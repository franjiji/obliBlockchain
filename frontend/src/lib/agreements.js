import { Contract } from "ethers";
import { deployment, vestingAbi, tokenAbi } from "./config.js";

export const vestingContract = (runner) => new Contract(deployment.vesting, vestingAbi, runner);
export const tokenContract = (address, runner) => new Contract(address, tokenAbi, runner);

const tokenCache = new Map();
export async function tokenInfo(provider, address) {
  const key = address.toLowerCase();
  if (!tokenCache.has(key)) {
    const t = tokenContract(address, provider);
    const [symbol, decimals] = await Promise.all([t.symbol(), t.decimals()]);
    tokenCache.set(key, { symbol, decimals: Number(decimals) });
  }
  return tokenCache.get(key);
}

/** Hora de la cadena (ultimo bloque): es la que ve el contrato, no el reloj del navegador. */
export async function chainNow(provider) {
  // Lectura cruda (sin la cache de ~250 ms de ethers): justo despues de una tx, getBlock("latest")
  // puede devolver el bloque anterior y el devengado quedaria por debajo de lo ya reclamado.
  const block = await provider.send("eth_getBlockByNumber", ["latest", false]);
  return BigInt(block.timestamp);
}

// ───────── Lectura de eventos tolerante a limites del RPC ─────────
// Los RPC publicos limitan el rango de eth_getLogs y la frecuencia de pedidos (rate limit).
// Por eso: (1) se consulta por tramos, (2) se reintenta con espera creciente y
// (3) se guarda en memoria lo ya escaneado para pedir solo los bloques nuevos.
const LOG_CHUNK = 2000; // bloques por consulta (bajar si el proveedor lo exige)
const REORG_OVERLAP = 6; // se re-escanean los ultimos bloques por posibles reorgs
const logCache = new Map(); // clave -> { lastBlock, logs: Map("txHash-index" -> log) }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function withRetry(fn, tries = 4) {
  for (let i = 0; ; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i >= tries) throw e;
      await sleep(400 * 2 ** i); // 0,4 s, 0,8 s, 1,6 s, 3,2 s
    }
  }
}

export async function queryLogs(contract, filter, key) {
  key = `${deployment.chainId}:${key}`; // la cache es por red
  const provider = contract.runner.provider ?? contract.runner;
  const latest = Number(await provider.send("eth_blockNumber", []));
  let entry = logCache.get(key);
  // Si la cadena es mas corta que lo cacheado (p. ej. se reinicio el nodo local), se descarta.
  if (!entry || entry.lastBlock > latest) entry = { lastBlock: deployment.deployBlock - 1, logs: new Map() };

  const from = Math.max(deployment.deployBlock, entry.lastBlock - REORG_OVERLAP + 1);
  for (let start = from; start <= latest; start += LOG_CHUNK) {
    const end = Math.min(start + LOG_CHUNK - 1, latest);
    const logs = await withRetry(() => contract.queryFilter(filter, start, end));
    for (const l of logs) entry.logs.set(`${l.transactionHash}-${l.index}`, l);
  }
  entry.lastBlock = latest;
  logCache.set(key, entry);
  return [...entry.logs.values()];
}

const blockTimes = new Map(); // los timestamps de bloques pasados no cambian
async function blockTimestamp(provider, blockNumber) {
  if (!blockTimes.has(blockNumber)) {
    const b = await withRetry(() => provider.getBlock(blockNumber));
    blockTimes.set(blockNumber, BigInt(b.timestamp));
  }
  return blockTimes.get(blockNumber);
}

export async function loadAgreement(provider, id, now) {
  const c = vestingContract(provider);
  const [a, vested] = await Promise.all([c.getAgreement(id), c.vestedAmountAt(id, now)]);
  const info = await tokenInfo(provider, a.token);
  return {
    id: BigInt(id),
    payer: a.payer,
    beneficiary: a.beneficiary,
    token: a.token,
    total: a.totalAmount,
    claimed: a.claimedAmount,
    start: a.startTime,
    cliff: a.cliffTime,
    end: a.endTime,
    revocable: a.revocable,
    status: Number(a.status),
    cancelledAt: a.cancelledAt,
    vested: vested > a.claimedAmount ? vested : a.claimedAmount,
    claimable: vested > a.claimedAmount ? vested - a.claimedAmount : 0n,
    now,
    ...info,
  };
}

/** Acuerdos donde `payer` o `beneficiary` coincide. Se indexan por eventos (no hay arrays en storage). */
export async function fetchAgreements(provider, { payer, beneficiary }) {
  const c = vestingContract(provider);
  const filter = c.filters.AgreementCreated(null, payer ?? null, beneficiary ?? null);
  const logs = await queryLogs(c, filter, `created:${payer ?? ""}:${beneficiary ?? ""}`);
  const now = await chainNow(provider);
  const rows = await Promise.all(logs.map((l) => loadAgreement(provider, l.args.id, now)));
  return rows.sort((x, y) => (x.id < y.id ? 1 : -1));
}

const HISTORY = [
  ["AgreementCreated", "Acuerdo creado"],
  ["Claimed", "Reclamo"],
  ["AgreementCompleted", "Acuerdo completado"],
  ["AgreementCancelled", "Acuerdo cancelado"],
];

export async function fetchHistory(provider, id) {
  const c = vestingContract(provider);
  const groups = await Promise.all(
    HISTORY.map(async ([name, label]) => {
      const logs = await queryLogs(c, c.filters[name](id), `history:${name}:${id}`);
      return logs.map((l) => ({ name, label, args: l.args, block: l.blockNumber, index: l.index, hash: l.transactionHash }));
    }),
  );
  const events = groups.flat().sort((a, b) => a.block - b.block || a.index - b.index);
  return Promise.all(
    events.map(async (e) => ({ ...e, timestamp: await blockTimestamp(provider, e.block) })),
  );
}
