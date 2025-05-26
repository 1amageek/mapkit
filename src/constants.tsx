// src/constants.tsx
/**
 * MapKit JSの定数を独自に定義
 * これによりMapKit JSの読み込み前でも安全に使用できる
 */

export const FeatureVisibility = {
  Adaptive: "Adaptive",
  Hidden: "Hidden", 
  Visible: "Visible"
} as const;

export const MapTypes = {
  Standard: "Standard",
  MutedStandard: "MutedStandard", 
  Hybrid: "Hybrid",
  Satellite: "Satellite"
} as const;

export const ColorSchemes = {
  Light: "Light",
  Dark: "Dark",
  Adaptive: "Adaptive"
} as const;

export const Distances = {
  Adaptive: "Adaptive",
  Imperial: "Imperial", 
  Metric: "Metric"
} as const;

export const DisplayPriority = {
  Low: 250,
  High: 750,
  Required: 1000
} as const;

export const CollisionMode = {
  Rectangle: "Rectangle",
  Circle: "Circle",
  None: "None"
} as const;

export const Transport = {
  Automobile: "Automobile",
  Walking: "Walking"
} as const;

export const LoadPriorities = {
  LandCover: "LandCover",
  PointsOfInterest: "PointsOfInterest",
  None: "None"
} as const;

// 型定義
export type FeatureVisibilityType = typeof FeatureVisibility[keyof typeof FeatureVisibility];
export type MapTypesType = typeof MapTypes[keyof typeof MapTypes];
export type ColorSchemesType = typeof ColorSchemes[keyof typeof ColorSchemes];
export type DistancesType = typeof Distances[keyof typeof Distances];
export type DisplayPriorityType = typeof DisplayPriority[keyof typeof DisplayPriority];
export type CollisionModeType = typeof CollisionMode[keyof typeof CollisionMode];
export type TransportType = typeof Transport[keyof typeof Transport];
export type LoadPrioritiesType = typeof LoadPriorities[keyof typeof LoadPriorities];

/**
 * MapKit JSが読み込まれた後に、独自定数からMapKit定数への変換を行う
 */
export const getMapKitFeatureVisibility = (value: FeatureVisibilityType): string => {
  if (typeof window !== 'undefined' && window.mapkit) {
    switch (value) {
      case FeatureVisibility.Adaptive:
        return window.mapkit.FeatureVisibility.Adaptive;
      case FeatureVisibility.Hidden:
        return window.mapkit.FeatureVisibility.Hidden;
      case FeatureVisibility.Visible:
        return window.mapkit.FeatureVisibility.Visible;
      default:
        return window.mapkit.FeatureVisibility.Adaptive;
    }
  }
  return value;
};

export const getMapKitMapType = (value: MapTypesType): string => {
  if (typeof window !== 'undefined' && window.mapkit) {
    switch (value) {
      case MapTypes.Standard:
        return window.mapkit.Map.MapTypes.Standard;
      case MapTypes.MutedStandard:
        return window.mapkit.Map.MapTypes.MutedStandard;
      case MapTypes.Hybrid:
        return window.mapkit.Map.MapTypes.Hybrid;
      case MapTypes.Satellite:
        return window.mapkit.Map.MapTypes.Satellite;
      default:
        return window.mapkit.Map.MapTypes.Standard;
    }
  }
  return value;
};

export const getMapKitColorScheme = (value: ColorSchemesType): string => {
  if (typeof window !== 'undefined' && window.mapkit) {
    switch (value) {
      case ColorSchemes.Light:
        return window.mapkit.Map.ColorSchemes.Light;
      case ColorSchemes.Dark:
        return window.mapkit.Map.ColorSchemes.Dark;
      case ColorSchemes.Adaptive:
        return window.mapkit.Map.ColorSchemes.Adaptive;
      default:
        return window.mapkit.Map.ColorSchemes.Adaptive;
    }
  }
  return value;
};

export const getMapKitDistance = (value: DistancesType): string => {
  if (typeof window !== 'undefined' && window.mapkit) {
    switch (value) {
      case Distances.Adaptive:
        return window.mapkit.Map.Distances.Adaptive;
      case Distances.Imperial:
        return window.mapkit.Map.Distances.Imperial;
      case Distances.Metric:
        return window.mapkit.Map.Distances.Metric;
      default:
        return window.mapkit.Map.Distances.Adaptive;
    }
  }
  return value;
};

export const getMapKitDisplayPriority = (value: DisplayPriorityType): number => {
  if (typeof window !== 'undefined' && window.mapkit) {
    switch (value) {
      case DisplayPriority.Low:
        return window.mapkit.Annotation.DisplayPriority.Low;
      case DisplayPriority.High:
        return window.mapkit.Annotation.DisplayPriority.High;
      case DisplayPriority.Required:
        return window.mapkit.Annotation.DisplayPriority.Required;
      default:
        return window.mapkit.Annotation.DisplayPriority.High;
    }
  }
  return value;
};

export const getMapKitCollisionMode = (value: CollisionModeType): string => {
  if (typeof window !== 'undefined' && window.mapkit) {
    switch (value) {
      case CollisionMode.Rectangle:
        return window.mapkit.Annotation.CollisionMode.Rectangle;
      case CollisionMode.Circle:
        return window.mapkit.Annotation.CollisionMode.Circle;
      case CollisionMode.None:
        return window.mapkit.Annotation.CollisionMode.None;
      default:
        return window.mapkit.Annotation.CollisionMode.Rectangle;
    }
  }
  return value;
};