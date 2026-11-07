import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { WalletProvider } from "./lib/wallet.jsx";
import { TxProvider } from "./lib/tx.jsx";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <WalletProvider>
      <TxProvider>
        <App />
      </TxProvider>
    </WalletProvider>
  </React.StrictMode>,
);
