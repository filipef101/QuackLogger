import React, { createContext, useContext } from "react"
import { RootStore } from "../RootStore"

const RootStoreContext = createContext<RootStore | null>(null)

interface RootStoreProviderProps {
  children: React.ReactNode
  store: RootStore
}

export const RootStoreProvider: React.FC<RootStoreProviderProps> = ({ children, store }) => {
  return React.createElement(RootStoreContext.Provider, { value: store }, children)
}

export const useStores = (): RootStore => {
  const store = useContext(RootStoreContext)
  if (!store) {
    throw new Error("useStores must be used within a RootStoreProvider")
  }
  return store
}
