import { expect } from "chai";
import { network } from "hardhat";

const { ethers, networkHelpers } = await network.getOrCreate();
const { time, loadFixture } = networkHelpers;

const TOTAL = 1_000n * 10n ** 6n; // 1000 mUSD (6 decimales)
const DURATION = 1_000n; // segundos: 1 segundo devenga TOTAL / 1000
const Status = { Active: 0n, Completed: 1n, Cancelled: 2n };

async function deployFixture() {
  const [payer, beneficiary, other] = await ethers.getSigners();
  const token = await ethers.deployContract("MockUSD");
  const vault = await ethers.deployContract("VestingPayroll");
  await token.mint(payer.address, 10n * TOTAL);
  await token.connect(payer).approve(await vault.getAddress(), 10n * TOTAL);

  // Crea un acuerdo empezando `startOffset` segundos en el futuro.
  async function create({
    total = TOTAL,
    duration = DURATION,
    startOffset = 100n,
    revocable = true,
    to = beneficiary.address,
    tokenAddr = null,
  } = {}) {
    const now = BigInt(await time.latest());
    const start = now + startOffset;
    const end = start + duration;
    tokenAddr ??= await token.getAddress();
    await vault.connect(payer).createAgreement(to, tokenAddr, total, start, end, revocable);
    const id = await vault.agreementCount();
    return { id, start, end };
  }

  // Mina un bloque con timestamp exacto y ejecuta la tx en ese instante.
  async function at(timestamp, txPromiseFactory) {
    await time.setNextBlockTimestamp(timestamp);
    return txPromiseFactory();
  }

  return { vault, token, payer, beneficiary, other, create, at };
}

describe("VestingPayroll", () => {
  // ───────────────────────── Creacion ─────────────────────────
  describe("creacion de acuerdos", () => {
    it("crea un acuerdo valido, bloquea los fondos y emite el evento", async () => {
      const { vault, token, payer, beneficiary } = await loadFixture(deployFixture);
      const now = BigInt(await time.latest());
      const start = now + 100n;
      const end = start + DURATION;
      const tokenAddr = await token.getAddress();

      await expect(vault.connect(payer).createAgreement(beneficiary.address, tokenAddr, TOTAL, start, end, true))
        .to.emit(vault, "AgreementCreated")
        .withArgs(1n, payer.address, beneficiary.address, tokenAddr, TOTAL, start, end, true);

      const a = await vault.getAgreement(1n);
      expect(a.payer).to.equal(payer.address);
      expect(a.beneficiary).to.equal(beneficiary.address);
      expect(a.token).to.equal(tokenAddr);
      expect(a.totalAmount).to.equal(TOTAL);
      expect(a.claimedAmount).to.equal(0n);
      expect(a.startTime).to.equal(start);
      expect(a.endTime).to.equal(end);
      expect(a.revocable).to.equal(true);
      expect(a.status).to.equal(Status.Active);
      expect(await vault.agreementCount()).to.equal(1n);
      expect(await token.balanceOf(await vault.getAddress())).to.equal(TOTAL);
    });

    it("asigna ids unicos y correlativos", async () => {
      const { create } = await loadFixture(deployFixture);
      const a = await create();
      const b = await create();
      expect(a.id).to.equal(1n);
      expect(b.id).to.equal(2n);
    });

    it("rechaza parametros invalidos", async () => {
      const { vault, token, payer, beneficiary } = await loadFixture(deployFixture);
      const tokenAddr = await token.getAddress();
      const now = BigInt(await time.latest());
      const s = now + 100n;
      const e = s + DURATION;
      const v = vault.connect(payer);

      await expect(v.createAgreement(ethers.ZeroAddress, tokenAddr, TOTAL, s, e, true)).to.be.revertedWithCustomError(vault, "InvalidBeneficiary");
      await expect(v.createAgreement(beneficiary.address, ethers.ZeroAddress, TOTAL, s, e, true)).to.be.revertedWithCustomError(vault, "InvalidToken");
      await expect(v.createAgreement(beneficiary.address, tokenAddr, 0n, s, e, true)).to.be.revertedWithCustomError(vault, "InvalidAmount");
      await expect(v.createAgreement(beneficiary.address, tokenAddr, TOTAL, s, s, true)).to.be.revertedWithCustomError(vault, "InvalidTimeRange"); // end == start
      await expect(v.createAgreement(beneficiary.address, tokenAddr, TOTAL, e, s, true)).to.be.revertedWithCustomError(vault, "InvalidTimeRange"); // end < start
    });

    it("revierte si no hay allowance suficiente", async () => {
      const { vault, token, other, beneficiary } = await loadFixture(deployFixture);
      await token.mint(other.address, TOTAL); // tiene saldo pero nunca hizo approve
      const now = BigInt(await time.latest());
      await expect(
        vault.connect(other).createAgreement(beneficiary.address, await token.getAddress(), TOTAL, now + 100n, now + 100n + DURATION, true),
      ).to.be.revertedWithCustomError(token, "ERC20InsufficientAllowance");
    });

    it("revierte si el pagador no tiene saldo suficiente", async () => {
      const { vault, token, other, beneficiary } = await loadFixture(deployFixture);
      await token.connect(other).approve(await vault.getAddress(), TOTAL); // allowance ok, saldo 0
      const now = BigInt(await time.latest());
      await expect(
        vault.connect(other).createAgreement(beneficiary.address, await token.getAddress(), TOTAL, now + 100n, now + 100n + DURATION, true),
      ).to.be.revertedWithCustomError(token, "ERC20InsufficientBalance");
    });

    it("rechaza tokens con fee-on-transfer (quedaria sub-fondeado)", async () => {
      const { vault, payer, beneficiary } = await loadFixture(deployFixture);
      const fee = await ethers.deployContract("FeeOnTransferToken");
      await fee.mint(payer.address, TOTAL);
      await fee.connect(payer).approve(await vault.getAddress(), TOTAL);
      const now = BigInt(await time.latest());
      await expect(
        vault.connect(payer).createAgreement(beneficiary.address, await fee.getAddress(), TOTAL, now + 100n, now + 100n + DURATION, true),
      )
        .to.be.revertedWithCustomError(vault, "UnexpectedTransferAmount")
        .withArgs(TOTAL, TOTAL - TOTAL / 100n);
    });
  });

  // ───────────────────────── Calculo de vesting ─────────────────────────
  describe("monto devengado", () => {
    it("es cero antes de startTime (y exactamente en startTime)", async () => {
      const { vault, create } = await loadFixture(deployFixture);
      const { id, start } = await create();
      expect(await vault.vestedAmountAt(id, start - 50n)).to.equal(0n);
      expect(await vault.vestedAmountAt(id, start - 1n)).to.equal(0n);
      expect(await vault.vestedAmountAt(id, start)).to.equal(0n);
    });

    it("crece linealmente durante el periodo", async () => {
      const { vault, create } = await loadFixture(deployFixture);
      const { id, start } = await create();
      expect(await vault.vestedAmountAt(id, start + DURATION / 4n)).to.equal(TOTAL / 4n);
      expect(await vault.vestedAmountAt(id, start + DURATION / 2n)).to.equal(TOTAL / 2n);
      expect(await vault.vestedAmountAt(id, start + (DURATION * 3n) / 4n)).to.equal((TOTAL * 3n) / 4n);
    });

    it("es igual al total en endTime y despues", async () => {
      const { vault, create } = await loadFixture(deployFixture);
      const { id, end } = await create();
      expect(await vault.vestedAmountAt(id, end - 1n)).to.equal((TOTAL * (DURATION - 1n)) / DURATION);
      expect(await vault.vestedAmountAt(id, end)).to.equal(TOTAL);
      expect(await vault.vestedAmountAt(id, end + 1_000_000n)).to.equal(TOTAL);
    });

    it("vestedAmount y claimableAmount usan el tiempo actual de la cadena", async () => {
      const { vault, create } = await loadFixture(deployFixture);
      const { id, end } = await create();
      expect(await vault.vestedAmount(id)).to.equal(0n);
      expect(await vault.claimableAmount(id)).to.equal(0n);
      await time.increaseTo(end + 10n);
      expect(await vault.vestedAmount(id)).to.equal(TOTAL);
      expect(await vault.claimableAmount(id)).to.equal(TOTAL);
    });

    it("revierte con AgreementNotFound para un id inexistente", async () => {
      const { vault } = await loadFixture(deployFixture);
      await expect(vault.getAgreement(0n)).to.be.revertedWithCustomError(vault, "AgreementNotFound").withArgs(0n);
      await expect(vault.vestedAmount(99n)).to.be.revertedWithCustomError(vault, "AgreementNotFound").withArgs(99n);
    });
  });

  // ───────────────────────── Reclamos ─────────────────────────
  describe("reclamos", () => {
    it("permite un reclamo parcial por el monto devengado", async () => {
      const { vault, token, beneficiary, create, at } = await loadFixture(deployFixture);
      const { id, start } = await create();
      const t = start + DURATION / 4n;

      await expect(at(t, () => vault.connect(beneficiary).claim(id)))
        .to.emit(vault, "Claimed")
        .withArgs(id, beneficiary.address, TOTAL / 4n, TOTAL / 4n);

      expect(await token.balanceOf(beneficiary.address)).to.equal(TOTAL / 4n);
      const a = await vault.getAgreement(id);
      expect(a.claimedAmount).to.equal(TOTAL / 4n);
      expect(a.status).to.equal(Status.Active);
    });

    it("permite multiples reclamos y completa el acuerdo al retirar todo", async () => {
      const { vault, token, beneficiary, create, at } = await loadFixture(deployFixture);
      const { id, start, end } = await create();

      await at(start + 250n, () => vault.connect(beneficiary).claim(id));
      await at(start + 600n, () => vault.connect(beneficiary).claim(id));
      expect(await token.balanceOf(beneficiary.address)).to.equal((TOTAL * 600n) / DURATION);
      expect((await vault.getAgreement(id)).status).to.equal(Status.Active);

      await expect(at(end + 5n, () => vault.connect(beneficiary).claim(id)))
        .to.emit(vault, "AgreementCompleted")
        .withArgs(id);

      expect(await token.balanceOf(beneficiary.address)).to.equal(TOTAL);
      expect(await token.balanceOf(await vault.getAddress())).to.equal(0n);
      const a = await vault.getAgreement(id);
      expect(a.claimedAmount).to.equal(TOTAL);
      expect(a.status).to.equal(Status.Completed);
    });

    it("impide el doble reclamo (sin saldo disponible revierte)", async () => {
      const { vault, beneficiary, create, at } = await loadFixture(deployFixture);
      const { id, end } = await create();
      await at(end + 1n, () => vault.connect(beneficiary).claim(id));
      await expect(vault.connect(beneficiary).claim(id)).to.be.revertedWithCustomError(vault, "NothingToClaim").withArgs(id);
    });

    it("revierte si se reclama antes de startTime", async () => {
      const { vault, beneficiary, create } = await loadFixture(deployFixture);
      const { id } = await create();
      await expect(vault.connect(beneficiary).claim(id)).to.be.revertedWithCustomError(vault, "NothingToClaim").withArgs(id);
    });

    it("solo el beneficiario puede reclamar", async () => {
      const { vault, payer, other, create } = await loadFixture(deployFixture);
      const { id, end } = await create();
      await time.increaseTo(end + 1n);
      await expect(vault.connect(other).claim(id)).to.be.revertedWithCustomError(vault, "NotBeneficiary").withArgs(id, other.address);
      await expect(vault.connect(payer).claim(id)).to.be.revertedWithCustomError(vault, "NotBeneficiary").withArgs(id, payer.address);
    });
  });

  // ───────────────────────── Cancelacion ─────────────────────────
  describe("cancelacion", () => {
    it("cancela un acuerdo revocable: congela lo devengado y devuelve el resto al pagador", async () => {
      const { vault, token, payer, create, at } = await loadFixture(deployFixture);
      const { id, start } = await create();
      const t = start + (DURATION * 4n) / 10n; // 40%
      const vested = (TOTAL * 4n) / 10n;
      const payerBefore = await token.balanceOf(payer.address);

      await expect(at(t, () => vault.connect(payer).cancel(id)))
        .to.emit(vault, "AgreementCancelled")
        .withArgs(id, payer.address, vested, TOTAL - vested);

      const a = await vault.getAgreement(id);
      expect(a.status).to.equal(Status.Cancelled);
      expect(a.cancelledAt).to.equal(t);
      // devolucion correcta del saldo no devengado
      expect(await token.balanceOf(payer.address)).to.equal(payerBefore + (TOTAL - vested));
      // en el contrato queda exactamente lo devengado
      expect(await token.balanceOf(await vault.getAddress())).to.equal(vested);
    });

    it("preserva el saldo devengado luego de cancelar y no sigue devengando", async () => {
      const { vault, token, payer, beneficiary, create, at } = await loadFixture(deployFixture);
      const { id, start, end } = await create();
      const vested = (TOTAL * 4n) / 10n;
      await at(start + (DURATION * 4n) / 10n, () => vault.connect(payer).cancel(id));

      await time.increaseTo(end + 10_000n); // pasa muchisimo tiempo
      expect(await vault.vestedAmount(id)).to.equal(vested);
      expect(await vault.claimableAmount(id)).to.equal(vested);

      await vault.connect(beneficiary).claim(id);
      expect(await token.balanceOf(beneficiary.address)).to.equal(vested);
      expect(await token.balanceOf(await vault.getAddress())).to.equal(0n);
      // reclamo posterior a la cancelacion + retiro total: no hay mas saldo
      await expect(vault.connect(beneficiary).claim(id)).to.be.revertedWithCustomError(vault, "NothingToClaim");
    });

    it("descuenta lo ya reclamado antes de cancelar", async () => {
      const { vault, token, payer, beneficiary, create, at } = await loadFixture(deployFixture);
      const { id, start } = await create();
      await at(start + 200n, () => vault.connect(beneficiary).claim(id)); // 20%
      await at(start + 500n, () => vault.connect(payer).cancel(id)); // 50%
      await vault.connect(beneficiary).claim(id);
      expect(await token.balanceOf(beneficiary.address)).to.equal(TOTAL / 2n);
      expect(await token.balanceOf(await vault.getAddress())).to.equal(0n);
    });

    it("cancelar antes del inicio devuelve todo al pagador y el beneficiario no cobra", async () => {
      const { vault, token, payer, beneficiary, create } = await loadFixture(deployFixture);
      const { id, end } = await create();
      const payerBefore = await token.balanceOf(payer.address);
      await vault.connect(payer).cancel(id);
      expect(await token.balanceOf(payer.address)).to.equal(payerBefore + TOTAL);
      await time.increaseTo(end + 1n);
      await expect(vault.connect(beneficiary).claim(id)).to.be.revertedWithCustomError(vault, "NothingToClaim");
    });

    it("solo el pagador puede cancelar", async () => {
      const { vault, beneficiary, other, create } = await loadFixture(deployFixture);
      const { id } = await create();
      await expect(vault.connect(other).cancel(id)).to.be.revertedWithCustomError(vault, "NotPayer").withArgs(id, other.address);
      await expect(vault.connect(beneficiary).cancel(id)).to.be.revertedWithCustomError(vault, "NotPayer").withArgs(id, beneficiary.address);
    });

    it("no permite cancelar un acuerdo no revocable", async () => {
      const { vault, payer, create } = await loadFixture(deployFixture);
      const { id } = await create({ revocable: false });
      await expect(vault.connect(payer).cancel(id)).to.be.revertedWithCustomError(vault, "NotRevocable").withArgs(id);
    });

    it("no permite cancelar dos veces, ni uno completado, ni uno ya finalizado en el tiempo", async () => {
      const { vault, payer, beneficiary, create } = await loadFixture(deployFixture);
      const a = await create();
      await vault.connect(payer).cancel(a.id);
      await expect(vault.connect(payer).cancel(a.id)).to.be.revertedWithCustomError(vault, "NotActive").withArgs(a.id, Status.Cancelled);

      const b = await create();
      await time.increaseTo(b.end + 1n);
      await expect(vault.connect(payer).cancel(b.id)).to.be.revertedWithCustomError(vault, "AlreadyEnded").withArgs(b.id);

      await vault.connect(beneficiary).claim(b.id); // pasa a Completed
      await expect(vault.connect(payer).cancel(b.id)).to.be.revertedWithCustomError(vault, "NotActive").withArgs(b.id, Status.Completed);
    });
  });

  // ───────────────────────── Redondeo ─────────────────────────
  describe("casos de borde de redondeo", () => {
    it("monto no divisible por la duracion: redondea hacia abajo y la suma de reclamos nunca supera el deposito", async () => {
      const { vault, token, beneficiary, create, at } = await loadFixture(deployFixture);
      const total = 10n; // 10 unidades en 3 segundos
      const { id, start } = await create({ total, duration: 3n });

      expect(await vault.vestedAmountAt(id, start + 1n)).to.equal(3n); // floor(10/3)
      expect(await vault.vestedAmountAt(id, start + 2n)).to.equal(6n); // floor(20/3)
      expect(await vault.vestedAmountAt(id, start + 3n)).to.equal(10n); // exacto al final

      await at(start + 1n, () => vault.connect(beneficiary).claim(id));
      await at(start + 2n, () => vault.connect(beneficiary).claim(id));
      await at(start + 3n, () => vault.connect(beneficiary).claim(id));
      expect(await token.balanceOf(beneficiary.address)).to.equal(total); // ni mas ni menos
      expect(await token.balanceOf(await vault.getAddress())).to.equal(0n); // sin polvo
    });

    it("monto menor que la duracion: no devenga nada hasta el final", async () => {
      const { vault, create } = await loadFixture(deployFixture);
      const { id, start, end } = await create({ total: 1n, duration: 1_000n });
      expect(await vault.vestedAmountAt(id, start + 999n)).to.equal(0n);
      expect(await vault.vestedAmountAt(id, end)).to.equal(1n);
    });

    it("no hace overflow con los valores maximos soportados", async () => {
      const { vault, token, payer, beneficiary } = await loadFixture(deployFixture);
      const max128 = 2n ** 128n - 1n;
      const max40 = 2n ** 40n - 1n;
      await token.mint(payer.address, max128);
      await token.connect(payer).approve(await vault.getAddress(), max128);
      await vault.connect(payer).createAgreement(beneficiary.address, await token.getAddress(), max128, 0n, max40, true);
      const id = await vault.agreementCount();

      const t = max40 - 1n;
      const expected = (max128 * t) / max40;
      const vested = await vault.vestedAmountAt(id, t);
      expect(vested).to.equal(expected);
      expect(vested).to.be.lessThanOrEqual(max128);
      expect(await vault.vestedAmountAt(id, max40)).to.equal(max128);
    });
  });

  // ───────────────────────── Reentrancy ─────────────────────────
  describe("seguridad: reentrancy", () => {
    it("un beneficiario malicioso no logra reclamar dos veces desde el callback del token", async () => {
      const { vault, payer } = await loadFixture(deployFixture);
      const rtoken = await ethers.deployContract("ReentrantToken");
      const attacker = await ethers.deployContract("ReentrantBeneficiary", [await vault.getAddress()]);
      await rtoken.mint(payer.address, TOTAL);
      await rtoken.connect(payer).approve(await vault.getAddress(), TOTAL);

      const now = BigInt(await time.latest());
      const start = now + 100n;
      const end = start + DURATION;
      await vault.connect(payer).createAgreement(await attacker.getAddress(), await rtoken.getAddress(), TOTAL, start, end, false);
      const id = await vault.agreementCount();

      await time.increaseTo(end + 1n);
      await attacker.attack(id); // el claim externo tiene exito...

      expect(await attacker.reentryAttempts()).to.equal(1n); // ...el token le dio la chance de reentrar...
      expect(await attacker.reentrySuccesses()).to.equal(0n); // ...pero la reentrada fue bloqueada
      expect(await rtoken.balanceOf(await attacker.getAddress())).to.equal(TOTAL); // cobro una sola vez
      expect(await rtoken.balanceOf(await vault.getAddress())).to.equal(0n);
      expect((await vault.getAgreement(id)).claimedAmount).to.equal(TOTAL);
    });
  });
});
