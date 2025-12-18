// Deploy script for stacks-lotto contract
// Run with: npx tsx deploy.mjs

import { makeContractDeploy, broadcastTransaction, AnchorMode } from '@stacks/transactions';
import { StacksMainnet } from '@stacks/network';
import { readFileSync } from 'fs';

// IMPORTANT: Set your private key as environment variable
const PRIVATE_KEY = process.env.STACKS_PRIVATE_KEY;

if (!PRIVATE_KEY) {
  console.error('Please set STACKS_PRIVATE_KEY environment variable');
  process.exit(1);
}

async function deploy() {
  const network = new StacksMainnet();
  
  const contractCode = readFileSync('./contracts/stacks-lotto.clar', 'utf8');
  
  console.log('Deploying stacks-lotto contract...');
  
  const txOptions = {
    contractName: 'stacks-lotto',
    codeBody: contractCode,
    senderKey: PRIVATE_KEY,
    network,
    anchorMode: AnchorMode.Any,
    fee: 100000n, // 0.1 STX fee
  };
  
  try {
    const transaction = await makeContractDeploy(txOptions);
    const result = await broadcastTransaction(transaction, network);
    
    console.log('Transaction broadcast!');
    console.log('TX ID:', result.txid);
    console.log('View on explorer: https://explorer.hiro.so/txid/' + result.txid + '?chain=mainnet');
  } catch (error) {
    console.error('Deployment failed:', error);
  }
}

deploy();
