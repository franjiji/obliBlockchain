import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { BrowserProvider, getAddress } from "ethers";
import { deployment, LOCAL_CHAIN_PARAMS, NETWORK_NAMES } from "./config.js";

const Ctx = createContext(null);
export const useWallet = () => useContext(Ctx);

export function WalletProvider({ children }) {
  const [provider, setProvider] = useState(null);
  const [account, setAccount] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [error, setError] = useState(null);
  const [connecting, setConnecting] = useState(false);
  const eth = window.ethereum;

  // Se crea un BrowserProvider nuevo en cada cambio: ethers falla si se reusa tras cambiar de red.
  const sync = useCallback(async () => {
    if (!eth) return;
    const accounts = await eth.request({ method: "eth_accounts" });
    const bp = new BrowserProvider(eth);
    const net = await bp.getNetwork();
    setProvider(bp);
    setChainId(Number(net.chainId));
    setAccount(accounts[0] ? getAddress(accounts[0]) : null);
    if (accounts[0]) setError(null); // ya conectada: se limpia un error viejo (p. ej. "solicitud pendiente")
  }, [eth]);

  useEffect(() => {
    if (!eth) return;
    sync().catch((e) => setError(e.message));
    eth.on?.("accountsChanged", sync);
    eth.on?.("chainChanged", sync);
    return () => {
      eth.removeListener?.("accountsChanged", sync);
      eth.removeListener?.("chainChanged", sync);
    };
  }, [eth, sync]);

  const connect = useCallback(async () => {
    setConnecting(true);
    try {
      setError(null);
      await eth.request({ method: "eth_requestAccounts" });
      await sync();
    } catch (e) {
      if (e.code === 4001) setError("Conexión rechazada en la billetera.");
      else if (e.code === -32002 || /already pending/i.test(e.message ?? ""))
        setError("Ya hay una solicitud pendiente: abrí la extensión MetaMask (ícono en la barra del navegador) y aceptá o rechazá la conexión.");
      else setError(e.message);
    } finally {
      setConnecting(false);
    }
  }, [eth, sync]);

  const switchNetwork = useCallback(async () => {
    const hexId = "0x" + deployment.chainId.toString(16);
    try {
      await eth.request({ method: "wallet_switchEthereumChain", params: [{ chainId: hexId }] });
    } catch (e) {
      if (e.code === 4902 && deployment.chainId === 31337) {
        await eth.request({ method: "wallet_addEthereumChain", params: [LOCAL_CHAIN_PARAMS] });
      } else {
        setError(e.message);
      }
    }
  }, [eth]);

  const value = useMemo(
    () => ({
      hasWallet: !!eth,
      provider,
      account,
      chainId,
      chainName: chainId ? (NETWORK_NAMES[chainId] ?? `Red ${chainId}`) : null,
      chainOk: chainId === deployment.chainId,
      expectedChainName: NETWORK_NAMES[deployment.chainId] ?? `Red ${deployment.chainId}`,
      error,
      connecting,
      connect,
      switchNetwork,
    }),
    [eth, provider, account, chainId, error, connecting, connect, switchNetwork],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
