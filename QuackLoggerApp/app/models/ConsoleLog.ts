import { Instance, SnapshotIn, SnapshotOut, types } from "mobx-state-tree"

export const ConsoleLogModel = types
  .model("ConsoleLog")
  .props({
    id: types.identifier,
    level: types.enumeration(["log", "info", "warn", "error", "debug"]),
    message: types.frozen(),
    timestamp: types.number,
    stack: types.maybeNull(types.string),
  })
  .views((self) => ({
    get color() {
      switch (self.level) {
        case "error":
          return "error"
        case "warn":
          return "warning"
        case "info":
          return "info"
        case "debug":
          return "muted"
        default:
          return "text"
      }
    },
  }))

export interface ConsoleLog extends Instance<typeof ConsoleLogModel> {}
export interface ConsoleLogSnapshotOut extends SnapshotOut<typeof ConsoleLogModel> {}
export interface ConsoleLogSnapshotIn extends SnapshotIn<typeof ConsoleLogModel> {}
