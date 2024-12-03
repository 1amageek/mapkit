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

// src/annotations.tsx
var annotations_exports = {};
__export(annotations_exports, {
  CircleOverlay: () => CircleOverlay,
  CustomAnnotation: () => CustomAnnotation,
  ImageAnnotation: () => ImageAnnotation,
  MarkerAnnotation: () => MarkerAnnotation,
  PolygonOverlay: () => PolygonOverlay,
  PolylineOverlay: () => PolylineOverlay,
  isCircleOverlayElement: () => isCircleOverlayElement,
  isCustomAnnotationElement: () => isCustomAnnotationElement,
  isImageAnnotationElement: () => isImageAnnotationElement,
  isMarkerAnnotationElement: () => isMarkerAnnotationElement,
  isPolygonOverlayElement: () => isPolygonOverlayElement,
  isPolylineOverlayElement: () => isPolylineOverlayElement
});
module.exports = __toCommonJS(annotations_exports);
var import_react = __toESM(require("react"));
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
  return import_react.default.isValidElement(element) && element.type === MarkerAnnotation;
}
function isImageAnnotationElement(element) {
  return import_react.default.isValidElement(element) && element.type === ImageAnnotation;
}
function isCustomAnnotationElement(element) {
  return import_react.default.isValidElement(element) && element.type === CustomAnnotation;
}
function isCircleOverlayElement(element) {
  return import_react.default.isValidElement(element) && element.type === CircleOverlay;
}
function isPolylineOverlayElement(element) {
  return import_react.default.isValidElement(element) && element.type === PolylineOverlay;
}
function isPolygonOverlayElement(element) {
  return import_react.default.isValidElement(element) && element.type === PolygonOverlay;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  CircleOverlay,
  CustomAnnotation,
  ImageAnnotation,
  MarkerAnnotation,
  PolygonOverlay,
  PolylineOverlay,
  isCircleOverlayElement,
  isCustomAnnotationElement,
  isImageAnnotationElement,
  isMarkerAnnotationElement,
  isPolygonOverlayElement,
  isPolylineOverlayElement
});
