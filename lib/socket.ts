import { io } from "socket.io-client";

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3006";

console.log("🔌 Attempting socket connection to:", SOCKET_URL);

/**
 * Standard Socket.io configuration.
 * Now that versions are aligned and IoAdapter is active, 
 * this should connect seamlessly.
 */
export const socket = io(SOCKET_URL, {
  autoConnect: true,
  withCredentials: true,
  transports: ["polling", "websocket"],
});

socket.on("connect", () => {
  console.log("✅ Connected to NeuralHub Events Gateway! ID:", socket.id);
});

socket.on("connect_error", (err) => {
  console.error("❌ Socket Connection Error:", err.message);
});

socket.on("disconnect", (reason) => {
  console.warn("⚠️ Disconnected from Events Gateway:", reason);
});
