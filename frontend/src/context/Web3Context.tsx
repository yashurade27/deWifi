import { createContext, useContext, useState, useCallback, useEffect } from "react";
import type { ReactNode } from "react";
import { BrowserProvider, ethers } from "ethers";
import { connectWallet as connectWeb3Wallet, isWalletAvailable } from "../lib/contracts";

interface Web3ContextType {
  /** Connected wallet address (null if not connected) */
  address: string | null;
  /** ethers.js BrowserProvider */
  provider: BrowserProvider | null;
  /** ethers.js Signer for sending transactions */
  signer: ethers.Signer | null;
  /** Whether wallet is currently connecting */
  isConnecting: boolean;
  /** Connect MetaMask / injected wallet */
  connect: () => Promise<void>;
  /** Disconnect (clear local state) */
  disconnect: () => void;
  /** Whether any wallet extension is installed */
  walletAvailable: boolean;
  /** Current chain ID */
  chainId: number | null;
  /** Error message from last failed operation */
  error: string | null;
}

const Web3Context = createContext<Web3ContextType>({
  address: null,
  provider: null,
  signer: null,
  isConnecting: false,
  connect: async () => {},
  disconnect: () => {},
  walletAvailable: false,
  chainId: null,
  error: null,
});

export const useWeb3 = () => useContext(Web3Context);

export function Web3Provider({ children }: { children: ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [provider, setProvider] = useState<BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [chainId, setChainId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const walletAvailable = isWalletAvailable();

  const connect = useCallback(async () => {
    if (!walletAvailable) {
      setError("No Ethereum wallet found. Please install MetaMask.");
      return;
    }

    setIsConnecting(true);
    setError(null);

    try {
      const { provider: p, signer: s, address: addr } = await connectWeb3Wallet();
      const network = await p.getNetwork();

      setProvider(p);
      setSigner(s);
      setAddress(addr);
      setChainId(Number(network.chainId));

      // Persist connection preference
      localStorage.setItem("airlink_web3_connected", "true");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to connect wallet";
      setError(message);
    } finally {
      setIsConnecting(false);
    }
  }, [walletAvailable]);

  const disconnect = useCallback(() => {
    setAddress(null);
    setProvider(null);
    setSigner(null);
    setChainId(null);
    setError(null);
    localStorage.removeItem("airlink_web3_connected");
  }, []);

  // Auto-reconnect if user was previously connected
  useEffect(() => {
    if (walletAvailable && localStorage.getItem("airlink_web3_connected") === "true") {
      connect();
    }
  }, [walletAvailable, connect]);

  // Listen for account and chain changes
  useEffect(() => {
    if (!walletAvailable || !window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect();
      } else {
        setAddress(accounts[0]);
      }
    };

    const handleChainChanged = (chainIdHex: string) => {
      setChainId(parseInt(chainIdHex, 16));
      // Reconnect to get new provider/signer for the new chain
      connect();
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    return () => {
      window.ethereum?.removeListener("accountsChanged", handleAccountsChanged);
      window.ethereum?.removeListener("chainChanged", handleChainChanged);
    };
  }, [walletAvailable, connect, disconnect]);

  return (
    <Web3Context.Provider
      value={{
        address,
        provider,
        signer,
        isConnecting,
        connect,
        disconnect,
        walletAvailable,
        chainId,
        error,
      }}
    >
      {children}
    </Web3Context.Provider>
  );
}
