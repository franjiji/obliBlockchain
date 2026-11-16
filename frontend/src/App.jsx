import { useState } from "react";
import { useWallet } from "./lib/wallet.jsx";
import { useTx } from "./lib/tx.jsx";
import { shortAddr } from "./lib/format.js";
import CreateAgreement from "./pages/CreateAgreement.jsx";
import Created from "./pages/Created.jsx";
import Income from "./pages/Income.jsx";
import Detail from "./pages/Detail.jsx";
import Welcome from "./pages/Welcome.jsx";

const TABS = [
  ["home", "Inicio"],
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
  const { hasWallet, account, chainId, chainName, chainOk, supportedChains, error, connecting, connect, switchNetwork } = useWallet();
  const [tab, setTab] = useState("home");
  const [detailId, setDetailId] = useState(null);
  const [backTab, setBackTab] = useState("created"); // pantalla desde la que se abrio el detalle

  const open = (id) => { setDetailId(id); setBackTab(tab); setTab("detail"); };
  const goTab = (t) => { setDetailId(null); setTab(t); };

  let content;
  if (!hasWallet || !account) content = <Welcome hasWallet={hasWallet} connecting={connecting} connect={connect} />;
  else if (!chainOk) content = (
    <div className="card">
      <p className="error">Estás en la red «{chainName}», pero la dApp solo está desplegada en: {supportedChains.map((c) => c.name).join(" y ")}.</p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {supportedChains.map((c) => <button key={c.chainId} className="primary" onClick={() => switchNetwork(c.chainId)}>Cambiar a {c.name}</button>)}
      </div>
    </div>
  );
  else if (tab === "home") content = <Welcome hasWallet account={account} onStart={() => goTab("create")} />;
  else if (tab === "detail") content = <Detail id={detailId} onBack={() => goTab(backTab)} />;
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
              <select className="net" aria-label="Red" value={chainOk ? chainId : ""} onChange={(e) => switchNetwork(Number(e.target.value))}>
                {!chainOk && <option value="">{chainName}</option>}
                {supportedChains.map((c) => <option key={c.chainId} value={c.chainId}>{c.name}</option>)}
              </select>
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
      <main key={chainId}>{content}</main>
      <TxList />
    </div>
  );
}
