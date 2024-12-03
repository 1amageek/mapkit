# @1amageek/mapkit

A React wrapper for Apple MapKit JS that provides a seamless integration with Apple Maps in your React applications.

## Installation

```bash
npm install @1amageek/mapkit
# or
yarn add @1amageek/mapkit
```

## Prerequisites

You need to have a valid Apple Developer account and obtain a MapKit JS key. For more information, visit [Apple's MapKit JS documentation](https://developer.apple.com/documentation/mapkitjs).

## Basic Usage

```tsx
import { MapKitProvider, Map, MarkerAnnotation } from '@1amageek/mapkit'

const fetchToken = async () => {
  const response = await fetch('/api/mapkit-token')
  if (!response.ok) {
    throw new Error('Failed to fetch token')
  }
  return response.json() // Should return { token: string, expiresAt: number }
}

function App() {
  return (
    <MapKitProvider fetchToken={fetchToken}>
      <Map
        options={{
          showsUserLocation: true,
          showsCompass: true
        }}
        onMapReady={(map) => console.log('Map is ready', map)}
        onMapError={(error) => console.error('Map error:', error)}
      >
        <MarkerAnnotation
          coordinate={{ latitude: 35.6812, longitude: 139.7671 }}
          title="Tokyo"
          subtitle="Japan"
        />
      </Map>
    </MapKitProvider>
  )
}
```

## Components

### MapKitProvider

The root component that manages MapKit JS initialization and token management.

```tsx
interface MapKitProviderProps {
  children: ReactNode
  fetchToken: () => Promise<{
    token: string
    expiresAt: number
  }>
}
```

### Map

The main map component that renders the Apple Map.

```tsx
interface MapProps {
  id?: string
  options?: mapkit.MapConstructorOptions
  children?: ReactNode
  location?: Location | null
  region?: Region | null
  onMapError?: (error: Error) => void
  onMapReady?: (map: mapkit.Map) => void
  className?: string
}
```

### Annotations

#### MarkerAnnotation

```tsx
<MarkerAnnotation
  coordinate={{ latitude: number, longitude: number }}
  title?: string
  subtitle?: string
  color?: string
  glyphText?: string
/>
```

#### CustomAnnotation

```tsx
<CustomAnnotation
  coordinate={{ latitude: number, longitude: number }}
>
  <div>Custom Marker Content</div>
</CustomAnnotation>
```

#### ImageAnnotation

```tsx
<ImageAnnotation
  coordinate={{ latitude: number, longitude: number }}
  url={{
    1: "path/to/image.png",
    2: "path/to/image@2x.png"
  }}
/>
```

### Overlays

#### CircleOverlay

```tsx
<CircleOverlay
  coordinate={{ latitude: number, longitude: number }}
  radius={1000}
  options={{
    strokeColor: "#007AFF",
    lineWidth: 2,
  }}
/>
```

#### PolylineOverlay

```tsx
<PolylineOverlay
  points={[
    { latitude: number, longitude: number },
    { latitude: number, longitude: number }
  ]}
  options={{
    strokeColor: "#007AFF",
    lineWidth: 2,
  }}
/>
```

## Error Handling

The library provides comprehensive error handling through the `onMapError` callback:

```tsx
<Map
  onMapError={(error) => {
    console.error('Map error:', error)
    // Handle error appropriately
  }}
>
  {/* Map content */}
</Map>
```

## Types

The library includes full TypeScript support with types for all components and options:

```tsx
import type {
  Location,
  Region,
  MapKitTokenResponse,
  MarkerAnnotationProps,
  CustomAnnotationProps
} from '@1amageek/mapkit'
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT © [Norikazu Muramoto](mailto:tmy0x3@icloud.com)