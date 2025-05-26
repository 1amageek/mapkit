// src/index.ts - 統合されたエントリポイント

// ===== TYPE EXPORTS =====
export type * from './types';

// ===== UTILITY EXPORTS =====
export {
  createMapKitError,
  isMapKitError,
  MapKitErrorBoundary
} from './utils/errors';

export {
  isValidCoordinate,
  isValidRegion,
  isValidPadding
} from './utils/validation';

export {
  isAnnotationElement,
  isMarkerAnnotationElement,
  isImageAnnotationElement,
  isCustomAnnotationElement,
  isCircleOverlayElement,
  isPolylineOverlayElement,
  isPolygonOverlayElement
} from './utils/type-guards';

export {
  CleanupManager,
  ReactRootManager
} from './utils/memory-management';

// ===== CONTEXT EXPORTS =====
export {
  MapKitProvider,
  useMapKit,
  useMap
} from './context/mapkit-context';

// ===== COMPONENT EXPORTS =====
export {
  MarkerAnnotation,
  ImageAnnotation,
  CustomAnnotation,
  CircleOverlay,
  PolylineOverlay,
  PolygonOverlay
} from './components';

export { default as Map } from './components/Map';

// ===== MANAGER EXPORTS =====
export {
  AnnotationManager,
  useAnnotationManager
} from './managers/annotation-manager';

export {
  OverlayManager,
  useOverlayManager
} from './managers/overlay-manager';

// ===== CONSTANTS EXPORTS =====
export * from './constants';

// ===== SEARCH EXPORTS =====
export {
  SearchProvider,
  useSearch
} from './search';