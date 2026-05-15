import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { getToken } from './api';

export interface WsMessage<T = any> {
  type: 'CHAT' | 'ORDER_STATUS' | 'ORDER_PAY_SUCCESS' | 'NOTIFICATION_COUNT' | 'SYSTEM';
  payload: T;
  timestamp: number;
}

class WebSocketManager {
  private client: Client | null = null;
  private listeners: Set<(msg: WsMessage) => void> = new Set();

  connect() {
    if (this.client?.active) return;

    const token = getToken();
    if (!token) return;

    this.client = new Client({
      webSocketFactory: () => new SockJS('/ws'),
      connectHeaders: {
        Authorization: `Bearer ${token}`,
      },
      onConnect: () => {
        console.log('✅ WebSocket Connected');
        this.client?.subscribe('/user/queue/messages', (message) => {
          const wsMsg: WsMessage = JSON.parse(message.body);
          this.listeners.forEach(fn => fn(wsMsg));
        });
      },
      onDisconnect: () => {
        console.log('❌ WebSocket Disconnected');
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.client.activate();
  }

  disconnect() {
    this.client?.deactivate();
    this.client = null;
  }

  subscribe(callback: (msg: WsMessage) => void) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  sendMessage(destination: string, payload: any) {
    if (this.client?.active) {
      this.client.publish({
        destination: `/app${destination}`,
        body: JSON.stringify(payload),
      });
    } else {
      console.error('WS not connected');
    }
  }
}

export const wsManager = new WebSocketManager();
