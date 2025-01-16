export interface ReactotronWebSocket {
  // Connection state
  readonly readyState: number
  readonly CONNECTING: number // 0
  readonly OPEN: number // 1
  readonly CLOSING: number // 2
  readonly CLOSED: number // 3

  // Methods
  close(): void
  send(data: string): void

  // Events
  onopen: ((event: any) => void) | null
  onclose: ((event: any) => void) | null
  onmessage: ((event: { data: any }) => void) | null
  onerror: ((event: any) => void) | null
}

export interface ReactotronWebSocketServer {
  // Methods
  close(): void

  // Events
  on(event: "connection", cb: (socket: ReactotronWebSocket, request: any) => void): void
  on(event: "error", cb: (error: Error) => void): void

  // Broadcast to all clients
  clients: Set<ReactotronWebSocket>
}

// Factory types
export type CreateWebSocket = (url: string) => ReactotronWebSocket
export type CreateWebSocketServer = (options: { port: number }) => ReactotronWebSocketServer
