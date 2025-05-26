// src/snapshot.ts
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useMapKit } from './context';

/**
 * スナップショットパラメータのインターフェース
 */
export interface MapSnapshotParams {
  // 必須パラメータ
  center: string | { latitude: number; longitude: number };
  
  // オプションパラメータ
  z?: number;                  // ズームレベル
  spn?: string;                // 表示範囲
  size?: string;               // 画像サイズ (例: "300x200")
  scale?: number;              // 画像スケール倍率
  t?: string;                  // マップタイプ ("standard", "satellite", "hybrid", "mutedStandard")
  colorScheme?: string;        // カラースキーム ("light", "dark")
  poi?: boolean;               // POI表示
  lang?: string;               // 言語
  annotations?: Annotation[];  // アノテーション
  overlays?: Overlay[];        // オーバーレイ
  overlayStyles?: OverlayStyle[]; // オーバーレイスタイル
  imgs?: Image[];              // 画像
  referer?: string;            // リファラー
  expires?: number;            // 有効期限（Unix秒数）
}

// 型定義
export interface Image {
  height: number;
  url: string;
  width: number;
}

export interface Annotation {
  markerStyle?: "dot" | "balloon" | "large" | "img";
  point: string;
  color?: string;
  glyphColor?: string;
  glyphImgIdx?: number;
  glyphText?: string;
  imgIdx?: number;
  offset?: string;
}

export interface Overlay {
  type?: "circle" | "polygon" | "polyline";
  points: string[] | string;
  center?: string;
  radius?: number;
  strokeColor?: string;
  lineWidth?: number;
  lineDash?: number[];
  fillColor?: string;
  fillOpacity?: number;
  fillRule?: string;
  lineCap?: "butt" | "round" | "square";
  lineDashOffset?: number;
  lineGradient?: LineGradient;
  lineGradientIndexes?: LineGradientIndexes;
  lineJoin?: "bevel" | "miter" | "round";
  strokeOpacity?: number;
  styleIdx?: number;
}

export interface OverlayStyle {
  fillColor?: string;
  fillOpacity?: number;
  fillRule?: "nonzero" | "evenodd";
  lineCap?: "butt" | "round" | "square";
  lineDash?: number[];
  lineDashOffset?: number;
  lineGradient?: LineGradient;
  lineGradientIndexes?: LineGradientIndexes;
  lineJoin?: "miter" | "round" | "bevel";
  lineWidth?: number;
  strokeColor?: string;
  strokeOpacity?: number;
}

export interface LineGradient {
  [key: string]: string;
}

export interface LineGradientIndexes {
  [key: string]: string;
}

/**
 * スナップショットパラメータをURLクエリ文字列に変換する
 */
function getSearchParams(teamID: string, keyID: string, params: MapSnapshotParams): string {
  const searchParams = new URLSearchParams({
    teamId: teamID,
    keyId: keyID,
  });

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }
    
    if (typeof value === "object" && value !== null) {
      if (key === "center" && "latitude" in value && "longitude" in value) {
        // centerがオブジェクトの場合、緯度と経度をカンマ区切りの文字列に変換
        searchParams.append(key, `${value.latitude},${value.longitude}`);
      } else if (Array.isArray(value)) {
        // 配列の場合、JSON文字列に変換して追加
        searchParams.append(key, JSON.stringify(value));
      } else {
        // その他のオブジェクトもJSON文字列に変換して追加
        searchParams.append(key, JSON.stringify(value));
      }
    } else {
      // プリミティブ値の場合はそのまま追加
      searchParams.append(key, value.toString());
    }
  });

  return searchParams.toString();
}

/**
 * 署名用のスナップショットパスを生成する
 * このパスはサーバーサイドでの署名に使用されます。
 * 
 * @param teamID - Apple Developer TeamID
 * @param keyID - MapKit JS キーID
 * @param params - スナップショットパラメータ
 * @returns 署名対象のスナップショットパス
 */
export function getPathForSigning(
  teamID: string,
  keyID: string,
  params: MapSnapshotParams
): string {
  const queryParams = getSearchParams(teamID, keyID, params);
  return `/api/v1/snapshot?${queryParams}`;
}

/**
 * スナップショットURLを生成する
 * 
 * @param teamID - Apple Developer TeamID
 * @param keyID - MapKit JS キーID
 * @param params - スナップショットパラメータ
 * @param signature - 署名文字列（Base64エンコード済み）
 * @returns 署名済みスナップショットURL
 */
export function getSnapshotURL(
  teamID: string, 
  keyID: string, 
  params: MapSnapshotParams, 
  signature: string
): string {
  const queryParams = getSearchParams(teamID, keyID, params);
  const snapshotPath = `/api/v1/snapshot?${queryParams}`;
  return `https://snapshot.apple-mapkit.com${snapshotPath}&signature=${encodeURIComponent(signature)}`;
}

/**
 * MapKitスナップショットURLを取得するフック
 * 
 * @param params スナップショットパラメータ
 * @param options オプション
 * @returns { url, signature, isLoading, error, fetchSnapshot } スナップショット情報
 */
export function useMapKitSnapshot(
  params: MapSnapshotParams,
  options?: { 
    autoFetch?: boolean,
    onError?: (error: Error) => void 
  }
) {
  const { autoFetch = true, onError } = options || {};
  const context = useMapKit();
  const [signature, setSignature] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(autoFetch);
  const [error, setError] = useState<Error | null>(null);

  // teamID, keyID, getSnapshotSignatureをコンテキストから取得（存在しない場合は型エラーを避けるため）
  const teamID = 'teamID' in context ? (context as any).teamID : undefined;
  const keyID = 'keyID' in context ? (context as any).keyID : undefined;
  const getSnapshotSignature = 'getSnapshotSignature' in context ? (context as any).getSnapshotSignature : undefined;

  // 署名を取得する関数
  const fetchSnapshot = useCallback(async () => {
    if (!context.isReady || !teamID || !keyID || !getSnapshotSignature) {
      const err = new Error('MapKit is not ready or missing teamID/keyID/getSnapshotSignature');
      setError(err);
      onError?.(err);
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // 署名を取得
      const sig = await getSnapshotSignature(params);
      setSignature(sig);
      
      // URLを生成
      return getSnapshotURL(teamID, keyID, params, sig);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to fetch snapshot');
      setError(error);
      onError?.(error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [context.isReady, teamID, keyID, getSnapshotSignature, params, onError]);

  // URLを生成
  const url = useMemo(() => {
    if (!signature || !teamID || !keyID) return null;
    try {
      return getSnapshotURL(teamID, keyID, params, signature);
    } catch (err) {
      return null;
    }
  }, [signature, teamID, keyID, params]);

  // 自動取得が有効な場合、初回および依存変数変更時に署名を取得
  useEffect(() => {
    if (autoFetch) {
      fetchSnapshot();
    }
  }, [autoFetch, fetchSnapshot]);

  return {
    url,
    signature,
    isLoading,
    error,
    fetchSnapshot
  };
}

/**
 * MapKitスナップショットコンポーネントのプロパティ
 * onErrorプロパティの型を明示的に分離して、React.ImgHTMLAttributesとの衝突を避ける
 */
export interface MapSnapshotProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'onError'> {
  params: MapSnapshotParams;
  onError?: (error: Error) => void;
  alt?: string;
  loadingComponent?: React.ReactNode;
}