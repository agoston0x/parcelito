'use client';

import { useState, useCallback } from 'react';
import { MiniKit } from '@worldcoin/minikit-js';
import { keccak256, encodePacked, namehash } from 'viem';

// L2Registry (parcelito.eth) on World Chain - DEPLOYED!
const PARCELITO_REGISTRY = '0x6383b5B1E7a67eC5579e8953e8FE9f3c09Ca7f40';

const BASE_NODE = namehash('parcelito.eth');

// World Chain token addresses
const TOKENS = {
  USDC: '0x79A02482A880bCE3F13e09Da970dC34db4CD24d1',
  WETH: '0x4200000000000000000000000000000000000006',
  WBTC: '0x03C7054BCB39f7b2e5B2c7AcB37583e32D70Cfa3',
  WLD: '0x2cFc85d8E48F8EAB294be644d9E25C3030863003',
} as const;

// 1inch Aggregation Router on World Chain
const INCH_ROUTER = '0x111111125421ca6dc452d289314280a0f8842a65';

// Durin L2Registry ABI
const REGISTRY_ABI = [
  {
    inputs: [
      { name: 'node', type: 'bytes32' },
      { name: 'label', type: 'string' },
      { name: '_owner', type: 'address' },
      { name: 'data', type: 'bytes[]' }
    ],
    name: 'createSubnode',
    outputs: [{ name: '', type: 'bytes32' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'node', type: 'bytes32' },
      { name: 'key', type: 'string' },
      { name: 'value', type: 'string' }
    ],
    name: 'setText',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'node', type: 'bytes32' }],
    name: 'owner',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  },
] as const;

// ERC20 approve ABI
const ERC20_ABI = [
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
] as const;

function makeNode(parentNode: `0x${string}`, label: string): `0x${string}` {
  const labelhash = keccak256(encodePacked(['string'], [label]));
  return keccak256(encodePacked(['bytes32', 'bytes32'], [parentNode, labelhash]));
}

interface ActionResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

export function useParcelito() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);

  // Check if username is registered
  const checkRegistration = useCallback(async (username: string): Promise<boolean> => {
    try {
      const userNode = makeNode(BASE_NODE as `0x${string}`, username);
      // Check via RPC if owner exists for this node
      const response = await fetch('https://worldchain-mainnet.g.alchemy.com/public', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          method: 'eth_call',
          params: [{
            to: PARCELITO_REGISTRY,
            data: `0x02571be3${userNode.slice(2)}` // owner(bytes32)
          }, 'latest'],
          id: 1
        })
      });
      const data = await response.json();
      // If owner is not zero address, user is registered
      const registered = data.result && data.result !== '0x0000000000000000000000000000000000000000000000000000000000000000';
      setIsRegistered(registered);
      return registered;
    } catch {
      return false;
    }
  }, []);

  // Register username (creates subdomain)
  const registerUsername = async (username: string, ownerAddress: string): Promise<ActionResult> => {
    setIsLoading(true);
    setError(null);

    try {
      if (!MiniKit.isInstalled()) {
        throw new Error('Please open in World App');
      }

      const result = await MiniKit.commandsAsync.sendTransaction({
        transaction: [{
          address: PARCELITO_REGISTRY,
          abi: REGISTRY_ABI,
          functionName: 'createSubnode',
          args: [BASE_NODE, username, ownerAddress, []],
        }],
      });

      const { finalPayload } = result;
      if (!finalPayload || !(finalPayload as any).transaction_id) {
        throw new Error('Registration failed');
      }

      setIsRegistered(true);
      return { success: true, txHash: (finalPayload as any).transaction_id };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  };

  // Buy parcelito: approve USDC → swap via 1inch → record on ENS
  const buyParcelito = async (
    username: string,
    walletAddress: string,
    basketName: string,
    usdcAmount: string, // e.g. "100" for $100
    swapData: string // 1inch swap calldata
  ): Promise<ActionResult> => {
    setIsLoading(true);
    setError(null);

    try {
      if (!MiniKit.isInstalled()) {
        throw new Error('Please open in World App');
      }

      // Check if registered, if not register first
      const registered = await checkRegistration(username);

      const transactions: any[] = [];

      // 1. Register if needed
      if (!registered) {
        transactions.push({
          address: PARCELITO_REGISTRY,
          abi: REGISTRY_ABI,
          functionName: 'createSubnode',
          args: [BASE_NODE, username, walletAddress, []],
        });
      }

      // 2. Approve USDC for 1inch router
      const amountWei = BigInt(parseFloat(usdcAmount) * 1e6); // USDC has 6 decimals
      transactions.push({
        address: TOKENS.USDC,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [INCH_ROUTER, amountWei],
      });

      // 3. Execute 1inch swap (swapData from API)
      if (swapData) {
        transactions.push({
          address: INCH_ROUTER,
          data: swapData,
        });
      }

      // 4. Record purchase on ENS
      const userNode = makeNode(BASE_NODE as `0x${string}`, username);
      const purchaseRecord = `${basketName}:$${usdcAmount}:${Date.now()}`;
      transactions.push({
        address: PARCELITO_REGISTRY,
        abi: REGISTRY_ABI,
        functionName: 'setText',
        args: [userNode, 'parcelito.purchased', purchaseRecord],
      });

      const result = await MiniKit.commandsAsync.sendTransaction({
        transaction: transactions,
      });

      const { finalPayload } = result;
      if (!finalPayload || !(finalPayload as any).transaction_id) {
        throw new Error('Purchase failed');
      }

      return { success: true, txHash: (finalPayload as any).transaction_id };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Purchase failed';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  };

  // Gift parcelito: record on ENS + send email
  const giftParcelito = async (
    senderUsername: string,
    senderAddress: string,
    recipientEmail: string,
    basketName: string,
    usdcAmount: string
  ): Promise<ActionResult> => {
    setIsLoading(true);
    setError(null);

    try {
      if (!MiniKit.isInstalled()) {
        throw new Error('Please open in World App');
      }

      // Check if sender is registered
      const registered = await checkRegistration(senderUsername);

      const transactions: any[] = [];

      // 1. Register sender if needed
      if (!registered) {
        transactions.push({
          address: PARCELITO_REGISTRY,
          abi: REGISTRY_ABI,
          functionName: 'createSubnode',
          args: [BASE_NODE, senderUsername, senderAddress, []],
        });
      }

      // 2. Record gift on sender's ENS
      const userNode = makeNode(BASE_NODE as `0x${string}`, senderUsername);
      const giftRecord = `${basketName}:$${usdcAmount}:to:${recipientEmail}:${Date.now()}`;
      transactions.push({
        address: PARCELITO_REGISTRY,
        abi: REGISTRY_ABI,
        functionName: 'setText',
        args: [userNode, 'parcelito.gifted', giftRecord],
      });

      const result = await MiniKit.commandsAsync.sendTransaction({
        transaction: transactions,
      });

      const { finalPayload } = result;
      if (!finalPayload || !(finalPayload as any).transaction_id) {
        throw new Error('Gift transaction failed');
      }

      // 3. Send email via API
      await fetch('/api/send-gift-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: recipientEmail,
          amount: usdcAmount,
          parcelito: basketName,
          sender: senderUsername,
          claimCode: (finalPayload as any).transaction_id,
        }),
      });

      return { success: true, txHash: (finalPayload as any).transaction_id };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gift failed';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  };

  // Claim received parcelito (for new users)
  const claimParcelito = async (
    username: string,
    walletAddress: string,
    claimCode: string,
    basketName: string,
    amount: string
  ): Promise<ActionResult> => {
    setIsLoading(true);
    setError(null);

    try {
      if (!MiniKit.isInstalled()) {
        throw new Error('Please open in World App');
      }

      const transactions: any[] = [];

      // 1. Register new user (creates their subdomain)
      const registered = await checkRegistration(username);
      if (!registered) {
        transactions.push({
          address: PARCELITO_REGISTRY,
          abi: REGISTRY_ABI,
          functionName: 'createSubnode',
          args: [BASE_NODE, username, walletAddress, []],
        });
      }

      // 2. Record received parcelito
      const userNode = makeNode(BASE_NODE as `0x${string}`, username);
      const receivedRecord = `${basketName}:$${amount}:claim:${claimCode}:${Date.now()}`;
      transactions.push({
        address: PARCELITO_REGISTRY,
        abi: REGISTRY_ABI,
        functionName: 'setText',
        args: [userNode, 'parcelito.received', receivedRecord],
      });

      const result = await MiniKit.commandsAsync.sendTransaction({
        transaction: transactions,
      });

      const { finalPayload } = result;
      if (!finalPayload || !(finalPayload as any).transaction_id) {
        throw new Error('Claim failed');
      }

      setIsRegistered(true);
      return { success: true, txHash: (finalPayload as any).transaction_id };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Claim failed';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    checkRegistration,
    registerUsername,
    buyParcelito,
    giftParcelito,
    claimParcelito,
    isLoading,
    isRegistered,
    error,
    PARCELITO_REGISTRY,
    TOKENS,
    makeNode,
  };
}
