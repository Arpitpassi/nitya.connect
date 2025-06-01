#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import os from 'os';
import fetch from 'node-fetch';
import { signEventPoolId } from './creditSigner.js';

async function main() {
  // Parse command-line arguments
  const args = process.argv.slice(2);
  let projectName = '';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--projectname' && i + 1 < args.length) {
      projectName = args[i + 1];
      i++;
    }
  }

  if (!projectName) {
    console.error('ERROR: --projectname option is required (e.g., --projectname myproject)');
    process.exit(8);
  }

  // Define paths
  const walletDir = path.join(os.homedir(), '.permaweb', projectName);
  const walletPath = path.join(walletDir, 'wallet.json');
  const configPath = path.join(process.cwd(), 'perma-config.json');

  // Load config
  if (!fs.existsSync(configPath)) {
    console.error(`ERROR: Config file not found at ${configPath}`);
    process.exit(2);
  }
  let config;
  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  } catch (error) {
    console.error(`ERROR: Failed to parse config file: ${error.message}`);
    process.exit(3);
  }
  const { walletAddress, eventPoolId } = config;

  // Validate config
  if (!walletAddress || !eventPoolId) {
    console.error('ERROR: Invalid config file - missing walletAddress or eventPoolId');
    process.exit(3);
  }

  // Load wallet
  if (!fs.existsSync(walletPath)) {
    console.error(`ERROR: Wallet file not found at ${walletPath}`);
    process.exit(4);
  }
  let wallet;
  try {
    wallet = JSON.parse(fs.readFileSync(walletPath, 'utf-8'));
  } catch (error) {
    console.error(`ERROR: Failed to parse wallet file: ${error.message}`);
    process.exit(4);
  }

  // Sign event pool ID
  let signedData;
  try {
    signedData = await signEventPoolId(wallet, eventPoolId);
  } catch (error) {
    console.error(`ERROR: Failed to sign event pool ID: ${error.message}`);
    process.exit(5);
  }

  // Send request to server
  try {
    const response = await fetch('http://localhost:3000/share-credits', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'deploy-api-key-123' // Replace with actual API key in production
      },
      body: JSON.stringify({
        eventPoolId: signedData.eventPoolId,
        publicKey: signedData.publicKey,
        signature: signedData.signature
      })
    });

    const result = await response.json();
    if (!response.ok) {
      console.error(`ERROR: Failed to share credits: ${result.error || 'Unknown error'}`);
      process.exit(6);
    }

    if (result.message === 'Credits shared successfully') {
      console.log(`Credits shared successfully\nYou have been sponsored by '${result.poolName}'\nSponsor Info: ${result.sponsorInfo}`);
    } else {
      console.error(`ERROR: ${result.message}${result.error ? `: ${result.error}` : ''}`);
      process.exit(7);
    }
  } catch (error) {
    console.error(`ERROR: Failed to communicate with server: ${error.message}`);
    process.exit(6);
  }
}

main().catch(error => {
  console.error(`ERROR: ${error.message}`);
  process.exit(1);
});