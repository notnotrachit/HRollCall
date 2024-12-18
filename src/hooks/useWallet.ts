import { useState, useEffect } from 'react';
import { ethers } from 'ethers';

export interface WalletState {
  address: string | null;
  isConnected: boolean;
  provider: ethers.providers.Web3Provider | null;
  signer: ethers.Signer | null;
  chainId: number | null;
  balance: string | null;
}

export const useWallet = () => {
  const [walletState, setWalletState] = useState<WalletState>({
    address: null,
    isConnected: false,
    provider: null,
    signer: null,
    chainId: null,
    balance: null,
  });

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        // Request account access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const address = accounts[0];
        const network = await provider.getNetwork();
        const balance = ethers.utils.formatEther(await provider.getBalance(address));

        setWalletState({
          address,
          isConnected: true,
          provider,
          signer,
          chainId: network.chainId,
          balance,
        });

        return true;
      } catch (error) {
        console.error('Error connecting wallet:', error);
        return false;
      }
    } else {
      console.error('Please install MetaMask or another Web3 wallet');
      return false;
    }
  };

  const disconnectWallet = () => {
    setWalletState({
      address: null,
      isConnected: false,
      provider: null,
      signer: null,
      chainId: null,
      balance: null,
    });
  };

  useEffect(() => {
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else if (walletState.address !== accounts[0]) {
        connectWallet();
      }
    };

    const handleChainChanged = () => {
      window.location.reload();
    };

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      // Check if already connected
      window.ethereum.request({ method: 'eth_accounts' })
        .then((accounts: string[]) => {
          if (accounts.length > 0) {
            connectWallet();
          }
        });

      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  return {
    ...walletState,
    connectWallet,
    disconnectWallet,
  };
};

export default useWallet;
