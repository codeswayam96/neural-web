# NeuralWeb Standards & Instructions

## 🎯 Purpose
NeuralWeb is the central dashboard for AI orchestration and agent management. It allows users to create, deploy, and monitor AI agents, manage knowledge bases, and build AI-driven workflows.

## 🛠 Tech Stack
- **Framework**: Next.js 15 (App Router), React 19
- **Real-time**: Socket.io-client
- **Markdown**: React Markdown, Remark GFM
- **Charts**: Recharts
- **Data Fetching**: Axios, SWR (via auth-client)
- **Styling**: Tailwind CSS v4, @tailwindcss/typography

## 📂 Key Directories & Files
- `app/agents/`: Agent configuration and chat interface.
- `app/workflows/`: AI-specific workflow management.
- `app/knowledge-base/`: Document ingestion and indexing controls.
- `lib/socket.ts`: Centralized socket.io connection management for real-time agent updates.

## 📐 Local Conventions
- **Real-time Updates**: Prefer Socket.io for agent status and chat responses to provide a "live" feel.
- **Markdown Styling**: Use the `prose` class from `@tailwindcss/typography` for all agent-generated content.
- **Port**: This application runs on port **3008**.

## 🔄 Specific Workflows
- **Development**: `npm run dev` (starts on port 3008).
- **Agent Testing**: Connects to `neural-api` in `core-api` for LLM orchestration.

## 🔐 Environment Variables
- `NEXT_PUBLIC_NEURAL_API_URL`: URL for the Neural API service (default: http://localhost:3000/neural).
- `NEXT_PUBLIC_SOCKET_URL`: URL for the WebSocket server (usually same as API).
