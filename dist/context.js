var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/context.tsx
var context_exports = {};
__export(context_exports, {
  MapKitContext: () => MapKitContext,
  MapKitProvider: () => MapKitProvider,
  findMap: () => findMap,
  useMapKit: () => useMapKit
});
module.exports = __toCommonJS(context_exports);
var import_react = __toESM(require("react"));
var defaultContextValue = {
  mapkit: null,
  isReady: false,
  isLoading: false,
  error: null,
  load: async () => {
  },
  reset: () => {
  }
};
var MapKitContext = (0, import_react.createContext)(defaultContextValue);
var RETRY_ATTEMPTS = 3;
var RETRY_DELAY = 2e3;
var TOKEN_BUFFER_TIME = 60;
var MapKitProvider = ({ children, fetchToken }) => {
  const [initialized, setInitialized] = (0, import_react.useState)(false);
  const [isLoading, setIsLoading] = (0, import_react.useState)(false);
  const [error, setError] = (0, import_react.useState)(null);
  const [mapkit2, setMapkit] = (0, import_react.useState)(null);
  const [tokenData, setTokenData] = (0, import_react.useState)({ token: null, expiresAt: null });
  const loadMapKitWithRetry = async (attempts = RETRY_ATTEMPTS) => {
    try {
      const script = document.createElement("script");
      script.src = "https://cdn.apple-mapkit.com/mk/5.x.x/mapkit.js";
      script.crossOrigin = "anonymous";
      await new Promise((resolve, reject) => {
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Failed to load MapKit JS"));
        document.head.appendChild(script);
      });
    } catch (err) {
      if (attempts > 1) {
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
        return loadMapKitWithRetry(attempts - 1);
      }
      throw err;
    }
  };
  const initializeMapKit = (0, import_react.useCallback)(async (options) => {
    if (!window.mapkit) {
      throw new Error("MapKit JS not loaded");
    }
    const currentTime = Math.floor(Date.now() / 1e3);
    const shouldFetchNewToken = !tokenData.token || tokenData.expiresAt && tokenData.expiresAt - currentTime < TOKEN_BUFFER_TIME;
    try {
      if (shouldFetchNewToken) {
        const newTokenData = await fetchToken();
        setTokenData(newTokenData);
        window.mapkit.init({
          authorizationCallback: (done) => done(newTokenData.token),
          language: options == null ? void 0 : options.language
        });
      } else {
        window.mapkit.init({
          authorizationCallback: (done) => done(tokenData.token),
          language: options == null ? void 0 : options.language
        });
      }
      setMapkit(window.mapkit);
      setInitialized(true);
    } catch (error2) {
      throw error2 instanceof Error ? error2 : new Error("Failed to initialize MapKit");
    }
  }, [tokenData, fetchToken]);
  const load = async (options) => {
    var _a;
    if (isLoading || initialized) return;
    setIsLoading(true);
    setError(null);
    try {
      await loadMapKitWithRetry();
      await initializeMapKit(options);
    } catch (err) {
      const error2 = err instanceof Error ? err : new Error("An unknown error occurred");
      setError(error2);
      (_a = options == null ? void 0 : options.onError) == null ? void 0 : _a.call(options, error2);
    } finally {
      setIsLoading(false);
    }
  };
  const reset = (0, import_react.useCallback)(() => {
    setInitialized(false);
    setMapkit(null);
    setError(null);
    setTokenData({ token: null, expiresAt: null });
  }, []);
  (0, import_react.useEffect)(() => {
    return () => reset();
  }, [reset]);
  return /* @__PURE__ */ import_react.default.createElement(
    MapKitContext.Provider,
    {
      value: {
        mapkit: mapkit2,
        isReady: initialized,
        isLoading,
        error,
        load,
        reset
      }
    },
    children
  );
};
var useMapKit = () => {
  const context = (0, import_react.useContext)(MapKitContext);
  if (!context) {
    throw new Error("useMapKit must be used within a MapKitProvider");
  }
  return context;
};
var findMap = (id) => {
  return mapkit.maps.find((map) => {
    var _a;
    return ((_a = map.element.parentElement) == null ? void 0 : _a.id) === id;
  }) ?? null;
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  MapKitContext,
  MapKitProvider,
  findMap,
  useMapKit
});
