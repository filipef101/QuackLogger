import WebSocket, { Server as WSServer } from "ws"
import type {
  ReactotronWebSocket,
  ReactotronWebSocketServer,
  CreateWebSocketServer,
} from "reactotron-core-contract/src/types"

class NodeWebSocketWrapper implements ReactotronWebSocket {
  private ws: WebSocket

  constructor(ws: WebSocket) {
    this.ws = ws
  }

  get readyState() {
    return this.ws.readyState
  }
  get CONNECTING() {
    return WebSocket.CONNECTING
  }
  get OPEN() {
    return WebSocket.OPEN
  }
  get CLOSING() {
    return WebSocket.CLOSING
  }
  get CLOSED() {
    return WebSocket.CLOSED
  }

  close() {
    this.ws.close()
  }
  send(data: string) {
    this.ws.send(data)
  }

  set onopen(handler: ((event: any) => void) | null) {
    this.ws.onopen = handler
  }
  set onclose(handler: ((event: any) => void) | null) {
    this.ws.onclose = handler
  }
  set onmessage(handler: ((event: { data: any }) => void) | null) {
    this.ws.onmessage = handler
  }
  set onerror(handler: ((event: any) => void) | null) {
    this.ws.onerror = handler
  }
}

class NodeWebSocketServer implements ReactotronWebSocketServer {
  private wss: WSServer
  clients: Set<ReactotronWebSocket>

  constructor(wss: WSServer) {
    this.wss = wss
    this.clients = new Set()

    // Wrap existing clients
    this.wss.clients.forEach((ws) => {
      this.clients.add(new NodeWebSocketWrapper(ws))
    })
  }

  close() {
    this.wss.close()
  }

  on(event: "connection" | "error", cb: any) {
    if (event === "connection") {
      this.wss.on("connection", (ws, req) => {
        const wrapped = new NodeWebSocketWrapper(ws)
        this.clients.add(wrapped)
        ws.on("close", () => this.clients.delete(wrapped))
        cb(wrapped, req)
      })
    } else {
      this.wss.on(event, cb)
    }
  }
}

export const createNodeWebSocketServer: CreateWebSocketServer = ({ port }) => {
  return new NodeWebSocketServer(new WSServer({ port }))
}
