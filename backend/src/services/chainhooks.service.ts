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

  async registerAllHooks(): Promise<void> {
    if (!LOTTO_CONTRACT) {
      console.error('[ChainhooksService] LOTTO_CONTRACT not set');
      return;
    }

    // Consolidated approach: Use ONE chainhook to catch ALL contract calls
    // The backend will filter by function name
    const hooks: Array<{ name: string; endpoint: string }> = [
      {
        name: 'StacksLotto-AllEvents',
        endpoint: '/events'
      }
    ];

    for (const hook of hooks) {
      try {
        // Check if hook already exists
        const existingHooks = await this.client.getChainhooks();
        const existing = existingHooks.results.find((h: any) => h.definition?.name === hook.name);
        
        if (existing) {
          console.log(`[ChainhooksService] Hook ${hook.name} already exists: ${existing.uuid}`);
          this.registeredHooks.push(existing.uuid);
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
                // No function_name filter - catches ALL function calls to the contract
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
          console.warn(`[ChainhooksService] Chainhook limit reached. You may need to delete old chainhooks first.`);
          console.warn(`[ChainhooksService] Run: npm run chainhook:status to see existing hooks`);
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
