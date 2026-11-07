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

export const formatDate = (ts) => new Date(Number(ts) * 1000).toLocaleString("es-UY");

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
  return e?.shortMessage ?? e?.message ?? String(e);
}
