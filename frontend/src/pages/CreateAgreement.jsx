import { useEffect, useState } from "react";
import { isAddress, parseUnits } from "ethers";
import { useWallet } from "../lib/wallet.jsx";
import { useTx } from "../lib/tx.jsx";
import { deployment } from "../lib/config.js";
import { tokenContract, tokenInfo, vestingContract } from "../lib/agreements.js";
import { formatAmount, formatDate, formatDuration, toLocalInput, toTimestamp } from "../lib/format.js";

const MAX_UINT128 = 2n ** 128n - 1n;

export default function CreateAgreement({ onCreated }) {
  const { provider, account } = useWallet();
  const { send, refreshKey } = useTx();
  const [beneficiary, setBeneficiary] = useState("");
  const [token, setToken] = useState(deployment.token);
  const [amount, setAmount] = useState("");
  const [start, setStart] = useState(() => toLocalInput(new Date(Date.now() + 2 * 60 * 1000)));
  const [end, setEnd] = useState(() => toLocalInput(new Date(Date.now() + 30 * 24 * 3600 * 1000)));
  const [cliff, setCliff] = useState(""); // vacio = sin cliff
  const [revocable, setRevocable] = useState(true);
  const [info, setInfo] = useState(null); // { symbol, decimals, balance, allowance }
  const [formError, setFormError] = useState(null);
  const [busy, setBusy] = useState(false);

  // Metadatos del token + saldo y allowance del pagador
  useEffect(() => {
    setInfo(null);
    if (!isAddress(token)) return;
    let off = false;
    (async () => {
      try {
        const meta = await tokenInfo(provider, token);
        const t = tokenContract(token, provider);
        const [balance, allowance] = await Promise.all([t.balanceOf(account), t.allowance(account, deployment.vesting)]);
        if (!off) setInfo({ ...meta, balance, allowance });
      } catch {
        if (!off) setInfo(null);
      }
    })();
    return () => {
      off = true;
    };
  }, [provider, account, token, refreshKey]);

  // Resumen de fechas en el mismo formato que el resto de la dApp (el selector del navegador usa el idioma del sistema).
  const startTs = toTimestamp(start);
  const endTs = toTimestamp(end);
  const nowTs = Math.floor(Date.now() / 1000);
  const datesOk = Boolean(startTs && endTs && endTs > startTs);
  const cliffTs = cliff ? toTimestamp(cliff) : startTs; // sin cliff = igual al inicio
  const cliffOk = !cliff || (datesOk && cliffTs >= startTs && cliffTs <= endTs);
  const warnings = [];
  if (datesOk && endTs <= nowTs) warnings.push("La fecha de fin ya pasó: el beneficiario podrá reclamar todo el monto de inmediato.");
  else if (datesOk && startTs < nowTs) warnings.push("El inicio ya pasó: parte del monto ya queda disponible apenas se crea el acuerdo.");

  const faucet = () =>
    send("Obtener mUSD de prueba", async () => tokenContract(token, await provider.getSigner()).mint(account, 1000n * 10n ** 6n));

  async function submit(e) {
    e.preventDefault();
    setFormError(null);
    if (!isAddress(beneficiary)) return setFormError("El beneficiario no es una dirección válida.");
    if (!isAddress(token) || !info) return setFormError("El token no es un ERC-20 válido en esta red.");
    let total;
    try {
      total = parseUnits(amount, info.decimals);
    } catch {
      return setFormError(`Monto inválido (máximo ${info.decimals} decimales).`);
    }
    if (total <= 0n) return setFormError("El monto debe ser mayor a cero.");
    if (total > MAX_UINT128) return setFormError("El monto excede el máximo soportado.");
    if (!startTs || !endTs) return setFormError("Completá las fechas de inicio y fin.");
    if (endTs <= startTs) return setFormError("La fecha de fin debe ser posterior a la de inicio.");
    if (!cliffOk) return setFormError("El cliff debe estar entre el inicio y el fin.");

    setBusy(true);
    try {
      const signer = await provider.getSigner();
      const erc20 = tokenContract(token, signer);
      const allowance = await erc20.allowance(account, deployment.vesting);
      if (allowance < total) {
        const ok = await send(`Aprobar ${amount} ${info.symbol}`, () => erc20.approve(deployment.vesting, total));
        if (!ok) return;
      }
      const ok = await send("Crear acuerdo", () =>
        vestingContract(signer).createAgreement(beneficiary, token, total, startTs, cliffTs, endTs, revocable),
      );
      if (ok) {
        setAmount("");
        setBeneficiary("");
        onCreated();
      }
    } catch (err) {
      setFormError(err.shortMessage ?? err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="card form" onSubmit={submit}>
      <h2>Crear acuerdo</h2>

      <label>
        Beneficiario
        <input value={beneficiary} onChange={(e) => setBeneficiary(e.target.value.trim())} placeholder="0x…" spellCheck="false" />
      </label>

      <label>
        Token (ERC-20)
        <input value={token} onChange={(e) => setToken(e.target.value.trim())} spellCheck="false" />
        <small className="muted">
          {info
            ? `${info.symbol} · ${info.decimals} decimales · tu saldo: ${formatAmount(info.balance, info.decimals, info.symbol)} · allowance: ${formatAmount(info.allowance, info.decimals, info.symbol)}`
            : "No se pudo leer el token en esta red."}
          {info && token.toLowerCase() === deployment.token.toLowerCase() && (
            <>
              {" "}
              <button type="button" className="link" onClick={faucet}>
                obtener 1.000 {info.symbol} de prueba
              </button>
            </>
          )}
        </small>
      </label>

      <label>
        Monto total
        <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="1000" />
      </label>

      <div className="row">
        <label>
          Inicio
          <input type="datetime-local" value={start} onChange={(e) => setStart(e.target.value)} />
        </label>
        <label>
          Fin
          <input type="datetime-local" value={end} onChange={(e) => setEnd(e.target.value)} />
        </label>
      </div>

      <p className="muted">
        {datesOk
          ? `Se vestea desde ${formatDate(startTs)} hasta ${formatDate(endTs)} (${formatDuration(endTs - startTs)}).`
          : "La fecha de fin debe ser posterior a la de inicio."}
      </p>
      {warnings.map((w) => (
        <p key={w} className="warn">
          ⚠ {w}
        </p>
      ))}

      <label>
        Cliff (opcional)
        <input type="datetime-local" value={cliff} onChange={(e) => setCliff(e.target.value)} />
        <small className="muted">Antes de esta fecha no se puede reclamar nada; al llegar, se libera lo devengado desde el inicio. Vacío = sin cliff.</small>
      </label>
      {cliff && cliffOk && <p className="muted">Cliff: {formatDate(cliffTs)}.</p>}
      {cliff && !cliffOk && <p className="warn">⚠ El cliff debe estar entre el inicio y el fin.</p>}

      <label className="check">
        <input type="checkbox" checked={revocable} onChange={(e) => setRevocable(e.target.checked)} />
        Revocable (el pagador puede cancelar; lo devengado queda para el beneficiario)
      </label>

      {formError && <p className="error">{formError}</p>}
      <button className="primary" disabled={busy}>
        {busy ? "Procesando…" : "Aprobar y crear acuerdo"}
      </button>
    </form>
  );
}
