import { ChainhooksClient, CHAINHOOKS_BASE_URL, type ChainhookDefinition } from '@hirosystems/chainhooks-client';
import dotenv from 'dotenv';

dotenv.config();

const HIRO_API_KEY = process.env.HIRO_API_KEY || '';
const WEBHOOK_URL = process.env.WEBHOOK_URL || 'http://localhost:3001/api/chainhook/events';
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || '';
const STACKS_NETWORK = (process.env.STACKS_NETWORK || 'mainnet') as 'mainnet' | 'testnet';
const LOTTO_CONTRACT = process.env.LOTTO_CONTRACT || '';

function webhookUrl(path: string): string {
  const base = WEBHOOK_URL.replace(/\/+$/, '');
  const p = path.startsWith('/') ? path : '/' + path;
  return base + p;
}

export class ChainhooksService {
  private client: ChainhooksClient;
  private registeredHooks: string[] = [];

  constructor() {
    this.client = new ChainhooksClient({
      baseUrl: CHAINHOOKS_BASE_URL[STACKS_NETWORK],
      apiKey: HIRO_API_KEY,
    });
  }

  async initialize(): Promise<void> {
    try {
      // Get API status
      try {
        const status = await this.client.getStatus();
        console.log(`[ChainhooksService] API Status: ${status.status}`);
        console.log(`[ChainhooksService] Server Version: ${status.server_version}`);
      } catch (e) {
        console.log('[ChainhooksService] Could not get API status');
      }
      
      // List existing hooks
      const response = await this.client.getChainhooks();
      console.log(`[ChainhooksService] Found ${response.total} chainhooks`);
      
      response.results.forEach((hook) => {
        this.registeredHooks.push(hook.uuid);
      });
      
    } catch (error) {
      console.error('[ChainhooksService] Initialization error:', error);
      throw error;
    }
  }

  async deleteOldChainhooks(): Promise<number> {
    const response = await this.client.getChainhooks();
    const allHooks = response.results;
    let deletedCount = 0;
    
    // Delete hooks that are NOT for StacksLotto
    for (const hook of allHooks) {
      const hookName = hook.definition?.name || '';
      // Keep only StacksLotto hooks, delete everything else
      if (!hookName.startsWith('StacksLotto-')) {
        try {
          await this.client.deleteChainhook(hook.uuid);
          console.log(`[ChainhooksService] Deleted old hook: ${hookName} (${hook.uuid})`);
          deletedCount++;
        } catch (error) {
          console.error(`[ChainhooksService] Failed to delete ${hook.uuid}:`, error);
        }
      }
    }
    
    return deletedCount;
  }

  async registerAllHooks(): Promise<void> {
    if (!LOTTO_CONTRACT) {
      console.error('[ChainhooksService] LOTTO_CONTRACT not set');
      return;
    }

    // Original design: 5 chainhooks as per README
    const hooks: Array<{ name: string; functionName?: string; endpoint: string }> = [
      {
        name: 'StacksLotto-TicketPurchase',
        functionName: 'buy-ticket',
        endpoint: '/ticket-purchase'
      },
      {
        name: 'StacksLotto-QuickPlay',
        functionName: 'quick-play',
        endpoint: '/ticket-purchase'
      },
      {
        name: 'StacksLotto-BulkTickets',
        functionName: 'buy-tickets',
        endpoint: '/bulk-tickets'
      },
      {
        name: 'StacksLotto-LuckyFive',
        functionName: 'lucky-five',
        endpoint: '/bulk-tickets'
      },
      {
        name: 'StacksLotto-PowerPlay',
        functionName: 'power-play',
        endpoint: '/bulk-tickets'
      },
      {
        name: 'StacksLotto-MegaPlay',
        functionName: 'mega-play',
        endpoint: '/bulk-tickets'
      },
      {
        name: 'StacksLotto-WinnerDrawn',
        functionName: 'draw-winner',
        endpoint: '/winner-drawn'
      },
      {
        name: 'StacksLotto-LotteryPaused',
        functionName: 'pause-lottery',
        endpoint: '/lottery-paused'
      },
      {
        name: 'StacksLotto-LotteryResumed',
        functionName: 'resume-lottery',
        endpoint: '/lottery-resumed'
      }
    ];

    // First, delete old non-StacksLotto chainhooks to make room
    console.log('[ChainhooksService] Cleaning up old chainhooks...');
    const deletedCount = await this.deleteOldChainhooks();
    if (deletedCount > 0) {
      console.log(`[ChainhooksService] Deleted ${deletedCount} old chainhook(s)`);
    }

    // Check existing StacksLotto hooks
    const existingHooks = await this.client.getChainhooks();
    const existingStacksLottoHooks = existingHooks.results.filter(
      (h: any) => h.definition?.name?.startsWith('StacksLotto-')
    );

    // Register missing hooks
    for (const hook of hooks) {
      try {
        // Check if this specific hook already exists
        const existing = existingStacksLottoHooks.find(
          (h: any) => h.definition?.name === hook.name
        );
        
        if (existing) {
          const currentWebhookUrl = existing.definition?.action?.url;
          const expectedWebhookUrl = webhookUrl(hook.endpoint);
          
          // Update hook if webhook URL has changed
          if (currentWebhookUrl !== expectedWebhookUrl) {
            console.log(`[ChainhooksService] Updating ${hook.name} webhook URL...`);
            try {
              await this.client.updateChainhook(existing.uuid, {
                action: {
                  type: 'http_post',
                  url: expectedWebhookUrl,
                }
              });
              console.log(`[ChainhooksService] Updated ${hook.name} webhook URL to ${expectedWebhookUrl}`);
            } catch (error: any) {
              console.error(`[ChainhooksService] Failed to update ${hook.name}:`, error.message || error);
            }
          } else {
            console.log(`[ChainhooksService] Hook ${hook.name} already exists with correct URL: ${existing.uuid}`);
          }
          this.registeredHooks.push(existing.uuid);
          continue;
        }

        // Check if we have room (limit is 10)
        const currentCount = (await this.client.getChainhooks()).total;
        if (currentCount >= 10) {
          console.warn(`[ChainhooksService] Chainhook limit reached (10/10). Cannot register ${hook.name}`);
          console.warn(`[ChainhooksService] Please delete more old chainhooks manually`);
          continue;
        }

        const definition: ChainhookDefinition = {
          name: hook.name,
          version: '1',
          chain: 'stacks',
          network: STACKS_NETWORK,
          filters: {
            events: [
              {
                type: 'contract_call',
                contract_identifier: LOTTO_CONTRACT,
                function_name: hook.functionName,
              }
            ]
          },
          action: {
            type: 'http_post',
            url: webhookUrl(hook.endpoint),
          },
          options: {
            decode_clarity_values: true,
            enable_on_registration: true,
          }
        };

        const result = await this.client.registerChainhook(definition);
        
        console.log(`[ChainhooksService] Registered ${hook.name}: ${result.uuid}`);
        this.registeredHooks.push(result.uuid);
        
      } catch (error: any) {
        if (error.body?.message?.includes('limit reached')) {
          console.warn(`[ChainhooksService] Chainhook limit reached. Deleted ${deletedCount} old hooks, but still need more room.`);
          console.warn(`[ChainhooksService] You may need to manually delete more chainhooks.`);
        }
        console.error(`[ChainhooksService] Failed to register ${hook.name}:`, error.message || error);
      }
    }
  }

  async listHooks(): Promise<any[]> {
    const response = await this.client.getChainhooks();
    return response.results;
  }

  async deleteAllHooks(): Promise<void> {
    const response = await this.client.getChainhooks();
    for (const hook of response.results) {
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
