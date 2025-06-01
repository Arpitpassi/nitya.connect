#!/usr/bin/env node
import crypto from 'crypto';
import Arweave from 'arweave';

const arweave = Arweave.init({
  host: 'arweave.net',
  port: 443,
  protocol: 'https'
});

export async function signEventPoolId(wallet, eventPoolId) {
  try {
    if (!wallet || !wallet.n) {
      throw new Error('Wallet is invalid or missing public key');
    }

    const hash = crypto.createHash('sha256').update(eventPoolId).digest();
    const hashHex = hash.toString('hex');
    const signature = await arweave.crypto.sign(wallet, hash);
    const signatureB64 = Buffer.from(signature).toString('base64');
    const walletAddress = await arweave.wallets.ownerToAddress(wallet.n);

    return {
      eventPoolId,
      publicKey: wallet.n,
      signature: signatureB64,
      walletAddress
    };
  } catch (error) {
    console.error(`Failed to sign event pool ID: ${error.message}`);
    throw error;
  }
}