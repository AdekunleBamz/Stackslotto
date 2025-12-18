'use client';

import { useState, useEffect } from 'react';
import { 
  Ticket, 
  Trophy, 
  Users, 
  Wallet,
  Sparkles,
  ArrowRight,
  ExternalLink,
  RefreshCw,
  Clock,
  Gift,
  Zap,
  Star,
  Crown,
  DollarSign,
  TrendingUp,
  History,
  CircleDot
} from 'lucide-react';
import { AppConfig, UserSession, showConnect } from '@stacks/connect';
import { 
  AnchorMode,
  PostConditionMode,
  uintCV,
  FungibleConditionCode,
  makeStandardSTXPostCondition,
  callReadOnlyFunction,
  cvToJSON,
  principalCV
} from '@stacks/transactions';

const appConfig = new AppConfig(['store_write']);
const userSession = new UserSession({ appConfig });

// Contract configuration - UPDATE AFTER DEPLOYMENT
const LOTTO_CONTRACT = process.env.NEXT_PUBLIC_LOTTO_CONTRACT || 'SP3FKNEZ86RG5RT7SZ5FBRGH85FZNG94ZH1MCGG6N.stacks-lotto';
const [CONTRACT_ADDRESS, CONTRACT_NAME] = LOTTO_CONTRACT.split('.');

const HIRO_API = 'https://api.hiro.so';
const TICKET_PRICE = 100000; // 0.1 STX in microSTX

interface Transaction {
  tx_id: string;
  sender_address: string;
  tx_status: string;
  tx_type: string;
  block_height: number;
  burn_block_time_iso: string;
  fee_rate: string;
  contract_call?: {
    function_name: string;
    function_args: any[];
  };
}

interface LotteryStats {
  currentRound: number;
  prizePool: number;
  totalTickets: number;
  isActive: boolean;
  lastWinner: string | null;
  lastPrize: number;
  totalRounds: number;
  totalDistributed: number;
}

interface PlayerStats {
  totalTickets: number;
  totalWins: number;
  totalWon: number;
  totalSpent: number;
}

interface RecentBuyer {
  address: string;
  tickets: number;
  time: string;
  txId: string;
}

export default function StacksLotto() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [showApp, setShowApp] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [txLoading, setTxLoading] = useState<string | null>(null);
  const [txStatus, setTxStatus] = useState<string | null>(null);
  const [contractDeployed, setContractDeployed] = useState(false);
  
  // Lottery data
  const [lotteryStats, setLotteryStats] = useState<LotteryStats>({
    currentRound: 1,
    prizePool: 0,
    totalTickets: 0,
    isActive: true,
    lastWinner: null,
    lastPrize: 0,
    totalRounds: 0,
    totalDistributed: 0
  });
  const [playerStats, setPlayerStats] = useState<PlayerStats>({
    totalTickets: 0,
    totalWins: 0,
    totalWon: 0,
    totalSpent: 0
  });
  const [recentBuyers, setRecentBuyers] = useState<RecentBuyer[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Check wallet on mount
  useEffect(() => {
    if (userSession.isUserSignedIn()) {
      const userData = userSession.loadUserData();
      setWalletConnected(true);
      setUserAddress(userData.profile.stxAddress.mainnet);
      setShowApp(true);
    }
  }, []);

  // Fetch blockchain data
  const fetchData = async () => {
    try {
      // First check if contract exists
      const contractCheck = await fetch(
        `${HIRO_API}/extended/v1/address/${LOTTO_CONTRACT}/transactions?limit=1`
      );
      
      if (contractCheck.ok) {
        setContractDeployed(true);
        
        // Fetch transactions
        const txResponse = await fetch(
          `${HIRO_API}/extended/v1/address/${LOTTO_CONTRACT}/transactions?limit=50`
        );
        
        if (txResponse.ok) {
          const txData = await txResponse.json();
          const txs: Transaction[] = txData.results || [];
          setTransactions(txs);
          
          // Process recent buyers from transactions
          const buyers: RecentBuyer[] = [];
          const seenTx = new Set();
          
          txs.forEach((tx: Transaction) => {
            if (tx.tx_type === 'contract_call' && tx.tx_status === 'success' && !seenTx.has(tx.tx_id)) {
              seenTx.add(tx.tx_id);
              const fn = tx.contract_call?.function_name || '';
              
              if (fn.includes('ticket') || fn.includes('play')) {
                let tickets = 1;
                if (fn === 'lucky-five') tickets = 5;
                if (fn === 'power-play') tickets = 10;
                if (fn === 'mega-play') tickets = 25;
                if (fn === 'buy-tickets') {
                  const arg = tx.contract_call?.function_args?.[0];
                  if (arg?.repr) {
                    const match = arg.repr.match(/u(\d+)/);
                    if (match) tickets = parseInt(match[1]);
                  }
                }
                
                buyers.push({
                  address: tx.sender_address,
                  tickets,
                  time: tx.burn_block_time_iso,
                  txId: tx.tx_id
                });
              }
            }
          });
          
          setRecentBuyers(buyers.slice(0, 20));
          
          // Calculate stats from transactions
          const uniqueUsers = new Set(txs.map((tx: Transaction) => tx.sender_address)).size;
          const totalTx = txs.filter((tx: Transaction) => 
            tx.tx_type === 'contract_call' && tx.tx_status === 'success'
          ).length;
          
          // Estimate prize pool from ticket purchases
          let estimatedTickets = 0;
          txs.forEach((tx: Transaction) => {
            if (tx.tx_type === 'contract_call' && tx.tx_status === 'success') {
              const fn = tx.contract_call?.function_name || '';
              if (fn === 'buy-ticket' || fn === 'quick-play') estimatedTickets += 1;
              if (fn === 'lucky-five') estimatedTickets += 5;
              if (fn === 'power-play') estimatedTickets += 10;
              if (fn === 'mega-play') estimatedTickets += 25;
            }
          });
          
          setLotteryStats(prev => ({
            ...prev,
            totalTickets: estimatedTickets,
            prizePool: estimatedTickets * TICKET_PRICE,
            totalRounds: totalTx > 0 ? 1 : 0
          }));
        }
        
        // Try to fetch contract read-only data
        try {
          const statsResult = await callReadOnlyFunction({
            contractAddress: CONTRACT_ADDRESS,
            contractName: CONTRACT_NAME,
            functionName: 'get-lottery-stats',
            functionArgs: [],
            network: 'mainnet',
            senderAddress: CONTRACT_ADDRESS,
          });
          
          const statsJson = cvToJSON(statsResult);
          if (statsJson?.value) {
            const v = statsJson.value;
            setLotteryStats({
              currentRound: parseInt(v['current-round']?.value) || 1,
              prizePool: parseInt(v['prize-pool']?.value) || 0,
              totalTickets: parseInt(v['total-tickets']?.value) || 0,
              isActive: v['is-active']?.value === true,
              lastWinner: v['last-winner']?.value?.value || null,
              lastPrize: parseInt(v['last-prize']?.value) || 0,
              totalRounds: parseInt(v['total-rounds']?.value) || 0,
              totalDistributed: parseInt(v['total-distributed']?.value) || 0
            });
          }
        } catch (e) {
          console.log('Could not fetch contract state (may not be deployed yet)');
        }
        
        // Fetch player stats if connected
        if (userAddress) {
          try {
            const playerResult = await callReadOnlyFunction({
              contractAddress: CONTRACT_ADDRESS,
              contractName: CONTRACT_NAME,
              functionName: 'get-player-stats',
              functionArgs: [principalCV(userAddress)],
              network: 'mainnet',
              senderAddress: userAddress,
            });
            
            const playerJson = cvToJSON(playerResult);
            if (playerJson?.value) {
              const v = playerJson.value;
              setPlayerStats({
                totalTickets: parseInt(v['total-tickets']?.value) || 0,
                totalWins: parseInt(v['total-wins']?.value) || 0,
                totalWon: parseInt(v['total-won']?.value) || 0,
                totalSpent: parseInt(v['total-spent']?.value) || 0
              });
            }
          } catch (e) {
            console.log('Could not fetch player stats');
          }
        }
      } else {
        setContractDeployed(false);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [userAddress]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const connectWallet = () => {
    showConnect({
      appDetails: {
        name: 'StacksLotto',
        icon: '/icon.svg',
      },
      redirectTo: '/',
      onFinish: () => {
        const userData = userSession.loadUserData();
        setWalletConnected(true);
        setUserAddress(userData.profile.stxAddress.mainnet);
        setShowApp(true);
      },
      userSession,
    });
  };

  const disconnectWallet = () => {
    userSession.signUserOut();
    setWalletConnected(false);
    setUserAddress(null);
  };

  const buyTickets = async (functionName: string, amount: number, cost: number) => {
    if (!walletConnected || !userAddress) {
      connectWallet();
      return;
    }

    setTxLoading(functionName);
    setTxStatus('Opening wallet...');

    try {
      const postConditions = [
        makeStandardSTXPostCondition(
          userAddress,
          FungibleConditionCode.LessEqual,
          cost + 50000 // Add buffer for fees
        )
      ];

      const txOptions = {
        contractAddress: CONTRACT_ADDRESS,
        contractName: CONTRACT_NAME,
        functionName,
        functionArgs: functionName === 'buy-tickets' ? [uintCV(amount)] : [],
        network: 'mainnet' as const,
        anchorMode: AnchorMode.Any,
        postConditionMode: PostConditionMode.Deny,
        postConditions,
        onFinish: (data: any) => {
          setTxStatus(`🎫 Tickets purchased! TX: ${data.txId.slice(0, 8)}...`);
          setTimeout(() => {
            setTxStatus(null);
            setTxLoading(null);
            setTimeout(fetchData, 5000);
          }, 3000);
        },
        onCancel: () => {
          setTxStatus(null);
          setTxLoading(null);
        },
      };

      const { openContractCall } = await import('@stacks/connect');
      await openContractCall(txOptions);
    } catch (error) {
      console.error('Error:', error);
      setTxStatus('Error: ' + (error as Error).message);
      setTxLoading(null);
      setTimeout(() => setTxStatus(null), 5000);
    }
  };

  const formatSTX = (microSTX: number) => (microSTX / 1000000).toFixed(2);
  const formatAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;
  const formatTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  // Landing Page
  if (!showApp) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 via-purple-950/20 to-gray-950 overflow-hidden relative">
        {/* Animated background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-20 w-96 h-96 bg-yellow-500/10 rounded-full filter blur-3xl animate-pulse" />
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-purple-500/10 rounded-full filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-yellow-500/5 rounded-full filter blur-3xl" />
        </div>

        {/* Floating lottery balls */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full shadow-lg lottery-ball flex items-center justify-center text-gray-900 font-bold"
              style={{
                left: `${15 + i * 15}%`,
                top: `${20 + (i % 3) * 25}%`,
                animationDelay: `${i * 0.3}s`
              }}
            >
              {i + 1}
            </div>
          ))}
        </div>

        {/* Navigation */}
        <nav className="relative z-10 px-6 py-5">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/30">
                <Ticket className="w-6 h-6 text-gray-900" />
              </div>
              <div>
                <span className="text-2xl font-bold text-white">StacksLotto</span>
                <span className="ml-2 px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-xs font-bold">MAINNET</span>
              </div>
            </div>
            <a
              href={`https://explorer.hiro.so/address/${LOTTO_CONTRACT}?chain=mainnet`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-gray-300 hover:bg-white/10 transition-all"
            >
              <span className="text-sm">View Contract</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </nav>

        {/* Hero */}
        <main className="relative z-10 px-6 pt-20 pb-24">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-yellow-500/10 border border-yellow-500/30 rounded-full mb-8">
              <Sparkles className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-yellow-200">On-Chain Lottery powered by Chainhooks</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl md:text-7xl font-extrabold mb-6 leading-tight">
              <span className="text-white">Win Big with</span>
              <br />
              <span className="bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 bg-clip-text text-transparent jackpot-text">
                StacksLotto
              </span>
            </h1>

            {/* Prize Pool Preview */}
            <div className="mb-8 inline-block">
              <div className="px-8 py-4 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-2xl">
                <p className="text-sm text-yellow-300 mb-1">Current Prize Pool</p>
                <p className="text-4xl font-bold text-yellow-400 jackpot-text">
                  {formatSTX(lotteryStats.prizePool)} STX
                </p>
              </div>
            </div>

            {/* Subtitle */}
            <p className="text-lg text-gray-400 mb-10 max-w-2xl mx-auto">
              Buy tickets, join the lottery, win prizes! 100% on-chain, fully transparent, 
              powered by Stacks smart contracts and Hiro Chainhooks.
            </p>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <button
                onClick={connectWallet}
                className="group px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-2xl font-bold text-lg text-gray-900 shadow-2xl shadow-yellow-500/30 hover:shadow-yellow-500/50 hover:scale-105 transition-all flex items-center gap-3"
              >
                <Wallet className="w-5 h-5" />
                Connect & Play
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => setShowApp(true)}
                className="px-8 py-4 bg-white/5 border border-white/20 rounded-2xl font-bold text-lg text-white hover:bg-white/10 transition-all"
              >
                View Lottery
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: Ticket, label: 'Tickets Sold', value: lotteryStats.totalTickets, color: 'from-yellow-500 to-orange-500' },
                { icon: Users, label: 'Players', value: recentBuyers.length || '-', color: 'from-blue-500 to-cyan-500' },
                { icon: DollarSign, label: 'Ticket Price', value: '0.1 STX', color: 'from-green-500 to-emerald-500' },
                { icon: Trophy, label: 'Round', value: `#${lotteryStats.currentRound}`, color: 'from-purple-500 to-pink-500' },
              ].map((s, i) => (
                <div key={i} className="p-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group">
                  <div className={`w-12 h-12 mb-3 bg-gradient-to-br ${s.color} rounded-xl flex items-center justify-center mx-auto group-hover:scale-110 transition-transform`}>
                    <s.icon className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-2xl font-bold text-white">{s.value}</p>
                  <p className="text-sm text-gray-400">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="relative z-10 border-t border-white/10 py-5">
          <p className="text-center text-gray-500 text-sm">
            Stacks Builder Challenge Week 2 • Powered by Hiro Chainhooks
          </p>
        </footer>
      </div>
    );
  }

  // Main App
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 via-purple-950/10 to-gray-950 relative">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-500/5 rounded-full filter blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/5 rounded-full filter blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/10 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-lg flex items-center justify-center">
              <Ticket className="w-5 h-5 text-gray-900" />
            </div>
            <span className="text-xl font-bold text-white">StacksLotto</span>
            <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs font-bold">MAINNET</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-gray-400 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            {walletConnected ? (
              <div className="flex items-center gap-2">
                <span className="px-3 py-1.5 bg-white/10 border border-white/20 rounded-lg text-sm text-white font-mono">
                  {formatAddress(userAddress || '')}
                </span>
                <button
                  onClick={disconnectWallet}
                  className="px-3 py-1.5 bg-red-500/20 border border-red-500/30 text-red-400 rounded-lg text-sm hover:bg-red-500/30 transition-all"
                >
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg text-gray-900 font-semibold hover:scale-105 transition-transform"
              >
                <Wallet className="w-4 h-4" />
                Connect
              </button>
            )}
          </div>
        </div>
      </header>

      {/* TX Status */}
      {txStatus && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50">
          <div className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-gray-900 rounded-xl shadow-2xl font-semibold flex items-center gap-3">
            {txLoading && <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin" />}
            {txStatus}
          </div>
        </div>
      )}

      <main className="relative z-10 max-w-6xl mx-auto px-5 py-6">
        {/* Prize Pool Hero */}
        <div className="mb-8 p-8 bg-gradient-to-r from-yellow-500/10 via-orange-500/10 to-yellow-500/10 border border-yellow-500/30 rounded-3xl text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Crown className="w-6 h-6 text-yellow-400" />
            <span className="text-yellow-300 font-medium">Round #{lotteryStats.currentRound} Prize Pool</span>
          </div>
          <p className="text-5xl md:text-6xl font-extrabold text-yellow-400 jackpot-text mb-4">
            {formatSTX(lotteryStats.prizePool)} STX
          </p>
          <div className="flex items-center justify-center gap-6 text-sm">
            <span className="text-gray-400">
              <Ticket className="w-4 h-4 inline mr-1" />
              {lotteryStats.totalTickets} tickets sold
            </span>
            <span className={`px-3 py-1 rounded-full ${lotteryStats.isActive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
              {lotteryStats.isActive ? '● Active' : '● Drawing...'}
            </span>
          </div>
        </div>

        {/* Buy Tickets Section */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Ticket className="w-5 h-5 text-yellow-400" />
            Buy Tickets
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { name: 'Quick Play', fn: 'quick-play', tickets: 1, cost: TICKET_PRICE, icon: Zap, color: 'from-blue-500 to-cyan-500' },
              { name: 'Lucky 5', fn: 'lucky-five', tickets: 5, cost: TICKET_PRICE * 5, icon: Star, color: 'from-green-500 to-emerald-500' },
              { name: 'Power Play', fn: 'power-play', tickets: 10, cost: TICKET_PRICE * 10, icon: Sparkles, color: 'from-yellow-500 to-orange-500' },
              { name: 'Mega Play', fn: 'mega-play', tickets: 25, cost: TICKET_PRICE * 25, icon: Crown, color: 'from-purple-500 to-pink-500' },
            ].map((option) => (
              <button
                key={option.fn}
                onClick={() => buyTickets(option.fn, option.tickets, option.cost)}
                disabled={txLoading !== null || !lotteryStats.isActive}
                className={`group p-5 bg-gradient-to-br ${option.color} rounded-2xl text-white hover:scale-105 hover:shadow-xl transition-all disabled:opacity-50 disabled:hover:scale-100`}
              >
                {txLoading === option.fn ? (
                  <div className="w-8 h-8 mb-2 mx-auto border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <option.icon className="w-8 h-8 mb-2 mx-auto group-hover:scale-110 transition-transform" />
                )}
                <p className="font-bold text-lg">{option.name}</p>
                <p className="text-sm opacity-90">{option.tickets} ticket{option.tickets > 1 ? 's' : ''}</p>
                <p className="text-xs opacity-75">{formatSTX(option.cost)} STX</p>
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Your Stats */}
          {walletConnected && (
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-white/10 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
                <h2 className="font-bold text-white flex items-center gap-2">
                  <CircleDot className="w-5 h-5 text-purple-400" />
                  Your Stats
                </h2>
              </div>
              <div className="p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Tickets Owned</span>
                  <span className="text-white font-bold text-xl">{playerStats.totalTickets}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Spent</span>
                  <span className="text-yellow-400 font-bold">{formatSTX(playerStats.totalSpent)} STX</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Wins</span>
                  <span className="text-green-400 font-bold">{playerStats.totalWins}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Total Won</span>
                  <span className="text-green-400 font-bold">{formatSTX(playerStats.totalWon)} STX</span>
                </div>
              </div>
            </div>
          )}

          {/* Last Winner */}
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-white/10 bg-gradient-to-r from-yellow-500/10 to-orange-500/10">
              <h2 className="font-bold text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                Last Winner
              </h2>
            </div>
            <div className="p-6 text-center">
              {lotteryStats.lastWinner ? (
                <>
                  <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Crown className="w-8 h-8 text-gray-900" />
                  </div>
                  <p className="text-white font-mono text-sm mb-2">
                    {formatAddress(lotteryStats.lastWinner)}
                  </p>
                  <p className="text-2xl font-bold text-yellow-400">
                    Won {formatSTX(lotteryStats.lastPrize)} STX
                  </p>
                </>
              ) : (
                <>
                  <div className="w-16 h-16 bg-gray-700/50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Gift className="w-8 h-8 text-gray-500" />
                  </div>
                  <p className="text-gray-400">No winners yet</p>
                  <p className="text-sm text-gray-500 mt-2">Be the first!</p>
                </>
              )}
            </div>
          </div>

          {/* Lottery Stats */}
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-white/10 bg-gradient-to-r from-blue-500/10 to-cyan-500/10">
              <h2 className="font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-blue-400" />
                Lottery Stats
              </h2>
            </div>
            <div className="p-4 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Total Rounds</span>
                <span className="text-white font-bold">{lotteryStats.totalRounds}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Total Distributed</span>
                <span className="text-green-400 font-bold">{formatSTX(lotteryStats.totalDistributed)} STX</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Ticket Price</span>
                <span className="text-yellow-400 font-bold">0.1 STX</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Winner Share</span>
                <span className="text-white font-bold">95%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8 bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <h2 className="font-bold text-white flex items-center gap-2">
              <History className="w-5 h-5 text-green-400" />
              Recent Ticket Purchases
            </h2>
            <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-semibold">
              ⚡ Live from Blockchain
            </span>
          </div>
          <div className="divide-y divide-white/5 max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="p-12 text-center text-gray-400">
                <div className="w-10 h-10 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p>Loading from blockchain...</p>
              </div>
            ) : recentBuyers.length === 0 ? (
              <div className="p-12 text-center text-gray-400">
                <Ticket className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg">No tickets purchased yet</p>
                <p className="text-sm mt-2">Be the first to join!</p>
              </div>
            ) : (
              recentBuyers.map((buyer, i) => (
                <a
                  key={`${buyer.txId}-${i}`}
                  href={`https://explorer.hiro.so/txid/${buyer.txId}?chain=mainnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-4 flex items-center gap-4 hover:bg-white/5 transition-all block"
                >
                  <div className="w-11 h-11 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center text-gray-900 font-bold">
                    {buyer.tickets}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-white font-medium">
                        {buyer.tickets} ticket{buyer.tickets > 1 ? 's' : ''} purchased
                      </p>
                      <span className="text-xs text-gray-400">{formatTime(buyer.time)}</span>
                    </div>
                    <p className="text-sm text-gray-400">{formatAddress(buyer.address)}</p>
                    <span className="text-xs text-yellow-400">{formatSTX(buyer.tickets * TICKET_PRICE)} STX</span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-gray-500" />
                </a>
              ))
            )}
          </div>
        </div>

        {/* Chainhook Banner */}
        <div className="mt-8 p-5 bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/30 rounded-xl flex items-center gap-5">
          <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center flex-shrink-0">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white mb-1">Powered by Hiro Chainhooks</h3>
            <p className="text-gray-300 text-sm mb-2">Real-time lottery events streamed from the blockchain.</p>
            <div className="flex flex-wrap gap-2">
              <a
                href={`https://explorer.hiro.so/address/${LOTTO_CONTRACT}?chain=mainnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 bg-white/10 rounded-full text-xs text-white hover:bg-white/20 transition-all flex items-center gap-1"
              >
                stacks-lotto <ExternalLink className="w-3 h-3" />
              </a>
              <span className="px-3 py-1 bg-green-500/20 rounded-full text-xs text-green-400">5 Chainhooks</span>
              <span className="px-3 py-1 bg-yellow-500/20 rounded-full text-xs text-yellow-400">Live Events</span>
            </div>
          </div>
        </div>
      </main>

      <footer className="relative z-10 border-t border-white/10 py-5 mt-8">
        <p className="text-center text-gray-500 text-sm">
          StacksLotto • Stacks Builder Challenge Week 2 • {transactions.length} transactions recorded
        </p>
      </footer>
    </div>
  );
}
