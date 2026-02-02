import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const WEBSOCKET_URL = 'https://snuxi.com/ws-stomp';

export const createStompClient = () => {
  const client = new Client({
    webSocketFactory: () => new SockJS(WEBSOCKET_URL),
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,
  });

  return client;
};
