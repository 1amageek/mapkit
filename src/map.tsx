import React, { useEffect, forwardRef, useMemo, useRef, useState, ForwardedRef } from "react"
import { useMapKit } from "./context"
import { createRoot } from "react-dom/client"
import { MapKitError, createMapKitError, isMapKitError } from "./errors"
import {
  Location,
  Region,
  isMarkerAnnotationElement,
  isImageAnnotationElement,
  isCustomAnnotationElement,
  isCircleOverlayElement,
  isPolylineOverlayElement,
  isPolygonOverlayElement,
  AnnotationEventHandlers
} from "./annotations"

export interface MapProps {
  id?: string
  options?: mapkit.MapConstructorOptions
  children?: React.ReactNode
  location?: Location | null
  region?: Region | null
  onMapError?: (error: Error | MapKitError) => void
  onAppear?: (map: mapkit.Map) => void
  className?: string
  loadingComponent?: React.ReactNode
  errorComponent?: React.ReactNode
}

const DEFAULT_MAP_OPTIONS: mapkit.MapConstructorOptions = {
  isScrollEnabled: true,
  showsUserLocation: true,
  showsCompass: "Adaptive",
  showsZoomControl: true
}

const Map = forwardRef(function Map(
  {
    id,
    options = DEFAULT_MAP_OPTIONS,
    children,
    location,
    region,
    onMapError,
    onAppear,
    className = "",
    loadingComponent,
    errorComponent
  }: MapProps,
  ref: ForwardedRef<HTMLDivElement>
): React.ReactElement | null {
  const { isReady, isLoading, error: mapKitError, load } = useMapKit()
  const mapRef = useRef<mapkit.Map | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [mapError, setMapError] = useState<Error | MapKitError | null>(null)
  const childrenArray = React.Children.toArray(children)

  useEffect(() => {
    const handleError = (error: Error | MapKitError) => {
      setMapError(error)
      onMapError?.(error)

      if (mapRef.current) {
        try {
          mapRef.current.destroy()
        } catch (cleanupError) {
          console.error('Error during map cleanup:', cleanupError)
        }
        mapRef.current = null
      }
    }

    load(handleError)
  }, [load, onMapError])

  function hasCoordinate(props: any): props is { coordinate: mapkit.Coordinate } {
    return props && typeof props.coordinate === "object";
  }

  const annotationsData = useMemo(() => {
    return childrenArray
      .map(child => {
        if (React.isValidElement(child) && typeof child.type === "function" && hasCoordinate(child.props)) {
          const { coordinate, ...rest } = child.props;
          return { coordinate };
        }
        return null;
      })
      .filter(Boolean) as Array<{ coordinate: mapkit.Coordinate }>;
  }, [childrenArray]);

  useEffect(() => {
    if (!isReady || !containerRef.current) return

    try {
      if (!window.mapkit) {
        throw createMapKitError('NOT_LOADED')
      }

      const map = new window.mapkit.Map(containerRef.current, {
        ...DEFAULT_MAP_OPTIONS,
        ...options
      })

      mapRef.current = map
      onAppear?.(map)

      return () => {
        if (mapRef.current) {
          try {
            mapRef.current.destroy()
          } catch (error) {
            console.error('Error destroying map:', error)
          }
          mapRef.current = null
        }
      }
    } catch (err) {
      const error = isMapKitError(err) ? err : createMapKitError(
        'INIT_ERROR',
        err instanceof Error ? err.message : 'Failed to initialize map'
      )
      setMapError(error)
      onMapError?.(error)
    }
  }, [isReady, JSON.stringify(options)])

  useEffect(() => {
    if (!isReady) return
    const map = mapRef.current
    if (!map) return
    try {
      if (location) {
        const coordinate = new window.mapkit.Coordinate(location.latitude, location.longitude)
        const annotation = new window.mapkit.MarkerAnnotation(coordinate)
        map.showItems([annotation], { animate: true })
      }

      if (region) {
        const mapkitRegion = new window.mapkit.CoordinateRegion(
          new window.mapkit.Coordinate(region.center.latitude, region.center.longitude),
          new window.mapkit.CoordinateSpan(region.span.latitudeDelta, region.span.longitudeDelta)
        )
        map.setRegionAnimated(mapkitRegion, true)
      }
    } catch (err) {
      const error = isMapKitError(err) ? err : createMapKitError(
        'UNKNOWN_ERROR',
        'Failed to update map location/region'
      )
      setMapError(error)
      onMapError?.(error)
    }
  }, [isReady, location, region])

  const annotationEventHandle = (annotation: mapkit.Annotation, handler: AnnotationEventHandlers) => {
    const cleanupFns: (() => void)[] = [];
    const { onSelect, onDeselect, onDrag, onDragStart, onDragEnd } = handler;

    if (onSelect) {
      annotation.addEventListener("select", onSelect);
      cleanupFns.push(() => annotation.removeEventListener("select", onSelect));
    }
    if (onDeselect) {
      annotation.addEventListener("deselect", onDeselect);
      cleanupFns.push(() => annotation.removeEventListener("deselect", onDeselect));
    }
    if (onDrag) {
      annotation.addEventListener("dragging", onDrag);
      cleanupFns.push(() => annotation.removeEventListener("dragging", onDrag));
    }
    if (onDragStart) {
      annotation.addEventListener("drag-start", onDragStart);
      cleanupFns.push(() => annotation.removeEventListener("drag-start", onDragStart));
    }
    if (onDragEnd) {
      annotation.addEventListener("drag-end", onDragEnd);
      cleanupFns.push(() => annotation.removeEventListener("drag-end", onDragEnd));
    }
    return () => cleanupFns.forEach(cleanup => cleanup());
  };

  useEffect(() => {
    if (!isReady) return
    const map = mapRef.current
    if (!map) return
    const cleanupFunctions: (() => void)[] = [];
    try {
      const currentAnnotations = new Set(map.annotations)
      const currentOverlays = new Set(map.overlays)

      const newAnnotations: mapkit.Annotation[] = []
      const newOverlays: mapkit.Overlay[] = []

      childrenArray.forEach((child) => {
        if (isMarkerAnnotationElement(child)) {
          const { coordinate, callout, ...options } = child.props
          const annotation = new mapkit.MarkerAnnotation(
            new mapkit.Coordinate(coordinate.latitude, coordinate.longitude),
            options
          )
          const cleanup = annotationEventHandle(annotation, child.props);
          cleanupFunctions.push(cleanup);
          newAnnotations.push(annotation)
        }

        if (isImageAnnotationElement(child)) {
          const { coordinate, callout, ...options } = child.props
          const annotation = new mapkit.ImageAnnotation(
            new mapkit.Coordinate(coordinate.latitude, coordinate.longitude),
            options
          )
          annotationEventHandle(annotation, child.props)
          const cleanup = annotationEventHandle(annotation, child.props);
          cleanupFunctions.push(cleanup);
          newAnnotations.push(annotation)
        }

        if (isCustomAnnotationElement(child)) {
          const { coordinate, children, callout, ...options } = child.props
          const annotation = new mapkit.Annotation(
            new mapkit.Coordinate(coordinate.latitude, coordinate.longitude),
            (coordinate: mapkit.Coordinate) => {
              const element = document.createElement("div")
              const root = createRoot(element)
              root.render(React.createElement(React.Fragment, null, children))
              return element
            },
            options
          )
          if (callout) {
            annotation.callout = {
              calloutAnchorOffsetForAnnotation: callout.calloutAnchorOffsetForAnnotation,
              calloutShouldAppearForAnnotation: callout.calloutShouldAppearForAnnotation,
              calloutShouldAnimateForAnnotation: callout.calloutShouldAnimateForAnnotation,
              calloutAppearanceAnimationForAnnotation: callout.calloutAppearanceAnimationForAnnotation,
              calloutContentForAnnotation: callout.calloutContentForAnnotation && ((mapAnnotation) => {
                const element = document.createElement("div")
                const root = createRoot(element)
                root.render(callout.calloutContentForAnnotation!(mapAnnotation))
                return element
              }),
              calloutElementForAnnotation: callout.calloutElementForAnnotation && ((mapAnnotation) => {
                const element = document.createElement("div")
                const root = createRoot(element)
                root.render(callout.calloutElementForAnnotation!(mapAnnotation))
                return element
              }),
              calloutLeftAccessoryForAnnotation: callout.calloutLeftAccessoryForAnnotation && ((mapAnnotation) => {
                const element = document.createElement("div")
                const root = createRoot(element)
                root.render(callout.calloutLeftAccessoryForAnnotation!(mapAnnotation))
                return element
              }),
              calloutRightAccessoryForAnnotation: callout.calloutRightAccessoryForAnnotation && ((mapAnnotation) => {
                const element = document.createElement("div")
                const root = createRoot(element)
                root.render(callout.calloutRightAccessoryForAnnotation!(mapAnnotation))
                return element
              })
            }
          }
          const cleanup = annotationEventHandle(annotation, child.props);
          cleanupFunctions.push(cleanup);
          newAnnotations.push(annotation)
        }

        if (isCircleOverlayElement(child)) {
          const { coordinate, radius, options } = child.props
          const overlay = new mapkit.CircleOverlay(coordinate, radius, options)
          newOverlays.push(overlay)
        }

        if (isPolylineOverlayElement(child)) {
          const { points, options } = child.props
          const overlay = new mapkit.PolylineOverlay(points, options)
          newOverlays.push(overlay)
        }

        if (isPolygonOverlayElement(child)) {
          const { points, options } = child.props
          const overlay = new mapkit.PolygonOverlay(points, options)
          newOverlays.push(overlay)
        }
      })

      // Remove annotations not in new set
      map.annotations.forEach(annotation => {
        if (!newAnnotations.includes(annotation)) {
          map.removeAnnotation(annotation)
        }
      })

      // Remove overlays not in new set
      currentOverlays.forEach(overlay => {
        if (!newOverlays.includes(overlay)) {
          map.removeOverlay(overlay)
        }
      })

      // Add new annotations
      newAnnotations.forEach(annotation => {
        if (!currentAnnotations.has(annotation)) {
          map.addAnnotation(annotation)
        }
      })

      // Add new overlays
      newOverlays.forEach(overlay => {
        if (!currentOverlays.has(overlay)) {
          map.addOverlay(overlay)
        }
      })

      // Setup cluster handling
      map.annotationForCluster = function (clusterAnnotation) {
        const { memberAnnotations } = clusterAnnotation
        return new mapkit.MarkerAnnotation(clusterAnnotation.coordinate, {
          title: `(${memberAnnotations.length})`,
          glyphText: memberAnnotations.length.toString()
        })
      }

      return () => {
        cleanupFunctions.forEach(cleanup => cleanup());
        try {
          map.removeAnnotations(map.annotations)
          map.removeOverlays(map.overlays)
        } catch (error) {
          console.error('Error cleaning up annotations/overlays:', error)
        }
      }
    } catch (err) {
      const error = isMapKitError(err) ? err : createMapKitError(
        'UNKNOWN_ERROR',
        'Failed to update map annotations/overlays'
      )
      setMapError(error)
      onMapError?.(error)
    }
  }, [isReady, childrenArray, annotationsData])

  if (isLoading) {
    return loadingComponent as React.ReactElement ?? <div>Loading map...</div>
  }

  if (mapKitError || mapError) {
    return errorComponent as React.ReactElement ?? (
      <div className="map-error">
        {(mapKitError || mapError)?.message || 'An error occurred while loading the map'}
      </div>
    )
  }

  if (!isReady) {
    return null
  }

  return (
    <div
      ref={el => {
        if (typeof ref === "function") ref(el)
        else if (ref) ref.current = el
        containerRef.current = el
      }}
      id={id}
      className={`map ${className}`}
      style={{ width: "100%", height: "100%" }}
      role="application"
      aria-label="Map"
    />
  )
})

Map.displayName = "Map"

export default Map