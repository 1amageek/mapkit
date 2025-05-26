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

// Export MapKit constants (safe to use before MapKit JS loads)
export {
  FeatureVisibility,
  MapTypes,
  ColorSchemes,
  Distances,
  DisplayPriority,
  CollisionMode,
  Transport,
  LoadPriorities,
  getMapKitFeatureVisibility,
  getMapKitMapType,
  getMapKitColorScheme,
  getMapKitDistance,
  getMapKitDisplayPriority,
  getMapKitCollisionMode,
  type FeatureVisibilityType,
  type MapTypesType,
  type ColorSchemesType,
  type DistancesType,
  type DisplayPriorityType,
  type CollisionModeType,
  type TransportType,
  type LoadPrioritiesType
} from "./constants"

export * from "./search";
// Export Map component and its types
import Map from "./map"
export { Map }
export type { MapProps } from "./map"