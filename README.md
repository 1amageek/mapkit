# @1amageek/mapkit

A React wrapper for Apple's MapKit JS, providing a seamless way to integrate Apple Maps into your React applications.

## Features

- 🗺️ Full TypeScript support
- 🔄 React component lifecycle integration
- 📍 Support for markers, custom annotations, and overlays
- 🎨 Customizable map styling and controls
- 🔒 Automatic token management and refresh
- 🎯 Built-in error handling
- 💫 Smooth animations and transitions
- 🖱️ Comprehensive event handling for map interactions, annotations, and user location

## Installation

```bash
npm install @1amageek/mapkit
```

## Prerequisites

You'll need:
1. An Apple Developer account
2. A Maps ID from the Apple Developer portal
3. A token generation endpoint in your backend

## Basic Usage

First, wrap your application with the `MapKitProvider`:

```tsx
import { MapKitProvider } from '@1amageek/mapkit';

const App = () => {
  const fetchToken = async () => {
    // Fetch your MapKit JS token from your server
    const response = await fetch('your-token-endpoint');
    const data = await response.json();
    return {
      token: data.token,
      expiresAt: data.expiresAt // Unix timestamp in seconds
    };
  };

  return (
    <MapKitProvider 
      fetchToken={fetchToken}
      options={{
        language: 'en'
      }}
    >
      <YourApp />
    </MapKitProvider>
  );
};
```

Then use the Map component:

```tsx
import { Map, MarkerAnnotation } from '@1amageek/mapkit';
```

## Event Handling

The library supports a wide range of events for the map, annotations, and user location:

### Map Events
The `Map` component emits various events related to map display and interaction:
- `onRegionChangeStart`: Triggered when the map region starts changing.
- `onRegionChangeEnd`: Triggered when the map region finishes changing.
- `onRotationStart`: Triggered when the map starts rotating.
- `onRotationEnd`: Triggered when the map finishes rotating.
- `onScrollStart`: Triggered when the map starts scrolling.
- `onScrollEnd`: Triggered when the map finishes scrolling.
- `onZoomStart`: Triggered when the map starts zooming.
- `onZoomEnd`: Triggered when the map finishes zooming.
- `onMapTypeChange`: Triggered when the map type changes (e.g., from satellite to standard).
- `onSingleTap`: Triggered when the map is tapped once.
- `onDoubleTap`: Triggered when the map is double-tapped.
- `onLongPress`: Triggered when the map is long-pressed.

### Annotation Events

- `onSelect`: Triggered when an annotation is selected
- `onDeselect`: Triggered when an annotation is deselected
- `onDrag`: Triggered while an annotation is being dragged, providing real-time updates.
- `onDragStart`: Triggered when starting to drag an annotation
- `onDragEnd`: Triggered when finishing dragging an annotation

### User Location Events
- `onUserLocationChange`: Triggered when the user's location changes. Provides the new coordinate and timestamp.
- `onUserLocationError`: Triggered when an error occurs while trying to retrieve the user's location.

Example usage with events:

```tsx
import { Map, MarkerAnnotation } from '@1amageek/mapkit';

const MapComponent = () => {

  return (
    <Map
      id="my-map"
      options={{
        showsUserLocation: true,
        showsCompass: "Adaptive",
      }}
      onRegionChangeStart={(event: mapkit.EventBase<mapkit.Map>) => {
        console.log("Region change start", event);
      }}
      onRegionChangeEnd={(event: mapkit.EventBase<mapkit.Map>) => {
        console.log("Region change end", event);
      }}
      region={{
        center: {
          latitude: 35.6812,
          longitude: 139.7671
        },
        span: {
          latitudeDelta: 0.1,
          longitudeDelta: 0.1
        }
      }}
    >
      <MarkerAnnotation
        coordinate={{
          latitude: 35.6812,
          longitude: 139.7671
        }}
        title="Tokyo Tower"
        subtitle="Tourist Attraction"
      />
    </Map>
  );
};
```

## Event Types

```typescript
interface AnnotationEventHandlers {
  onSelect?: (event: mapkit.EventBase<mapkit.Map>) => void;
  onDeselect?: (event: mapkit.EventBase<mapkit.Map>) => void;
  onDrag?: (event: mapkit.EventBase<mapkit.Map>) => void;
  onDragStart?: (event: mapkit.EventBase<mapkit.Map>) => void;
  onDragEnd?: (event: mapkit.EventBase<mapkit.Map>) => void;
}
```

## Usage Examples

### Basic Marker Annotation with Events

```tsx
<Map>
  <MarkerAnnotation
    coordinate={{
      latitude: 35.6812,
      longitude: 139.7671
    }}
    title="Tokyo Tower"
    subtitle="Tourist Attraction"
    draggable={true}
    onSelect={(event) => {
      // Event when user clicks/taps the annotation
      const annotation = event.target;
      console.log('Selected:', annotation.title);
      console.log('At coordinate:', annotation.coordinate);
    }}
    onDrag={(event) => {
      // Real-time coordinate updates during drag
      console.log('Current position:', event.coordinate);
    }}
    onDragEnd={(event) => {
      // Final location after drag ends
      const { latitude, longitude } = event.coordinate;
      console.log('Final position:', { latitude, longitude });
    }}
  />
</Map>
```

### Custom Annotation with Complex Interaction

```tsx
<Map>
  <CustomAnnotation
    coordinate={{
      latitude: 35.6812,
      longitude: 139.7671
    }}
    draggable={true}
    onSelect={(event) => {
      // Access to DOM event and screen coordinates
      console.log('Click position:', event.pointOnPage);
      console.log('DOM event:', event.domEvent);
    }}
    callout={{
      calloutContentForAnnotation: (annotation) => (
        <div className="custom-callout">
          <h3>{annotation.title}</h3>
          <button onClick={() => handleCalloutAction(annotation)}>
            Details
          </button>
        </div>
      )
    }}
  >
    <div className="custom-marker">
      {/* Your custom marker content */}
    </div>
  </CustomAnnotation>
</Map>
```

### Multiple Annotations with Shared Event Handler

```tsx
const MapWithAnnotations = () => {
  const handleAnnotationSelect = (event: mapkit.EventBase<mapkit.Map>) => {
    // Common handler for all annotations
    const { title, data } = event.target;
    console.log('Selected location:', title);
    console.log('Custom data:', data);
  };

  return (
    <Map>
      {locations.map((location) => (
        <MarkerAnnotation
          key={location.id}
          coordinate={location.coordinate}
          title={location.name}
          data={location.customData}
          onSelect={handleAnnotationSelect}
        />
      ))}
    </Map>
  );
};
```

### Image Annotation with Clustering

```tsx
<Map>
  <ImageAnnotation
    coordinate={{
      latitude: 35.6812,
      longitude: 139.7671
    }}
    url={{
      1: "path/to/image.png",
      2: "path/to/image@2x.png",
      3: "path/to/image@3x.png"
    }}
    clusteringIdentifier="landmarks"
    onSelect={(event) => {
      if (event.target.memberAnnotations) {
        // This is a cluster
        console.log('Cluster size:', event.target.memberAnnotations.length);
      } else {
        // Single annotation
        console.log('Selected image annotation');
      }
    }}
  />
</Map>
```

These event handlers are available for all annotation types (`MarkerAnnotation`, `ImageAnnotation`, `CustomAnnotation`).

# Advanced Features

### Custom Annotations

Create custom annotations with your own React components:

```tsx
import { CustomAnnotation } from '@1amageek/mapkit';

const CustomPin = () => (
  <CustomAnnotation
    coordinate={{
      latitude: 35.6812,
      longitude: 139.7671
    }}
  >
    <div className="custom-pin">
      <img src="pin-icon.png" alt="Custom Pin" />
    </div>
  </CustomAnnotation>
);
```

### Overlays

Add various types of overlays to your map:

```tsx
import { CircleOverlay, PolylineOverlay, PolygonOverlay } from '@1amageek/mapkit';

const MapWithOverlays = () => (
  <Map>
    <CircleOverlay
      coordinate={{ latitude: 35.6812, longitude: 139.7671 }}
      radius={1000}
      options={{
        strokeColor: "#FF0000",
        lineWidth: 2,
        fillColor: "#FF000033"
      }}
    />
    <PolylineOverlay
      points={[
        { latitude: 35.6812, longitude: 139.7671 },
        { latitude: 35.6813, longitude: 139.7672 }
      ]}
      options={{
        strokeColor: "#0000FF",
        lineWidth: 3
      }}
    />
  </Map>
);
```

### Error Handling

The library provides built-in error handling:

```tsx
const MapComponent = () => (
  <Map
    onMapError={(error) => {
      console.error('Map error:', error);
    }}
    errorComponent={<div>Failed to load map</div>}
    loadingComponent={<div>Loading map...</div>}
  />
);
```

## API Reference

### MapKitProvider Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| fetchToken | () => Promise<MapKitTokenResponse> | Yes | Function to fetch MapKit JS token |
| options | MapKitInitOptions | No | Initialization options |
| onError | (error: MapKitError) => void | No | Error handler |

### Map Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| id | string | No | Map container ID |
| options | mapkit.MapConstructorOptions | No | Map configuration options |
| location | Coordinate | No | Center Coordinate |
| region | Region | No | Map region with center and span |
| onMapError | (error: Error \| MapKitError) => void | No | Error handler |
| onAppear | (map: mapkit.Map) => void | No | Called when map is ready |
| onChange | (map: mapkit.Map, newAnnotations: mapkit.Annotation[]) => void | No | Called when annotations/overlays change |
| className | string | No | Additional CSS classes |
| loadingComponent | ReactNode | No | Custom loading component |
| errorComponent | ReactNode | No | Custom error component |
| onRegionChangeStart | (event: mapkit.EventBase<mapkit.Map>) => void | No | Triggered when the map region starts changing. |
| onRegionChangeEnd | (event: mapkit.EventBase<mapkit.Map>) => void | No | Triggered when the map region finishes changing. |
| onRotationStart | (event: mapkit.EventBase<mapkit.Map>) => void | No | Triggered when the map starts rotating. |
| onRotationEnd | (event: mapkit.EventBase<mapkit.Map>) => void | No | Triggered when the map finishes rotating. |
| onScrollStart | (event: mapkit.EventBase<mapkit.Map>) => void | No | Triggered when the map starts scrolling. |
| onScrollEnd | (event: mapkit.EventBase<mapkit.Map>) => void | No | Triggered when the map finishes scrolling. |
| onZoomStart | (event: mapkit.EventBase<mapkit.Map>) => void | No | Triggered when the map starts zooming. |
| onZoomEnd | (event: mapkit.EventBase<mapkit.Map>) => void | No | Triggered when the map finishes zooming. |
| onMapTypeChange | (event: mapkit.EventBase<mapkit.Map>) => void | No | Triggered when the map type changes. |
| onUserLocationChange | (event: mapkit.EventBase<mapkit.Map> & { coordinate: mapkit.Coordinate; timestamp: Date }) => void | No | Triggered when the user's location changes. |
| onUserLocationError | (event: mapkit.EventBase<mapkit.Map> & { code: number; message: string }) => void | No | Triggered when an error occurs while trying to retrieve the user's location. |
| onSingleTap | (event: mapkit.EventBase<mapkit.Map>) => void | No | Triggered when the map is tapped once. |
| onDoubleTap | (event: mapkit.EventBase<mapkit.Map>) => void | No | Triggered when the map is double-tapped. |
| onLongPress | (event: mapkit.EventBase<mapkit.Map>) => void | No | Triggered when the map is long-pressed. |

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.