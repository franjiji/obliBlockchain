export default function Welcome({ hasWallet, connecting, connect, expectedChainName }) {
  return (
    <div className="card welcome">
      <h2>Pagos de sueldo con vesting lineal</h2>
      <p>
        El pagador deposita por adelantado el monto de un acuerdo en un token ERC-20 y el beneficiario lo va cobrando a medida que
        pasa el tiempo. Se puede agregar un <strong>cliff</strong> (antes de esa fecha no se cobra nada) y, si el acuerdo es
        revocable, el pagador puede cancelarlo: lo devengado queda para el beneficiario y el resto vuelve al pagador.
      </p>

      <ol className="steps">
        <li>
          <strong>1. Conectá tu billetera</strong>
          <span className="muted">Red esperada: {expectedChainName}.</span>
        </li>
        <li>
          <strong>2. Pagador</strong>
          <span className="muted">En «Crear acuerdo» aprobás el token y creás el acuerdo.</span>
        </li>
        <li>
          <strong>3. Beneficiario</strong>
          <span className="muted">En «Mis ingresos» reclamás lo que ya se devengó.</span>
        </li>
      </ol>

      {hasWallet ? (
        <button className="primary" onClick={connect} disabled={connecting}>
          {connecting ? "Esperando a la billetera…" : "Conectar billetera"}
        </button>
      ) : (
        <p className="error">No se detectó una billetera EVM. Instalá MetaMask para usar la dApp.</p>
      )}
    </div>
  );
}
