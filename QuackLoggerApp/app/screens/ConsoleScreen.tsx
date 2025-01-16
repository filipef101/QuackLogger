import React, { FC } from "react"
import { observer } from "mobx-react-lite"
import { FlatList, View, ViewStyle, TextStyle } from "react-native"
import { Screen, Text } from "app/components"
import { useStores } from "app/models"
import { spacing } from "app/theme"
import { ConsoleStore } from "app/models/ConsoleStore"
import type { Instance } from "mobx-state-tree"

type ConsoleLog = Instance<typeof ConsoleStore>["logs"][number]
type LogLevel = ConsoleLog["payload"]["level"]

const LOG_COLORS: Record<LogLevel, string> = {
  log: "#000000",
  debug: "#666666",
  warn: "#f39c12",
  error: "#c0392b",
}

export const ConsoleScreen: FC = observer(function ConsoleScreen() {
  const store = useStores()

  const renderItem = ({ item }: { item: ConsoleLog }) => (
    <View style={$logContainer}>
      <Text style={[$level, { color: LOG_COLORS[item.payload.level] }]} text={item.payload.level} />
      <View style={$messageContainer}>
        <Text style={$message} text={JSON.stringify(item.payload.message, null, 2)} />
        {item.payload.stack && (
          <Text
            style={$stack}
            text={item.payload.stack
              .map((frame) => `${frame.functionName} (${frame.fileName}:${frame.lineNumber})`)
              .join("\n")}
          />
        )}
      </View>
    </View>
  )

  return (
    <Screen preset="fixed" safeAreaEdges={["top"]} contentContainerStyle={$screenContainer}>
      <FlatList
        data={store.sortedLogs}
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

const $logContainer: ViewStyle = {
  padding: spacing.md,
  borderBottomWidth: 1,
  borderBottomColor: "rgba(0,0,0,0.1)",
  flexDirection: "row",
}

const $level: TextStyle = {
  width: 60,
  fontWeight: "bold",
}

const $messageContainer: ViewStyle = {
  flex: 1,
}

const $message: TextStyle = {
  flex: 1,
}

const $stack: TextStyle = {
  marginTop: spacing.xs,
  color: "rgba(0,0,0,0.5)",
  fontSize: 12,
}
