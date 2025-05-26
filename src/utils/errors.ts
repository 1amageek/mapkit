// src/utils/errors.ts
import { MapKitError, MapKitErrorCode } from '../types';

export const createMapKitError = (
  code: MapKitErrorCode,
  message?: string,
  cause?: Error
): MapKitError => {
  const defaultMessages: Record<MapKitErrorCode, string> = {
    LOAD_ERROR: "Failed to load MapKit JS",
    NOT_LOADED: "MapKit JS not loaded",
    INIT_ERROR: "Failed to initialize MapKit",
    TOKEN_ERROR: "Failed to fetch or validate MapKit token",
    CONTEXT_ERROR: "MapKit context error",
    NETWORK_ERROR: "Network error occurred",
    VALIDATION_ERROR: "Validation error",
    PERMISSION_ERROR: "Permission denied",
    QUOTA_EXCEEDED: "API quota exceeded",
    UNKNOWN_ERROR: "An unknown error occurred"
  };

  return {
    code,
    message: message || defaultMessages[code],
    cause,
    timestamp: Date.now()
  };
};

export const isMapKitError = (error: unknown): error is MapKitError => {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    "message" in error &&
    "timestamp" in error &&
    typeof (error as MapKitError).code === "string" &&
    typeof (error as MapKitError).message === "string" &&
    typeof (error as MapKitError).timestamp === "number"
  );
};

export class MapKitErrorBoundary extends Error {
  public readonly mapKitError: MapKitError;

  constructor(mapKitError: MapKitError) {
    super(mapKitError.message);
    this.name = 'MapKitErrorBoundary';
    this.mapKitError = mapKitError;
  }
}