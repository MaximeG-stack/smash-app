const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// 1. Watch the entire monorepo (needed for @smashi/shared)
config.watchFolders = [workspaceRoot];

// 2. Resolve modules: local node_modules first, then workspace root
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// 3. Force ALL React-related imports to LOCAL copies.
//
//    ROOT CAUSE: `expo` (at workspace root) embeds react-native@0.84.0 in
//    its own node_modules. RN 0.84 uses React 19, which defines
//    REACT_ELEMENT_TYPE = Symbol.for("react.transitional.element").
//    Our app creates elements with React 18 which uses
//    Symbol.for("react.element"). Different symbols →
//    "Objects are not valid as a React child".
//
//    extraNodeModules does NOT fix this because it is ignored when the
//    requiring package has its own nested node_modules (expo/node_modules/react).
//    resolveRequest intercepts EVERY require() globally — this is the fix.
const localReact = path.resolve(projectRoot, "node_modules/react");
const localReactDom = path.resolve(projectRoot, "node_modules/react-dom");
const localRN = path.resolve(projectRoot, "node_modules/react-native");

const originalResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  switch (moduleName) {
    case "react":
      return { filePath: path.resolve(localReact, "index.js"), type: "sourceFile" };
    case "react/jsx-runtime":
      return { filePath: path.resolve(localReact, "jsx-runtime.js"), type: "sourceFile" };
    case "react/jsx-dev-runtime":
      return { filePath: path.resolve(localReact, "jsx-dev-runtime.js"), type: "sourceFile" };
    case "react-dom":
      return { filePath: path.resolve(localReactDom, "index.js"), type: "sourceFile" };
    case "react-dom/client":
      return { filePath: path.resolve(localReactDom, "client.js"), type: "sourceFile" };
    case "react-native":
      return { filePath: path.resolve(localRN, "index.js"), type: "sourceFile" };
    default:
      if (originalResolveRequest) {
        return originalResolveRequest(context, moduleName, platform);
      }
      return context.resolveRequest(context, moduleName, platform);
  }
};

module.exports = config;
