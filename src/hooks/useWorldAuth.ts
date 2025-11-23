'use client';

import { useState, useCallback } from 'react';
import { MiniKit, VerificationLevel } from '@worldcoin/minikit-js';

interface WorldUser {
  walletAddress: string;
  username: string;
  isVerified: boolean;
  verificationLevel: 'orb' | 'device' | 'none';
}

interface AuthResult {
  success: boolean;
  user?: WorldUser;
  error?: string;
}

export function useWorldAuth() {
  const [user, setUser] = useState<WorldUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Authenticate with World App and get user info
  const authenticate = useCallback(async (): Promise<AuthResult> => {
    setIsLoading(true);
    setError(null);

    try {
      if (!MiniKit.isInstalled()) {
        throw new Error('Please open in World App');
      }

      // Generate nonce for SIWE
      const nonce = crypto.randomUUID().replace(/-/g, '').slice(0, 16);

      // Request wallet auth
      const authResult = await MiniKit.commandsAsync.walletAuth({
        nonce,
        expirationTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week
        statement: 'Sign in to Parcelito',
      });

      const { finalPayload } = authResult;
      if (!finalPayload || (finalPayload as Record<string, unknown>).status === 'error') {
        throw new Error('Authentication cancelled');
      }

      const address = (finalPayload as Record<string, unknown>).address as string;

      // Get user details including username
      const userInfo = await MiniKit.getUserByAddress(address);

      const worldUser: WorldUser = {
        walletAddress: address,
        username: userInfo?.username || address.slice(0, 8),
        isVerified: false,
        verificationLevel: 'none',
      };

      setUser(worldUser);
      return { success: true, user: worldUser };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Authentication failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Verify with World ID (device or orb level)
  const verify = useCallback(async (level: 'device' | 'orb' = 'device'): Promise<AuthResult> => {
    setIsLoading(true);
    setError(null);

    try {
      if (!MiniKit.isInstalled()) {
        throw new Error('Please open in World App');
      }

      const verificationLevel = level === 'orb'
        ? VerificationLevel.Orb
        : VerificationLevel.Device;

      // Request World ID verification
      const verifyResult = await MiniKit.commandsAsync.verify({
        action: 'parcelito-verify',
        verification_level: verificationLevel,
      });

      const { finalPayload } = verifyResult;
      if (!finalPayload || (finalPayload as Record<string, unknown>).status === 'error') {
        throw new Error('Verification cancelled or failed');
      }

      // Update user state
      if (user) {
        const verifiedUser: WorldUser = {
          ...user,
          isVerified: true,
          verificationLevel: level,
        };
        setUser(verifiedUser);
        return { success: true, user: verifiedUser };
      }

      return { success: true };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Verification failed';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  return {
    user,
    authenticate,
    verify,
    isLoading,
    error,
    isAuthenticated: !!user,
    isVerified: user?.isVerified ?? false,
  };
}
