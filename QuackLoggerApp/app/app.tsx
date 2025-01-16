import React, { useEffect } from "react"
import { AppNavigator } from "./navigators"
import { RootStoreProvider } from "./models"
import "./i18n"
import { tcpServer } from "./services/tcp-server"
import { createRootStore } from "./models/RootStore"
import { PermissionsAndroid, Platform } from "react-native"

async function requestPermissions() {
  if (Platform.OS === "android") {
    try {
      await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.INTERNET, {
        title: "Internet Permission",
        message: "QuackLogger needs access to Internet",
        buttonNeutral: "Ask Me Later",
        buttonNegative: "Cancel",
        buttonPositive: "OK",
      })
    } catch (err) {
      console.warn(err)
    }
  }
}

export const App = () => {
  const store = createRootStore()

  useEffect(() => {
    requestPermissions().then(() => {
      tcpServer.setStore(store)
      tcpServer.start()
    })
    return () => tcpServer.stop()
  }, [store])

  return (
    <RootStoreProvider store={store}>
      <AppNavigator />
    </RootStoreProvider>
  )
}
