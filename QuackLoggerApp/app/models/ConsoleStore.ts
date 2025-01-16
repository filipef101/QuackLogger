import { Instance, types } from "mobx-state-tree"

const StackFrame = types.model("StackFrame").props({
  fileName: types.string,
  functionName: types.string,
  lineNumber: types.number,
})

export const ConsoleLog = types.model("ConsoleLog").props({
  id: types.identifier,
  type: types.enumeration(["log", "debug", "warn", "error"]),
  payload: types.model({
    level: types.enumeration(["log", "debug", "warn", "error"]),
    message: types.frozen(),
    stack: types.maybe(types.array(StackFrame)),
  }),
  important: types.optional(types.boolean, false),
  connectionId: types.maybe(types.number),
  messageId: types.maybe(types.number),
  date: types.Date,
  deltaTime: types.maybe(types.number),
  clientId: types.maybe(types.string),
})

export const ConsoleStore = types
  .model("ConsoleStore")
  .props({
    logs: types.array(ConsoleLog),
  })
  .actions((self) => ({
    addLog(command: any) {
      self.logs.push({
        id: command.messageId?.toString() || Date.now().toString(),
        type: command.type || "log",
        payload: {
          level: command.payload.level || "log",
          message: command.payload.message,
          stack: command.payload.stack,
        },
        important: command.important || false,
        connectionId: command.connectionId,
        messageId: command.messageId,
        date: new Date(command.date || Date.now()),
        deltaTime: command.deltaTime,
        clientId: command.clientId,
      })
    },
    clear() {
      self.logs.clear()
    },
  }))
  .views((self) => ({
    get sortedLogs() {
      return self.logs.slice().sort((a, b) => b.date.getTime() - a.date.getTime())
    },
  }))

export interface ConsoleStore extends Instance<typeof ConsoleStore> {}
