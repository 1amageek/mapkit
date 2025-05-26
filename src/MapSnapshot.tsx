import React from 'react';
import { MapSnapshotProps, useMapKitSnapshot } from './snapshot';

/**
 * Apple MapKitの静的スナップショット画像を表示するコンポーネント
 * TeamID、KeyID、署名はすべてMapKitProviderから自動的に取得
 */
export function MapSnapshot({
  params,
  onError,
  alt = 'Map snapshot',
  loadingComponent,
  ...imgProps
}: MapSnapshotProps) {
  const { url, isLoading, error } = useMapKitSnapshot(params, { onError });

  if (isLoading) {
    return (
      <>
        {loadingComponent || (
          <div style={{ 
            width: imgProps.width, 
            height: imgProps.height, 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            backgroundColor: '#f0f0f0', 
            borderRadius: '4px' 
          }}>
            Loading map snapshot...
          </div>
        )}
      </>
    );
  }

  if (error || !url) {
    return (
      <div style={{ 
        width: imgProps.width, 
        height: imgProps.height, 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: '#f0f0f0', 
        borderRadius: '4px', 
        color: 'red' 
      }}>
        Error: {error?.message || 'Failed to load map snapshot'}
      </div>
    );
  }

  return (
    <img 
      src={url} 
      alt={alt}
      {...imgProps}
    />
  );
}

export default MapSnapshot;