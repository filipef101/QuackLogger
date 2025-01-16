import { Instance, SnapshotIn, SnapshotOut, types } from "mobx-state-tree"
import { NetworkStore } from "./NetworkStore"
import { ConsoleStore } from "./ConsoleStore"
import { ClientStore } from "./ClientStore"

export const RootStoreModel = types
  .model("RootStore")
  .props({
    networkStore: types.optional(NetworkStore, {}),
    consoleStore: types.optional(ConsoleStore, {}),
    clientStore: types.optional(ClientStore, {}),
  })
  .actions((self) => ({
    addNetworkRequest(request: any) {
      self.networkStore.addRequest(request)
    },
    addConsoleLog(log: any) {
      self.consoleStore.addLog(log)
    },
    addClient(client: any) {
      self.clientStore.addClient(client)
    },
    setState(state: any) {
      // Handle state backup responses
      console.log("State backup received:", state)
    },
    handleCustomCommand(command: any) {
      // Handle custom commands
      console.log("Custom command received:", command)
    },
  }))
  .views((self) => ({
    get sortedLogs() {
      return self.consoleStore.sortedLogs
    },
    get sortedRequests() {
      return self.networkStore.sortedRequests
    },
  }))

export interface RootStore extends Instance<typeof RootStoreModel> {}
export interface RootStoreSnapshotOut extends SnapshotOut<typeof RootStoreModel> {}
export interface RootStoreSnapshotIn extends SnapshotIn<typeof RootStoreModel> {}

// Initialize the store
export const createRootStore = () =>
  RootStoreModel.create({
    networkStore: {},
    consoleStore: {},
    clientStore: {},
  })
