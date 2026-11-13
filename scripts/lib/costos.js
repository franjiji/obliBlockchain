import fs from "node:fs";
import path from "node:path";
import assert from "node:assert/strict";

export const NETWORKS = {
  11155111: { name: "sepolia", explorer: "https://sepolia.etherscan.io" },
  84532: { name: "baseSepolia", explorer: "https://sepolia.basescan.org" },
  31337: { name: "localhost", explorer: null },
};

export function readJson(file) {
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, "utf8")) : null;
}

export function writeJson(file, value) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temporary = `${file}.tmp`;
  fs.writeFileSync(temporary, JSON.stringify(value, null, 2) + "\n");
  fs.renameSync(temporary, file);
}

// Guardar el hash ANTES de esperar permite reanudar sin repetir una transaccion.
export async function sendRecorded(record, label, action, persist, provider) {
  record.operations ??= [];
  let entry = record.operations.find((r) => r.operation === label);
  if (entry?.status === "confirmed") return entry;
  if (!entry) {
    const tx = await action();
    entry = { operation: label, transactionHash: tx.hash, status: "pending" };
    record.operations.push(entry);
    persist();
  }
  console.log(`${label}: ${entry.transactionHash}`);
  const receipt = await provider.waitForTransaction(entry.transactionHash, 1, 180000);
  assert.equal(receipt.status, 1, `${label}: transaccion revertida`);
  const raw = await provider.send("eth_getTransactionReceipt", [entry.transactionHash]);
  const blockTag = `0x${receipt.blockNumber.toString(16)}`;
  const previousTag = `0x${(receipt.blockNumber - 1).toString(16)}`;
  const block = await provider.send("eth_getBlockByNumber", [blockTag, true]);
  const sender = receipt.from.toLowerCase();
  const ownTransactions = block.transactions.filter((tx) => tx.from.toLowerCase() === sender);
  assert.equal(ownTransactions.length, 1, "Otra transaccion del emisor en el mismo bloque altera el balance");
  assert(!block.transactions.some((tx) => tx.to?.toLowerCase() === sender && BigInt(tx.value) > 0n),
    "Un ingreso de ETH en el mismo bloque altera la medicion");
  const value = BigInt(ownTransactions[0].value);
  const before = BigInt(await provider.send("eth_getBalance", [receipt.from, previousTag]));
  const after = BigInt(await provider.send("eth_getBalance", [receipt.from, blockTag]));
  const gasUsed = BigInt(raw.gasUsed);
  const gasPrice = BigInt(raw.effectiveGasPrice ?? raw.gasPrice);
  const executionFee = gasUsed * gasPrice;
  if (record.chainId === 84532) assert(raw.l1Fee !== undefined, "El RPC no informa l1Fee");
  const l1Fee = BigInt(raw.l1Fee ?? 0);
  // Las operaciones medidas no transfieren ETH: la diferencia de saldo captura
  // tambien operator fees u otros cargos del fork activo sin asumir su formula.
  assert.equal(value, 0n, "La medicion espera transacciones sin valor ETH");
  const totalFee = before - after;
  const otherFee = totalFee - executionFee - l1Fee;
  assert(otherFee >= 0n, "La diferencia de saldo no concuerda con las fees del recibo");
  if (record.chainId !== 84532) assert.equal(otherFee, 0n, "Cargo inesperado en L1/local");
  Object.assign(entry, {
    status: "confirmed", blockNumber: receipt.blockNumber,
    timestamp: Number(BigInt(block.timestamp)), sender: receipt.from,
    to: ownTransactions[0].to, input: ownTransactions[0].input,
    gasUsed: gasUsed.toString(), gasPriceWei: gasPrice.toString(),
    executionFeeWei: executionFee.toString(), l1FeeWei: l1Fee.toString(),
    otherFeeWei: otherFee.toString(), totalFeeWei: totalFee.toString(),
    senderBalanceBeforeWei: before.toString(), senderBalanceAfterWei: after.toString(),
    receiptFeeFields: Object.fromEntries(Object.entries(raw).filter(([key]) =>
      /^(l1|operator|blobGas|effectiveGasPrice|gasUsed)/.test(key))),
  });
  persist();
  console.log(`${label}: confirmado; gas=${entry.gasUsed}; costo total=${entry.totalFeeWei} wei`);
  return entry;
}
