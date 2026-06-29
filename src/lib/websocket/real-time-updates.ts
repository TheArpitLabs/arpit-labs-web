/**
 * WebSocket Real-time Updates
 * Manages WebSocket connections for real-time data updates
 */

export interface WebSocketMessage {
  type: string;
  data?: any;
  error?: string;
  id?: string;
}

export interface WebSocketClient {
  id: string;
  socket: WebSocket;
  userId?: string;
  channels: Set<string>;
  lastPing: number;
}

export interface ChannelSubscription {
  channel: string;
  clients: Set<string>;
}

class WebSocketManager {
  private clients = new Map<string, WebSocketClient>();
  private channels = new Map<string, ChannelSubscription>();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private messageHandlers = new Map<string, (data: any) => void>();

  constructor() {
    this.startHeartbeat();
  }

  /**
   * Handles a new WebSocket connection
   */
  handleConnection(socket: WebSocket, userId?: string): string {
    const clientId = `client-${Date.now()}-${Math.random()}`;

    const client: WebSocketClient = {
      id: clientId,
      socket,
      userId,
      channels: new Set(),
      lastPing: Date.now(),
    };

    this.clients.set(clientId, client);

    socket.onmessage = (event) => this.handleMessage(clientId, event);
    socket.onerror = (error) => this.handleError(clientId, error);
    socket.onclose = () => this.handleDisconnect(clientId);

    // Send welcome message
    this.sendToClient(clientId, {
      type: 'connected',
      data: { clientId },
    });

    return clientId;
  }

  /**
   * Handles incoming messages from a client
   */
  private handleMessage(clientId: string, event: MessageEvent): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      client.lastPing = Date.now();

      switch (message.type) {
        case 'ping':
          this.sendToClient(clientId, { type: 'pong' });
          break;
        case 'subscribe':
          if (message.data?.channel) {
            this.subscribeToChannel(clientId, message.data.channel);
          }
          break;
        case 'unsubscribe':
          if (message.data?.channel) {
            this.unsubscribeFromChannel(clientId, message.data.channel);
          }
          break;
        default:
          // Handle custom message types
          const handler = this.messageHandlers.get(message.type);
          if (handler) {
            handler(message.data);
          }
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  }

  /**
   * Handles WebSocket errors
   */
  private handleError(clientId: string, error: Event): void {
    console.error(`WebSocket error for client ${clientId}:`, error);
    this.handleDisconnect(clientId);
  }

  /**
   * Handles client disconnection
   */
  private handleDisconnect(clientId: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Unsubscribe from all channels
    for (const channel of client.channels) {
      this.unsubscribeFromChannel(clientId, channel);
    }

    this.clients.delete(clientId);
  }

  /**
   * Subscribes a client to a channel
   */
  subscribeToChannel(clientId: string, channel: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.channels.add(channel);

    if (!this.channels.has(channel)) {
      this.channels.set(channel, {
        channel,
        clients: new Set(),
      });
    }

    this.channels.get(channel)!.clients.add(clientId);

    this.sendToClient(clientId, {
      type: 'subscribed',
      data: { channel },
    });
  }

  /**
   * Unsubscribes a client from a channel
   */
  unsubscribeFromChannel(clientId: string, channel: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    client.channels.delete(channel);

    const channelSub = this.channels.get(channel);
    if (channelSub) {
      channelSub.clients.delete(clientId);

      // Clean up empty channels
      if (channelSub.clients.size === 0) {
        this.channels.delete(channel);
      }
    }

    this.sendToClient(clientId, {
      type: 'unsubscribed',
      data: { channel },
    });
  }

  /**
   * Broadcasts a message to all clients in a channel
   */
  broadcastToChannel(channel: string, message: WebSocketMessage): void {
    const channelSub = this.channels.get(channel);
    if (!channelSub) return;

    for (const clientId of channelSub.clients) {
      this.sendToClient(clientId, message);
    }
  }

  /**
   * Sends a message to a specific client
   */
  sendToClient(clientId: string, message: WebSocketMessage): void {
    const client = this.clients.get(clientId);
    if (!client || client.socket.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      client.socket.send(JSON.stringify(message));
    } catch (error) {
      console.error(`Error sending to client ${clientId}:`, error);
      this.handleDisconnect(clientId);
    }
  }

  /**
   * Broadcasts a message to all connected clients
   */
  broadcast(message: WebSocketMessage): void {
    for (const clientId of this.clients.keys()) {
      this.sendToClient(clientId, message);
    }
  }

  /**
   * Registers a message handler
   */
  onMessage(type: string, handler: (data: any) => void): void {
    this.messageHandlers.set(type, handler);
  }

  /**
   * Starts heartbeat to detect dead connections
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      const timeout = 30000; // 30 seconds

      for (const [clientId, client] of this.clients.entries()) {
        if (now - client.lastPing > timeout) {
          console.log(`Client ${clientId} timed out`);
          this.handleDisconnect(clientId);
        } else {
          // Send ping
          this.sendToClient(clientId, { type: 'ping' });
        }
      }
    }, 15000); // Check every 15 seconds
  }

  /**
   * Stops heartbeat
   */
  stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  /**
   * Gets connection statistics
   */
  getStatistics(): {
    totalClients: number;
    totalChannels: number;
    clientsByChannel: Record<string, number>;
  } {
    const clientsByChannel: Record<string, number> = {};

    for (const [channel, sub] of this.channels.entries()) {
      clientsByChannel[channel] = sub.clients.size;
    }

    return {
      totalClients: this.clients.size,
      totalChannels: this.channels.size,
      clientsByChannel,
    };
  }

  /**
   * Disconnects all clients
   */
  disconnectAll(): void {
    for (const [clientId, client] of this.clients.entries()) {
      client.socket.close();
    }
    this.clients.clear();
    this.channels.clear();
  }
}

// Create singleton instance
const wsManager = new WebSocketManager();

/**
 * Handles a new WebSocket connection
 */
export function handleWebSocketConnection(socket: WebSocket, userId?: string): string {
  return wsManager.handleConnection(socket, userId);
}

/**
 * Subscribes a client to a channel
 */
export function subscribeToChannel(clientId: string, channel: string): void {
  wsManager.subscribeToChannel(clientId, channel);
}

/**
 * Unsubscribes a client from a channel
 */
export function unsubscribeFromChannel(clientId: string, channel: string): void {
  wsManager.unsubscribeFromChannel(clientId, channel);
}

/**
 * Broadcasts to a channel
 */
export function broadcastToChannel(channel: string, message: WebSocketMessage): void {
  wsManager.broadcastToChannel(channel, message);
}

/**
 * Broadcasts to all clients
 */
export function broadcastToAll(message: WebSocketMessage): void {
  wsManager.broadcast(message);
}

/**
 * Registers a message handler
 */
export function onWebSocketMessage(type: string, handler: (data: any) => void): void {
  wsManager.onMessage(type, handler);
}

/**
 * Gets WebSocket statistics
 */
export function getWebSocketStatistics() {
  return wsManager.getStatistics();
}

/**
 * Disconnects all WebSocket clients
 */
export function disconnectAllWebSockets(): void {
  wsManager.disconnectAll();
}

export default wsManager;
