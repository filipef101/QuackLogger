import TcpSocket from "react-native-tcp-socket"
import { RootStore } from "app/models/RootStore"
import type { Command, CommandTypeKey } from "reactotron-core-contract"

export class TcpServer {
  private server: ReturnType<typeof TcpSocket.createServer> | null = null
  private store: RootStore | null = null
  private clients: Set<ReturnType<typeof TcpSocket.createConnection>> = new Set()
  private subscriptions: string[] = []

  constructor(private port: number = 9090) {}

  setStore(store: RootStore) {
    this.store = store
  }

  start() {
    if (this.server) return
    if (!this.store) throw new Error("Store must be set before starting the server")

    this.server = TcpSocket.createServer((socket) => {
      console.log("Client connected:", socket.address())
      this.clients.add(socket)

      socket.on("data", (data) => {
        try {
          const command = JSON.parse(data.toString()) as Command
          this.handleCommand(command)
        } catch (error) {
          console.error("Error handling message:", error)
        }
      })

      socket.on("error", (error) => {
        console.error("Socket error:", error)
      })

      socket.on("close", () => {
        console.log("Client disconnected:", socket.address())
        this.clients.delete(socket)
      })
    })

    this.server.listen({ port: this.port, host: "0.0.0.0" }, () => {
      console.log(`TCP server listening on port ${this.port}`)
    })
  }

  private handleCommand(command: Command) {
    if (!this.store) return

    switch (command.type as string) {
      case "client.intro":
        this.store.addClient(command.payload)
        break

      case "api.response":
        this.store.addNetworkRequest(command)
        break

      case "log":
        this.store.addConsoleLog(command)
        break

      case "state.values.change":
        this.subscriptions = command.payload.changes.map((c: { path: string }) => c.path)
        break

      case "state.backup.response":
        this.store.setState(command.payload)
        break

      case "state.keys.request":
        this.sendStateKeys(command.payload.path)
        break

      case "custom":
        this.store.handleCustomCommand(command.payload)
        break

      default:
        console.log("Unknown command type:", command.type)
    }
  }

  private sendStateKeys(path: string) {
    // Implementation for state keys response
    this.broadcast("state.keys.response", {
      path,
      keys: [],
      // TODO: Implement actual state key extraction
    })
  }

  stop() {
    if (this.server) {
      this.clients.forEach((client) => client.destroy())
      this.clients.clear()
      this.server.close()
      this.server = null
    }
  }

  broadcast(type: CommandTypeKey, payload: any) {
    const message = JSON.stringify({
      type,
      payload,
      date: new Date().toISOString(),
    })

    this.clients.forEach((client) => client.write(message))
  }
}

// Create a singleton instance
export const tcpServer = new TcpServer()
