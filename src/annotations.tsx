import React, { ReactNode } from "react"

export interface Location {
  latitude: number
  longitude: number
}

export interface Region {
  center: Location
  span: {
    latitudeDelta: number
    longitudeDelta: number
  }
}

export type AnnotationConstructorOptions = {
  title?: string
  subtitle?: string
  accessibilityLabel?: string
  data?: any
  draggable?: boolean
  visible?: boolean
  enabled?: boolean
  selected?: boolean
  calloutEnabled?: boolean
  animates?: boolean
  appearanceAnimation?: string
  anchorOffset?: DOMPoint
  calloutOffset?: DOMPoint
  callout?: {
    calloutAnchorOffsetForAnnotation?: (annotation: mapkit.Annotation, size: { width: number; height: number }) => DOMPoint
    calloutShouldAppearForAnnotation?: (annotation: mapkit.Annotation) => boolean
    calloutShouldAnimateForAnnotation?: (annotation: mapkit.Annotation) => boolean
    calloutAppearanceAnimationForAnnotation?: (annotation: mapkit.Annotation) => string
    calloutContentForAnnotation?: (annotation: mapkit.Annotation) => ReactNode
    calloutElementForAnnotation?: (annotation: mapkit.Annotation) => ReactNode
    calloutLeftAccessoryForAnnotation?: (annotation: mapkit.Annotation) => ReactNode
    calloutRightAccessoryForAnnotation?: (annotation: mapkit.Annotation) => ReactNode
  }
  size?: { width: number; height: number }
  displayPriority?: number
  collisionMode?: string
  padding?: mapkit.Padding
  clusteringIdentifier?: string
  place?: mapkit.Place
  id?: string
}

export type MarkerAnnotationConstructorOptions = AnnotationConstructorOptions & {
  titleVisibility?: string
  subtitleVisibility?: string
  color?: string
  glyphColor?: string
  glyphText?: string
  glyphImage?: {
    1: string
    2?: string
    3?: string
  }
  selectedGlyphImage?: {
    1: string
    2?: string
    3?: string
  }
}

export type MarkerAnnotationProps = MarkerAnnotationConstructorOptions & {
  coordinate: Location
}

export type ImageAnnotationConstructorOptions = AnnotationConstructorOptions & {
  url: {
    1: string
    2?: string
    3?: string
  }
}

export type ImageAnnotationProps = ImageAnnotationConstructorOptions & {
  coordinate: Location
}

export type CustomAnnotationProps = AnnotationConstructorOptions & {
  coordinate: Location
  children: ReactNode
}

export type CircleOverlayProps = { 
  coordinate: mapkit.Coordinate
  radius: number
  options?: mapkit.StylesOverlayOptions 
}

export type PolylineOverlayProps = { 
  points: mapkit.Coordinate[]
  options?: mapkit.StylesOverlayOptions 
}

export type PolygonOverlayProps = { 
  points: mapkit.Coordinate[]
  options?: mapkit.StylesOverlayOptions 
}

export function MarkerAnnotation(props: MarkerAnnotationProps) {
  return null
}

export function ImageAnnotation(props: ImageAnnotationProps) {
  return null
}

export function CustomAnnotation(props: CustomAnnotationProps) {
  return null
}

export function CircleOverlay(props: CircleOverlayProps) {
  return null
}

export function PolylineOverlay(props: PolylineOverlayProps) {
  return null
}

export function PolygonOverlay(props: PolygonOverlayProps) {
  return null
}

export function isMarkerAnnotationElement(element: React.ReactNode): element is React.ReactElement<MarkerAnnotationProps> {
  return React.isValidElement(element) && element.type === MarkerAnnotation
}

export function isImageAnnotationElement(element: React.ReactNode): element is React.ReactElement<ImageAnnotationProps> {
  return React.isValidElement(element) && element.type === ImageAnnotation
}

export function isCustomAnnotationElement(element: React.ReactNode): element is React.ReactElement<CustomAnnotationProps> {
  return React.isValidElement(element) && element.type === CustomAnnotation
}

export function isCircleOverlayElement(element: React.ReactNode): element is React.ReactElement<CircleOverlayProps> {
  return React.isValidElement(element) && element.type === CircleOverlay
}

export function isPolylineOverlayElement(element: React.ReactNode): element is React.ReactElement<PolylineOverlayProps> {
  return React.isValidElement(element) && element.type === PolylineOverlay
}

export function isPolygonOverlayElement(element: React.ReactNode): element is React.ReactElement<PolygonOverlayProps> {
  return React.isValidElement(element) && element.type === PolygonOverlay
}