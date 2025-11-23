// ENS utilities for storing parcelito claims

// Standard ENS Public Resolver ABI (only setText function)
export const ENS_RESOLVER_ABI = [
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
    inputs: [
      { name: 'node', type: 'bytes32' },
      { name: 'key', type: 'string' }
    ],
    name: 'text',
    outputs: [{ name: '', type: 'string' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const;

// ENS Registry ABI (to get resolver)
export const ENS_REGISTRY_ABI = [
  {
    inputs: [{ name: 'node', type: 'bytes32' }],
    name: 'resolver',
    outputs: [{ name: '', type: 'address' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const;

// World Chain ENS Registry address (same as mainnet standard)
export const ENS_REGISTRY_ADDRESS = '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e';

// Parcelito definitions
export const PARCELITO_COMPOSITIONS = {
  'Layer 1s': {
    tokens: ['ETH', 'SOL', 'AVAX'],
    allocations: [50, 30, 20],
    addresses: {
      ETH: '0x0000000000000000000000000000000000000000',
      SOL: '0x570a5d26f7765ecb712c0924e4de545b89fd43df', // Wrapped SOL
      AVAX: '0x85f138bfee4ef8e540890cfb48f620571d67eda3', // Wrapped AVAX
    }
  },
  'Real World': {
    tokens: ['PAXG', 'ONDO', 'RWA'],
    allocations: [40, 35, 25],
    addresses: {
      PAXG: '0x45804880de22913dafe09f4980848ece6ecbaf78',
      ONDO: '0xfaba6f8e4a5e8ab82f62fe7c39859fa577269be3',
      RWA: '0x0000000000000000000000000000000000000000', // placeholder
    }
  },
  'DeFi Blue': {
    tokens: ['UNI', 'AAVE', 'MKR'],
    allocations: [40, 35, 25],
    addresses: {
      UNI: '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984',
      AAVE: '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9',
      MKR: '0x9f8f72aa9304c8b593d555f12ef6589cc3a579a2',
    }
  }
};

// Calculate namehash for ENS domain
export function namehash(name: string): string {
  let node = '0x0000000000000000000000000000000000000000000000000000000000000000';

  if (name) {
    const labels = name.split('.');
    for (let i = labels.length - 1; i >= 0; i--) {
      const labelHash = keccak256(labels[i]);
      node = keccak256Concat(node, labelHash);
    }
  }

  return node;
}

// Simple keccak256 using Web Crypto (for browser)
function keccak256(input: string): string {
  // Use ethers or viem in real implementation
  // This is a placeholder - will use proper library
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  // For now return a mock - will replace with real keccak256
  return '0x' + Array.from(data).map(b => b.toString(16).padStart(2, '0')).join('').padEnd(64, '0');
}

function keccak256Concat(a: string, b: string): string {
  // Concatenate and hash - placeholder
  return '0x' + (a.slice(2) + b.slice(2)).slice(0, 64);
}

// Create claims JSON for a parcelito purchase
export function createClaimsJson(
  parcelitoType: keyof typeof PARCELITO_COMPOSITIONS,
  amountUsd: number,
  timestamp: number = Date.now()
): string {
  const composition = PARCELITO_COMPOSITIONS[parcelitoType];

  const claim = {
    type: parcelitoType,
    amountUsd,
    timestamp,
    tokens: composition.tokens.map((token, i) => ({
      symbol: token,
      allocation: composition.allocations[i],
      // In real impl, calculate actual token amounts based on price
      estimatedAmount: (amountUsd * composition.allocations[i] / 100).toFixed(2)
    }))
  };

  return JSON.stringify(claim);
}

// Merge new claim with existing claims
export function mergeClaims(existingClaimsJson: string | null, newClaimJson: string): string {
  let claims: object[] = [];

  if (existingClaimsJson) {
    try {
      const existing = JSON.parse(existingClaimsJson);
      claims = Array.isArray(existing) ? existing : [existing];
    } catch {
      claims = [];
    }
  }

  claims.push(JSON.parse(newClaimJson));
  return JSON.stringify(claims);
}
