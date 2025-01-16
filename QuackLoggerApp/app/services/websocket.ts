import { RootStore } from "app/models/RootStore"

interface Command {
  type: string
  payload: any
}

export class WebSocketServer {
  private server: WebSocket | null = null
  private store: RootStore | null = null

  constructor(private port: number = 9090) {}

  setStore(store: RootStore) {
    this.store = store
  }

  start() {
    if (this.server) return
    if (!this.store) {
      throw new Error("Store must be set before starting the server")
    }

    // In React Native, we'll act as a WebSocket client connecting to a proxy server
    // that will forward connections from debug clients
    this.server = new WebSocket(`ws://localhost:${this.port}`)

    this.server.onopen = () => {
      console.log("WebSocket server started")
    }

    this.server.onmessage = (event) => {
      try {
        const command = JSON.parse(event.data) as Command
        this.handleCommand(command)
      } catch (error) {
        console.error("Error handling message:", error)
      }
    }

    this.server.onerror = (error) => {
      console.error("WebSocket error:", error)
    }

    this.server.onclose = () => {
      console.log("WebSocket server closed")
      // Attempt to reconnect after a delay
      setTimeout(() => this.start(), 5000)
    }
  }

  private handleCommand(command: Command) {
    if (!this.store) return

    switch (command.type) {
      case "request":
        this.store.addNetworkRequest(command.payload)
        break
      case "log":
        this.store.addConsoleLog(command.payload)
        break
      default:
        console.log("Unknown command type:", command.type)
    }
  }

  stop() {
    if (this.server) {
      this.server.close()
      this.server = null
    }
  }
}

// Create a singleton instance
export const webSocketServer = new WebSocketServer()
