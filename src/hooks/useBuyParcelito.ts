'use client';

import { useState } from 'react';
import { MiniKit } from '@worldcoin/minikit-js';
import { PARCELITO_COMPOSITIONS } from '@/lib/ens';
import { keccak256, encodePacked, namehash } from 'viem';

// L2Registry (parcelito.eth) on World Chain - DEPLOYED!
const PARCELITO_REGISTRY = '0x6383b5B1E7a67eC5579e8953e8FE9f3c09Ca7f40';

// Base node for parcelito.eth (namehash)
const BASE_NODE = namehash('parcelito.eth');

// Durin L2Registry ABI (only functions we need)
const REGISTRY_ABI = [
  // Create subdomain: createSubnode(parentNode, label, owner, data)
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
  // Set text record: setText(node, key, value)
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
  // Get text record
  {
    inputs: [
      { name: 'node', type: 'bytes32' },
      { name: 'key', type: 'string' }
    ],
    name: 'text',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function'
  },
  // Check owner of node
  {
    inputs: [{ name: 'node', type: 'bytes32' }],
    name: 'owner',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  },
  // Get node from parent + label
  {
    inputs: [
      { name: 'parentNode', type: 'bytes32' },
      { name: 'label', type: 'string' }
    ],
    name: 'makeNode',
    outputs: [{ name: '', type: 'bytes32' }],
    stateMutability: 'pure',
    type: 'function'
  },
  // Base node
  {
    inputs: [],
    name: 'baseNode',
    outputs: [{ name: '', type: 'bytes32' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const;

interface BuyParcelitoResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

// Helper to compute subnode hash (same as contract's makeNode)
function makeNode(parentNode: `0x${string}`, label: string): `0x${string}` {
  const labelhash = keccak256(encodePacked(['string'], [label]));
  return keccak256(encodePacked(['bytes32', 'bytes32'], [parentNode, labelhash]));
}

export function useBuyParcelito() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Register username as subdomain (one-time)
  // Creates: username.parcelitos.eth
  const registerUsername = async (username: string, ownerAddress: string): Promise<BuyParcelitoResult> => {
    setIsLoading(true);
    setError(null);

    try {
      if (!MiniKit.isInstalled()) {
        throw new Error('Please open in World App');
      }

      // Create subdomain under parcelitos.eth
      const result = await MiniKit.commandsAsync.sendTransaction({
        transaction: [
          {
            address: PARCELITO_REGISTRY,
            abi: REGISTRY_ABI,
            functionName: 'createSubnode',
            args: [BASE_NODE, username, ownerAddress, []],
          }
        ],
      });

      const { finalPayload } = result;
      if (!finalPayload || !(finalPayload as Record<string, unknown>).transaction_id) {
        throw new Error('Registration cancelled or failed');
      }

      return {
        success: true,
        transactionId: (finalPayload as Record<string, unknown>).transaction_id as string,
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Record a purchase on user's subdomain
  const recordPurchase = async (
    username: string,
    parcelitoType: keyof typeof PARCELITO_COMPOSITIONS,
    amountUsd: number
  ): Promise<BuyParcelitoResult> => {
    setIsLoading(true);
    setError(null);

    try {
      if (!MiniKit.isInstalled()) {
        throw new Error('Please open in World App');
      }

      // Get the user's subdomain node
      const userNode = makeNode(BASE_NODE as `0x${string}`, username);

      // Simple text record for the purchase
      const purchaseValue = `${parcelitoType}:$${amountUsd}:${Date.now()}`;

      // Set text record on user's subdomain
      const result = await MiniKit.commandsAsync.sendTransaction({
        transaction: [
          {
            address: PARCELITO_REGISTRY,
            abi: REGISTRY_ABI,
            functionName: 'setText',
            args: [userNode, 'parcelito.purchased', purchaseValue],
          }
        ],
      });

      const { finalPayload } = result;
      if (!finalPayload || !(finalPayload as Record<string, unknown>).transaction_id) {
        throw new Error('Transaction cancelled or failed');
      }

      return {
        success: true,
        transactionId: (finalPayload as Record<string, unknown>).transaction_id as string,
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Record a gift sent
  const recordGift = async (
    username: string,
    parcelitoType: keyof typeof PARCELITO_COMPOSITIONS,
    amountUsd: number,
    recipient: string
  ): Promise<BuyParcelitoResult> => {
    setIsLoading(true);
    setError(null);

    try {
      if (!MiniKit.isInstalled()) {
        throw new Error('Please open in World App');
      }

      const userNode = makeNode(BASE_NODE as `0x${string}`, username);
      const giftValue = `${parcelitoType}:$${amountUsd}:to:${recipient}:${Date.now()}`;

      const result = await MiniKit.commandsAsync.sendTransaction({
        transaction: [
          {
            address: PARCELITO_REGISTRY,
            abi: REGISTRY_ABI,
            functionName: 'setText',
            args: [userNode, 'parcelito.gifted', giftValue],
          }
        ],
      });

      const { finalPayload } = result;
      if (!finalPayload || !(finalPayload as Record<string, unknown>).transaction_id) {
        throw new Error('Transaction cancelled or failed');
      }

      return {
        success: true,
        transactionId: (finalPayload as Record<string, unknown>).transaction_id as string,
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Record a gift received
  const recordReceived = async (
    username: string,
    parcelitoType: keyof typeof PARCELITO_COMPOSITIONS,
    amountUsd: number,
    sender: string
  ): Promise<BuyParcelitoResult> => {
    setIsLoading(true);
    setError(null);

    try {
      if (!MiniKit.isInstalled()) {
        throw new Error('Please open in World App');
      }

      const userNode = makeNode(BASE_NODE as `0x${string}`, username);
      const receivedValue = `${parcelitoType}:$${amountUsd}:from:${sender}:${Date.now()}`;

      const result = await MiniKit.commandsAsync.sendTransaction({
        transaction: [
          {
            address: PARCELITO_REGISTRY,
            abi: REGISTRY_ABI,
            functionName: 'setText',
            args: [userNode, 'parcelito.received', receivedValue],
          }
        ],
      });

      const { finalPayload } = result;
      if (!finalPayload || !(finalPayload as Record<string, unknown>).transaction_id) {
        throw new Error('Transaction cancelled or failed');
      }

      return {
        success: true,
        transactionId: (finalPayload as Record<string, unknown>).transaction_id as string,
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Record a created parcelito (requires World ID verification)
  const recordCreated = async (
    username: string,
    parcelitoName: string,
    tokens: string[]
  ): Promise<BuyParcelitoResult> => {
    setIsLoading(true);
    setError(null);

    try {
      if (!MiniKit.isInstalled()) {
        throw new Error('Please open in World App');
      }

      const userNode = makeNode(BASE_NODE as `0x${string}`, username);
      const createdValue = `${parcelitoName}:[${tokens.join(',')}]:${Date.now()}`;

      const result = await MiniKit.commandsAsync.sendTransaction({
        transaction: [
          {
            address: PARCELITO_REGISTRY,
            abi: REGISTRY_ABI,
            functionName: 'setText',
            args: [userNode, 'parcelito.created', createdValue],
          }
        ],
      });

      const { finalPayload } = result;
      if (!finalPayload || !(finalPayload as Record<string, unknown>).transaction_id) {
        throw new Error('Transaction cancelled or failed');
      }

      return {
        success: true,
        transactionId: (finalPayload as Record<string, unknown>).transaction_id as string,
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    registerUsername,
    recordPurchase,
    recordGift,
    recordReceived,
    recordCreated,
    isLoading,
    error,
    PARCELITO_REGISTRY,
    BASE_NODE,
    makeNode,
  };
}
