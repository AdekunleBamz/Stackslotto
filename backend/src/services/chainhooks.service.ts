import { ChainhooksClient, EventObserverOptions } from '@hirosystems/chainhooks-client';
import dotenv from 'dotenv';

dotenv.config();

const HIRO_API_KEY = process.env.HIRO_API_KEY || '';
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:3001/api/chainhook/events';
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || '';
const STACKS_NETWORK = process.env.STACKS_NETWORK || 'mainnet';
const LOTTO_CONTRACT = process.env.LOTTO_CONTRACT || '';

function webhookUrl(path: string): string {
  const base = WEBHOOK_URL.replace(/\/+$/, '');
  const p = path.startsWith('/') ? path : '/' + path;
  const url = base + p;
  return WEBHOOK_SECRET ? `${url}?token=${encodeURIComponent(WEBHOOK_SECRET)}` : url;
}

export class ChainhooksService {
  private client: ChainhooksClient;
  private registeredHooks: string[] = [];

  constructor() {
    this.client = new ChainhooksClient({
      apiKey: HIRO_API_KEY,
    });
  }

  async initialize(): Promise<void> {
    try {
      const status = await this.client.getApiStatus();
      console.log(`[ChainhooksService] API Status: ${status.status}`);
      console.log(`[ChainhooksService] Server Version: ${status.server_version}`);
      
      // List existing hooks
      const hooks = await this.client.listChainhooks();
      console.log(`[ChainhooksService] Found ${hooks.length} chainhooks`);
      
      hooks.forEach((hook: any) => {
        this.registeredHooks.push(hook.uuid);
      });
      
    } catch (error) {
      console.error('[ChainhooksService] Initialization error:', error);
      throw error;
    }
  }

  async registerAllHooks(): Promise<void> {
    if (!LOTTO_CONTRACT) {
      console.error('[ChainhooksService] LOTTO_CONTRACT not set');
      return;
    }

    const [contractAddress, contractName] = LOTTO_CONTRACT.split('.');
    
    const hooks = [
      {
        name: 'StacksLotto-TicketPurchase',
        filter: 'ticket-purchased',
        endpoint: '/ticket-purchase'
      },
      {
        name: 'StacksLotto-BulkTickets',
        filter: 'tickets-purchased',
        endpoint: '/bulk-tickets'
      },
      {
        name: 'StacksLotto-WinnerDrawn',
        filter: 'winner-drawn',
        endpoint: '/winner-drawn'
      },
      {
        name: 'StacksLotto-LotteryPaused',
        filter: 'lottery-paused',
        endpoint: '/lottery-paused'
      },
      {
        name: 'StacksLotto-LotteryResumed',
        filter: 'lottery-resumed',
        endpoint: '/lottery-resumed'
      }
    ];

    for (const hook of hooks) {
      try {
        const result = await this.client.createChainhook({
          name: hook.name,
          version: '1.0.0',
          chain: 'stacks',
          networks: {
            [STACKS_NETWORK]: {
              if_this: {
                scope: 'contract_call',
                contract_identifier: LOTTO_CONTRACT,
                method: '*'
              },
              then_that: {
                http_post: {
                  url: webhookUrl(hook.endpoint),
                  authorization_header: WEBHOOK_SECRET ? `Bearer ${WEBHOOK_SECRET}` : undefined
                }
              },
              start_block: STACKS_NETWORK === 'mainnet' ? 170000 : 1,
              expire_after_occurrence: null,
              decode_clarity_values: true
            }
          }
        });
        
        console.log(`[ChainhooksService] Registered ${hook.name}: ${result.uuid}`);
        this.registeredHooks.push(result.uuid);
        
        // Enable the hook
        await this.client.toggleChainhook(result.uuid, true);
        console.log(`[ChainhooksService] Enabled ${hook.name}`);
        
      } catch (error) {
        console.error(`[ChainhooksService] Failed to register ${hook.name}:`, error);
      }
    }
  }

  async listHooks(): Promise<any[]> {
    return await this.client.listChainhooks();
  }

  async deleteAllHooks(): Promise<void> {
    const hooks = await this.client.listChainhooks();
    for (const hook of hooks) {
      try {
        await this.client.deleteChainhook(hook.uuid);
        console.log(`[ChainhooksService] Deleted hook: ${hook.uuid}`);
      } catch (error) {
        console.error(`[ChainhooksService] Failed to delete ${hook.uuid}:`, error);
      }
    }
    this.registeredHooks = [];
  }

  getRegisteredHooks(): string[] {
    return this.registeredHooks;
  }
}
