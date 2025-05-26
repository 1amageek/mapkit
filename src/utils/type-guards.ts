// src/utils/type-guards.ts
import React from 'react';
import {
  MarkerAnnotationProps,
  ImageAnnotationProps,
  CustomAnnotationProps,
  CircleOverlayProps,
  PolylineOverlayProps,
  PolygonOverlayProps,
  AnyAnnotationProps
} from '../types';

// Component type constants for comparison
export const MARKER_ANNOTATION = 'MarkerAnnotation';
export const IMAGE_ANNOTATION = 'ImageAnnotation';
export const CUSTOM_ANNOTATION = 'CustomAnnotation';
export const CIRCLE_OVERLAY = 'CircleOverlay';
export const POLYLINE_OVERLAY = 'PolylineOverlay';
export const POLYGON_OVERLAY = 'PolygonOverlay';

export const isAnnotationElement = (
  element: React.ReactNode
): element is React.ReactElement<AnyAnnotationProps> => {
  return (
    isMarkerAnnotationElement(element) ||
    isImageAnnotationElement(element) ||
    isCustomAnnotationElement(element)
  );
};

export const isMarkerAnnotationElement = (
  element: React.ReactNode
): element is React.ReactElement<MarkerAnnotationProps> => {
  return (
    React.isValidElement(element) && 
    (element.type as any)?.displayName === MARKER_ANNOTATION
  );
};

export const isImageAnnotationElement = (
  element: React.ReactNode
): element is React.ReactElement<ImageAnnotationProps> => {
  return (
    React.isValidElement(element) && 
    (element.type as any)?.displayName === IMAGE_ANNOTATION
  );
};

export const isCustomAnnotationElement = (
  element: React.ReactNode
): element is React.ReactElement<CustomAnnotationProps> => {
  return (
    React.isValidElement(element) && 
    (element.type as any)?.displayName === CUSTOM_ANNOTATION
  );
};

export const isCircleOverlayElement = (
  element: React.ReactNode
): element is React.ReactElement<CircleOverlayProps> => {
  return (
    React.isValidElement(element) && 
    (element.type as any)?.displayName === CIRCLE_OVERLAY
  );
};

export const isPolylineOverlayElement = (
  element: React.ReactNode
): element is React.ReactElement<PolylineOverlayProps> => {
  return (
    React.isValidElement(element) && 
    (element.type as any)?.displayName === POLYLINE_OVERLAY
  );
};

export const isPolygonOverlayElement = (
  element: React.ReactNode
): element is React.ReactElement<PolygonOverlayProps> => {
  return (
    React.isValidElement(element) && 
    (element.type as any)?.displayName === POLYGON_OVERLAY
  );
};