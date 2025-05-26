// src/context/mapkit-context.tsx
import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  ReactNode
} from 'react';
import {
  MapKitContextProps,
  MapKitProviderProps,
  MapKitInitOptions,
  TokenData,
  MapKitError,
  MapKitTokenResponse
} from '../types';
import { createMapKitError, isMapKitError } from '../utils/errors';
import { CleanupManager } from '../utils/memory-management';

/* -------------------------------------------------------------------------- */
/*                               STATE & TYPES                                */
/* -------------------------------------------------------------------------- */

interface MapKitState {
  readonly mapkit: typeof mapkit | null;
  readonly isReady: boolean;
  readonly isLoading: boolean;
  readonly error: MapKitError | null;
  readonly tokenData: TokenData;
}

type MapKitAction =
  | { type: 'LOADING_START' }
  | { type: 'LOADING_SUCCESS'; payload: { mapkit: typeof mapkit } }
  | { type: 'LOADING_ERROR'; payload: { error: MapKitError } }
  | { type: 'TOKEN_UPDATE'; payload: { tokenData: TokenData } }
  | { type: 'RESET' };

const initialState: MapKitState = {
  mapkit: null,
  isReady: false,
  isLoading: false,
  error: null,
  tokenData: { token: null, expiresAt: null, isValid: false }
};

const mapKitReducer = (state: MapKitState, action: MapKitAction): MapKitState => {
  switch (action.type) {
    case 'LOADING_START':
      return { ...state, isLoading: true, error: null };
    case 'LOADING_SUCCESS':
      return {
        ...state,
        mapkit: action.payload.mapkit,
        isReady: true,
        isLoading: false,
        error: null
      };
    case 'LOADING_ERROR':
      return { ...state, isLoading: false, error: action.payload.error, isReady: false };
    case 'TOKEN_UPDATE':
      return { ...state, tokenData: action.payload.tokenData };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
};

/* -------------------------------------------------------------------------- */
/*                               DEFAULT OPTIONS                              */
/* -------------------------------------------------------------------------- */

const DEFAULT_OPTIONS: Required<MapKitInitOptions> = {
  language: 'en',
  version: '5.x.x',
  libraries: [],
  tokenFetchRetries: 3,
  tokenFetchRetryDelay: 2000
};

const TOKEN_BUFFER_TIME = 60; // 秒前にリフレッシュ

/* -------------------------------------------------------------------------- */
/*                             GLOBAL INITIAL STATE                           */
/* -------------------------------------------------------------------------- */

interface GlobalState {
  isScriptLoaded: boolean;
  isInitialized: boolean;
  loadPromise: Promise<void> | null;
  initPromise: Promise<void> | null;
}

const globalState: GlobalState = {
  isScriptLoaded: false,
  isInitialized: false,
  loadPromise: null,
  initPromise: null
};

/* -------------------------------------------------------------------------- */
/*                                   CONTEXT                                  */
/* -------------------------------------------------------------------------- */

const MapKitContext = createContext<MapKitContextProps | null>(null);

/* -------------------------------------------------------------------------- */
/*                           TOKEN MANAGEMENT CLASS                           */
/* -------------------------------------------------------------------------- */

class TokenManager {
  private tokenData: TokenData = { token: null, expiresAt: null, isValid: false };
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private readonly fetchToken: () => Promise<MapKitTokenResponse>,
    private readonly onTokenUpdate: (tokenData: TokenData) => void,
    private readonly onError: (error: MapKitError) => void
  ) {}

  public async getValidToken(): Promise<string> {
    if (this.isTokenValid()) return this.tokenData.token!;
    const newData = await this.refreshToken();
    return newData.token!;
  }

  private isTokenValid(): boolean {
    if (!this.tokenData.token || !this.tokenData.expiresAt) return false;
    const now = Math.floor(Date.now() / 1000);
    return this.tokenData.expiresAt > now + TOKEN_BUFFER_TIME;
  }

  private async refreshToken(): Promise<TokenData> {
    try {
      const res = await this.fetchToken();
      if (!this.validateResponse(res)) throw createMapKitError('TOKEN_ERROR', 'Invalid token response');

      const next: TokenData = { token: res.token, expiresAt: res.expiresAt, isValid: true };
      this.tokenData = next;
      this.onTokenUpdate(next);
      this.scheduleRefresh(res.expiresAt);
      return next;
    } catch (e) {
      const err = isMapKitError(e) ? e : createMapKitError('TOKEN_ERROR', 'Failed to refresh token', e as Error);
      this.onError(err);
      throw err;
    }
  }

  private validateResponse(r: MapKitTokenResponse): boolean {
    return typeof r.token === 'string' && r.token.length > 0 && typeof r.expiresAt === 'number';
  }

  private scheduleRefresh(exp: number): void {
    if (this.refreshTimer) clearTimeout(this.refreshTimer);
    const now = Math.floor(Date.now() / 1000);
    const ms = (exp - now - TOKEN_BUFFER_TIME) * 1000;
    if (ms > 0) {
      this.refreshTimer = setTimeout(() => this.refreshToken().catch(() => {}), ms);
    }
  }

  public cleanup(): void {
    if (this.refreshTimer) clearTimeout(this.refreshTimer);
  }
}

/* -------------------------------------------------------------------------- */
/*                              SCRIPT LOADER CLASS                           */
/* -------------------------------------------------------------------------- */

class ScriptLoader {
  private cleanupManager = new CleanupManager();

  public async loadMapKit(options: Required<MapKitInitOptions>): Promise<void> {
    if (globalState.isScriptLoaded && window.mapkit) return;
    if (globalState.loadPromise) return globalState.loadPromise;
    globalState.loadPromise = this.loadScripts(options);
    return globalState.loadPromise;
  }

  private async loadScripts(opts: Required<MapKitInitOptions>): Promise<void> {
    try {
      await this.inject(`https://cdn.apple-mapkit.com/mk/${opts.version}/mapkit.js`, 'mapkit-js');
      await Promise.all(
        opts.libraries.map(lib =>
          this.inject(`https://cdn.apple-mapkit.com/mk/${opts.version}/${lib}.js`, `mk-${lib}`)
        )
      );
      globalState.isScriptLoaded = true;
    } catch (e) {
      globalState.loadPromise = null;
      throw isMapKitError(e) ? e : createMapKitError('LOAD_ERROR');
    }
  }

  private inject(src: string, id: string): Promise<void> {
    return new Promise((res, rej) => {
      if (document.getElementById(id)) return res();
      const s = document.createElement('script');
      s.src = src;
      s.id = id;
      s.crossOrigin = 'anonymous';

      const clean = () => {
        s.removeEventListener('load', onLoad);
        s.removeEventListener('error', onErr);
      };
      const onLoad = () => {
        clean();
        res();
      };
      const onErr = () => {
        clean();
        rej(createMapKitError('LOAD_ERROR', `Failed to load ${src}`));
      };

      s.addEventListener('load', onLoad);
      s.addEventListener('error', onErr);
      this.cleanupManager.add(clean);
      document.head.appendChild(s);
    });
  }

  public cleanup(): void {
    this.cleanupManager.cleanup();
  }
}

/* -------------------------------------------------------------------------- */
/*                             PROVIDER COMPONENT                             */
/* -------------------------------------------------------------------------- */

export const MapKitProvider: React.FC<MapKitProviderProps> = ({
  children,
  fetchToken,
  options: userOptions = {},
  onError
}) => {
  /* ---------- merge user options ---------- */
  const options = useMemo(
    () => ({ ...DEFAULT_OPTIONS, ...userOptions }),
    [userOptions]
  );

  /* ---------- reducer ---------- */
  const [state, dispatch] = useReducer(mapKitReducer, initialState);

  /* ---------- refs (safe, eager init) ---------- */
  const scriptLoaderRef = useRef<ScriptLoader>(new ScriptLoader());
  const cleanupManagerRef = useRef<CleanupManager>(new CleanupManager());
  const tokenManagerRef = useRef<TokenManager | null>(null);

  /* ---------- ref-dependent managers ---------- */
  useEffect(() => {
    const handleTokenUpdate = (td: TokenData) =>
      dispatch({ type: 'TOKEN_UPDATE', payload: { tokenData: td } });

    const handleError = (err: MapKitError) => {
      dispatch({ type: 'LOADING_ERROR', payload: { error: err } });
      onError?.(err);
    };

    tokenManagerRef.current = new TokenManager(fetchToken, handleTokenUpdate, handleError);

    return () => {
      tokenManagerRef.current?.cleanup();
      scriptLoaderRef.current.cleanup();
      cleanupManagerRef.current?.cleanup();
    };
  }, [fetchToken, onError]);

  /* ---------- initialization ----------- */
  const initializeMapKit = useCallback(async (): Promise<void> => {
    if (globalState.isInitialized && window.mapkit) return;
    if (globalState.initPromise) return globalState.initPromise;

    globalState.initPromise = (async () => {
      try {
        if (!window.mapkit) throw createMapKitError('NOT_LOADED');
        const token = await tokenManagerRef.current!.getValidToken();

        window.mapkit.init({
          authorizationCallback: done => done(token),
          language: options.language
        });

        globalState.isInitialized = true;
        dispatch({ type: 'LOADING_SUCCESS', payload: { mapkit: window.mapkit } });
      } catch (e) {
        globalState.initPromise = null;
        throw isMapKitError(e) ? e : createMapKitError('INIT_ERROR');
      }
    })();

    return globalState.initPromise;
  }, [options.language]);

  /* ---------- load (public) ---------- */
  const load = useCallback(
    async (errorCallback?: (err: MapKitError) => void): Promise<void> => {
      if (state.isLoading || state.isReady) return;
      dispatch({ type: 'LOADING_START' });

      try {
        await scriptLoaderRef.current.loadMapKit(options);
        await initializeMapKit();
      } catch (e) {
        const mkErr = isMapKitError(e) ? e : createMapKitError('UNKNOWN_ERROR');
        dispatch({ type: 'LOADING_ERROR', payload: { error: mkErr } });
        errorCallback?.(mkErr);
        onError?.(mkErr);
      }
    },
    [state.isLoading, state.isReady, options, initializeMapKit, onError]
  );

  /* ---------- context value ---------- */
  const ctx = useMemo<MapKitContextProps>(
    () => ({
      mapkit: state.mapkit,
      isReady: state.isReady,
      isLoading: state.isLoading,
      error: state.error,
      load
    }),
    [state, load]
  );

  return <MapKitContext.Provider value={ctx}>{children}</MapKitContext.Provider>;
};

/* -------------------------------------------------------------------------- */
/*                                    HOOKS                                   */
/* -------------------------------------------------------------------------- */

export const useMapKit = (): MapKitContextProps => {
  const ctx = useContext(MapKitContext);
  if (!ctx) {
    throw createMapKitError('CONTEXT_ERROR', 'useMapKit must be used within a MapKitProvider');
  }
  return ctx;
};

export const useMap = (id: string): mapkit.Map | null => {
  const { isReady } = useMapKit();
  return useMemo(() => {
    if (!isReady || !window.mapkit) return null;
    return (
      window.mapkit.maps.find(
        (m: mapkit.Map) => m.element.parentElement?.id === id
      ) ?? null
    );
  }, [isReady, id]);
};
