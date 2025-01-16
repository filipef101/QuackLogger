import { Instance, types } from "mobx-state-tree"

export const Client = types.model("Client").props({
  id: types.identifier,
  name: types.string,
  platform: types.string,
  version: types.string,
  connected: types.optional(types.boolean, true),
})

export const ClientStore = types
  .model("ClientStore")
  .props({
    clients: types.array(Client),
  })
  .actions((self) => ({
    addClient(client: any) {
      const existingClient = self.clients.find((c) => c.id === client.id)
      if (existingClient) {
        existingClient.connected = true
      } else {
        self.clients.push({
          id: client.id || Date.now().toString(),
          name: client.name || "Unknown",
          platform: client.platform || "unknown",
          version: client.version || "0.0.0",
        })
      }
    },
    removeClient(id: string) {
      const client = self.clients.find((c) => c.id === id)
      if (client) {
        client.connected = false
      }
    },
    clear() {
      self.clients.clear()
    },
  }))

export interface ClientStore extends Instance<typeof ClientStore> {}
