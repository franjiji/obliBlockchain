import { useState } from "react";
import { useWallet } from "./lib/wallet.jsx";
import { useTx } from "./lib/tx.jsx";
import { shortAddr } from "./lib/format.js";
import CreateAgreement from "./pages/CreateAgreement.jsx";
import Created from "./pages/Created.jsx";
import Income from "./pages/Income.jsx";
import Detail from "./pages/Detail.jsx";

const TABS = [
  ["create", "Crear acuerdo"],
  ["created", "Acuerdos creados"],
  ["income", "Mis ingresos"],
];
const STATUS_LABEL = { pending: "Pendiente", confirmed: "Confirmada", failed: "Fallida" };

function TxList() {
  const { txs, dismiss } = useTx();
  if (!txs.length) return null;
  return (
    <aside className="txlist" aria-live="polite">
      {txs.map((t) => (
        <div key={t.id} className={`tx tx-${t.status}`}>
          <div>
            <strong>{t.label}</strong> — {STATUS_LABEL[t.status]}
            {t.error && <div className="tx-error">{t.error}</div>}
          </div>
          {t.status !== "pending" && <button className="link" onClick={() => dismiss(t.id)}>cerrar</button>}
        </div>
      ))}
    </aside>
  );
}

export default function App() {
  const { hasWallet, account, chainName, chainOk, expectedChainName, error, connecting, connect, switchNetwork } = useWallet();
  const [tab, setTab] = useState("create");
  const [detailId, setDetailId] = useState(null);

  const open = (id) => { setDetailId(id); setTab("detail"); };
  const goTab = (t) => { setDetailId(null); setTab(t); };

  let content;
  if (!hasWallet) content = <div className="card">No se detectó una billetera EVM. Instalá MetaMask para usar la dApp.</div>;
  else if (!account) content = <div className="card"><p>Conectá tu billetera para empezar.</p><button className="primary" onClick={connect} disabled={connecting}>{connecting ? "Esperando a la billetera…" : "Conectar billetera"}</button></div>;
  else if (!chainOk) content = <div className="card"><p className="error">Estás en la red «{chainName}», pero la dApp está desplegada en «{expectedChainName}».</p><button className="primary" onClick={switchNetwork}>Cambiar a {expectedChainName}</button></div>;
  else if (tab === "detail") content = <Detail id={detailId} onBack={() => goTab("created")} />;
  else if (tab === "create") content = <CreateAgreement onCreated={() => goTab("created")} />;
  else if (tab === "created") content = <Created onOpen={open} />;
  else content = <Income onOpen={open} />;

  return (
    <div className="app">
      <header>
        <h1>Vesting dApp</h1>
        <div className="wallet">
          {account ? (
            <>
              <span className={`dot ${chainOk ? "ok" : "bad"}`} />
              <span>{chainName}</span>
              <code title={account}>{shortAddr(account)}</code>
            </>
          ) : (
            hasWallet && <button onClick={connect} disabled={connecting}>{connecting ? "Esperando a la billetera…" : "Conectar billetera"}</button>
          )}
        </div>
      </header>
      {error && <p className="error">{error}</p>}
      {account && chainOk && (
        <nav>
          {TABS.map(([key, label]) => (
            <button key={key} className={tab === key ? "tab active" : "tab"} onClick={() => goTab(key)}>{label}</button>
          ))}
        </nav>
      )}
      <main>{content}</main>
      <TxList />
    </div>
  );
}
