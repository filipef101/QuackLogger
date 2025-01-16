import React, { FC } from "react"
import { observer } from "mobx-react-lite"
import { FlatList, View, ViewStyle, TextStyle } from "react-native"
import { Screen, Text } from "app/components"
import { useStores } from "app/models"
import { spacing } from "app/theme"
import { NetworkStore } from "app/models/NetworkStore"
import type { Instance } from "mobx-state-tree"

type NetworkRequest = Instance<typeof NetworkStore>["requests"][number]

export const NetworkScreen: FC = observer(function NetworkScreen() {
  const store = useStores()

  const renderItem = ({ item }: { item: NetworkRequest }) => (
    <View style={$requestContainer}>
      <Text style={$method} text={item.payload.request.method} />
      <View style={$details}>
        <Text style={$url} text={item.payload.request.url} />
        <Text style={$status} text={`${item.payload.response.status || "pending"}`} />
        <Text style={$duration} text={`${item.payload.duration}ms`} />
      </View>
    </View>
  )

  return (
    <Screen preset="fixed" safeAreaEdges={["top"]} contentContainerStyle={$screenContainer}>
      <FlatList
        data={store.sortedRequests}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        style={$list}
      />
    </Screen>
  )
})

const $screenContainer: ViewStyle = {
  flex: 1,
}

const $list: ViewStyle = {
  flex: 1,
}

const $requestContainer: ViewStyle = {
  padding: spacing.md,
  borderBottomWidth: 1,
  borderBottomColor: "rgba(0,0,0,0.1)",
  flexDirection: "row",
  alignItems: "center",
}

const $method: TextStyle = {
  width: 80,
  fontWeight: "bold",
}

const $details: ViewStyle = {
  flex: 1,
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
}

const $url: TextStyle = {
  flex: 1,
  marginRight: spacing.sm,
}

const $status: TextStyle = {
  width: 60,
  textAlign: "right",
}

const $duration: TextStyle = {
  width: 80,
  textAlign: "right",
}
