import { STATUS } from "../lib/format.js";

// ended: la hora de la cadena ya llego a endTime. Un acuerdo Active sigue asi hasta que se cobra el total.
export default function Badge({ status, ended = false }) {
  if (status === 0 && ended) return <span className="badge badge-finalizado">Finalizado (pendiente de cobro)</span>;
  return <span className={`badge badge-${STATUS[status].toLowerCase()}`}>{STATUS[status]}</span>;
}
