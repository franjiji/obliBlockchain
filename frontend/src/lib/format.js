import { Interface, formatUnits } from "ethers";
import { vestingAbi, tokenAbi } from "./config.js";

export const STATUS = ["Activo", "Completado", "Cancelado"];

export const shortAddr = (a) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "");

// maxFrac trunca (no redondea) los decimales mostrados, para no exhibir mas de lo realmente disponible.
export function formatAmount(value, decimals, symbol = "", maxFrac = decimals) {
  const [int, frac = ""] = formatUnits(value, decimals).split(".");
  const f = frac.slice(0, maxFrac).replace(/0+$/, "");
  const i = BigInt(int).toLocaleString("es-UY");
  return `${i}${f ? "," + f : ""}${symbol ? " " + symbol : ""}`;
}

// Formato fijo dd/mm/aaaa HH:mm (24 h), el mismo en toda la dApp.
export function formatDate(ts) {
  const d = new Date(Number(ts) * 1000);
  const p = (n) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

// Duración legible entre dos timestamps (segundos).
export function formatDuration(seconds) {
  const s = Math.max(0, Number(seconds));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return h > 0 ? `${d} d ${h} h` : `${d} d`;
  if (h > 0) return m > 0 ? `${h} h ${m} min` : `${h} h`;
  return `${m} min`;
}

export function toLocalInput(date) {
  const p = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}T${p(date.getHours())}:${p(date.getMinutes())}`;
}

export const toTimestamp = (localInput) => Math.floor(new Date(localInput).getTime() / 1000);

// ───────── Mensajes de error ─────────
const MESSAGES = {
  InvalidBeneficiary: "El beneficiario no puede ser la dirección cero.",
  InvalidToken: "El token no es válido.",
  InvalidAmount: "El monto debe ser mayor a cero.",
  InvalidTimeRange: "La fecha de fin debe ser posterior a la de inicio.",
  InvalidCliff: "El cliff debe estar entre el inicio y el fin.",
  AgreementNotFound: "El acuerdo no existe.",
  NotBeneficiary: "Solo el beneficiario puede reclamar.",
  NotPayer: "Solo el pagador puede cancelar.",
  NothingToClaim: "No hay saldo disponible para reclamar.",
  NotRevocable: "Este acuerdo no es revocable.",
  NotActive: "El acuerdo ya no está activo.",
  AlreadyEnded: "El acuerdo ya finalizó, no se puede cancelar.",
  UnexpectedTransferAmount: "El token cobró comisión en la transferencia y no se soporta.",
  ERC20InsufficientAllowance: "Allowance insuficiente: falta aprobar el monto.",
  ERC20InsufficientBalance: "Saldo de tokens insuficiente.",
};
const interfaces = [new Interface(vestingAbi), new Interface(tokenAbi)];

export function errorMessage(e) {
  if (e?.code === "ACTION_REJECTED" || e?.code === 4001) return "Transacción rechazada en la billetera.";
  const data = [e?.data, e?.error?.data, e?.info?.error?.data].find((d) => typeof d === "string" && d.startsWith("0x"));
  if (data) {
    for (const iface of interfaces) {
      const parsed = iface.parseError(data);
      if (parsed) return MESSAGES[parsed.name] ?? parsed.name;
    }
  }
  if (e?.revert?.name) return MESSAGES[e.revert.name] ?? e.revert.name;
  if (
    e?.code === "UNKNOWN_ERROR" ||
    e?.code === "NETWORK_ERROR" ||
    /could not coalesce|failed to fetch|internal json-rpc/i.test(e?.message ?? "")
  )
    return "No se pudo comunicar con la red. Si es la local, ¿está corriendo `npx hardhat node`? Revisá también el RPC de la red en MetaMask.";
  return e?.shortMessage ?? e?.message ?? String(e);
}
