import React, { FC, useEffect, useState } from "react"
import { observer } from "mobx-react-lite"
import { View, ViewStyle, TextStyle } from "react-native"
import { Screen, Text } from "app/components"
import { spacing } from "app/theme"
import NetInfo from "@react-native-community/netinfo"

export const ConnectionInfoScreen: FC = observer(function ConnectionInfoScreen() {
  const [ipAddress, setIpAddress] = useState<string>("")

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      if (state.type === "wifi" && state.details) {
        setIpAddress(state.details.ipAddress || "")
      }
    })

    return () => unsubscribe()
  }, [])

  return (
    <Screen preset="fixed" safeAreaEdges={["top"]} contentContainerStyle={$screenContainer}>
      <View style={$infoContainer}>
        <Text style={$title} text="Connection Info" />
        <Text style={$info} text={`IP Address: ${ipAddress}`} />
        <Text style={$info} text="Port: 9090" />
        <Text
          style={$instructions}
          text="To connect, use this device's IP address and port in your React Native app's Reactotron configuration."
        />
      </View>
    </Screen>
  )
})

const $screenContainer: ViewStyle = {
  flex: 1,
  padding: spacing.md,
}

const $infoContainer: ViewStyle = {
  backgroundColor: "rgba(0,0,0,0.05)",
  padding: spacing.md,
  borderRadius: 8,
}

const $title: TextStyle = {
  fontSize: 20,
  fontWeight: "bold",
  marginBottom: spacing.sm,
}

const $info: TextStyle = {
  fontSize: 16,
  marginBottom: spacing.xs,
}

const $instructions: TextStyle = {
  marginTop: spacing.sm,
  fontSize: 14,
  color: "rgba(0,0,0,0.7)",
}
