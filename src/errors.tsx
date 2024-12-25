export type MapKitErrorCode =
  | "LOAD_ERROR"
  | "NOT_LOADED"
  | "INIT_ERROR"
  | "TOKEN_ERROR"
  | "CONTEXT_ERROR"
  | "UNKNOWN_ERROR"

export interface MapKitError {
  code: MapKitErrorCode
  message: string
}

export const createMapKitError = (code: MapKitErrorCode, message?: string): MapKitError => {
  const defaultMessages: Record<MapKitErrorCode, string> = {
    LOAD_ERROR: "Failed to load MapKit JS",
    NOT_LOADED: "MapKit JS not loaded",
    INIT_ERROR: "Failed to initialize MapKit",
    TOKEN_ERROR: "Failed to fetch or validate MapKit token",
    CONTEXT_ERROR: "MapKit context error",
    UNKNOWN_ERROR: "An unknown error occurred"
  }

  return {
    code,
    message: message || defaultMessages[code]
  }
}

// Helper function to check if an error is a MapKitError
export const isMapKitError = (error: unknown): error is MapKitError => {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "message" in error &&
    typeof error.code === "string" &&
    typeof error.message === "string"
  )
}