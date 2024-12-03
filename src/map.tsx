import React, { useEffect, forwardRef, useMemo, useRef } from "react"
import { useMapKit } from "./context"
import { createRoot } from "react-dom/client"
import {
  Location,
  Region,
  isMarkerAnnotationElement,
  isImageAnnotationElement,
  isCustomAnnotationElement,
  isCircleOverlayElement,
  isPolylineOverlayElement,
  isPolygonOverlayElement
} from "./annotations"

interface MapProps {
  id?: string
  options?: mapkit.MapConstructorOptions
  children?: React.ReactNode
  location?: Location | null
  region?: Region | null
  onMapError?: (error: Error) => void
  onMapReady?: (map: mapkit.Map) => void
  className?: string
}

const DEFAULT_MAP_OPTIONS: mapkit.MapConstructorOptions = {
  isScrollEnabled: true,
  showsUserLocation: true,
  showsCompass: "Adaptive",
  showsZoomControl: true
}

const Map = forwardRef<HTMLDivElement, MapProps>((props, ref) => {
  const {
    id,
    options = DEFAULT_MAP_OPTIONS,
    children,
    location,
    region,
    onMapError,
    onMapReady,
    className = ''
  } = props


  const { isReady, isLoading, error, load } = useMapKit()
  const mapRef = useRef<mapkit.Map | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  const childrenArray = React.Children.toArray(children)

  useEffect(() => {
    load({ onError: onMapError })
  }, [load, onMapError])

  const annotationsData = useMemo(() => {
    return childrenArray
      .map(child => {
        if (React.isValidElement(child) && typeof child.type === "function") {
          const { coordinate, ...rest } = child.props
          return { coordinate }
        }
        return null
      })
      .filter(Boolean)
  }, [childrenArray])

  useEffect(() => {
    if (!isReady || !containerRef.current) return

    try {
      const map = new window.mapkit.Map(containerRef.current, {
        ...DEFAULT_MAP_OPTIONS,
        ...options
      })
      
      mapRef.current = map
      onMapReady?.(map)

      return () => {
        if (mapRef.current) {
          mapRef.current.destroy()
          mapRef.current = null
        }
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to initialize map")
      onMapError?.(error)
    }
  }, [isReady, JSON.stringify(options)])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

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
  }, [location, region])

  useEffect(() => {
    const map = mapRef.current
    if (!map) return

    // Store current annotations and overlays
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
        newAnnotations.push(annotation)
      }

      if (isImageAnnotationElement(child)) {
        const { coordinate, callout, ...options } = child.props
        const annotation = new mapkit.ImageAnnotation(
          new mapkit.Coordinate(coordinate.latitude, coordinate.longitude),
          options
        )
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

    // Update annotations
    map.annotations.forEach(annotation => {
      if (!newAnnotations.includes(annotation)) {
        map.removeAnnotation(annotation)
      }
    })

    // Update overlays
    currentOverlays.forEach(overlay => {
      if (!newOverlays.includes(overlay)) {
        map.removeOverlay(overlay)
      }
    })

    // Add new items
    newAnnotations.forEach(annotation => {
      if (!currentAnnotations.has(annotation)) {
        map.addAnnotation(annotation)
      }
    })

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
      map.removeAnnotations(map.annotations)
      map.removeOverlays(map.overlays)
    }
  }, [childrenArray, annotationsData])

  if (isLoading || error || !isReady) {
    return null
  }

  return (
    <div 
      ref={el => {
        if (typeof ref === 'function') ref(el)
        else if (ref) ref.current = el
        containerRef.current = el
      }}
      id={id}
      className={`map flex w-full h-full relative ${className}`}
    />
  )
})

Map.displayName = "Map"

export default Map