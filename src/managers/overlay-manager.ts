// src/managers/overlay-manager.ts - より型安全な版
import React from 'react';
import { 
  CircleOverlayProps, 
  PolylineOverlayProps, 
  PolygonOverlayProps,
  MapKitError,
  AnyOverlayProps
} from '../types';
import { 
  isCircleOverlayElement,
  isPolylineOverlayElement,
  isPolygonOverlayElement
} from '../utils/type-guards';
import { createMapKitError } from '../utils/errors';
import { CleanupManager } from '../utils/memory-management';

interface OverlayData {
  readonly element: React.ReactElement<AnyOverlayProps>;
  readonly overlay: mapkit.Overlay;
  readonly id: string;
}

export class OverlayManager {
  private map: mapkit.Map;
  private overlays = new Map<string, OverlayData>();
  private cleanupManager = new CleanupManager();
  private idCounter = 0;

  constructor(map: mapkit.Map) {
    this.map = map;
  }

  public updateOverlays(children: React.ReactNode[]): void {
    try {
      const currentOverlays = new Set(this.overlays.keys());
      const newOverlays = new Map<string, React.ReactElement<AnyOverlayProps>>();

      // Collect new overlays
      children.forEach(child => {
        if (this.isOverlayElement(child)) {
          const id = this.getElementId(child);
          newOverlays.set(id, child);
        }
      });

      // Remove overlays that are no longer present
      currentOverlays.forEach(id => {
        if (!newOverlays.has(id)) {
          this.removeOverlay(id);
        }
      });

      // Add or update overlays
      newOverlays.forEach((element, id) => {
        const existingData = this.overlays.get(id);
        
        if (!existingData) {
          this.addOverlay(id, element);
        } else if (this.shouldUpdateOverlay(existingData.element, element)) {
          this.updateOverlay(id, element);
        }
      });

    } catch (error) {
      throw createMapKitError(
        "UNKNOWN_ERROR",
        "Failed to update overlays",
        error as Error
      );
    }
  }

  private isOverlayElement(element: React.ReactNode): element is React.ReactElement<AnyOverlayProps> {
    return (
      isCircleOverlayElement(element) ||
      isPolylineOverlayElement(element) ||
      isPolygonOverlayElement(element)
    );
  }

  private getElementId(element: React.ReactElement<AnyOverlayProps>): string {
    // 型安全な方法でpropsにアクセス
    const hasId = (props: any): props is { id: string } => {
      return props && typeof props.id === 'string';
    };

    if (hasId(element.props)) {
      return element.props.id;
    }

    return `overlay-${this.idCounter++}`;
  }

  private shouldUpdateOverlay(
    oldElement: React.ReactElement<AnyOverlayProps>,
    newElement: React.ReactElement<AnyOverlayProps>
  ): boolean {
    return JSON.stringify(oldElement.props) !== JSON.stringify(newElement.props);
  }

  private addOverlay(id: string, element: React.ReactElement<AnyOverlayProps>): void {
    let overlay: mapkit.Overlay;

    if (isCircleOverlayElement(element)) {
      overlay = this.createCircleOverlay(element);
    } else if (isPolylineOverlayElement(element)) {
      overlay = this.createPolylineOverlay(element);
    } else if (isPolygonOverlayElement(element)) {
      overlay = this.createPolygonOverlay(element);
    } else {
      throw createMapKitError("VALIDATION_ERROR", "Invalid overlay element");
    }

    this.map.addOverlay(overlay);
    
    const overlayData: OverlayData = {
      element,
      overlay,
      id
    };
    
    this.overlays.set(id, overlayData);
  }

  private updateOverlay(id: string, element: React.ReactElement<AnyOverlayProps>): void {
    this.removeOverlay(id);
    this.addOverlay(id, element);
  }

  private removeOverlay(id: string): void {
    const overlayData = this.overlays.get(id);
    if (!overlayData) return;

    try {
      this.map.removeOverlay(overlayData.overlay);
      this.overlays.delete(id);
    } catch (error) {
      console.warn(`Failed to remove overlay ${id}:`, error);
    }
  }

  private createCircleOverlay(element: React.ReactElement<CircleOverlayProps>): mapkit.CircleOverlay {
    const { coordinate, radius, options } = element.props;
    
    return new mapkit.CircleOverlay(
      new mapkit.Coordinate(coordinate.latitude, coordinate.longitude),
      radius,
      options
    );
  }

  private createPolylineOverlay(element: React.ReactElement<PolylineOverlayProps>): mapkit.PolylineOverlay {
    const { points, options } = element.props;
    
    return new mapkit.PolylineOverlay(
      points.map(point => new mapkit.Coordinate(point.latitude, point.longitude)),
      options
    );
  }

  private createPolygonOverlay(element: React.ReactElement<PolygonOverlayProps>): mapkit.PolygonOverlay {
    const { points, options } = element.props;
    
    const coordinates = Array.isArray(points[0])
      ? (points as readonly (readonly import('../types').Coordinate[])[]).map(pointArray =>
          pointArray.map(point => new mapkit.Coordinate(point.latitude, point.longitude))
        )
      : (points as readonly import('../types').Coordinate[]).map(point => 
          new mapkit.Coordinate(point.latitude, point.longitude)
        );
    
    return new mapkit.PolygonOverlay(coordinates, options);
  }

  public getOverlays(): readonly mapkit.Overlay[] {
    return Array.from(this.overlays.values()).map(data => data.overlay);
  }

  public cleanup(): void {
    try {
      // Remove all overlays from map
      const overlaysToRemove = Array.from(this.overlays.values())
        .map(data => data.overlay);
      
      if (overlaysToRemove.length > 0) {
        this.map.removeOverlays(overlaysToRemove);
      }

      // Cleanup all resources
      this.cleanupManager.cleanup();
      this.overlays.clear();
    } catch (error) {
      console.warn('Error during overlay manager cleanup:', error);
    }
  }
}

// Hook for using overlay manager
export const useOverlayManager = (map: mapkit.Map | null) => {
  const managerRef = React.useRef<OverlayManager | null>(null);

  React.useEffect(() => {
    if (!map) return;

    managerRef.current = new OverlayManager(map);

    return () => {
      managerRef.current?.cleanup();
      managerRef.current = null;
    };
  }, [map]);

  return managerRef.current;
};