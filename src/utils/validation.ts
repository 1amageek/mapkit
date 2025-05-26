// src/utils/validation.ts
import { Coordinate, Region, Padding } from '../types';

export const isValidCoordinate = (coord: unknown): coord is Coordinate => {
  return (
    typeof coord === 'object' &&
    coord !== null &&
    'latitude' in coord &&
    'longitude' in coord &&
    typeof (coord as Coordinate).latitude === 'number' &&
    typeof (coord as Coordinate).longitude === 'number' &&
    (coord as Coordinate).latitude >= -90 &&
    (coord as Coordinate).latitude <= 90 &&
    (coord as Coordinate).longitude >= -180 &&
    (coord as Coordinate).longitude <= 180
  );
};

export const isValidRegion = (region: unknown): region is Region => {
  return (
    typeof region === 'object' &&
    region !== null &&
    'center' in region &&
    'span' in region &&
    isValidCoordinate((region as Region).center) &&
    typeof (region as Region).span === 'object' &&
    (region as Region).span !== null &&
    'latitudeDelta' in (region as Region).span &&
    'longitudeDelta' in (region as Region).span &&
    typeof (region as Region).span.latitudeDelta === 'number' &&
    typeof (region as Region).span.longitudeDelta === 'number' &&
    (region as Region).span.latitudeDelta > 0 &&
    (region as Region).span.longitudeDelta > 0
  );
};

export const isValidPadding = (padding: unknown): padding is Padding => {
  if (typeof padding !== 'object' || padding === null) return false;
  
  const p = padding as Padding;
  return (
    (p.top === undefined || (typeof p.top === 'number' && p.top >= 0)) &&
    (p.right === undefined || (typeof p.right === 'number' && p.right >= 0)) &&
    (p.bottom === undefined || (typeof p.bottom === 'number' && p.bottom >= 0)) &&
    (p.left === undefined || (typeof p.left === 'number' && p.left >= 0))
  );
};