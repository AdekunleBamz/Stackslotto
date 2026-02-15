/**
 * Transaction-related types
 */
export interface Transaction {
  tx_id: string;
  sender_address: string;
  tx_status: 'pending' | 'success' | 'failed';
  tx_type: string;
  block_height: number;
  burn_block_time_iso: string;
  fee_rate: string;
  contract_call?: {
    function_name: string;
    function_args: any[];
  };
}

/**
 * Lottery statistics and game state
 */
export interface LotteryStats {
  currentRound: number;
  prizePool: number;
  totalTickets: number;
  isActive: boolean;
  lastWinner: string | null;
  lastPrize: number;
  totalRounds: number;
  totalDistributed: number;
}

/**
 * Individual player statistics
 */
export interface PlayerStats {
  totalTickets: number;
  totalWins: number;
  totalWon: number;
  totalSpent: number;
}

/**
 * Recent buyer on blockchain
 */
export interface RecentBuyer {
  address: string;
  tickets: number;
  time: string;
  txId: string;
}

/**
 * Ticket options with different price points
 */
export interface TicketOption {
  id: string;
  name: string;
  tickets: number;
  price: number; // in microSTX
  description: string;
  discount: number; // percentage discount if any
}

/**
 * User wallet session
 */
export interface WalletSession {
  isConnected: boolean;
  address: string | null;
  publicKey: string | null;
  network: 'mainnet' | 'testnet';
}

/**
 * Transaction request payload
 */
export interface TransactionRequest {
  contractAddress: string;
  contractName: string;
  functionName: string;
  functionArgs: any[];
  postConditions?: any[];
  anchorMode?: number;
  fee?: number;
}

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Notification/Toast configuration
 */
export interface Toast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

/**
 * Loading and error states
 */
export interface AsyncState<T> {
  loading: boolean;
  error: string | null;
  data: T | null;
}

/**
 * Ticket purchase options
 */
export enum TicketType {
  QUICK_PLAY = 'quick',
  LUCKY_5 = 'lucky5',
  POWER_PLAY = 'power',
  MEGA_PLAY = 'mega'
}

/**
 * Transaction status enum
 */
export enum TransactionStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

/**
 * Network type
 */
export enum NetworkType {
  MAINNET = 'mainnet',
  TESTNET = 'testnet',
  DEVNET = 'devnet'
}
