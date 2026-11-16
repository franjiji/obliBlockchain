import { useWallet } from "../lib/wallet.jsx";
import { useTx } from "../lib/tx.jsx";
import { useAgreements } from "../lib/useAgreements.js";
import { vestingContract } from "../lib/agreements.js";
import { formatList, shortAddr } from "../lib/format.js";
import Badge from "./Badge.jsx";

export default function Income({ onOpen }) {
  const { provider } = useWallet();
  const { send } = useTx();
  const { rows, error } = useAgreements("beneficiary");

  const claim = (id) =>
    send(`Reclamar acuerdo #${id}`, async () => vestingContract(await provider.getSigner()).claim(id));

  return (
    <div className="card">
      <h2>Mis ingresos</h2>
      <p className="muted">Acuerdos donde tu billetera es la beneficiaria.</p>
      {error && <p className="error">{error}</p>}
      {!rows && !error && <p>Cargando…</p>}
      {rows?.length === 0 && <p>No tenés acuerdos como beneficiario.</p>}
      {rows?.length > 0 && (
        <div className="scroll">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Pagador</th>
                <th>Estado</th>
                <th>Total</th>
                <th>Devengado</th>
                <th>Reclamado</th>
                <th>Disponible</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{String(r.id)}</td>
                  <td title={r.payer}>{shortAddr(r.payer)}</td>
                  <td>
                    <Badge status={r.status} ended={r.now >= r.end} />
                  </td>
                  <td>{formatList(r.total, r.decimals, r.symbol)}</td>
                  <td>{formatList(r.vested, r.decimals, r.symbol)}</td>
                  <td>{formatList(r.claimed, r.decimals, r.symbol)}</td>
                  <td>
                    <strong>{formatList(r.claimable, r.decimals, r.symbol)}</strong>
                  </td>
                  <td className="actions">
                    <button onClick={() => onOpen(r.id)}>Detalle</button>
                    <button className="primary" disabled={r.claimable === 0n} onClick={() => claim(r.id)}>
                      Reclamar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
