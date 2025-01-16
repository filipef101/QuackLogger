import { Instance, SnapshotIn, SnapshotOut, types } from "mobx-state-tree"

export const NetworkRequestModel = types
  .model("NetworkRequest")
  .props({
    id: types.identifier,
    url: types.string,
    method: types.string,
    headers: types.frozen(),
    body: types.maybeNull(types.frozen()),
    response: types.maybeNull(types.frozen()),
    status: types.maybeNull(types.number),
    duration: types.number,
    timestamp: types.number,
  })
  .views((self) => ({
    get shortUrl() {
      try {
        const url = new URL(self.url)
        return `${url.pathname}${url.search}`
      } catch {
        return self.url
      }
    },
  }))

export interface NetworkRequest extends Instance<typeof NetworkRequestModel> {}
export interface NetworkRequestSnapshotOut extends SnapshotOut<typeof NetworkRequestModel> {}
export interface NetworkRequestSnapshotIn extends SnapshotIn<typeof NetworkRequestModel> {}
