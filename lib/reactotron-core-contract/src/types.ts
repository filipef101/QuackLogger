import { WssServerOptions } from "./server-events"
import { CreateWebSocketServer } from "./websocket"
export * from "./websocket" // Export all WebSocket types

export interface ServerOptions {
  port?: number
  wss?: WssServerOptions
  createServer?: CreateWebSocketServer
}
