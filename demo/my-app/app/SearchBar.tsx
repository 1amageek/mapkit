// mapkit/search/SearchBar.tsx
import React, { useEffect, useState } from "react";
import { useSearch } from "@1amageek/mapkit"

const SearchBar: React.FC = () => {
  const [show, setShow] = useState(false)
  const {
    searchQuery,
    setSearchQuery,
    searchAutocompleteResults,
    searchAutocompleteResult,
    setSearchAutocompleteResult,
    search,
    setPlaces,
  } = useSearch();

  useEffect(() => {
    setShow(true)
  }, [searchQuery])

  return (
    <div>
      <input
        type="text"
        placeholder="Search"
        value={searchQuery}
        className="py-1 px-2 rounded-full border-2 border-blue-500 drop-shadow-lg backdrop-blur-2xl bg-transparent text-gray-900"
        onChange={(e) => setSearchQuery(e.target.value)}
      />
      {show && (
        <div className="flex p-2 backdrop-blur-2xl mt-2 rounded-2xl max-h-40 overflow-y-scroll text-gray-700">
          <ul>
            {searchAutocompleteResults.map((result, index) => (
              <li
                key={index}
                onClick={() => {
                  setSearchAutocompleteResult(result);
                  search(result).then(setPlaces);
                  setShow(false)
                }}
                className="hover:bg-white/20 py-0.5 px-1 rounded-lg"
              >
                <div className="flex gap-2">
                  {result.displayLines[0]}
                  {result.displayLines[1] && (<span className="text-sm">{result.displayLines[1]}</span>)}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default SearchBar;