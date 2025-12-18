// Deploy script for stacks-lotto contract
// Run with: npx tsx deploy.mjs

import { makeContractDeploy, broadcastTransaction, AnchorMode } from '@stacks/transactions';
import * as network from '@stacks/network';
import { generateWallet } from '@stacks/wallet-sdk';
import { readFileSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: './backend/.env' });

// Support both mnemonic and private key
const MNEMONIC = process.env.STACKS_MNEMONIC;
const PRIVATE_KEY = process.env.STACKS_PRIVATE_KEY;

let senderKey;

if (MNEMONIC) {
  console.log('Using mnemonic to derive private key...');
  try {
    const wallet = await generateWallet({ secretKey: MNEMONIC });
    // Get the first account's private key
    if (wallet.accounts && wallet.accounts.length > 0) {
      senderKey = wallet.accounts[0].stxPrivateKey;
    } else {
      // Fallback: try to get from wallet directly
      senderKey = wallet.stxPrivateKey || wallet.privateKey;
    }
    if (!senderKey) {
      throw new Error('Could not extract private key from wallet');
    }
    console.log('Private key derived from mnemonic');
  } catch (error) {
    console.error('Failed to derive private key from mnemonic:', error);
    console.error('Please convert your mnemonic to a private key using Hiro Wallet and set STACKS_PRIVATE_KEY instead');
    process.exit(1);
  }
} else if (PRIVATE_KEY) {
  senderKey = PRIVATE_KEY;
} else {
  console.error('Please set either STACKS_MNEMONIC or STACKS_PRIVATE_KEY in backend/.env');
  process.exit(1);
}

async function deploy() {
  // Use the network's client for broadcasting
  const stacksNetwork = network.STACKS_MAINNET;
  
  const contractCode = readFileSync('./contracts/stacks-lotto.clar', 'utf8');
  
  console.log('Deploying stacks-lotto contract...');
  console.log('Contract code length:', contractCode.length, 'characters');
  
  // Check if contract already exists
  try {
    const checkUrl = `https://api.hiro.so/v2/contracts/SP3FKNEZ86RG5RT7SZ5FBRGH85FZNG94ZH1MCGG6N/stacks-lotto`;
    const checkResponse = await fetch(checkUrl);
    if (checkResponse.ok) {
      console.log('⚠️  Contract already exists at this address!');
      console.log('If you want to redeploy, you need to use a different contract name or address.');
      return;
    }
  } catch (e) {
    // Contract doesn't exist, proceed with deployment
  }

  const txOptions = {
    contractName: 'stacks-lotto',
    codeBody: contractCode,
    senderKey: senderKey,
    network: stacksNetwork,
    anchorMode: AnchorMode.Any,
    fee: 500000n, // 0.5 STX fee (increased for reliability)
  };
  
  try {
    console.log('Creating contract deployment transaction...');
    const transaction = await makeContractDeploy(txOptions);
    console.log('Transaction created successfully');
    console.log('Broadcasting to network...');
    // Serialize and broadcast
    const serializedTx = transaction.serialize();
    const txId = transaction.txid();
    
    // Broadcast using Hiro API directly
    const broadcastUrl = 'https://api.hiro.so/v2/transactions';
    const response = await fetch(broadcastUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tx: serializedTx }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      let errorMsg = `Broadcast failed: ${response.status}`;
      try {
        const errorJson = JSON.parse(errorText);
        errorMsg += ` - ${errorJson.error || errorJson.message || errorText}`;
      } catch {
        errorMsg += ` - ${errorText}`;
      }
      throw new Error(errorMsg);
    }
    
    const result = await response.json();
    
    console.log('✅ Transaction broadcast!');
    console.log('TX ID:', txId);
    console.log('View on explorer: https://explorer.hiro.so/txid/' + txId + '?chain=mainnet');
    console.log('\n⏳ Waiting for confirmation (takes ~10 minutes)...');
    console.log('📝 Contract will be available at:');
    console.log(`   SP3FKNEZ86RG5RT7SZ5FBRGH85FZNG94ZH1MCGG6N.stacks-lotto`);
    console.log('\n💡 Check status: https://explorer.hiro.so/txid/' + txId + '?chain=mainnet');
  } catch (error) {
    console.error('❌ Deployment failed:', error.message || error);
    if (error.message?.includes('insufficient')) {
      console.error('💡 Make sure you have enough STX for deployment fees');
    }
  }
}

deploy();
