import { Connection, Keypair, clusterApiUrl, Transaction } from '@solana/web3.js';
import { createMint, getOrCreateAssociatedTokenAccount, mintTo, Token, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { TokenInstructions } from '@project-serum/serum'; // Note: This might not be used for Raydium

import { RaydiumMarket, RaydiumToken, RaydiumUser } from '@raydium/serum'; // Example import, replace with actual Raydium SDK imports

import fs from 'fs';
import path from 'path';

// Load the wallet keypair
const loadKeypair = (filePath: string): Keypair => {
  const secretKeyString = fs.readFileSync(filePath, 'utf8');
  const secretKey = Uint8Array.from(JSON.parse(secretKeyString));
  return Keypair.fromSecretKey(secretKey);
};

const createToken = async (supply: number, name: string, symbol: string, imageUri: string) => {
  try {
    // Connect to the Solana cluster (devnet for example)
    const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

    // Load the wallet keypair
    const keypair = loadKeypair(path.join(__dirname, '../../solana-wallet', 'keypair.json'));

    // Create SPL token mint
    const mint = await createMint(
      connection,
      keypair,
      keypair.publicKey,
      null,
      9 // Decimals
    );

    // Get or create associated token account
    const tokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      keypair,
      mint,
      keypair.publicKey
    );

    // Mint initial tokens to the associated token account
    await mintTo(
      connection,
      keypair,
      mint,
      tokenAccount.address,
      keypair.publicKey,
      supply
    );

    // Log token creation details
    console.log('Token created successfully:');
    console.log('Mint Address:', mint.toBase58());
    console.log('Token Account:', tokenAccount.address.toBase58());
    console.log('Name:', name);
    console.log('Symbol:', symbol);
    console.log('Image URI:', imageUri);

    // Create Raydium AMM pool and add liquidity
    await createRaydiumPool(connection, keypair, mint, symbol);
  } catch (error) {
    console.error('Error creating token:', error);
  }
};

const createRaydiumPool = async (connection: Connection, walletKeyPair: Keypair, mint: Token, symbol: string) => {
  try {
    // Example: Initialize the Raydium market and user
    const raydiumMarket = new RaydiumMarket(connection, 'RAYDIUM_MARKET_ADDRESS', TOKEN_PROGRAM_ID);
    const raydiumToken = new RaydiumToken(connection, 'RAYDIUM_TOKEN_ADDRESS');
    const raydiumUser = new RaydiumUser(connection, walletKeyPair, TOKEN_PROGRAM_ID);

    // Example: Provide liquidity to the Raydium AMM market
    const txId = await raydiumUser.addLiquidity({
      amount: 1000, // Amount of tokens to add
      tokenMint: mint.publicKey,
      poolMint: raydiumMarket.poolToken,
      slippage: 5, // Slippage tolerance
    });

    console.log(`Liquidity provided for ${symbol} in the AMM pool on Raydium with transaction ID: ${txId}`);
  } catch (error) {
    console.error('Error creating Raydium pool:', error);
  }
};

// Example usage
const supply = 1000000;
const name = 'Example Token';
const symbol = 'EXT';
const imageUri = 'https://example.com/image.png';

createToken(supply, name, symbol, imageUri);
