import type { ReactotronWebSocket, CreateWebSocket } from "reactotron-core-contract/src/types"

class BrowserWebSocketWrapper implements ReactotronWebSocket {
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

export const createBrowserWebSocket: CreateWebSocket = (url: string) => {
  return new BrowserWebSocketWrapper(new WebSocket(url))
}
