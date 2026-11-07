import { useEffect, useState } from "react";
import { useWallet } from "../lib/wallet.jsx";
import { useTx } from "../lib/tx.jsx";
import { chainNow, fetchHistory, loadAgreement } from "../lib/agreements.js";
import { errorMessage, formatAmount, formatDate, shortAddr } from "../lib/format.js";
import Badge from "./Badge.jsx";

function describe(e, r) {
  if (e.name === "Claimed") return `${formatAmount(e.args.amount, r.decimals, r.symbol)} reclamados (acumulado ${formatAmount(e.args.totalClaimed, r.decimals, r.symbol)})`;
  if (e.name === "AgreementCancelled")
    return `Devengado congelado en ${formatAmount(e.args.vestedAtCancel, r.decimals, r.symbol)}; ${formatAmount(e.args.refunded, r.decimals, r.symbol)} devueltos al pagador`;
  if (e.name === "AgreementCreated") return `${formatAmount(e.args.totalAmount, r.decimals, r.symbol)} depositados`;
  return "";
}

export default function Detail({ id, onBack }) {
  const { provider } = useWallet();
  const { refreshKey } = useTx();
  const [data, setData] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    let off = false;
    (async () => {
      try {
        const row = await loadAgreement(provider, id, await chainNow(provider));
        const events = await fetchHistory(provider, id);
        if (!off) {
          setData(row);
          setHistory(events);
          setError(null);
        }
      } catch (e) {
        if (!off) setError(errorMessage(e));
      }
    })();
    return () => {
      off = true;
    };
  }, [provider, id, refreshKey]);

  if (error) return <div className="card"><button onClick={onBack}>← Volver</button><p className="error">{error}</p></div>;
  if (!data) return <div className="card">Cargando…</div>;

  const r = data;
  // Progreso temporal (si se canceló, queda congelado en el instante de cancelación)
  const effective = r.status === 2 ? r.cancelledAt : r.now;
  const span = Number(r.end - r.start);
  const pct = Math.max(0, Math.min(100, ((Number(effective) - Number(r.start)) / span) * 100));
  const fmt = (v) => formatAmount(v, r.decimals, r.symbol);

  return (
    <div className="card">
      <button onClick={onBack}>← Volver</button>
      <h2>
        Acuerdo #{String(r.id)} <Badge status={r.status} />
      </h2>

      <dl className="grid">
        <dt>Pagador</dt><dd title={r.payer}>{r.payer}</dd>
        <dt>Beneficiario</dt><dd title={r.beneficiary}>{r.beneficiary}</dd>
        <dt>Token</dt><dd>{r.symbol} ({shortAddr(r.token)})</dd>
        <dt>Monto total</dt><dd>{fmt(r.total)}</dd>
        <dt>Devengado</dt><dd>{fmt(r.vested)}</dd>
        <dt>Reclamado</dt><dd>{fmt(r.claimed)}</dd>
        <dt>Disponible</dt><dd><strong>{fmt(r.claimable)}</strong></dd>
        <dt>Inicio</dt><dd>{formatDate(r.start)}</dd>
        <dt>Fin</dt><dd>{formatDate(r.end)}</dd>
        <dt>Revocable</dt><dd>{r.revocable ? "Sí" : "No"}</dd>
        {r.status === 2 && (<><dt>Cancelado el</dt><dd>{formatDate(r.cancelledAt)}</dd></>)}
      </dl>

      <h3>Progreso temporal</h3>
      <div className="progress" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin="0" aria-valuemax="100">
        <div className="progress-bar" style={{ width: `${pct}%` }} />
      </div>
      <p className="muted">{pct.toFixed(1)} % del período transcurrido (hora de la cadena: {formatDate(r.now)})</p>

      <h3>Historial</h3>
      <ul className="history">
        {history.map((e) => (
          <li key={`${e.hash}-${e.index}`}>
            <strong>{e.label}</strong> <span className="muted">· {formatDate(e.timestamp)} · tx {shortAddr(e.hash)}</span>
            <div>{describe(e, r)}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
