"use client";

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

// WebSocket must connect directly to the neural-api URL (not the proxy)
// because Next.js rewrites don't support WebSocket upgrades.
// In production: NEXT_PUBLIC_NEURAL_WS_URL = https://neural-api-xyz.onrender.com
// In dev: falls back to NEXT_PUBLIC_NEURAL_API_URL or localhost
const SOCKET_URL = process.env.NEXT_PUBLIC_NEURAL_WS_URL 
  || process.env.NEXT_PUBLIC_NEURAL_API_URL 
  || 'http://localhost:3006';

function getAuthToken(): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const match = document.cookie.match(/Authentication=([^;]+)/);
  return match?.[1];
}

export function useNeuralEvents() {
  const [events, setEvents] = useState<any[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const token = getAuthToken();

    const s: Socket = io(`${SOCKET_URL}/events`, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      // Pass JWT as auth payload — works cross-domain without cookie sharing
      auth: token ? { token } : undefined,
    });

    s.on('connect', () => {
      console.log('[NeuralEvents] Connected to WebSocket');
      setConnected(true);
    });

    s.on('disconnect', () => {
      setConnected(false);
    });

    s.on('neural-request', (event) => {
      setEvents((prev) => [event, ...prev].slice(0, 50));
    });

    return () => {
      s.disconnect();
    };
  }, []);

  return { events, connected };
}
