module.exports = {
  // ... other config
  resolver: {
    // ... other resolver config
    resolveRequest: (context, moduleName, platform) => {
      if (moduleName === "crypto") {
        return context.resolveRequest(context, "react-native-quick-crypto", platform)
      }
      return context.resolveRequest(context, moduleName, platform)
    },
  },
}
