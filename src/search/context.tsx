import {
  useState,
  createContext,
  ReactNode,
  useEffect,
  useContext,
  Dispatch,
  SetStateAction,
  useRef
} from "react";

import useDebounce from "./debounce";
import { useMapKit } from "../context/mapkit-context";

type SearchConstructorOptions = mapkit.SearchConstructorOptions
type SearchOptions = mapkit.SearchOptions
type SearchAutocompleteOptions = mapkit.SearchAutocompleteOptions
type SearchAutocompleteResult = mapkit.SearchAutocompleteResult
type Place = mapkit.Place

interface SearchContextProps {
  searchQuery: string;
  setSearchQuery: Dispatch<SetStateAction<string>>;
  searchAutocompleteResults: SearchAutocompleteResult[];
  searchAutocompleteResult: SearchAutocompleteResult | null;
  setSearchAutocompleteResult: Dispatch<SetStateAction<SearchAutocompleteResult | null>>;
  setSearchAutocompleteResults: Dispatch<SetStateAction<SearchAutocompleteResult[]>>;
  places: Place[];
  setPlaces: Dispatch<SetStateAction<Place[]>>;
  search: (
    query: string | SearchAutocompleteResult,
    options?: SearchOptions
  ) => Promise<Place[]>;
  autocomplete: (
    query: string,
    options?: SearchAutocompleteOptions,
    callback?: (results: SearchAutocompleteResult[]) => void
  ) => void;
  isSearching: boolean;
}

const defaultContextValue: SearchContextProps = {
  searchQuery: "",
  setSearchQuery: () => { },
  searchAutocompleteResults: [],
  searchAutocompleteResult: null,
  setSearchAutocompleteResult: () => { },
  setSearchAutocompleteResults: () => { },
  places: [],
  setPlaces: () => { },
  search: async () => {
    throw new Error("search must be used within a Provider");
  },
  autocomplete: () => {
    throw new Error("autocomplete must be used within a Provider");
  },
  isSearching: false
};

export const SearchContext = createContext<SearchContextProps>(defaultContextValue);

interface SearchProviderProps {
  options?: SearchConstructorOptions;
  children: ReactNode;
}

export const SearchProvider = ({
  children,
  options,
}: SearchProviderProps) => {
  const { isReady } = useMapKit()
  const [searchQuery, setSearchQuery] = useState("");
  const [searchAutocompleteResults, setSearchAutocompleteResults] = useState<SearchAutocompleteResult[]>([]);
  const [searchAutocompleteResult, setSearchAutocompleteResult] = useState<SearchAutocompleteResult | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const debouncedText = useDebounce(searchQuery, 220);
  const searchRef = useRef<mapkit.Search | null>(null);
  
  useEffect(() => {
    if (!window.mapkit) return;
    searchRef.current = new window.mapkit.Search({ ...options });
  }, [isReady]);

  const search = async (
    query: string | SearchAutocompleteResult,
    options?: SearchOptions
  ): Promise<Place[]> => {
    if (!searchRef.current) {
      throw new Error("search must be used within a Provider");
    }
    try {
      setIsSearching(true);
      return new Promise((resolve, reject) => {
        searchRef.current!.search(query, (error, data) => {
          setIsSearching(false);
          if (error) {
            reject(error);
            return;
          }
          resolve(data.places);
        }, options);
      });
    } catch (error) {
      setIsSearching(false);
      throw error;
    }
  };

  const autocomplete = (
    query: string,
    options?: SearchAutocompleteOptions,
    callback?: (results: SearchAutocompleteResult[]) => void
  ): void => {
    if (!searchRef.current) {
      throw new Error("autocomplete must be used within a Provider");
    }
    if (query.length === 0) {
      setSearchAutocompleteResults([]);
      callback?.([]);
      return;
    }
    searchRef.current.autocomplete(query, (error, data) => {
      if (error) {
        console.error("Autocomplete error:", error);
        setSearchAutocompleteResults([]);
        callback?.([]);
        return;
      }
      const results = data.results as SearchAutocompleteResult[];
      setSearchAutocompleteResults(results);
      callback?.(results);
    }, options);
  };

  useEffect(() => {
    if (!isReady) return
    if (debouncedText && debouncedText.trim().length > 0) {
      autocomplete(debouncedText);
    } else {
      setSearchAutocompleteResults([]);
    }
  }, [debouncedText, isReady]);

  return (
    <SearchContext.Provider
      value={{
        searchQuery,
        setSearchQuery,
        searchAutocompleteResults,
        searchAutocompleteResult,
        setSearchAutocompleteResult,
        setSearchAutocompleteResults,
        places,
        setPlaces,
        search,
        autocomplete,
        isSearching
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = () => {
  return useContext(SearchContext);
};