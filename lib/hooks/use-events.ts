"use client";

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.NEXT_PUBLIC_NEURAL_API_URL || 'http://localhost:3007';

export function useNeuralEvents() {
  const [events, setEvents] = useState<any[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    const s = io(`${SOCKET_URL}/events`, {
      withCredentials: true,
      transports: ['websocket'],
    });

    s.on('connect', () => {
      console.log('[NeuralEvents] Connected to WebSocket');
    });

    s.on('neural-request', (event) => {
      setEvents((prev) => [event, ...prev].slice(0, 50)); // Keep last 50 events
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, []);

  return { events, connected: socket?.connected ?? false };
}
