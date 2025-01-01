import React, {
  useEffect,
  forwardRef,
  useRef,
  useState,
  ForwardedRef,
} from "react";
import { useMapKit } from "./context";
import { createRoot } from "react-dom/client";
import { MapKitError, createMapKitError, isMapKitError } from "./errors";
import {
  Location,
  Region,
  isMarkerAnnotationElement,
  isImageAnnotationElement,
  isCustomAnnotationElement,
  isCircleOverlayElement,
  isPolylineOverlayElement,
  isPolygonOverlayElement,
  AnnotationEventHandlers,
} from "./annotations";

export interface MapProps {
  id?: string;
  options?: mapkit.MapConstructorOptions;
  children?: React.ReactNode;
  location?: Location | null;
  region?: Region | null;
  onMapError?: (error: Error | MapKitError) => void;
  onAppear?: (map: mapkit.Map) => void;
  onChange?: (map: mapkit.Map, newAnnotations: mapkit.Annotation[]) => void;
  className?: string;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  onRegionChangeStart?: (event: mapkit.EventBase<mapkit.Map>) => void;
  onRegionChangeEnd?: (event: mapkit.EventBase<mapkit.Map>) => void;
  onRotationStart?: (event: mapkit.EventBase<mapkit.Map>) => void;
  onRotationEnd?: (event: mapkit.EventBase<mapkit.Map>) => void;
  onScrollStart?: (event: mapkit.EventBase<mapkit.Map>) => void;
  onScrollEnd?: (event: mapkit.EventBase<mapkit.Map>) => void;
  onZoomStart?: (event: mapkit.EventBase<mapkit.Map>) => void;
  onZoomEnd?: (event: mapkit.EventBase<mapkit.Map>) => void;
  onMapTypeChange?: (event: mapkit.EventBase<mapkit.Map>) => void;
  onUserLocationChange?: (event: mapkit.EventBase<mapkit.Map> & { coordinate: mapkit.Coordinate; timestamp: Date }) => void;
  onUserLocationError?: (event: mapkit.EventBase<mapkit.Map> & { code: number; message: string }) => void;
  onSingleTap?: (event: mapkit.EventBase<mapkit.Map>) => void;
  onDoubleTap?: (event: mapkit.EventBase<mapkit.Map>) => void;
  onLongPress?: (event: mapkit.EventBase<mapkit.Map>) => void;
}

const DEFAULT_MAP_OPTIONS: mapkit.MapConstructorOptions = {
  isScrollEnabled: true,
  showsUserLocation: true,
  showsCompass: "Adaptive",
  showsZoomControl: true,
};

const Map = forwardRef(function Map(
  {
    id,
    options = DEFAULT_MAP_OPTIONS,
    children,
    location,
    region,
    onMapError,
    onAppear,
    onChange,
    className = "",
    loadingComponent,
    errorComponent,
    onRegionChangeStart,
    onRegionChangeEnd,
    onRotationStart,
    onRotationEnd,
    onScrollStart,
    onScrollEnd,
    onZoomStart,
    onZoomEnd,
    onMapTypeChange,
    onUserLocationChange,
    onUserLocationError,
    onSingleTap,
    onDoubleTap,
    onLongPress,
  }: MapProps,
  ref: ForwardedRef<HTMLDivElement>
): React.ReactElement | null {
  const { isReady, isLoading, error: mapKitError, load } = useMapKit();
  const mapRef = useRef<mapkit.Map | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [mapError, setMapError] = useState<Error | MapKitError | null>(null);

  useEffect(() => {
    const handleError = (error: Error | MapKitError) => {
      setMapError(error);
      onMapError?.(error);

      if (mapRef.current) {
        try {
          mapRef.current.destroy();
        } catch (cleanupError) {
          console.error("Error during map cleanup:", cleanupError);
        }
        mapRef.current = null;
      }
    };

    load(handleError);
  }, [load, onMapError]);

  function hasCoordinate(props: any): props is { coordinate: mapkit.Coordinate } {
    return props && typeof props.coordinate === "object";
  }

  const annotationsData = React.Children.toArray(children)
    .map(child => {
      if (React.isValidElement(child) && typeof child.type === "function" && hasCoordinate(child.props)) {
        const { coordinate, ...rest } = child.props;
        return { longitude: coordinate.longitude, latitude: coordinate.latitude };
      }
      return null;
    })
    .filter(Boolean) as Array<Location>;

  useEffect(() => {
    if (!isReady || !containerRef.current) return;

    try {
      if (!window.mapkit) {
        throw createMapKitError("NOT_LOADED");
      }

      const map = new window.mapkit.Map(containerRef.current, {
        ...DEFAULT_MAP_OPTIONS,
        ...options,
      });

      mapRef.current = map;
      onAppear?.(map);

      // Map Event Handlers
      const mapEventCleanupFunctions: (() => void)[] = [];
      if (onRegionChangeStart) {
        const handler = (event: mapkit.EventBase<mapkit.Map>) => onRegionChangeStart(event);
        map.addEventListener("region-change-start", handler);
        mapEventCleanupFunctions.push(() => map.removeEventListener("region-change-start", handler));
      }
      if (onRegionChangeEnd) {
        const handler = (event: mapkit.EventBase<mapkit.Map>) => onRegionChangeEnd(event);
        map.addEventListener("region-change-end", handler);
        mapEventCleanupFunctions.push(() => map.removeEventListener("region-change-end", handler));
      }
      if (onRotationStart) {
        const handler = (event: mapkit.EventBase<mapkit.Map>) => onRotationStart(event);
        map.addEventListener("rotation-start", handler);
        mapEventCleanupFunctions.push(() => map.removeEventListener("rotation-start", handler));
      }
      if (onRotationEnd) {
        const handler = (event: mapkit.EventBase<mapkit.Map>) => onRotationEnd(event);
        map.addEventListener("rotation-end", handler);
        mapEventCleanupFunctions.push(() => map.removeEventListener("rotation-end", handler));
      }
      if (onScrollStart) {
        const handler = (event: mapkit.EventBase<mapkit.Map>) => onScrollStart(event);
        map.addEventListener("scroll-start", handler);
        mapEventCleanupFunctions.push(() => map.removeEventListener("scroll-start", handler));
      }
      if (onScrollEnd) {
        const handler = (event: mapkit.EventBase<mapkit.Map>) => onScrollEnd(event);
        map.addEventListener("scroll-end", handler);
        mapEventCleanupFunctions.push(() => map.removeEventListener("scroll-end", handler));
      }
      if (onZoomStart) {
        const handler = (event: mapkit.EventBase<mapkit.Map>) => onZoomStart(event);
        map.addEventListener("zoom-start", handler);
        mapEventCleanupFunctions.push(() => map.removeEventListener("zoom-start", handler));
      }
      if (onZoomEnd) {
        const handler = (event: mapkit.EventBase<mapkit.Map>) => onZoomEnd(event);
        map.addEventListener("zoom-end", handler);
        mapEventCleanupFunctions.push(() => map.removeEventListener("zoom-end", handler));
      }
      if (onMapTypeChange) {
        const handler = (event: mapkit.EventBase<mapkit.Map>) => onMapTypeChange(event);
        map.addEventListener("map-type-change", handler);
        mapEventCleanupFunctions.push(() => map.removeEventListener("map-type-change", handler));
      }
      if (onUserLocationChange) {
        const handler = (event: mapkit.EventBase<mapkit.Map> & { coordinate: mapkit.Coordinate; timestamp: Date }) => onUserLocationChange(event);
        map.addEventListener("user-location-change", handler);
        mapEventCleanupFunctions.push(() => map.removeEventListener("user-location-change", handler));
      }
      if (onUserLocationError) {
        const handler = (event: mapkit.EventBase<mapkit.Map> & { code: number; message: string }) => onUserLocationError(event);
        map.addEventListener("user-location-error", handler);
        mapEventCleanupFunctions.push(() => map.removeEventListener("user-location-error", handler));
      }
      if (onSingleTap) {
        const handler = (event: mapkit.EventBase<mapkit.Map>) => onSingleTap(event);
        map.addEventListener("single-tap", handler);
        mapEventCleanupFunctions.push(() => map.removeEventListener("single-tap", handler));
      }
      if (onDoubleTap) {
        const handler = (event: mapkit.EventBase<mapkit.Map>) => onDoubleTap(event);
        map.addEventListener("double-tap", handler);
        mapEventCleanupFunctions.push(() => map.removeEventListener("double-tap", handler));
      }
      if (onLongPress) {
        const handler = (event: mapkit.EventBase<mapkit.Map>) => onLongPress(event);
        map.addEventListener("long-press", handler);
        mapEventCleanupFunctions.push(() => map.removeEventListener("long-press", handler));
      }
      return () => {
        if (mapRef.current) {
          try {
            mapRef.current.destroy();
          } catch (error) {
            console.error("Error destroying map:", error);
          }
          mapRef.current = null;
        }
        mapEventCleanupFunctions.forEach(cleanup => cleanup());
      }
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
  }, [isReady, JSON.stringify(options)]);

  useEffect(() => {
    if (!isReady) return;
    const map = mapRef.current;
    if (!map) return;
    try {
      if (location) {
        const coordinate = new window.mapkit.Coordinate(
          location.latitude,
          location.longitude
        );
        const annotation = new window.mapkit.MarkerAnnotation(coordinate);
        map.showItems([annotation], { animate: true });
      }

      if (region) {
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
          "Failed to update map location/region"
        );
      setMapError(error);
      onMapError?.(error);
    }
  }, [isReady, location, region]);

  const annotationEventHandle = (annotation: mapkit.Annotation, handler: AnnotationEventHandlers) => {
    const cleanupFns: (() => void)[] = [];
    const { onSelect, onDeselect, onDrag, onDragStart, onDragEnd } = handler;
    if (onSelect) {
      const wrappedHandler = (event: mapkit.EventBase<mapkit.Map>) => onSelect(event, annotation);
      annotation.addEventListener("select", wrappedHandler);
      cleanupFns.push(() => annotation.removeEventListener("select", wrappedHandler));
    }
    if (onDeselect) {
      const wrappedHandler = (event: mapkit.EventBase<mapkit.Map>) => onDeselect(event, annotation);
      annotation.addEventListener("deselect", wrappedHandler);
      cleanupFns.push(() => annotation.removeEventListener("deselect", wrappedHandler));
    }
    if (onDrag) {
      const wrappedHandler = (event: mapkit.EventBase<mapkit.Map>) => onDrag(event, annotation);
      annotation.addEventListener("dragging", wrappedHandler);
      cleanupFns.push(() => annotation.removeEventListener("dragging", wrappedHandler));
    }
    if (onDragStart) {
      const wrappedHandler = (event: mapkit.EventBase<mapkit.Map>) => onDragStart(event, annotation);
      annotation.addEventListener("drag-start", wrappedHandler);
      cleanupFns.push(() => annotation.removeEventListener("drag-start", wrappedHandler));
    }
    if (onDragEnd) {
      const wrappedHandler = (event: mapkit.EventBase<mapkit.Map>) => onDragEnd(event, annotation);
      annotation.addEventListener("drag-end", wrappedHandler);
      cleanupFns.push(() => annotation.removeEventListener("drag-end", wrappedHandler));
    }
    return () => cleanupFns.forEach(cleanup => cleanup());
  };


  useEffect(() => {
    if (!isReady) return;
    const map = mapRef.current;
    if (!map) return;
    const cleanupFunctions: (() => void)[] = [];
    try {
      const currentAnnotations = new Set(map.annotations);
      const currentOverlays = new Set(map.overlays);

      const newAnnotations: mapkit.Annotation[] = [];
      const newOverlays: mapkit.Overlay[] = [];

      React.Children.toArray(children).forEach((child) => {
        if (isMarkerAnnotationElement(child)) {
          const { coordinate, callout, ...options } = child.props;
          const annotation = new mapkit.MarkerAnnotation(
            new mapkit.Coordinate(coordinate.latitude, coordinate.longitude),
            options
          );
          const cleanup = annotationEventHandle(annotation, child.props);
          cleanupFunctions.push(cleanup);
          newAnnotations.push(annotation);
        }

        if (isImageAnnotationElement(child)) {
          const { coordinate, callout, ...options } = child.props;
          const annotation = new mapkit.ImageAnnotation(
            new mapkit.Coordinate(coordinate.latitude, coordinate.longitude),
            options
          );
          annotationEventHandle(annotation, child.props);
          const cleanup = annotationEventHandle(annotation, child.props);
          cleanupFunctions.push(cleanup);
          newAnnotations.push(annotation);
        }

        if (isCustomAnnotationElement(child)) {
          const { coordinate, children, callout, ...options } = child.props;
          const annotation = new mapkit.Annotation(
            new mapkit.Coordinate(coordinate.latitude, coordinate.longitude),
            (coordinate: mapkit.Coordinate) => {
              const element = document.createElement("div");
              const root = createRoot(element);
              root.render(React.createElement(React.Fragment, null, children));
              return element;
            },
            options
          );
          if (callout) {
            annotation.callout = {
              calloutAnchorOffsetForAnnotation: callout.calloutAnchorOffsetForAnnotation,
              calloutShouldAppearForAnnotation: callout.calloutShouldAppearForAnnotation,
              calloutShouldAnimateForAnnotation: callout.calloutShouldAnimateForAnnotation,
              calloutAppearanceAnimationForAnnotation: callout.calloutAppearanceAnimationForAnnotation,
              calloutContentForAnnotation: callout.calloutContentForAnnotation && ((mapAnnotation) => {
                const element = document.createElement("div");
                const root = createRoot(element);
                root.render(callout.calloutContentForAnnotation!(mapAnnotation));
                return element;
              }),
              calloutElementForAnnotation: callout.calloutElementForAnnotation && ((mapAnnotation) => {
                const element = document.createElement("div");
                const root = createRoot(element);
                root.render(callout.calloutElementForAnnotation!(mapAnnotation));
                return element;
              }),
              calloutLeftAccessoryForAnnotation: callout.calloutLeftAccessoryForAnnotation && ((mapAnnotation) => {
                const element = document.createElement("div");
                const root = createRoot(element);
                root.render(callout.calloutLeftAccessoryForAnnotation!(mapAnnotation));
                return element;
              }),
              calloutRightAccessoryForAnnotation: callout.calloutRightAccessoryForAnnotation && ((mapAnnotation) => {
                const element = document.createElement("div");
                const root = createRoot(element);
                root.render(callout.calloutRightAccessoryForAnnotation!(mapAnnotation));
                return element;
              })
            };
          }
          const cleanup = annotationEventHandle(annotation, child.props);
          cleanupFunctions.push(cleanup);
          newAnnotations.push(annotation);
        }

        if (isCircleOverlayElement(child)) {
          const { coordinate, radius, options } = child.props;
          const overlay = new mapkit.CircleOverlay(coordinate, radius, options);
          newOverlays.push(overlay);
        }

        if (isPolylineOverlayElement(child)) {
          const { points, options } = child.props;
          const overlay = new mapkit.PolylineOverlay(points, options);
          newOverlays.push(overlay);
        }

        if (isPolygonOverlayElement(child)) {
          const { points, options } = child.props;
          const overlay = new mapkit.PolygonOverlay(points, options);
          newOverlays.push(overlay);
        }
      });

      // Remove annotations not in new set
      map.annotations.forEach(annotation => {
        if (!newAnnotations.includes(annotation)) {
          map.removeAnnotation(annotation);
        }
      });

      // Remove overlays not in new set
      currentOverlays.forEach(overlay => {
        if (!newOverlays.includes(overlay)) {
          map.removeOverlay(overlay);
        }
      });

      // Add new annotations
      newAnnotations.forEach(annotation => {
        if (!currentAnnotations.has(annotation)) {
          map.addAnnotation(annotation);
        }
      });

      // Add new overlays
      newOverlays.forEach(overlay => {
        if (!currentOverlays.has(overlay)) {
          map.addOverlay(overlay);
        }
      });

      // Setup cluster handling
      map.annotationForCluster = function (clusterAnnotation) {
        const { memberAnnotations } = clusterAnnotation;
        return new mapkit.MarkerAnnotation(clusterAnnotation.coordinate, {
          title: `(${memberAnnotations.length})`,
          glyphText: memberAnnotations.length.toString()
        });
      };

      onChange?.(map, newAnnotations);

      return () => {
        cleanupFunctions.forEach(cleanup => cleanup());
        try {
          map.removeAnnotations(map.annotations);
          map.removeOverlays(map.overlays);
        } catch (error) {
          console.error("Error cleaning up annotations/overlays:", error);
        }
      };
    } catch (err) {
      const error = isMapKitError(err)
        ? err
        : createMapKitError(
          "UNKNOWN_ERROR",
          "Failed to update map annotations/overlays"
        );
      setMapError(error);
      onMapError?.(error);
    }
  }, [isReady, JSON.stringify(annotationsData)]);


  if (isLoading) {
    return loadingComponent as React.ReactElement ?? <div>Loading map...</div>;
  }

  if (mapKitError || mapError) {
    return errorComponent as React.ReactElement ?? (
      <div className="map-error">
        {(mapKitError || mapError)?.message ||
          "An error occurred while loading the map"}
      </div>
    );
  }

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
      className={`map ${className}`}
      style={{ width: "100%", height: "100%" }}
      role="application"
      aria-label="Map"
    />
  );
});

Map.displayName = "Map";

export default Map;