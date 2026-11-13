export default function Welcome({ hasWallet, account, onStart, connecting, connect }) {
  return (
    <div className="card welcome">
      <h2>Pagos de sueldo con vesting</h2>
      <p className="muted">El pagador deposita el monto y el beneficiario lo va cobrando con el tiempo.</p>

      {account ? (
        <button className="primary" onClick={onStart}>
          Crear un acuerdo
        </button>
      ) : hasWallet ? (
        <button className="primary" onClick={connect} disabled={connecting}>
          {connecting ? "Esperando a la billetera…" : "Conectar billetera"}
        </button>
      ) : (
        <p className="error">No se detectó una billetera EVM. Instalá MetaMask para usar la dApp.</p>
      )}
    </div>
  );
}
