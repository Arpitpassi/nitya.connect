#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import os from 'os';
import Arweave from 'arweave';

const arweave = Arweave.init({
  host: 'arweave.net',
  port: 443,
  protocol: 'https'
});

function getMostRecentWallet() {
  const baseDir = path.join(os.homedir(), '.permaweb');
  if (!fs.existsSync(baseDir)) {
    return null;
  }
  const projects = fs.readdirSync(baseDir).filter(f => fs.statSync(path.join(baseDir, f)).isDirectory());
  let latestWallet = null;
  let latestMtime = 0;

  for (const project of projects) {
    const walletPath = path.join(baseDir, project, 'wallet.json');
    if (fs.existsSync(walletPath)) {
      const mtime = fs.statSync(walletPath).mtimeMs;
      if (mtime > latestMtime) {
        latestMtime = mtime;
        latestWallet = walletPath;
      }
    }
  }
  return latestWallet;
}

async function main() {
  // Parse command-line arguments
  const args = process.argv.slice(2);
  let projectName = '';
  let showWallet = false;
  let eventId = '';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--projectname' && i + 1 < args.length) {
      projectName = args[i + 1];
      i++;
    } else if (args[i] === '--wallet-address') {
      showWallet = true;
    } else if (args[i] === '--event' && i + 1 < args.length) {
      eventId = args[i + 1];
      i++;
    }
  }

  if (!projectName && !showWallet && !eventId) {
    console.error('ERROR: One of --projectname, --wallet, or --event is required');
    process.exit(8);
  }

  // Define paths
  const configPath = path.join(process.cwd(), 'perma-config.json');
  let walletPath = projectName ? path.join(os.homedir(), '.permaweb', projectName, 'wallet.json') : null;
  

  if (showWallet || eventId) {
    walletPath = getMostRecentWallet();
    if (!walletPath) {
      console.error('ERROR: No wallet found in ~/.permaweb/');
      process.exit(2);
    }
  }

  if (showWallet) {
    // Display wallet address
    try {
      const wallet = JSON.parse(fs.readFileSync(walletPath, 'utf-8'));
      const walletAddress = await arweave.wallets.jwkToAddress(wallet);
      console.log(`Wallet Address: ${walletAddress}`);
      
    } catch (error) {
      console.error(`ERROR: Failed to read wallet: ${error.message}`);
      process.exit(3);
    }
    return;
  }

  if (eventId) {
    // Update config with event ID and wallet path
    try {
      const wallet = JSON.parse(fs.readFileSync(walletPath, 'utf-8'));
      const walletAddress = await arweave.wallets.jwkToAddress(wallet);
      const config = {
        walletAddress,
        eventPoolId: eventId,
        walletPath
      };
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
      console.log(`Config saved to ${configPath}`);
      
    } catch (error) {
      console.error(`ERROR: Failed to save config: ${error.message}`);
      process.exit(5);
    }
    return;
  }

  // Generate wallet
  if (!projectName) {
    console.error('ERROR: --projectname is required for wallet generation');
    process.exit(9);
  }

  const walletDir = path.dirname(walletPath);
  fs.mkdirSync(walletDir, { recursive: true });

  if (fs.existsSync(walletPath)) {
    console.error(`ERROR: Wallet already exists at ${walletPath}. Use --wallet to view address or --event to add event ID.`);
    process.exit(6);
  }

  try {
    // Generate wallet
    const wallet = await arweave.wallets.generate();
    const walletAddress = await arweave.wallets.jwkToAddress(wallet);

    // Save wallet
    fs.writeFileSync(walletPath, JSON.stringify(wallet, null, 2));
    console.log(`Wallet saved to ${walletPath}`);
    console.log(`Wallet Address: ${walletAddress}`);
  } catch (error) {
    console.error(`ERROR: Failed to generate wallet: ${error.message}`);
    process.exit(7);
  }
}

main();