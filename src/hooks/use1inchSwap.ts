'use client';

import { useState } from 'react';
import { MiniKit } from '@worldcoin/minikit-js';

// World Chain token addresses
const TOKENS = {
  USDC: '0x79A02482A880bCE3F13e09Da970dC34db4CD24d1', // USDC on World Chain
  WETH: '0x4200000000000000000000000000000000000006', // Wrapped ETH
  WBTC: '0x03C7054BCB39f7b2e5B2c7AcB37583e32D70Cfa3', // Wrapped BTC
  WLD: '0x2cFc85d8E48F8EAB294be644d9E25C3030863003',  // Worldcoin
} as const;

// 1inch API for World Chain (chainId 480)
const INCH_API = 'https://api.1inch.dev/swap/v6.0/480';

// Basic Parcelito compositions
export const PARCELITO_BASKETS = {
  'Blue Chips': {
    tokens: ['WETH', 'WBTC'],
    allocations: [60, 40], // percentages
  },
  'Layer 1s': {
    tokens: ['WETH', 'WLD'],
    allocations: [50, 50],
  },
  'DeFi Blue': {
    tokens: ['WETH', 'WBTC', 'WLD'],
    allocations: [40, 35, 25],
  },
} as const;

interface SwapResult {
  success: boolean;
  txHash?: string;
  error?: string;
}

export function use1inchSwap() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get 1inch swap quote
  const getSwapQuote = async (
    fromToken: string,
    toToken: string,
    amount: string, // in wei
    walletAddress: string
  ) => {
    try {
      const params = new URLSearchParams({
        src: fromToken,
        dst: toToken,
        amount: amount,
        from: walletAddress,
        slippage: '1', // 1% slippage
        disableEstimate: 'true',
      });

      const res = await fetch(`${INCH_API}/swap?${params}`, {
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_1INCH_API_KEY || ''}`,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to get swap quote');
      }

      return await res.json();
    } catch (err) {
      console.error('1inch quote error:', err);
      return null;
    }
  };

  // Buy a parcelito basket - swaps USDC to basket tokens
  const buyParcelitoBasket = async (
    basketName: keyof typeof PARCELITO_BASKETS,
    usdcAmount: bigint, // amount in USDC (6 decimals)
    walletAddress: string
  ): Promise<SwapResult> => {
    setIsLoading(true);
    setError(null);

    try {
      if (!MiniKit.isInstalled()) {
        throw new Error('Please open in World App');
      }

      const basket = PARCELITO_BASKETS[basketName];
      const transactions: any[] = [];

      // Build swap transactions for each token in basket
      for (let i = 0; i < basket.tokens.length; i++) {
        const tokenSymbol = basket.tokens[i] as keyof typeof TOKENS;
        const allocation = basket.allocations[i];
        const tokenAmount = (usdcAmount * BigInt(allocation)) / BigInt(100);

        if (tokenSymbol === 'WETH' || tokenSymbol === 'WBTC' || tokenSymbol === 'WLD') {
          const toAddress = TOKENS[tokenSymbol];

          // Get swap data from 1inch
          const swapData = await getSwapQuote(
            TOKENS.USDC,
            toAddress,
            tokenAmount.toString(),
            walletAddress
          );

          if (swapData && swapData.tx) {
            transactions.push({
              address: swapData.tx.to as `0x${string}`,
              abi: [] as const,
              functionName: '',
              args: [],
              data: swapData.tx.data,
            } as any);
          }
        }
      }

      if (transactions.length === 0) {
        throw new Error('No valid swap transactions');
      }

      // Execute all swaps via MiniKit
      const result = await MiniKit.commandsAsync.sendTransaction({
        transaction: transactions,
      });

      const { finalPayload } = result;
      if (!finalPayload || !(finalPayload as any).transaction_id) {
        throw new Error('Transaction cancelled or failed');
      }

      return {
        success: true,
        txHash: (finalPayload as any).transaction_id,
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Swap failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  // Simple direct swap
  const swapTokens = async (
    fromToken: keyof typeof TOKENS,
    toToken: keyof typeof TOKENS,
    amount: bigint,
    walletAddress: string
  ): Promise<SwapResult> => {
    setIsLoading(true);
    setError(null);

    try {
      if (!MiniKit.isInstalled()) {
        throw new Error('Please open in World App');
      }

      const swapData = await getSwapQuote(
        TOKENS[fromToken],
        TOKENS[toToken],
        amount.toString(),
        walletAddress
      );

      if (!swapData || !swapData.tx) {
        throw new Error('Failed to get swap quote');
      }

      const result = await MiniKit.commandsAsync.sendTransaction({
        transaction: [{
          address: swapData.tx.to as `0x${string}`,
          abi: [] as const,
          functionName: '',
          args: [],
          data: swapData.tx.data,
        } as any],
      });

      const { finalPayload } = result;
      if (!finalPayload || !(finalPayload as any).transaction_id) {
        throw new Error('Transaction cancelled or failed');
      }

      return {
        success: true,
        txHash: (finalPayload as any).transaction_id,
      };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Swap failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    buyParcelitoBasket,
    swapTokens,
    getSwapQuote,
    isLoading,
    error,
    TOKENS,
    PARCELITO_BASKETS,
  };
}
