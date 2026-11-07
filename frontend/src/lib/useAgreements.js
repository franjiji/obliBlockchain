import { useEffect, useState } from "react";
import { useWallet } from "./wallet.jsx";
import { useTx } from "./tx.jsx";
import { fetchAgreements } from "./agreements.js";
import { errorMessage } from "./format.js";

/** role: "payer" (acuerdos creados) | "beneficiary" (mis ingresos). Se recarga tras cada tx y cada 15 s. */
export function useAgreements(role) {
  const { provider, account, chainOk } = useWallet();
  const { refreshKey } = useTx();
  const [state, setState] = useState({ rows: null, error: null });

  useEffect(() => {
    if (!provider || !account || !chainOk) return;
    let cancelled = false;
    const filter = role === "payer" ? { payer: account } : { beneficiary: account };
    fetchAgreements(provider, filter)
      .then((rows) => !cancelled && setState({ rows, error: null }))
      .catch((e) => !cancelled && setState({ rows: null, error: errorMessage(e) }));
    return () => {
      cancelled = true;
    };
  }, [provider, account, chainOk, role, refreshKey]);

  return state;
}
