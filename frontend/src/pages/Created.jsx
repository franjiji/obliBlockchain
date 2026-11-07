import { useState } from "react";
import { useWallet } from "../lib/wallet.jsx";
import { useTx } from "../lib/tx.jsx";
import { useAgreements } from "../lib/useAgreements.js";
import { vestingContract } from "../lib/agreements.js";
import { formatAmount, shortAddr } from "../lib/format.js";
import Badge from "./Badge.jsx";

export default function Created({ onOpen }) {
  const { provider } = useWallet();
  const { send } = useTx();
  const { rows, error } = useAgreements("payer");
  const [confirming, setConfirming] = useState(null);

  const cancel = async (id) => {
    setConfirming(null);
    await send(`Cancelar acuerdo #${id}`, async () => vestingContract(await provider.getSigner()).cancel(id));
  };

  return (
    <div className="card">
      <h2>Acuerdos creados</h2>
      <p className="muted">Acuerdos donde tu billetera es el pagador.</p>
      {error && <p className="error">{error}</p>}
      {!rows && !error && <p>Cargando…</p>}
      {rows?.length === 0 && <p>Todavía no creaste acuerdos.</p>}
      {rows?.length > 0 && (
        <div className="scroll">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Beneficiario</th>
                <th>Estado</th>
                <th>Monto total</th>
                <th>Devengado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const canCancel = r.revocable && r.status === 0 && r.now < r.end;
                return (
                  <tr key={r.id}>
                    <td>{String(r.id)}</td>
                    <td title={r.beneficiary}>{shortAddr(r.beneficiary)}</td>
                    <td>
                      <Badge status={r.status} />
                    </td>
                    <td>{formatAmount(r.total, r.decimals, r.symbol, 2)}</td>
                    <td>{formatAmount(r.vested, r.decimals, r.symbol, 2)}</td>
                    <td className="actions">
                      <button onClick={() => onOpen(r.id)}>Detalle</button>
                      {canCancel &&
                        (confirming === r.id ? (
                          <button className="danger" onClick={() => cancel(r.id)}>
                            ¿Confirmar cancelación?
                          </button>
                        ) : (
                          <button className="danger-outline" onClick={() => setConfirming(r.id)}>
                            Cancelar
                          </button>
                        ))}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
