// src/types/index.ts - 統合された型定義
import { ReactNode } from 'react';

// ===== BASE TYPES =====
export interface Coordinate {
  readonly latitude: number;
  readonly longitude: number;
}

export interface Region {
  readonly center: Coordinate;
  readonly span: {
    readonly latitudeDelta: number;
    readonly longitudeDelta: number;
  };
}

export interface Padding {
  readonly top?: number;
  readonly right?: number;
  readonly bottom?: number;
  readonly left?: number;
}

// ===== ERROR TYPES =====
export type MapKitErrorCode =
  | "LOAD_ERROR"
  | "NOT_LOADED"
  | "INIT_ERROR"
  | "TOKEN_ERROR"
  | "CONTEXT_ERROR"
  | "NETWORK_ERROR"
  | "VALIDATION_ERROR"
  | "PERMISSION_ERROR"
  | "QUOTA_EXCEEDED"
  | "UNKNOWN_ERROR";

export interface MapKitError {
  readonly code: MapKitErrorCode;
  readonly message: string;
  readonly cause?: Error;
  readonly timestamp: number;
}

// ===== CONTEXT TYPES =====
export interface MapKitTokenResponse {
  readonly token: string;
  readonly expiresAt: number;
}

export interface TokenData {
  readonly token: string | null;
  readonly expiresAt: number | null;
  readonly isValid: boolean;
}

export interface MapKitInitOptions {
  readonly language?: string;
  readonly version?: string;
  readonly libraries?: readonly string[];
  readonly tokenFetchRetries?: number;
  readonly tokenFetchRetryDelay?: number;
}

export interface MapKitContextState {
  readonly mapkit: typeof mapkit | null;
  readonly isReady: boolean;
  readonly isLoading: boolean;
  readonly error: MapKitError | null;
}

export interface MapKitContextProps extends MapKitContextState {
  readonly load: (onError?: (error: MapKitError) => void, options?: MapKitInitOptions) => Promise<void>;
}

export interface MapKitProviderProps {
  readonly children: ReactNode;
  readonly options?: Partial<MapKitInitOptions>;
  readonly fetchToken: () => Promise<MapKitTokenResponse>;
  readonly onError?: (error: MapKitError) => void;
}

// ===== EVENT HANDLERS =====
export interface AnnotationEventHandlers<T = mapkit.Annotation> {
  readonly onSelect?: (map: mapkit.Map, annotation: T) => void;
  readonly onDeselect?: (map: mapkit.Map, annotation: T) => void;
  readonly onDrag?: (map: mapkit.Map, annotation: T, coordinate: mapkit.Coordinate) => void;
  readonly onDragStart?: (map: mapkit.Map, annotation: T) => void;
  readonly onDragEnd?: (map: mapkit.Map, annotation: T) => void;
}

export interface MapEventHandlers {
  readonly onRegionChangeStart?: (event: mapkit.EventBase<mapkit.Map>) => void;
  readonly onRegionChangeEnd?: (event: mapkit.EventBase<mapkit.Map>) => void;
  readonly onRotationStart?: (event: mapkit.EventBase<mapkit.Map>) => void;
  readonly onRotationEnd?: (event: mapkit.EventBase<mapkit.Map>) => void;
  readonly onScrollStart?: (event: mapkit.EventBase<mapkit.Map>) => void;
  readonly onScrollEnd?: (event: mapkit.EventBase<mapkit.Map>) => void;
  readonly onZoomStart?: (event: mapkit.EventBase<mapkit.Map>) => void;
  readonly onZoomEnd?: (event: mapkit.EventBase<mapkit.Map>) => void;
  readonly onMapTypeChange?: (event: mapkit.EventBase<mapkit.Map>) => void;
  readonly onUserLocationChange?: (
    event: mapkit.EventBase<mapkit.Map> & {
      coordinate: mapkit.Coordinate;
      timestamp: Date;
    }
  ) => void;
  readonly onUserLocationError?: (
    event: mapkit.EventBase<mapkit.Map> & { code: number; message: string }
  ) => void;
  readonly onSingleTap?: (event: mapkit.EventBase<mapkit.Map>) => void;
  readonly onDoubleTap?: (event: mapkit.EventBase<mapkit.Map>) => void;
  readonly onLongPress?: (event: mapkit.EventBase<mapkit.Map>) => void;
}

// ===== ANNOTATION TYPES =====
export interface BaseAnnotationOptions {
  readonly id?: string;
  readonly title?: string;
  readonly subtitle?: string;
  readonly accessibilityLabel?: string;
  readonly data?: Record<string, unknown>;
  readonly draggable?: boolean;
  readonly visible?: boolean;
  readonly enabled?: boolean;
  readonly selected?: boolean;
  readonly calloutEnabled?: boolean;
  readonly animates?: boolean;
  readonly appearanceAnimation?: string;
  readonly anchorOffset?: DOMPoint;
  readonly calloutOffset?: DOMPoint;
  readonly size?: { width: number; height: number };
  readonly displayPriority?: number;
  readonly collisionMode?: string;
  readonly padding?: Padding;
  readonly clusteringIdentifier?: string;
  readonly place?: mapkit.Place;
}

export interface CalloutDelegate {
  readonly calloutAnchorOffsetForAnnotation?: (
    annotation: mapkit.Annotation,
    size: { width: number; height: number }
  ) => DOMPoint;
  readonly calloutShouldAppearForAnnotation?: (annotation: mapkit.Annotation) => boolean;
  readonly calloutShouldAnimateForAnnotation?: (annotation: mapkit.Annotation) => boolean;
  readonly calloutAppearanceAnimationForAnnotation?: (annotation: mapkit.Annotation) => string;
  readonly calloutContentForAnnotation?: (annotation: mapkit.Annotation) => ReactNode;
  readonly calloutElementForAnnotation?: (annotation: mapkit.Annotation) => ReactNode;
  readonly calloutLeftAccessoryForAnnotation?: (annotation: mapkit.Annotation) => ReactNode;
  readonly calloutRightAccessoryForAnnotation?: (annotation: mapkit.Annotation) => ReactNode;
}

export type AnnotationConstructorOptions = BaseAnnotationOptions & 
  AnnotationEventHandlers & {
    readonly callout?: CalloutDelegate;
  };

export interface MarkerAnnotationOptions extends AnnotationConstructorOptions {
  readonly titleVisibility?: string;
  readonly subtitleVisibility?: string;
  readonly color?: string;
  readonly glyphColor?: string;
  readonly glyphText?: string;
  readonly glyphImage?: {
    readonly 1: string;
    readonly 2?: string;
    readonly 3?: string;
  };
  readonly selectedGlyphImage?: {
    readonly 1: string;
    readonly 2?: string;
    readonly 3?: string;
  };
}

export interface ImageAnnotationOptions extends AnnotationConstructorOptions {
  readonly url: {
    readonly 1: string;
    readonly 2?: string;
    readonly 3?: string;
  };
}

export interface CustomAnnotationOptions extends AnnotationConstructorOptions {
  readonly children: ReactNode;
}

export interface MarkerAnnotationProps extends MarkerAnnotationOptions {
  readonly coordinate: Coordinate;
}

export interface ImageAnnotationProps extends ImageAnnotationOptions {
  readonly coordinate: Coordinate;
}

export interface CustomAnnotationProps extends CustomAnnotationOptions {
  readonly coordinate: Coordinate;
}

// ===== OVERLAY TYPES =====
export interface CircleOverlayProps {
  readonly id?: string;
  readonly coordinate: Coordinate;
  readonly radius: number;
  readonly options?: mapkit.StylesOverlayOptions;
}

export interface PolylineOverlayProps {
  readonly id?: string;
  readonly points: readonly Coordinate[];
  readonly options?: mapkit.StylesOverlayOptions;
}

export interface PolygonOverlayProps {
  readonly id?: string;
  readonly points: readonly Coordinate[] | readonly (readonly Coordinate[])[];
  readonly options?: mapkit.StylesOverlayOptions;
}

// ===== MAP TYPES =====
export interface MapProps extends MapEventHandlers {
  readonly id?: string;
  readonly options?: Readonly<mapkit.MapConstructorOptions>;
  readonly children?: ReactNode;
  readonly location?: Coordinate | null;
  readonly region?: Region | null;
  readonly onMapError?: (error: Error | MapKitError) => void;
  readonly onAppear?: (map: mapkit.Map) => void;
  readonly onChange?: (map: mapkit.Map, annotations: readonly mapkit.Annotation[]) => void;
  readonly className?: string;
  readonly loadingComponent?: ReactNode;
  readonly errorComponent?: ReactNode;
  readonly optimizationKey?: string;
}

// ===== UNION TYPES =====
export type AnyAnnotationProps = MarkerAnnotationProps | ImageAnnotationProps | CustomAnnotationProps;
export type AnyOverlayProps = CircleOverlayProps | PolylineOverlayProps | PolygonOverlayProps;

// ===== UTILITY TYPES =====
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? never : K;
}[keyof T];

export type OptionalKeys<T> = {
  [K in keyof T]-?: {} extends Pick<T, K> ? K : never;
}[keyof T];