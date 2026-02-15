/**
 * Application-wide constants
 * These values should not change at runtime
 */

/**
 * Blockchain and Contract Configuration
 */
export const BLOCKCHAIN_CONFIG = {
  // Default contract address - should be changed after deployment
  DEFAULT_LOTTO_CONTRACT: 'SP3FKNEZ86RG5RT7SZ5FBRGH85FZNG94ZH1MCGG6N.stacks-lotto',
  
  // API endpoints
  HIRO_API_MAINNET: 'https://api.hiro.so',
  HIRO_API_TESTNET: 'https://api.testnet.hiro.so',
  
  // Transaction confirmations required
  REQUIRED_CONFIRMATIONS: 6,
  
  // Microblocks STX conversion
  MICROBTC_TO_STX: 1000000,
};

/**
 * Ticket Pricing and Configuration
 */
export const TICKET_CONFIG = {
  // Base ticket price in microSTX (0.1 STX)
  BASE_PRICE_MICROBTX: 100000,
  
  // Price in STX for display
  BASE_PRICE_STX: 0.1,
  
  // Available ticket options
  TICKET_OPTIONS: {
    QUICK_PLAY: {
      tickets: 1,
      multiplier: 1,
      displayName: 'Quick Play',
    },
    LUCKY_5: {
      tickets: 5,
      multiplier: 4.5, // 10% discount
      displayName: 'Lucky 5',
    },
    POWER_PLAY: {
      tickets: 10,
      multiplier: 9, // 10% discount
      displayName: 'Power Play',
    },
    MEGA_PLAY: {
      tickets: 25,
      multiplier: 22.5, // 10% discount
      displayName: 'Mega Play',
    },
  },
};

/**
 * Lottery Rules and Configuration
 */
export const LOTTERY_CONFIG = {
  // Prize distribution percentages
  PRIZE_TO_WINNER_PERCENTAGE: 95,
  PRIZE_TO_OWNER_PERCENTAGE: 5,
  
  // Minimum players to trigger draw
  MIN_PLAYERS_FOR_DRAW: 1,
  
  // Draw frequency in milliseconds (if applicable)
  DRAW_FREQUENCY_MS: 24 * 60 * 60 * 1000, // 24 hours
};

/**
 * UI/UX Constants
 */
export const UI_CONFIG = {
  // Animation durations in milliseconds
  ANIMATION_DURATION: {
    FAST: 150,
    NORMAL: 300,
    SLOW: 500,
  },
  
  // Toast notification durations
  TOAST_DURATION: {
    SHORT: 2000,
    NORMAL: 3000,
    LONG: 5000,
  },
  
  // Polling intervals
  POLLING_INTERVAL: {
    FAST: 3000,      // 3 seconds
    NORMAL: 5000,    // 5 seconds
    SLOW: 10000,     // 10 seconds
  },
  
  // Debounce delays
  DEBOUNCE_DELAY: {
    FAST: 300,
    NORMAL: 500,
    SLOW: 1000,
  },
};

/**
 * Error Messages
 */
export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: 'Please connect your wallet first',
  INSUFFICIENT_BALANCE: 'Insufficient STX balance for this transaction',
  CONTRACT_ERROR: 'An error occurred while processing your transaction',
  NETWORK_ERROR: 'Network error. Please check your connection',
  INVALID_ADDRESS: 'Invalid wallet address',
  TRANSACTION_FAILED: 'Transaction failed. Please try again',
  USER_CANCELLED: 'Transaction was cancelled by user',
  GENERIC_ERROR: 'An unexpected error occurred',
};

/**
 * Success Messages
 */
export const SUCCESS_MESSAGES = {
  WALLET_CONNECTED: 'Wallet connected successfully',
  TICKETS_PURCHASED: 'Tickets purchased successfully',
  TRANSACTION_SUBMITTED: 'Transaction submitted',
  TRANSACTION_CONFIRMED: 'Transaction confirmed',
  WALLET_DISCONNECTED: 'Wallet disconnected',
};

/**
 * API Response Status Codes
 */
export const API_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  SERVER_ERROR: 500,
};

/**
 * Local Storage Keys
 */
export const STORAGE_KEYS = {
  USER_ADDRESS: 'stackslotto_user_address',
  LAST_LOTTERY_ROUND: 'stackslotto_last_round',
  USER_PREFERENCES: 'stackslotto_preferences',
  TRANSACTION_HISTORY: 'stackslotto_tx_history',
  CACHE_VERSION: 'stackslotto_cache_v1',
};

/**
 * Network Configuration
 */
export const NETWORK_CONFIG = {
  MAINNET: {
    name: 'mainnet',
    displayName: 'Stacks Mainnet',
    chainId: 'mainnet',
  },
  TESTNET: {
    name: 'testnet',
    displayName: 'Stacks Testnet',
    chainId: 'testnet',
  },
};

/**
 * Limit Configuration
 */
export const LIMITS = {
  MAX_TICKETS_PER_TRANSACTION: 1000,
  MIN_TICKETS_PER_TRANSACTION: 1,
  MAX_WALLET_DISPLAY_LENGTH: 8, // Show first and last characters
  MAX_TX_HISTORY_ITEMS: 50,
};
