import { useState, useMemo, createContext, useContext, ReactNode, useEffect, useCallback } from "react"
import { MapKitError, createMapKitError, isMapKitError } from "./errors"

type MapKit = typeof mapkit

export interface MapKitTokenResponse {
  token: string
  expiresAt: number
}

export interface MapKitContextProps {
  mapkit: MapKit | null
  isReady: boolean
  isLoading: boolean
  error: MapKitError | null
  load: (onError?: (error: MapKitError) => void, options?: MapKitInitOptions) => Promise<void>
}

export interface TokenData {
  token: string | null
  expiresAt: number | null
}

export interface MapKitInitOptions {
  language?: string
  version?: string
  libraries?: string[]
  tokenFetchRetries?: number
  tokenFetchRetryDelay?: number
}

export interface MapKitProviderProps {
  children: ReactNode
  options?: Partial<MapKitInitOptions>
  fetchToken: () => Promise<MapKitTokenResponse>
  onError?: (error: MapKitError) => void
}

const DEFAULT_OPTIONS: Required<MapKitInitOptions> = {
  language: "en",
  version: "5.x.x",
  libraries: [],
  tokenFetchRetries: 3,
  tokenFetchRetryDelay: 2000
}

const defaultContextValue: MapKitContextProps = {
  mapkit: null,
  isReady: false,
  isLoading: false,
  error: null,
  load: async () => { },
}

export const MapKitContext = createContext<MapKitContextProps>(defaultContextValue)

const TOKEN_BUFFER_TIME = 60 // seconds before token expiry to refresh

export const MapKitProvider = ({
  children,
  fetchToken,
  options: userOptions,
  onError
}: MapKitProviderProps) => {
  const options: Required<MapKitInitOptions> = {
    ...DEFAULT_OPTIONS,
    ...userOptions
  }

  const [initialized, setInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<MapKitError | null>(null)
  const [mapkit, setMapkit] = useState<MapKit | null>(null)
  const [tokenData, setTokenData] = useState<TokenData>({
    token: null,
    expiresAt: null
  })

  const handleError = useCallback((error: unknown) => {
    const mapKitError = isMapKitError(error)
      ? error
      : createMapKitError("UNKNOWN_ERROR", error instanceof Error ? error.message : undefined)

    setError(mapKitError)
    onError?.(mapKitError)
  }, [onError])

  const fetchTokenWithRetry = useCallback(async (
    attempts: number = options.tokenFetchRetries
  ): Promise<MapKitTokenResponse> => {
    try {
      return await fetchToken()
    } catch (err) {
      if (attempts > 1) {
        await new Promise(resolve => setTimeout(resolve, options.tokenFetchRetryDelay))
        return fetchTokenWithRetry(attempts - 1)
      }
      throw createMapKitError(
        "TOKEN_ERROR",
        err instanceof Error ? err.message : undefined
      )
    }
  }, [fetchToken, options.tokenFetchRetries, options.tokenFetchRetryDelay])

  const loadMapKitWithRetry = useCallback(async (
    attempts: number = options.tokenFetchRetries
  ): Promise<void> => {
    try {
      const script = document.createElement("script")
      script.src = `https://cdn.apple-mapkit.com/mk/${options.version}/mapkit.js`
      script.crossOrigin = "anonymous"

      await new Promise<void>((resolve, reject) => {
        script.onload = () => resolve()
        script.onerror = () => reject(createMapKitError("LOAD_ERROR"))
        document.head.appendChild(script)
      })

      if (options.libraries.length > 0) {
        await Promise.all(options.libraries.map(async (library) => {
          const libraryScript = document.createElement("script")
          libraryScript.src = `https://cdn.apple-mapkit.com/mk/${options.version}/${library}.js`
          libraryScript.crossOrigin = "anonymous"

          await new Promise<void>((resolve, reject) => {
            libraryScript.onload = () => resolve()
            libraryScript.onerror = () => reject(
              createMapKitError("LOAD_ERROR", `Failed to load library: ${library}`)
            )
            document.head.appendChild(libraryScript)
          })
        }))
      }
    } catch (err) {
      if (attempts > 1) {
        await new Promise(resolve => setTimeout(resolve, options.tokenFetchRetryDelay))
        return loadMapKitWithRetry(attempts - 1)
      }
      throw isMapKitError(err) ? err : createMapKitError("UNKNOWN_ERROR")
    }
  }, [options.version, options.libraries, options.tokenFetchRetryDelay])

  const validateToken = useCallback((token: string, expiresAt: number): boolean => {
    const currentTime = Math.floor(Date.now() / 1000)
    return token.length > 0 && expiresAt > currentTime + TOKEN_BUFFER_TIME
  }, [])

  const initializeMapKit = useCallback(async () => {
    if (!window.mapkit) {
      throw createMapKitError("NOT_LOADED")
    }

    const currentTime = Math.floor(Date.now() / 1000)
    const shouldFetchNewToken = !tokenData.token ||
      !tokenData.expiresAt ||
      tokenData.expiresAt - currentTime < TOKEN_BUFFER_TIME

    try {
      let token: string
      let expiresAt: number

      if (shouldFetchNewToken) {
        const newTokenData = await fetchTokenWithRetry()
        if (!validateToken(newTokenData.token, newTokenData.expiresAt)) {
          throw createMapKitError("TOKEN_ERROR", "Invalid token data received")
        }
        token = newTokenData.token
        expiresAt = newTokenData.expiresAt
        setTokenData(newTokenData)
      } else {
        token = tokenData.token!
        expiresAt = tokenData.expiresAt!
      }

      window.mapkit.init({
        authorizationCallback: (done: (token: string) => void) => done(token),
        language: options.language
      })

      const refreshTimeout = (expiresAt - currentTime - TOKEN_BUFFER_TIME) * 1000
      setTimeout(async () => {
        try {
          const newTokenData = await fetchTokenWithRetry()
          setTokenData(newTokenData)
        } catch (err) {
          handleError(
            isMapKitError(err) ? err : createMapKitError("TOKEN_ERROR")
          )
        }
      }, refreshTimeout)

      setMapkit(window.mapkit)
      setInitialized(true)
    } catch (error) {
      throw isMapKitError(error)
        ? error
        : createMapKitError("INIT_ERROR", error instanceof Error ? error.message : undefined)
    }
  }, [
    tokenData,
    fetchTokenWithRetry,
    validateToken,
    options.language,
    handleError
  ])

  const load = useCallback(async (
    onError?: (error: MapKitError) => void,
    loadOptions?: MapKitInitOptions
  ) => {
    if (isLoading || initialized) return

    setIsLoading(true)
    setError(null)

    try {
      await loadMapKitWithRetry()
      await initializeMapKit()
    } catch (err) {
      const mapKitError = isMapKitError(err)
        ? err
        : createMapKitError("UNKNOWN_ERROR")
      handleError(mapKitError)
      onError?.(mapKitError)
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, initialized, loadMapKitWithRetry, initializeMapKit, handleError])

  useEffect(() => {
    return () => {
      setInitialized(false)
      setMapkit(null)
      setError(null)
      setTokenData({ token: null, expiresAt: null })
    }
  }, [])

  const contextValue = useMemo<MapKitContextProps>(() => ({
    mapkit,
    isReady: initialized,
    isLoading,
    error,
    load,
  }), [mapkit, initialized, isLoading, error, load])

  return (
    <MapKitContext.Provider value={contextValue}>
      {children}
    </MapKitContext.Provider>
  )
}

export const useMapKit = () => {
  const context = useContext(MapKitContext)
  if (!context) {
    throw createMapKitError(
      "CONTEXT_ERROR",
      "useMapKit must be used within a MapKitProvider"
    )
  }
  return context
}

export const useMap = (id: string): mapkit.Map | null => {
  const { isReady } = useMapKit()
  if (!isReady) return null
  return window.mapkit.maps.find(
    (map: mapkit.Map) => map.element.parentElement?.id === id
  ) ?? null
}