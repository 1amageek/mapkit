// Export error types and utilities
export {
  type MapKitError,
  type MapKitErrorCode,
  createMapKitError,
  isMapKitError
} from "./errors"

// Export context, provider, and related types
export {
  MapKitContext,
  MapKitProvider,
  useMapKit,
  useMap,
  type MapKitContextProps,
  type MapKitInitOptions,
  type MapKitTokenResponse,
  type MapKitProviderProps,
  type TokenData
} from "./context"

// Export annotations and overlays
export {
  MarkerAnnotation,
  ImageAnnotation,
  CustomAnnotation,
  CircleOverlay,
  PolylineOverlay,
  PolygonOverlay,
  type Coordinate,
  type Region,
  type AnnotationConstructorOptions,
  type MarkerAnnotationProps,
  type ImageAnnotationProps,
  type CustomAnnotationProps,
  type CircleOverlayProps,
  type PolylineOverlayProps,
  type PolygonOverlayProps
} from "./annotations"

export * from "./search";
// Export Map component and its types
import Map from "./map"
export { Map }
export type { MapProps } from "./map"