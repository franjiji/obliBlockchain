import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { errorMessage } from "./format.js";

const Ctx = createContext(null);
export const useTx = () => useContext(Ctx);

const POLL_MS = 15000;

export function TxProvider({ children }) {
  const [txs, setTxs] = useState([]); // { id, label, status: pending | confirmed | failed, hash, error }
  const [refreshKey, setRefreshKey] = useState(0);
  const nextId = useRef(1);

  // Refresco periodico: el devengado crece con el tiempo aunque nadie transaccione.
  useEffect(() => {
    const t = setInterval(() => setRefreshKey((k) => k + 1), POLL_MS);
    return () => clearInterval(t);
  }, []);

  const patch = (id, changes) => setTxs((list) => list.map((t) => (t.id === id ? { ...t, ...changes } : t)));

  /** Ejecuta una tx mostrando pendiente → confirmada/fallida y refresca los datos al confirmar. */
  const send = useCallback(async (label, action) => {
    const id = nextId.current++;
    setTxs((list) => [{ id, label, status: "pending" }, ...list].slice(0, 5));
    try {
      const tx = await action();
      patch(id, { hash: tx.hash });
      const receipt = await tx.wait();
      if (receipt.status !== 1) throw new Error("La transacción fue revertida.");
      patch(id, { status: "confirmed" });
      setRefreshKey((k) => k + 1);
      return true;
    } catch (e) {
      patch(id, { status: "failed", error: errorMessage(e) });
      return false;
    }
  }, []);

  const dismiss = useCallback((id) => setTxs((list) => list.filter((t) => t.id !== id)), []);
  const value = useMemo(() => ({ txs, send, dismiss, refreshKey }), [txs, send, dismiss, refreshKey]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
