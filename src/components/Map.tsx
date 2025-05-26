// src/components/Map.tsx
import React, {
  useEffect,
  forwardRef,
  useRef,
  useState,
  useCallback,
  useMemo,
  ForwardedRef,
} from "react";
import { useMapKit } from "../context/mapkit-context";
import { MapProps, MapKitError, Coordinate, Region } from "../types";
import { createMapKitError, isMapKitError } from "../utils/errors";
import { isValidCoordinate, isValidRegion } from "../utils/validation";
import { AnnotationManager, useAnnotationManager } from "../managers/annotation-manager";
import { OverlayManager, useOverlayManager } from "../managers/overlay-manager";
import { CleanupManager } from "../utils/memory-management";
import {
  getMapKitFeatureVisibility,
  getMapKitMapType,
  getMapKitColorScheme,
  getMapKitDistance,
  type FeatureVisibilityType,
  type MapTypesType,
  type ColorSchemesType,
  type DistancesType
} from "../constants";

// Default map options
const getDefaultMapOptions = (): mapkit.MapConstructorOptions => ({
  isScrollEnabled: true,
  showsUserLocation: true,
  showsCompass: getMapKitFeatureVisibility("Adaptive" as FeatureVisibilityType),
  showsZoomControl: true,
});

// Map options converter
const convertMapOptions = (options: mapkit.MapConstructorOptions): mapkit.MapConstructorOptions => {
  const converted = { ...options };
  
  if (converted.showsCompass && typeof converted.showsCompass === 'string') {
    converted.showsCompass = getMapKitFeatureVisibility(converted.showsCompass as FeatureVisibilityType);
  }
  
  if (converted.showsScale && typeof converted.showsScale === 'string') {
    converted.showsScale = getMapKitFeatureVisibility(converted.showsScale as FeatureVisibilityType);
  }
  
  if (converted.mapType && typeof converted.mapType === 'string') {
    converted.mapType = getMapKitMapType(converted.mapType as MapTypesType);
  }
  
  if (converted.colorScheme && typeof converted.colorScheme === 'string') {
    converted.colorScheme = getMapKitColorScheme(converted.colorScheme as ColorSchemesType);
  }
  
  return converted;
};

// Event handler setup
const useMapEventHandlers = (
  map: mapkit.Map | null,
  eventHandlers: Partial<MapProps>,
  cleanupManager: CleanupManager
) => {
  useEffect(() => {
    if (!map) return;

    const setupHandler = <K extends keyof mapkit.MapEvents<mapkit.Map>>(
      eventType: K,
      handler: ((event: mapkit.MapEvents<mapkit.Map>[K]) => void) | undefined
    ) => {
      if (!handler) return;
      
      const wrappedHandler = (event: mapkit.MapEvents<mapkit.Map>[K]) => handler(event);
      map.addEventListener(eventType, wrappedHandler);
      
      const cleanup = () => map.removeEventListener(eventType, wrappedHandler);
      cleanupManager.add(cleanup);
    };

    // Setup all event handlers
    setupHandler("region-change-start", eventHandlers.onRegionChangeStart);
    setupHandler("region-change-end", eventHandlers.onRegionChangeEnd);
    setupHandler("rotation-start", eventHandlers.onRotationStart);
    setupHandler("rotation-end", eventHandlers.onRotationEnd);
    setupHandler("scroll-start", eventHandlers.onScrollStart);
    setupHandler("scroll-end", eventHandlers.onScrollEnd);
    setupHandler("zoom-start", eventHandlers.onZoomStart);
    setupHandler("zoom-end", eventHandlers.onZoomEnd);
    setupHandler("map-type-change", eventHandlers.onMapTypeChange);
    setupHandler("user-location-change", eventHandlers.onUserLocationChange);
    setupHandler("user-location-error", eventHandlers.onUserLocationError);
    setupHandler("single-tap", eventHandlers.onSingleTap);
    setupHandler("double-tap", eventHandlers.onDoubleTap);
    setupHandler("long-press", eventHandlers.onLongPress);

  }, [map, eventHandlers, cleanupManager]);
};

// Location and region management
const useLocationAndRegion = (
  map: mapkit.Map | null,
  location: Coordinate | null | undefined,
  region: Region | null | undefined,
  onMapError?: (error: Error | MapKitError) => void
) => {
  useEffect(() => {
    if (!map) return;
    
    try {
      // Clear existing annotations for location
      const existingLocationAnnotations = map.annotations.filter(
        annotation => annotation.data?.isLocationMarker
      );
      if (existingLocationAnnotations.length > 0) {
        map.removeAnnotations(existingLocationAnnotations);
      }

      if (location) {
        if (!isValidCoordinate(location)) {
          throw createMapKitError("VALIDATION_ERROR", "Invalid coordinate provided");
        }

        const coordinate = new window.mapkit.Coordinate(
          location.latitude,
          location.longitude
        );
        const annotation = new window.mapkit.MarkerAnnotation(coordinate, {
          data: { isLocationMarker: true }
        });
        map.showItems([annotation], { animate: true });
      }

      if (region) {
        if (!isValidRegion(region)) {
          throw createMapKitError("VALIDATION_ERROR", "Invalid region provided");
        }

        const mapkitRegion = new window.mapkit.CoordinateRegion(
          new window.mapkit.Coordinate(
            region.center.latitude,
            region.center.longitude
          ),
          new window.mapkit.CoordinateSpan(
            region.span.latitudeDelta,
            region.span.longitudeDelta
          )
        );
        map.setRegionAnimated(mapkitRegion, true);
      }
    } catch (err) {
      const error = isMapKitError(err)
        ? err
        : createMapKitError(
            "UNKNOWN_ERROR",
            "Failed to update map location/region",
            err as Error
          );
      onMapError?.(error);
    }
  }, [map, location, region, onMapError]);
};

// Main Map component
const Map = forwardRef<HTMLDivElement, MapProps>(function Map(
  {
    id,
    options = {},
    children,
    location,
    region,
    onMapError,
    onAppear,
    onChange,
    className = "",
    loadingComponent,
    errorComponent,
    optimizationKey,
    ...eventHandlers
  },
  ref: ForwardedRef<HTMLDivElement>
) {
  const { isReady, isLoading, error: mapKitError, load } = useMapKit();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapkit.Map | null>(null);
  const cleanupManagerRef = useRef<CleanupManager | null>(null);
  const [mapError, setMapError] = useState<Error | MapKitError | null>(null);

  // Initialize cleanup manager
  useEffect(() => {
    cleanupManagerRef.current = new CleanupManager();
    return () => {
      cleanupManagerRef.current?.cleanup();
    };
  }, []);

  // Auto-load MapKit
  useEffect(() => {
    const handleError = (error: MapKitError) => {
      setMapError(error);
      onMapError?.(error);
    };
    load(handleError);
  }, [load, onMapError]);

  // Memoized map options
  const mapOptions = useMemo(() => {
    const defaultOptions = getDefaultMapOptions();
    const mergedOptions = { ...defaultOptions, ...options };
    return convertMapOptions(mergedOptions);
  }, [options]);

  // Initialize map
  useEffect(() => {
    if (!isReady || !containerRef.current || mapRef.current) return;

    try {
      if (!window.mapkit) {
        throw createMapKitError("NOT_LOADED");
      }

      const map = new window.mapkit.Map(containerRef.current, mapOptions);
      mapRef.current = map;
      onAppear?.(map);

    } catch (err) {
      const error = isMapKitError(err)
        ? err
        : createMapKitError(
            "INIT_ERROR",
            err instanceof Error ? err.message : "Failed to initialize map"
          );
      setMapError(error);
      onMapError?.(error);
    }
  }, [isReady, mapOptions, onAppear, onMapError]);

  // Cleanup map on unmount
  useEffect(() => {
    return () => {
      if (mapRef.current) {
        try {
          mapRef.current.destroy();
        } catch (error) {
          console.error("Error destroying map:", error);
        }
        mapRef.current = null;
      }
    };
  }, []);

  // Setup event handlers
  useMapEventHandlers(mapRef.current, eventHandlers, cleanupManagerRef.current!);

  // Manage location and region
  useLocationAndRegion(mapRef.current, location, region, onMapError);

  // Annotation and overlay managers
  const annotationManager = useAnnotationManager(mapRef.current);
  const overlayManager = useOverlayManager(mapRef.current);

  // Update annotations and overlays when children change
  const childrenArray = useMemo(() => 
    React.Children.toArray(children), 
    [children, optimizationKey]
  );

  useEffect(() => {
    if (!isReady || !annotationManager || !overlayManager) return;

    try {
      annotationManager.updateAnnotations(childrenArray);
      overlayManager.updateOverlays(childrenArray);

      const annotations = annotationManager.getAnnotations();
      onChange?.(mapRef.current!, annotations);
    } catch (err) {
      const error = isMapKitError(err)
        ? err
        : createMapKitError(
            "UNKNOWN_ERROR",
            "Failed to update map annotations/overlays",
            err as Error
          );
      setMapError(error);
      onMapError?.(error);
    }
  }, [isReady, childrenArray, annotationManager, overlayManager, onChange, onMapError]);

  // Render loading state
  if (isLoading) {
    return (
      (loadingComponent as React.ReactElement) ?? (
        <div 
          style={{ 
            width: "100%", 
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontSize: "0.875rem",
            color: "#666"
          }}
        >
          Loading map...
        </div>
      )
    );
  }

  // Render error state
  if (mapKitError || mapError) {
    return (
      (errorComponent as React.ReactElement) ?? (
        <div 
          className="map-error"
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            fontSize: "0.875rem",
            color: "#d32f2f",
            backgroundColor: "#ffebee",
            border: "1px solid #ffcdd2",
            borderRadius: "4px"
          }}
        >
          {(mapKitError || mapError)?.message || "An error occurred while loading the map"}
        </div>
      )
    );
  }

  // Don't render until ready
  if (!isReady) {
    return null;
  }

  return (
    <div
      ref={(el) => {
        if (typeof ref === "function") ref(el);
        else if (ref) ref.current = el;
        containerRef.current = el;
      }}
      id={id}
      className={`map ${className}`.trim()}
      style={{ width: "100%", height: "100%" }}
      role="application"
      aria-label="Interactive map"
    />
  );
});

Map.displayName = "Map";

export default Map;