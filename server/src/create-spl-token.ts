import { Connection, Keypair, clusterApiUrl } from '@solana/web3.js';
import { createMint, getOrCreateAssociatedTokenAccount, mintTo } from '@solana/spl-token';
import fs from 'fs';
import path from 'path';

const loadKeypair = (filePath: string): Keypair => {
  const secretKeyString = fs.readFileSync(filePath, 'utf8');
  const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
  return Keypair.fromSecretKey(secretKey);
};

const createToken = async (supply: number, name: string, symbol: string, imageUri: string) => {
  try {
    const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');
    const keypair = loadKeypair(path.join(__dirname, '../../solana-wallet', 'keypair.json'));

    const mint = await createMint(
      connection,
      keypair,
      keypair.publicKey,
      null,
      9 // Decimals
    );

    const tokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      keypair,
      mint,
      keypair.publicKey
    );

    await mintTo(
      connection,
      keypair,
      mint,
      tokenAccount.address,
      keypair.publicKey,
      supply
    );

    console.log('Token created successfully:');
    console.log('Mint Address:', mint.toBase58());
    console.log('Token Account:', tokenAccount.address.toBase58());
    console.log('Name:', name);
    console.log('Symbol:', symbol);
    console.log('Image URI:', imageUri);
  } catch (error) {
    console.error('Error creating token:', error);
  }
};

// Example usage
const supply = 1000000;
const name = 'Example Token';
const symbol = 'EXT';
const imageUri = 'https://example.com/image.png';

createToken(supply, name, symbol, imageUri);