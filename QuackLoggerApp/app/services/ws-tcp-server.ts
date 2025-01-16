import TcpSocket from "react-native-tcp-socket"
import { RootStore } from "app/models/RootStore"
import type { Command, CommandTypeKey } from "reactotron-core-contract"
import QuickCrypto from "react-native-quick-crypto"
var Buffer: Buffer = require("buffer/").Buffer
interface WebSocketFrame {
  fin: boolean
  opcode: number
  payload: Buffer
  payloadString: string
}

const enum WebSocketOpCode {
  Continuation = 0x0,
  Text = 0x1,
  Binary = 0x2,
  Close = 0x8,
  Ping = 0x9,
  Pong = 0xa,
}

export class WebSocketServer {
  private server: ReturnType<typeof TcpSocket.createServer> | null = null
  private store: RootStore | null = null
  private clients: Set<ReturnType<typeof TcpSocket.createConnection>> = new Set()
  private subscriptions: string[] = []
  private fragmentedMessages: Map<
    ReturnType<typeof TcpSocket.createConnection>,
    {
      opcode: number
      data: Buffer[]
    }
  > = new Map()

  // Add these constants to match the client's serialization exactly
  private static readonly UNDEFINED = "~~~ undefined ~~~"
  private static readonly NULL = "~~~ null ~~~"
  private static readonly FALSE = "~~~ false ~~~"
  private static readonly ZERO = "~~~ zero ~~~"
  private static readonly EMPTY_STRING = "~~~ empty string ~~~"
  private static readonly CIRCULAR = "~~~ Circular Reference ~~~"
  private static readonly ANONYMOUS = "~~~ anonymous function ~~~"
  private static readonly INFINITY = "~~~ Infinity ~~~"
  private static readonly NEGATIVE_INFINITY = "~~~ -Infinity ~~~"

  private static readonly SPECIAL_VALUES = {
    [WebSocketServer.UNDEFINED]: undefined,
    [WebSocketServer.NULL]: null,
    [WebSocketServer.FALSE]: false,
    [WebSocketServer.ZERO]: 0,
    [WebSocketServer.EMPTY_STRING]: "",
    [WebSocketServer.CIRCULAR]: "[Circular]",
    [WebSocketServer.ANONYMOUS]: "[Function]",
    [WebSocketServer.INFINITY]: Infinity,
    [WebSocketServer.NEGATIVE_INFINITY]: -Infinity,
  }

  constructor(private port: number = 9091) {}

  setStore(store: RootStore) {
    this.store = store
  }

  private generateAcceptValue(key: string): string {
    const GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11"
    const combined = key + GUID
    const sha1 = QuickCrypto.createHash("sha1").update(combined).digest("base64")
    return sha1
  }

  private handleWebSocketHandshake(
    socket: ReturnType<typeof TcpSocket.createConnection>,
    data: Buffer,
  ) {
    const request = data.toString()
    console.log("Received potential WebSocket handshake request")

    // Check if this is a WebSocket upgrade request
    if (request.includes("Upgrade: websocket")) {
      console.log("Confirmed WebSocket upgrade request")
      // Extract the WebSocket key
      const keyMatch = request.match(/Sec-WebSocket-Key: (.+)\r\n/)
      if (!keyMatch) {
        console.log("Missing Sec-WebSocket-Key, closing connection")
        socket.end()
        return false
      }

      const clientKey = keyMatch[1]
      const acceptValue = this.generateAcceptValue(clientKey)
      console.log("Generated accept value for client key")

      // Send WebSocket handshake response
      const headers = [
        "HTTP/1.1 101 Switching Protocols",
        "Upgrade: websocket",
        "Connection: Upgrade",
        `Sec-WebSocket-Accept: ${acceptValue}`,
        "",
        "", // Extra newline required
      ].join("\r\n")

      socket.write(headers)
      console.log("WebSocket handshake complete")
      return true
    }
    console.log("Not a WebSocket upgrade request")
    return false
  }

  private decodeWebSocketFrame(data: Buffer): WebSocketFrame | null {
    try {
      if (!data || data.length < 2) {
        console.error("Invalid WebSocket frame: too short")
        return null
      }

      const fin = (data[0] & 0x80) === 0x80
      const rsv1 = (data[0] & 0x40) === 0x40
      const rsv2 = (data[0] & 0x20) === 0x20
      const rsv3 = (data[0] & 0x10) === 0x10
      const opcode = data[0] & 0x0f
      const masked = (data[1] & 0x80) === 0x80
      let payloadLength = data[1] & 0x7f
      let maskStart = 2

      // Enhanced debug logging
      const frameDetails = {
        firstByte: data[0].toString(2).padStart(8, "0"),
        secondByte: data[1].toString(2).padStart(8, "0"),
        fin,
        rsv1,
        rsv2,
        rsv3,
        opcode,
        masked,
        payloadLength,
        dataLength: data.length,
        opcodeName: WebSocketOpCode[opcode] || `Reserved(${opcode})`,
        isControlFrame: opcode >= 0x8,
        isReservedOpcode: (opcode >= 0x3 && opcode <= 0x7) || (opcode >= 0xb && opcode <= 0xf),
        isCompressed: rsv1,
      }
      console.log("Frame binary details:", frameDetails)

      // Only warn about RSV2 and RSV3, RSV1 might be compression
      if (rsv2 || rsv3) {
        console.warn("Warning: Received frame with unexpected RSV bits:", { rsv2, rsv3 })
      }

      // Be more lenient with reserved opcodes in non-control range
      if (frameDetails.isReservedOpcode && frameDetails.isControlFrame) {
        console.warn("Warning: Received reserved control opcode:", opcode)
      }

      // Masking is required for client-to-server messages per RFC 6455
      if (!masked) {
        console.error("Invalid WebSocket frame: client frames must be masked", frameDetails)
        return null
      }

      if (payloadLength === 126) {
        if (data.length < 4) {
          console.error("Invalid WebSocket frame: not enough data for 16-bit length")
          return null
        }
        payloadLength = data.readUInt16BE(2)
        maskStart = 4
      } else if (payloadLength === 127) {
        if (data.length < 10) {
          console.error("Invalid WebSocket frame: not enough data for 64-bit length")
          return null
        }
        const highBits = data.readUInt32BE(2)
        const lowBits = data.readUInt32BE(6)
        payloadLength = highBits * Math.pow(2, 32) + lowBits
        maskStart = 10
      }

      // Control frames must have payload <= 125 bytes
      if (frameDetails.isControlFrame && payloadLength > 125) {
        console.error("Invalid WebSocket frame: control frame payload too large")
        return null
      }

      if (data.length < maskStart + (masked ? 4 : 0) + payloadLength) {
        console.error("Invalid WebSocket frame: incomplete frame")
        return null
      }

      let payload: Buffer
      if (masked) {
        const maskKey = data.slice(maskStart, maskStart + 4)
        const maskedPayload = data.slice(maskStart + 4, maskStart + 4 + payloadLength)
        payload = Buffer.alloc(payloadLength)
        for (let i = 0; i < maskedPayload.length; i++) {
          payload[i] = maskedPayload[i] ^ maskKey[i % 4]
        }
      } else {
        payload = data.slice(maskStart, maskStart + payloadLength)
      }

      return {
        fin,
        opcode,
        payload,
        payloadString: payload.toString(),
      }
    } catch (error) {
      console.error("Error decoding WebSocket frame:", {
        error,
        dataLength: data?.length,
        firstBytes: data?.slice(0, 10),
      })
      return null
    }
  }

  private handleFragmentedMessage(
    socket: ReturnType<typeof TcpSocket.createConnection>,
    frame: WebSocketFrame,
  ): boolean {
    try {
      if (!frame.fin) {
        // This is a fragment
        let fragmented = this.fragmentedMessages.get(socket)
        if (!fragmented) {
          // First fragment - must not be continuation
          if (frame.opcode === WebSocketOpCode.Continuation) {
            console.warn("Skipping continuation frame without start frame")
            return true // Skip but don't fail
          }
          fragmented = {
            opcode: frame.opcode,
            data: [frame.payload],
          }
          console.log("Starting new fragmented message", { opcode: frame.opcode })
        } else {
          // Continuation fragment - must be continuation
          if (frame.opcode !== WebSocketOpCode.Continuation) {
            console.warn("Unexpected non-continuation frame during fragmented message")
            return true // Skip but don't fail
          }
          fragmented.data.push(frame.payload)
          console.log("Added fragment to message", {
            fragments: fragmented.data.length,
            totalSize: fragmented.data.reduce((sum, buf) => sum + buf.length, 0),
          })
        }
        this.fragmentedMessages.set(socket, fragmented)
        return true
      } else if (frame.opcode === WebSocketOpCode.Continuation) {
        // Final fragment
        const fragmented = this.fragmentedMessages.get(socket)
        if (!fragmented) {
          console.warn("Skipping final fragment without previous fragments")
          return true // Skip but don't fail
        }

        // Combine all fragments
        fragmented.data.push(frame.payload)
        const fullPayload = Buffer.concat(fragmented.data)
        this.fragmentedMessages.delete(socket)

        console.log("Completed fragmented message", {
          opcode: fragmented.opcode,
          totalSize: fullPayload.length,
        })

        // Create a complete frame
        const completeFrame: WebSocketFrame = {
          fin: true,
          opcode: fragmented.opcode,
          payload: fullPayload,
          payloadString: fullPayload.toString(),
        }

        // Process the complete message
        this.processFrame(socket, completeFrame)
        return true
      }
      return false
    } catch (error) {
      console.error("Error handling fragmented message:", error)
      this.fragmentedMessages.delete(socket) // Clean up on error
      return true // Skip further processing
    }
  }

  private deserialize(data: string): any {
    try {
      return JSON.parse(data, (key: string, value: any) => {
        // Handle special serialized values
        if (typeof value === "string") {
          // Handle special values
          if (value in WebSocketServer.SPECIAL_VALUES) {
            return WebSocketServer.SPECIAL_VALUES[
              value as keyof typeof WebSocketServer.SPECIAL_VALUES
            ]
          }

          // Handle function names
          if (value.startsWith("~~~ ") && value.endsWith(" ~~~")) {
            if (value.includes("()")) {
              return `[Function: ${value.slice(4, -4)}]`
            }
          }

          // Handle BigInt strings (they're serialized as strings by the client)
          if (/^-?\d+n$/.test(value)) {
            return BigInt(value.slice(0, -1))
          }
        }

        return value
      })
    } catch (error) {
      console.error("Error deserializing data:", error)
      return null
    }
  }

  private processFrame(
    socket: ReturnType<typeof TcpSocket.createConnection>,
    frame: WebSocketFrame,
  ) {
    try {
      // Handle control frames
      if (frame.opcode >= 0x8) {
        switch (frame.opcode) {
          case WebSocketOpCode.Close:
            socket.end()
            return
          case WebSocketOpCode.Ping:
            const pongFrame = this.encodeWebSocketFrame(frame.payloadString, WebSocketOpCode.Pong)
            socket.write(pongFrame)
            return
          case WebSocketOpCode.Pong:
            return
        }
        return
      }

      // Handle data frames
      if (frame.opcode === WebSocketOpCode.Text) {
        const command = this.deserialize(frame.payloadString) as Command
        try {
          this.handleCommand(command)
        } catch (error) {
          console.error("Error handling command:", error)
        }
      }
    } catch (error) {
      console.error("Error processing frame:", error)
    }
  }

  start() {
    console.log("Starting WebSocket server")
    if (this.server) {
      console.log("WebSocket server already started")
      return
    }
    if (!this.store) throw new Error("Store must be set before starting the server")

    this.server = TcpSocket.createServer((socket) => {
      console.log("Client connected:", socket.address())
      let isWebSocket = false

      socket.on("data", (data: any) => {
        if (!isWebSocket) {
          isWebSocket = this.handleWebSocketHandshake(socket, data)
          if (isWebSocket) {
            this.clients.add(socket)
          }
          return
        }

        try {
          const frame = this.decodeWebSocketFrame(data)
          if (!frame) {
            console.error("Invalid WebSocket frame")
            return
          }

          // Handle fragmented messages
          if (this.handleFragmentedMessage(socket, frame)) {
            return
          }

          // Process complete frame
          this.processFrame(socket, frame)
        } catch (error) {
          console.error("Error handling WebSocket frame:", error)
        }
      })

      socket.on("error", (error) => {
        console.error("Socket error:", error)
      })

      socket.on("close", () => {
        console.log("Client disconnected:", socket.address())
        this.fragmentedMessages.delete(socket)
        this.clients.delete(socket)
      })
    })
    console.log("Starting server listen")
    this.server.listen({ port: this.port, host: "127.0.0.1" }, () => {
      console.log(`WebSocket server listening on port ${this.port}`)
    })
  }

  private handleCommand(command: Command) {
    console.log("Handling command:", command)
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
      this.server = null
    }
  }

  private encodeWebSocketFrame(
    data: string,
    opcode: WebSocketOpCode = WebSocketOpCode.Text,
  ): Buffer {
    const payload = Buffer.from(data)
    const length = payload.length

    let frameLength = 2 // First 2 bytes are always there
    if (length > 65535) {
      frameLength += 8
    } else if (length > 125) {
      frameLength += 2
    }

    const frame = Buffer.alloc(frameLength + length)
    frame[0] = 0x80 | opcode // FIN + opcode

    if (length <= 125) {
      frame[1] = length
    } else if (length <= 65535) {
      frame[1] = 126
      frame.writeUInt16BE(length, 2)
    } else {
      frame[1] = 127
      const highBits = Math.floor(length / Math.pow(2, 32))
      const lowBits = length % Math.pow(2, 32)
      frame.writeUInt32BE(highBits, 2)
      frame.writeUInt32BE(lowBits, 6)
    }

    payload.copy(frame, frameLength)
    return frame
  }

  private serialize(value: any): string {
    return JSON.stringify(value, (key: string, val: any) => {
      if (val === undefined) return WebSocketServer.UNDEFINED
      if (val === null) return WebSocketServer.NULL
      if (val === false) return WebSocketServer.FALSE
      if (val === 0) return WebSocketServer.ZERO
      if (val === "") return WebSocketServer.EMPTY_STRING
      if (val === Infinity) return WebSocketServer.INFINITY
      if (val === -Infinity) return WebSocketServer.NEGATIVE_INFINITY
      if (typeof val === "function") {
        return `~~~ ${val.name || "anonymous"}() ~~~`
      }
      if (typeof val === "bigint") {
        return `${val.toString()}n`
      }
      return val
    })
  }

  broadcast(type: CommandTypeKey, payload: any) {
    const message = this.serialize({
      type,
      payload,
      date: new Date().toISOString(),
    })

    const frame = this.encodeWebSocketFrame(message)
    this.clients.forEach((client) => {
      try {
        client.write(frame)
      } catch (error) {
        console.error("Error sending message:", error)
      }
    })
  }
}

// Create a singleton instance
export const wsServer = new WebSocketServer()
