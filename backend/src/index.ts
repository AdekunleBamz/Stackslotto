import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import dotenv from 'dotenv';
import { ChainhooksService } from './services/chainhooks.service';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || '';

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// In-memory storage for events
interface LottoEvent {
  id: string;
  type: string;
  player?: string;
  round?: number;
  tickets?: number;
  amount?: number;
  winner?: string;
  prize?: number;
  timestamp: string;
  txId?: string;
  blockHeight?: number;
}

const events: LottoEvent[] = [];
const MAX_EVENTS = 500;

// WebSocket setup
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

const clients = new Set<WebSocket>();

wss.on('connection', (ws) => {
  console.log('[WebSocket] Client connected');
  clients.add(ws);
  
  // Send recent events on connect
  ws.send(JSON.stringify({ type: 'connected', events: events.slice(0, 50) }));
  
  ws.on('close', () => {
    clients.delete(ws);
    console.log('[WebSocket] Client disconnected');
  });
});

function broadcast(data: any) {
  const message = JSON.stringify(data);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Webhook authentication
function authenticateWebhook(req: Request, res: Response, next: NextFunction): void {
  // Check Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader === `Bearer ${WEBHOOK_SECRET}`) {
    next();
    return;
  }
  
  // Check query param token (used by chainhooks)
  const queryToken = req.query.token as string;
  if (queryToken === WEBHOOK_SECRET) {
    next();
    return;
  }
  
  // Allow if no secret configured (development)
  if (!WEBHOOK_SECRET) {
    next();
    return;
  }
  
  console.warn('[Server] Unauthorized webhook attempt');
  res.status(401).json({ error: 'Unauthorized' });
}

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    eventsCount: events.length 
  });
});

// Get events
app.get('/api/events', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
  res.json({ events: events.slice(0, limit) });
});

// Webhook endpoints for each event type
app.post('/api/chainhook/events/:eventType', authenticateWebhook, (req, res) => {
  const { eventType } = req.params;
  console.log(`[Server] Received ${eventType} webhook event`);
  
  try {
    const payload = req.body;
    
    // Process chainhook payload
    if (payload.apply && Array.isArray(payload.apply)) {
      payload.apply.forEach((block: any) => {
        if (block.transactions) {
          block.transactions.forEach((tx: any) => {
            // Extract event data from transaction
            const event: LottoEvent = {
              id: `${tx.transaction_identifier?.hash || Date.now()}-${events.length}`,
              type: eventType,
              timestamp: new Date().toISOString(),
              txId: tx.transaction_identifier?.hash,
              blockHeight: block.block_identifier?.index
            };
            
            // Parse print events for lottery data
            if (tx.metadata?.receipt?.events) {
              tx.metadata.receipt.events.forEach((e: any) => {
                if (e.type === 'SmartContractEvent' || e.type === 'print_event') {
                  const data = e.data?.value || e.contract_event?.value;
                  if (data) {
                    // Try to extract relevant fields
                    if (data.player) event.player = data.player;
                    if (data.round) event.round = data.round;
                    if (data.amount) event.tickets = data.amount;
                    if (data.winner) event.winner = data.winner;
                    if (data.prize || data['winner-prize']) event.prize = data.prize || data['winner-prize'];
                  }
                }
              });
            }
            
            events.unshift(event);
            broadcast({ type: 'new-event', event });
          });
        }
      });
    }
    
    // Keep events list bounded
    while (events.length > MAX_EVENTS) {
      events.pop();
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('[Server] Error processing webhook:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

// Generic webhook endpoint (consolidated - handles all StacksLotto events)
app.post('/api/chainhook/events', authenticateWebhook, (req, res) => {
  console.log('[Server] Received consolidated StacksLotto webhook event');
  
  try {
    const payload = req.body;
    const hookId = payload.chainhook?.uuid || 'unknown';
    
    console.log(`[Server] Hook UUID: ${hookId}`);
    
    // Process chainhook payload
    if (payload.apply && Array.isArray(payload.apply)) {
      payload.apply.forEach((block: any) => {
        if (block.transactions) {
          block.transactions.forEach((tx: any) => {
            // Get function name from contract call
            const functionName = tx.metadata?.kind?.data?.function_name || 
                                tx.contract_call?.function_name;
            
            // Map function names to event types
            let eventType = 'unknown';
            if (['buy-ticket', 'quick-play'].includes(functionName)) {
              eventType = 'ticket-purchase';
            } else if (['buy-tickets', 'lucky-five', 'power-play', 'mega-play'].includes(functionName)) {
              eventType = 'bulk-tickets';
            } else if (functionName === 'draw-winner') {
              eventType = 'winner-drawn';
            } else if (functionName === 'pause-lottery') {
              eventType = 'lottery-paused';
            } else if (functionName === 'resume-lottery') {
              eventType = 'lottery-resumed';
            }
            
            if (eventType !== 'unknown') {
              // Extract event data from transaction
              const event: LottoEvent = {
                id: `${tx.transaction_identifier?.hash || Date.now()}-${events.length}`,
                type: eventType,
                timestamp: new Date().toISOString(),
                txId: tx.transaction_identifier?.hash,
                blockHeight: block.block_identifier?.index
              };
              
              // Parse print events for lottery data
              if (tx.metadata?.receipt?.events) {
                tx.metadata.receipt.events.forEach((e: any) => {
                  if (e.type === 'SmartContractEvent' || e.type === 'print_event') {
                    const data = e.data?.value || e.contract_event?.value;
                    if (data) {
                      if (data.player) event.player = data.player;
                      if (data.round) event.round = data.round;
                      if (data.amount) event.tickets = data.amount;
                      if (data.winner) event.winner = data.winner;
                      if (data.prize || data['winner-prize']) event.prize = data.prize || data['winner-prize'];
                    }
                  }
                });
              }
              
              events.unshift(event);
              broadcast({ type: 'new-event', event });
              console.log(`[Server] Processed ${eventType} event from ${functionName}`);
            }
          });
        }
      });
    }
    
    // Keep events list bounded
    while (events.length > MAX_EVENTS) {
      events.pop();
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('[Server] Error:', error);
    res.status(500).json({ error: 'Failed to process' });
  }
});

// Initialize chainhooks service
let chainhooksService: ChainhooksService | null = null;

async function initializeChainhooks() {
  if (process.env.HIRO_API_KEY) {
    try {
      chainhooksService = new ChainhooksService();
      await chainhooksService.initialize();
      console.log('[Server] Chainhooks service initialized');
    } catch (error) {
      console.error('[Server] Failed to initialize chainhooks:', error);
    }
  } else {
    console.log('[Server] No HIRO_API_KEY, skipping chainhooks initialization');
  }
}

// Start server
server.listen(PORT, async () => {
  console.log(`[Server] StacksLotto backend running on port ${PORT}`);
  console.log(`[Server] WebSocket server running on ws://localhost:${PORT}/ws`);
  console.log(`[Server] Health check: http://localhost:${PORT}/health`);
  
  await initializeChainhooks();
});

export { app, server };
