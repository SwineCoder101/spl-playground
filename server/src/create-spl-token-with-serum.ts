import { Connection, Keypair, clusterApiUrl, Transaction, SystemProgram, PublicKey } from '@solana/web3.js';
import { createMint, getOrCreateAssociatedTokenAccount, Mint, mintTo, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { Market, OpenOrders, Orderbook } from '@project-serum/serum';
import fs from 'fs';
import path from 'path';

// Load the Serum API key
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

    // Create Serum DEX market and add liquidity (SSLP)
    await createSerumPool(connection, keypair, mint, symbol);
  } catch (error) {
    console.error('Error creating token:', error);
  }
};

const createSerumPool = async (connection: Connection, walletKeyPair: Keypair, mint: PublicKey, symbol: string) => {
  try {
    // Load the Serum market address (replace with actual market address)
    const marketAddress = new PublicKey('SERUM_MARKET_ADDRESS');

    // Load the Serum market
    const market = await Market.load(connection, marketAddress, {}, TOKEN_2022_PROGRAM_ID);

    // Example: Provide liquidity to the market (SSLP)
    const openOrdersAccounts = await OpenOrders.findForMarketAndOwner(connection, marketAddress, walletKeyPair.publicKey, TOKEN_2022_PROGRAM_ID);
    const [bids, asks] = await Promise.all([
      market.loadBids(connection),
      market.loadAsks(connection),
    ]);

    // Construct your liquidity provision transaction here
    const tx = new Transaction();
    // Add transaction instructions for providing liquidity

    // Sign and send the transaction
    tx.feePayer = walletKeyPair.publicKey;
    tx.recentBlockhash = (await connection.getRecentBlockhash()).blockhash;
    tx.partialSign(walletKeyPair);

    const signature = await connection.sendTransaction(tx, [walletKeyPair]);
    console.log(`Liquidity provided for ${symbol} in the SSLP on Serum with signature: ${signature}`);
  } catch (error) {
    console.error('Error creating Serum pool:', error);
  }
};

// Example usage
const supply = 1000000;
const name = 'Example Token';
const symbol = 'EXT';
const imageUri = 'https://example.com/image.png';

createToken(supply, name, symbol, imageUri);
