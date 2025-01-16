import { Instance, types } from "mobx-state-tree"

const RequestModel = types.model("Request").props({
  url: types.string,
  method: types.string,
  data: types.frozen(),
  headers: types.frozen(),
  params: types.frozen(),
})

const ResponseModel = types.model("Response").props({
  body: types.frozen(),
  status: types.number,
  headers: types.frozen(),
})

export const NetworkRequest = types.model("NetworkRequest").props({
  id: types.identifier,
  type: types.literal("api.response"),
  important: types.optional(types.boolean, false),
  payload: types.model({
    request: RequestModel,
    response: ResponseModel,
    duration: types.number,
  }),
  connectionId: types.maybe(types.number),
  messageId: types.maybe(types.number),
  date: types.Date,
  deltaTime: types.maybe(types.number),
  clientId: types.maybe(types.string),
})

export const NetworkStore = types
  .model("NetworkStore")
  .props({
    requests: types.array(NetworkRequest),
  })
  .actions((self) => ({
    addRequest(command: any) {
      self.requests.push({
        id: command.messageId?.toString() || Date.now().toString(),
        type: "api.response",
        important: command.important || false,
        payload: command.payload,
        connectionId: command.connectionId,
        messageId: command.messageId,
        date: new Date(command.date || Date.now()),
        deltaTime: command.deltaTime,
        clientId: command.clientId,
      })
    },
    clear() {
      self.requests.clear()
    },
  }))
  .views((self) => ({
    get sortedRequests() {
      return self.requests.slice().sort((a, b) => b.date.getTime() - a.date.getTime())
    },
  }))

export interface NetworkStore extends Instance<typeof NetworkStore> {}
