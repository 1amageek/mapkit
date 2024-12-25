import React, { useState, createContext, useContext, ReactNode, useEffect, useCallback } from "react"

type MapKit = typeof mapkit

export interface MapKitTokenResponse {
  token: string
  expiresAt: number
}

export interface MapKitContextProps {
  mapkit: MapKit | null
  isReady: boolean
  isLoading: boolean
  error: Error | null
  load: (options?: MapKitInitOptions) => Promise<void>
  reset: () => void
}

export interface TokenData {
  token: string | null
  expiresAt: number | null
}

export interface MapKitInitOptions {
  language?: string
  onError?: (error: Error) => void
}

export interface MapKitProviderProps {
  children: ReactNode
  fetchToken: () => Promise<MapKitTokenResponse>
}

const defaultContextValue: MapKitContextProps = {
  mapkit: null,
  isReady: false,
  isLoading: false,
  error: null,
  load: async () => {},
  reset: () => {}
}

export const MapKitContext = createContext<MapKitContextProps>(defaultContextValue)

const RETRY_ATTEMPTS = 3
const RETRY_DELAY = 2000
const TOKEN_BUFFER_TIME = 60

export const MapKitProvider = ({ children, fetchToken }: MapKitProviderProps) => {
  const [initialized, setInitialized] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [mapkit, setMapkit] = useState<MapKit | null>(null)
  const [tokenData, setTokenData] = useState<TokenData>({ token: null, expiresAt: null })

  const loadMapKitWithRetry = async (attempts = RETRY_ATTEMPTS): Promise<void> => {
    try {
      const script = document.createElement("script")
      script.src = "https://cdn.apple-mapkit.com/mk/5.x.x/mapkit.js"
      script.crossOrigin = "anonymous"
      
      await new Promise<void>((resolve, reject) => {
        script.onload = () => resolve()
        script.onerror = () => reject(new Error("Failed to load MapKit JS"))
        document.head.appendChild(script)
      })
    } catch (err) {
      if (attempts > 1) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
        return loadMapKitWithRetry(attempts - 1)
      }
      throw err
    }
  }

  const initializeMapKit = useCallback(async (options?: MapKitInitOptions) => {
    if (!window.mapkit) {
      throw new Error("MapKit JS not loaded")
    }

    const currentTime = Math.floor(Date.now() / 1000)
    const shouldFetchNewToken = !tokenData.token || 
      (tokenData.expiresAt && tokenData.expiresAt - currentTime < TOKEN_BUFFER_TIME)

    try {
      if (shouldFetchNewToken) {
        const newTokenData = await fetchToken()
        setTokenData(newTokenData)
        window.mapkit.init({
          authorizationCallback: (done: (token: string) => void) => done(newTokenData.token),
          language: options?.language
        })
      } else {
        window.mapkit.init({
          authorizationCallback: (done: (token: string) => void) => done(tokenData.token!),
          language: options?.language
        })
      }

      setMapkit(window.mapkit)
      setInitialized(true)
    } catch (error) {
      throw error instanceof Error ? error : new Error('Failed to initialize MapKit')
    }
  }, [tokenData])

  const load = async (options?: MapKitInitOptions) => {
    if (isLoading || initialized) return
    
    setIsLoading(true)
    setError(null)

    try {
      await loadMapKitWithRetry()
      await initializeMapKit(options)
    } catch (err) {
      const error = err instanceof Error ? err : new Error("An unknown error occurred")
      setError(error)
      options?.onError?.(error)
    } finally {
      setIsLoading(false)
    }
  }

  const reset = useCallback(() => {
    setInitialized(false)
    setMapkit(null)
    setError(null)
    setTokenData({ token: null, expiresAt: null })
  }, [])

  useEffect(() => {
    return () => reset()
  }, [])

  return (
    <MapKitContext.Provider 
      value={{ 
        mapkit, 
        isReady: initialized, 
        isLoading,
        error,
        load,
        reset
      }}
    >
      {children}
    </MapKitContext.Provider>
  )
}

export const useMapKit = () => {
  const context = useContext(MapKitContext)
  if (!context) {
    throw new Error("useMapKit must be used within a MapKitProvider")
  }
  return context
}

export const findMap = (id: string): mapkit.Map | null => {
  return mapkit.maps.find((map: mapkit.Map) => map.element.parentElement?.id === id) ?? null
}