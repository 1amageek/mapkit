/* --------------------------------------------------------------------------
 *  src/managers/annotation-manager.ts  – 2025-05-26 final
 * -------------------------------------------------------------------------- */
import React from 'react';
import type {
  MarkerAnnotationProps,
  ImageAnnotationProps,
  CustomAnnotationProps,
  AnnotationEventHandlers
} from '../types';
import {
  isMarkerAnnotationElement,
  isImageAnnotationElement,
  isCustomAnnotationElement
} from '../utils/type-guards';
import { createMapKitError } from '../utils/errors';
import { CleanupManager } from '../utils/memory-management';

/* -------------------------------------------------------------------------- */
/*                                TYPE HELPERS                                */
/* -------------------------------------------------------------------------- */

interface AnnotationData {
  readonly element: React.ReactElement;
  readonly annotation: mapkit.Annotation;
  readonly id: string;
  readonly cleanup: () => void;
}

/* -------------------------------------------------------------------------- */
/*          UTIL – SYNCHRONOUSLY CONVERT ReactNode → DOM (no flushSync)       */
/* -------------------------------------------------------------------------- */

function renderElementSync(node: React.ReactNode, host: HTMLElement): void {
  /* Primitive ------------------------------------------------------------ */
  if (typeof node === 'string' || typeof node === 'number') {
    host.appendChild(document.createTextNode(String(node)));
    return;
  }
  if (node === null || node === undefined) return;

  /* Array ---------------------------------------------------------------- */
  if (Array.isArray(node)) {
    node.forEach(n => renderElementSync(n, host));
    return;
  }

  /* Valid ReactElement --------------------------------------------------- */
  if (React.isValidElement(node)) {
    const el = node as React.ReactElement<any, any>;
    const { type, props } = el;

    /* ---> Fragment / <> ------------------------------------------------- */
    if (type === React.Fragment) {
      renderElementSync(props.children, host);
      return;
    }

    /* ---> Intrinsic HTML element --------------------------------------- */
    if (typeof type === 'string') {
      const dom = document.createElement(type);

      if (props?.className) dom.className = String(props.className);
      if (props?.style && typeof props.style === 'object')
        Object.assign(dom.style, props.style);

      renderElementSync(props?.children, dom);
      host.appendChild(dom);
      return;
    }

    /* ---> Function / Class component (不可) ---------------------------- */
    host.appendChild(
      document.createTextNode('[Component]')
    );
    return;
  }

  /* Fallback ------------------------------------------------------------- */
  host.appendChild(document.createTextNode(String(node)));
}

/* -------------------------------------------------------------------------- */
/*                         ANNOTATION MANAGER  CLASS                          */
/* -------------------------------------------------------------------------- */

export class AnnotationManager {
  private readonly map: mapkit.Map;
  private readonly annotations = new Map<string, AnnotationData>();

  private readonly cleanupManager = new CleanupManager();
  private readonly calloutCache = new Map<string, HTMLElement>();

  private idCounter = 0;

  constructor(map: mapkit.Map) {
    this.map = map;
  }

  /* --------------------------- PUBLIC INTERFACE --------------------------- */

  public updateAnnotations(children: React.ReactNode[]): void {
    const current = new Set(this.annotations.keys());
    const next = new Map<string, React.ReactElement>();

    children.forEach(n => {
      if (this.isAnnotation(n)) next.set(this.getId(n), n);
    });

    current.forEach(id => !next.has(id) && this.remove(id));
    next.forEach((el, id) => {
      const stored = this.annotations.get(id);
      if (!stored) this.add(id, el);
      else if (JSON.stringify(stored.element.props) !== JSON.stringify(el.props))
        this.replace(id, el);
    });
  }

  public setupClusterHandling(): void {
    this.map.annotationForCluster = c =>
      new mapkit.MarkerAnnotation(c.coordinate, {
        glyphText: String(c.memberAnnotations.length)
      });
  }

  public getAnnotations(): readonly mapkit.Annotation[] {
    return Array.from(this.annotations.values()).map(d => d.annotation);
  }

  public cleanup(): void {
    try {
      const anns = Array.from(this.annotations.values()).map(d => d.annotation);
      anns.length && this.map.removeAnnotations(anns);

      this.cleanupManager.cleanup();
      this.annotations.clear();

      this.calloutCache.forEach(el => el.remove());
      this.calloutCache.clear();
    } catch (e) {
      console.warn('[AnnotationManager] cleanup error:', e);
    }
  }

  /* ------------------------------- INTERNAL ------------------------------- */

  private isAnnotation(
    n: React.ReactNode
  ): n is React.ReactElement {
    return (
      isMarkerAnnotationElement(n) ||
      isImageAnnotationElement(n) ||
      isCustomAnnotationElement(n)
    );
  }

  private getId(el: React.ReactElement): string {
    const p: any = el.props;
    return typeof p.id === 'string' ? p.id : `annotation-${this.idCounter++}`;
  }

  /* ------------------------ ADD / REPLACE / REMOVE ------------------------ */

  private add(id: string, el: React.ReactElement) {
    const { annotation, cleanup } = this.createAnnotation(id, el);
    this.map.addAnnotation(annotation);
    this.annotations.set(id, { id, element: el, annotation, cleanup });
    this.cleanupManager.add(cleanup);
  }

  private replace(id: string, el: React.ReactElement) {
    this.remove(id);
    this.add(id, el);
  }

  private remove(id: string) {
    const stored = this.annotations.get(id);
    if (!stored) return;

    this.map.removeAnnotation(stored.annotation);
    stored.cleanup();
    this.cleanupManager.remove(stored.cleanup);
    this.annotations.delete(id);

    const cached = this.calloutCache.get(id);
    if (cached) cached.remove();
    this.calloutCache.delete(id);
  }

  /* --------------------- INDIVIDUAL ANNOTATION BUILD ---------------------- */

  private createAnnotation(id: string, el: React.ReactElement) {
    if (isMarkerAnnotationElement(el)) return this.buildMarker(el);
    if (isImageAnnotationElement(el)) return this.buildImage(el);
    if (isCustomAnnotationElement(el)) return this.buildCustom(id, el);

    throw createMapKitError('VALIDATION_ERROR', 'Unsupported element');
  }

  /* -- Marker ------------------------------------------------------------- */
  private buildMarker(el: React.ReactElement<MarkerAnnotationProps>) {
    const { coordinate, callout, padding, ...opt } = el.props;

    const ann = new mapkit.MarkerAnnotation(
      new mapkit.Coordinate(coordinate.latitude, coordinate.longitude),
      {
        ...opt,
        padding:
          padding &&
          new mapkit.Padding(
            padding.top,
            padding.right,
            padding.bottom,
            padding.left
          )
      }
    );
    if (callout) ann.callout = this.makeDelegate(callout);
    const cleanup = this.bindEvents(ann, el.props);
    return { annotation: ann, cleanup };
  }

  /* -- Image -------------------------------------------------------------- */
  private buildImage(el: React.ReactElement<ImageAnnotationProps>) {
    const { coordinate, callout, padding, ...opt } = el.props;

    const ann = new mapkit.ImageAnnotation(
      new mapkit.Coordinate(coordinate.latitude, coordinate.longitude),
      {
        ...opt,
        padding:
          padding &&
          new mapkit.Padding(
            padding.top,
            padding.right,
            padding.bottom,
            padding.left
          )
      }
    );
    if (callout) ann.callout = this.makeDelegate(callout);
    const cleanup = this.bindEvents(ann, el.props);
    return { annotation: ann, cleanup };
  }

  /* -- Custom ------------------------------------------------------------- */
  private buildCustom(id: string, el: React.ReactElement<CustomAnnotationProps>) {
    const { coordinate, children, callout, padding, ...opt } = el.props;

    const ann = new mapkit.Annotation(
      new mapkit.Coordinate(coordinate.latitude, coordinate.longitude),
      () => {
        const host = document.createElement('div');
        host.style.cssText = 'position:relative;pointer-events:auto;';
        renderElementSync(children, host);
        return host;
      },
      {
        ...opt,
        padding:
          padding &&
          new mapkit.Padding(
            padding.top,
            padding.right,
            padding.bottom,
            padding.left
          )
      }
    );
    if (callout) ann.callout = this.makeDelegate(callout, id);
    const cleanup = this.bindEvents(ann, el.props);
    return { annotation: ann, cleanup };
  }

  /* ------------------------ CALLOUT DELEGATE ------------------------------ */

  private makeDelegate(
    callout: NonNullable<MarkerAnnotationProps['callout']>,
    ownerId?: string
  ): mapkit.AnnotationCalloutDelegate {
    const d: mapkit.AnnotationCalloutDelegate = {};

    if (callout.calloutAnchorOffsetForAnnotation)
      d.calloutAnchorOffsetForAnnotation =
        callout.calloutAnchorOffsetForAnnotation;
    if (callout.calloutShouldAppearForAnnotation)
      d.calloutShouldAppearForAnnotation =
        callout.calloutShouldAppearForAnnotation;
    if (callout.calloutShouldAnimateForAnnotation)
      d.calloutShouldAnimateForAnnotation =
        callout.calloutShouldAnimateForAnnotation;
    if (callout.calloutAppearanceAnimationForAnnotation)
      d.calloutAppearanceAnimationForAnnotation =
        callout.calloutAppearanceAnimationForAnnotation;

    const toDOM =
      (factory: (ann: mapkit.Annotation) => React.ReactNode) =>
        (ann: mapkit.Annotation): HTMLElement => {

          const reactNode = factory(ann);
          const wrapper = document.createElement('div');
          renderElementSync(reactNode, wrapper);

          const container: HTMLElement =
            wrapper.childElementCount === 1
              ? (wrapper.firstElementChild as HTMLElement)
              : wrapper;

          let width: number | undefined;
          let height: number | undefined;

          if (React.isValidElement(reactNode)) {
            const { style } = (reactNode.props as { style?: any });
            if (style) {
              if (typeof style.width === 'number') width = style.width;
              else if (typeof style.width === 'string') width = parseFloat(style.width);
              if (typeof style.height === 'number') height = style.height;
              else if (typeof style.height === 'string') height = parseFloat(style.height);
            }
          }

          if (width === undefined || height === undefined) {
            const rect = container.getBoundingClientRect();
            width ??= rect.width;
            height ??= rect.height;
          }

          container.style.pointerEvents = 'auto';
          container.style.position = container.style.position || 'relative';

          if (width !== undefined) container.style.width = `${width}px`;
          if (height !== undefined) container.style.height = `${height}px`;

          ownerId && this.calloutCache.set(ownerId, container);
          return container;
        };


    if (callout.calloutElementForAnnotation)
      d.calloutElementForAnnotation = toDOM(callout.calloutElementForAnnotation);
    if (callout.calloutContentForAnnotation)
      d.calloutContentForAnnotation = toDOM(callout.calloutContentForAnnotation);
    if (callout.calloutLeftAccessoryForAnnotation)
      d.calloutLeftAccessoryForAnnotation = toDOM(
        callout.calloutLeftAccessoryForAnnotation
      );
    if (callout.calloutRightAccessoryForAnnotation)
      d.calloutRightAccessoryForAnnotation = toDOM(
        callout.calloutRightAccessoryForAnnotation
      );

    return d;
  }

  /* ----------------------------- EVENT BINDINGS --------------------------- */

  private bindEvents(
    annotation: mapkit.Annotation,
    handlers: AnnotationEventHandlers
  ): () => void {
    const disposers: Array<() => void> = [];

    const bind = (
      evt: string,
      fn?: (...args: any[]) => void
    ) => {
      if (!fn) return;
      const wrap = (...args: any[]) => fn(this.map, annotation, ...args);
      (annotation as any).addEventListener(evt, wrap);
      disposers.push(() => (annotation as any).removeEventListener(evt, wrap));
    };

    bind('select', handlers.onSelect);
    bind('deselect', handlers.onDeselect);
    bind('dragging', handlers.onDrag);
    bind('drag-start', handlers.onDragStart);
    bind('drag-end', handlers.onDragEnd);

    return () => disposers.forEach(d => d());
  }
}

/* -------------------------------------------------------------------------- */
/*                               HOOK WRAPPER                                */
/* -------------------------------------------------------------------------- */

export const useAnnotationManager = (map: mapkit.Map | null) => {
  const ref = React.useRef<AnnotationManager | null>(null);

  React.useEffect(() => {
    if (!map) return;
    ref.current = new AnnotationManager(map);
    ref.current.setupClusterHandling();
    return () => {
      ref.current?.cleanup();
      ref.current = null;
    };
  }, [map]);

  return ref.current;
};
