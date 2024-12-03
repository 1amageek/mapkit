var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/map.tsx
var map_exports = {};
__export(map_exports, {
  default: () => map_default
});
module.exports = __toCommonJS(map_exports);
var import_react3 = __toESM(require("react"));

// src/context.tsx
var import_react = __toESM(require("react"));
var defaultContextValue = {
  mapkit: null,
  isReady: false,
  isLoading: false,
  error: null,
  load: async () => {
  },
  reset: () => {
  }
};
var MapKitContext = (0, import_react.createContext)(defaultContextValue);
var useMapKit = () => {
  const context = (0, import_react.useContext)(MapKitContext);
  if (!context) {
    throw new Error("useMapKit must be used within a MapKitProvider");
  }
  return context;
};

// src/map.tsx
var import_client = require("react-dom/client");

// src/annotations.tsx
var import_react2 = __toESM(require("react"));
function MarkerAnnotation(props) {
  return null;
}
function ImageAnnotation(props) {
  return null;
}
function CustomAnnotation(props) {
  return null;
}
function CircleOverlay(props) {
  return null;
}
function PolylineOverlay(props) {
  return null;
}
function PolygonOverlay(props) {
  return null;
}
function isMarkerAnnotationElement(element) {
  return import_react2.default.isValidElement(element) && element.type === MarkerAnnotation;
}
function isImageAnnotationElement(element) {
  return import_react2.default.isValidElement(element) && element.type === ImageAnnotation;
}
function isCustomAnnotationElement(element) {
  return import_react2.default.isValidElement(element) && element.type === CustomAnnotation;
}
function isCircleOverlayElement(element) {
  return import_react2.default.isValidElement(element) && element.type === CircleOverlay;
}
function isPolylineOverlayElement(element) {
  return import_react2.default.isValidElement(element) && element.type === PolylineOverlay;
}
function isPolygonOverlayElement(element) {
  return import_react2.default.isValidElement(element) && element.type === PolygonOverlay;
}

// src/map.tsx
var DEFAULT_MAP_OPTIONS = {
  isScrollEnabled: true,
  showsUserLocation: true,
  showsCompass: "Adaptive",
  showsZoomControl: true
};
var Map = (0, import_react3.forwardRef)((props, ref) => {
  const {
    id,
    options = DEFAULT_MAP_OPTIONS,
    children,
    location,
    region,
    onMapError,
    onMapReady,
    className = ""
  } = props;
  const { isReady, isLoading, error, load } = useMapKit();
  const mapRef = (0, import_react3.useRef)(null);
  const containerRef = (0, import_react3.useRef)(null);
  const childrenArray = import_react3.default.Children.toArray(children);
  (0, import_react3.useEffect)(() => {
    load({ onError: onMapError });
  }, [load, onMapError]);
  const annotationsData = (0, import_react3.useMemo)(() => {
    return childrenArray.map((child) => {
      if (import_react3.default.isValidElement(child) && typeof child.type === "function") {
        const { coordinate, ...rest } = child.props;
        return { coordinate };
      }
      return null;
    }).filter(Boolean);
  }, [childrenArray]);
  (0, import_react3.useEffect)(() => {
    if (!isReady || !containerRef.current) return;
    try {
      const map = new window.mapkit.Map(containerRef.current, {
        ...DEFAULT_MAP_OPTIONS,
        ...options
      });
      mapRef.current = map;
      onMapReady == null ? void 0 : onMapReady(map);
      return () => {
        if (mapRef.current) {
          mapRef.current.destroy();
          mapRef.current = null;
        }
      };
    } catch (err) {
      const error2 = err instanceof Error ? err : new Error("Failed to initialize map");
      onMapError == null ? void 0 : onMapError(error2);
    }
  }, [isReady, JSON.stringify(options)]);
  (0, import_react3.useEffect)(() => {
    const map = mapRef.current;
    if (!map) return;
    if (location) {
      const coordinate = new window.mapkit.Coordinate(location.latitude, location.longitude);
      const annotation = new window.mapkit.MarkerAnnotation(coordinate);
      map.showItems([annotation], { animate: true });
    }
    if (region) {
      const mapkitRegion = new window.mapkit.CoordinateRegion(
        new window.mapkit.Coordinate(region.center.latitude, region.center.longitude),
        new window.mapkit.CoordinateSpan(region.span.latitudeDelta, region.span.longitudeDelta)
      );
      map.setRegionAnimated(mapkitRegion, true);
    }
  }, [location, region]);
  (0, import_react3.useEffect)(() => {
    const map = mapRef.current;
    if (!map) return;
    const currentAnnotations = new Set(map.annotations);
    const currentOverlays = new Set(map.overlays);
    const newAnnotations = [];
    const newOverlays = [];
    childrenArray.forEach((child) => {
      if (isMarkerAnnotationElement(child)) {
        const { coordinate, callout, ...options2 } = child.props;
        const annotation = new mapkit.MarkerAnnotation(
          new mapkit.Coordinate(coordinate.latitude, coordinate.longitude),
          options2
        );
        newAnnotations.push(annotation);
      }
      if (isImageAnnotationElement(child)) {
        const { coordinate, callout, ...options2 } = child.props;
        const annotation = new mapkit.ImageAnnotation(
          new mapkit.Coordinate(coordinate.latitude, coordinate.longitude),
          options2
        );
        newAnnotations.push(annotation);
      }
      if (isCustomAnnotationElement(child)) {
        const { coordinate, children: children2, callout, ...options2 } = child.props;
        const annotation = new mapkit.Annotation(
          new mapkit.Coordinate(coordinate.latitude, coordinate.longitude),
          (coordinate2) => {
            const element = document.createElement("div");
            const root = (0, import_client.createRoot)(element);
            root.render(import_react3.default.createElement(import_react3.default.Fragment, null, children2));
            return element;
          },
          options2
        );
        if (callout) {
          annotation.callout = {
            calloutAnchorOffsetForAnnotation: callout.calloutAnchorOffsetForAnnotation,
            calloutShouldAppearForAnnotation: callout.calloutShouldAppearForAnnotation,
            calloutShouldAnimateForAnnotation: callout.calloutShouldAnimateForAnnotation,
            calloutAppearanceAnimationForAnnotation: callout.calloutAppearanceAnimationForAnnotation,
            calloutContentForAnnotation: callout.calloutContentForAnnotation && ((mapAnnotation) => {
              const element = document.createElement("div");
              const root = (0, import_client.createRoot)(element);
              root.render(callout.calloutContentForAnnotation(mapAnnotation));
              return element;
            }),
            calloutElementForAnnotation: callout.calloutElementForAnnotation && ((mapAnnotation) => {
              const element = document.createElement("div");
              const root = (0, import_client.createRoot)(element);
              root.render(callout.calloutElementForAnnotation(mapAnnotation));
              return element;
            }),
            calloutLeftAccessoryForAnnotation: callout.calloutLeftAccessoryForAnnotation && ((mapAnnotation) => {
              const element = document.createElement("div");
              const root = (0, import_client.createRoot)(element);
              root.render(callout.calloutLeftAccessoryForAnnotation(mapAnnotation));
              return element;
            }),
            calloutRightAccessoryForAnnotation: callout.calloutRightAccessoryForAnnotation && ((mapAnnotation) => {
              const element = document.createElement("div");
              const root = (0, import_client.createRoot)(element);
              root.render(callout.calloutRightAccessoryForAnnotation(mapAnnotation));
              return element;
            })
          };
        }
        newAnnotations.push(annotation);
      }
      if (isCircleOverlayElement(child)) {
        const { coordinate, radius, options: options2 } = child.props;
        const overlay = new mapkit.CircleOverlay(coordinate, radius, options2);
        newOverlays.push(overlay);
      }
      if (isPolylineOverlayElement(child)) {
        const { points, options: options2 } = child.props;
        const overlay = new mapkit.PolylineOverlay(points, options2);
        newOverlays.push(overlay);
      }
      if (isPolygonOverlayElement(child)) {
        const { points, options: options2 } = child.props;
        const overlay = new mapkit.PolygonOverlay(points, options2);
        newOverlays.push(overlay);
      }
    });
    map.annotations.forEach((annotation) => {
      if (!newAnnotations.includes(annotation)) {
        map.removeAnnotation(annotation);
      }
    });
    currentOverlays.forEach((overlay) => {
      if (!newOverlays.includes(overlay)) {
        map.removeOverlay(overlay);
      }
    });
    newAnnotations.forEach((annotation) => {
      if (!currentAnnotations.has(annotation)) {
        map.addAnnotation(annotation);
      }
    });
    newOverlays.forEach((overlay) => {
      if (!currentOverlays.has(overlay)) {
        map.addOverlay(overlay);
      }
    });
    map.annotationForCluster = function(clusterAnnotation) {
      const { memberAnnotations } = clusterAnnotation;
      return new mapkit.MarkerAnnotation(clusterAnnotation.coordinate, {
        title: `(${memberAnnotations.length})`,
        glyphText: memberAnnotations.length.toString()
      });
    };
    return () => {
      map.removeAnnotations(map.annotations);
      map.removeOverlays(map.overlays);
    };
  }, [childrenArray, annotationsData]);
  if (isLoading || error || !isReady) {
    return null;
  }
  return /* @__PURE__ */ import_react3.default.createElement(
    "div",
    {
      ref: (el) => {
        if (typeof ref === "function") ref(el);
        else if (ref) ref.current = el;
        containerRef.current = el;
      },
      id,
      className: `map flex w-full h-full relative ${className}`
    }
  );
});
Map.displayName = "Map";
var map_default = Map;
