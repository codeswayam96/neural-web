import { io, Socket } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3006";

/**
 * Lazy singleton — only connects when first accessed.
 * Prevents socket connections on unauthenticated/public pages.
 */
let _socket: Socket | null = null;

export function getSocket(): Socket {
  if (!_socket) {
    _socket = io(SOCKET_URL, {
      autoConnect: false,
      withCredentials: true,
      transports: ["polling", "websocket"],
    });
  }
  return _socket;
}

/** Connect the socket (call from authenticated pages only). */
export function connectSocket() {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
}

/** Disconnect and destroy the singleton (call on logout). */
export function disconnectSocket() {
  if (_socket) {
    _socket.disconnect();
    _socket = null;
  }
}

// Legacy export for backward compatibility with existing imports
export const socket = new Proxy({} as Socket, {
  get(_target, prop) {
    return (getSocket() as any)[prop];
  },
});
