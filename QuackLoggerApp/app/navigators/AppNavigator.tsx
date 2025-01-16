/**
 * The app navigator (formerly "AppNavigator" and "MainNavigator") is used for the primary
 * navigation flows of your app.
 * Generally speaking, it will contain an auth flow (registration, login, forgot password)
 * and a "main" flow which the user will use once logged in.
 */
import { DarkTheme, DefaultTheme, NavigationContainer } from "@react-navigation/native"
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs"
import React from "react"
import { useColorScheme } from "react-native"
import { NetworkScreen } from "app/screens/NetworkScreen"
import { ConsoleScreen } from "app/screens/ConsoleScreen"
import { ConnectionInfoScreen } from "app/screens/ConnectionInfoScreen"
import { colors } from "app/theme"
import { Icon } from "app/components"

export type AppStackParamList = {
  Network: undefined
  Console: undefined
  Connection: undefined
}

const Tab = createBottomTabNavigator<AppStackParamList>()

export const AppNavigator = function AppNavigator() {
  const colorScheme = useColorScheme()

  return (
    <NavigationContainer theme={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.tint,
        }}
      >
        <Tab.Screen
          name="Network"
          component={NetworkScreen}
          options={{
            tabBarIcon: ({ color }) => <Icon icon="components" color={color} />,
          }}
        />
        <Tab.Screen
          name="Console"
          component={ConsoleScreen}
          options={{
            tabBarIcon: ({ color }) => <Icon icon="debug" color={color} />,
          }}
        />
        <Tab.Screen
          name="Connection"
          component={ConnectionInfoScreen}
          options={{
            tabBarIcon: ({ color }) => <Icon icon="settings" color={color} />,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  )
}
