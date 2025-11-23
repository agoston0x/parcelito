import { NextResponse } from 'next/server';
import { createPublicClient, http } from 'viem';
import { mainnet } from 'viem/chains';
import { normalize } from 'viem/ens';

const client = createPublicClient({
  chain: mainnet,
  transport: http('https://eth.llamarpc.com'),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name');

  if (!name) {
    return NextResponse.json({ error: 'Name required' }, { status: 400 });
  }

  try {
    // Normalize the ENS name
    const normalizedName = normalize(name);

    // Get resolver address
    const resolverAddress = await client.getEnsResolver({
      name: normalizedName,
    });

    // Get the address it resolves to
    const address = await client.getEnsAddress({
      name: normalizedName,
    });

    return NextResponse.json({
      name: normalizedName,
      resolverAddress,
      address,
    });
  } catch (error) {
    console.error('ENS lookup error:', error);
    return NextResponse.json({
      error: 'Failed to lookup ENS',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
