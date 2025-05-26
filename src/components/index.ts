// src/components/index.ts
import React from 'react';
import {
  MarkerAnnotationProps,
  ImageAnnotationProps,
  CustomAnnotationProps,
  CircleOverlayProps,
  PolylineOverlayProps,
  PolygonOverlayProps
} from '../types';
import {
  MARKER_ANNOTATION,
  IMAGE_ANNOTATION,
  CUSTOM_ANNOTATION,
  CIRCLE_OVERLAY,
  POLYLINE_OVERLAY,
  POLYGON_OVERLAY
} from '../utils/type-guards';

// Annotation components
export const MarkerAnnotation: React.FC<MarkerAnnotationProps> = () => null;
MarkerAnnotation.displayName = MARKER_ANNOTATION;

export const ImageAnnotation: React.FC<ImageAnnotationProps> = () => null;  
ImageAnnotation.displayName = IMAGE_ANNOTATION;

export const CustomAnnotation: React.FC<CustomAnnotationProps> = () => null;
CustomAnnotation.displayName = CUSTOM_ANNOTATION;

// Overlay components  
export const CircleOverlay: React.FC<CircleOverlayProps> = () => null;
CircleOverlay.displayName = CIRCLE_OVERLAY;

export const PolylineOverlay: React.FC<PolylineOverlayProps> = () => null;
PolylineOverlay.displayName = POLYLINE_OVERLAY;

export const PolygonOverlay: React.FC<PolygonOverlayProps> = () => null;
PolygonOverlay.displayName = POLYGON_OVERLAY;