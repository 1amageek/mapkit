"use client"

import { useMap, Map, useSearch, CustomAnnotation, CustomAnnotationProps } from "@1amageek/mapkit"
import SearchBar from "./SearchBar";
import { useRef, useState } from "react";

type Place = {
  id: string;
  latitude: number;
  longitude: number;
  title: string;
  description: string;
};

const hotelLocations: Place[] = [
  { id: "0", latitude: 35.1815, longitude: 136.9066, title: "Hotel Nagoya Station", description: "名古屋駅近くの便利なホテル" }, // 名古屋駅
  { id: "1", latitude: 35.1709, longitude: 136.8815, title: "Hotel Nagoya Castle", description: "名古屋城の美しい景色を楽しめるホテル" },  // 名古屋城
  { id: "2", latitude: 35.1543, longitude: 136.9139, title: "Hotel Osu", description: "大須商店街に近い活気あるホテル" },            // 大須
  { id: "3", latitude: 35.1880, longitude: 136.8975, title: "Hotel Sakae", description: "栄の中心に位置する高級ホテル" },          // 栄
  { id: "4", latitude: 35.1168, longitude: 136.9342, title: "Hotel Atsuta", description: "熱田神宮に近い静かなホテル" },         // 熱田神宮
  { id: "5", latitude: 35.1683, longitude: 136.8957, title: "Hotel Fushimi", description: "伏見エリアの便利なホテル" },        // 伏見
  { id: "6", latitude: 35.1771, longitude: 136.8895, title: "Hotel Marunouchi", description: "ビジネスに最適な丸の内のホテル" },     // 丸の内
  { id: "7", latitude: 35.1931, longitude: 136.9275, title: "Hotel Motoyama", description: "本山エリアの落ち着いたホテル" },       // 本山
  { id: "8", latitude: 35.1449, longitude: 136.9569, title: "Hotel Kanayama", description: "金山駅近くの便利なホテル" },       // 金山
  { id: "9", latitude: 35.1032, longitude: 136.9083, title: "Hotel Higashi Betsuin", description: "東別院に近い歴史的なホテル" } // 東別院
];

const restaurantLocations: Place[] = [
  { id: "10", latitude: 34.6978, longitude: 135.4947, title: "道頓堀 たこ焼き", description: "大阪名物、道頓堀のたこ焼き店" },
  { id: "11", latitude: 34.7024, longitude: 135.4959, title: "新世界 串かつ", description: "大阪の味、新世界の串かつ店" },
  { id: "12", latitude: 34.6718, longitude: 135.5104, title: "なんば グルメ", description: "なんば周辺の多様なレストラン" },
  { id: "13", latitude: 34.6863, longitude: 135.5234, title: "大阪城近くのレストラン", description: "大阪城公園近くの食事処" },
  { id: "14", latitude: 34.6937, longitude: 135.5023, title: "梅田 グルメ", description: "梅田駅周辺のレストラン街" }
];

export default function Home() {
  const map = useMap("target")
  const mapRef = useRef<HTMLDivElement>(null)
  const showLocations = () => {
    if (!map) return;
    const annotations = hotelLocations.map((location) => {
      const coordinate = new mapkit.Coordinate(location.latitude, location.longitude);
      const annotation = new mapkit.MarkerAnnotation(coordinate, {
        title: location.title,
      });
      return annotation;
    });
    map.removeAnnotations(map.annotations);
    map.showItems(annotations, { animate: true });
  };

  const { places, } = useSearch()

  return (
    <main className="grid grid-cols-1 lg:grid-cols-2 w-full h-full gap-2 p-2">
      <div className="w-full h-96">
        <Map
          location={{
            latitude: 35.6895, // 東京の緯度
            longitude: 139.6917, // 東京の経度
          }} />
      </div>
      <div className="w-full h-96">
        <Map
          onChange={(map, annotations) => {
            map.showItems(annotations, {
              padding: new mapkit.Padding({ top: 20, bottom: 20 })
            })
          }}
        >
          {restaurantLocations.map((location, index) => {
            const titleSize = location.title.length * 12 + 8;
            return (
              <CustomAnnotation
                key={index}
                title={location.title}
                coordinate={{
                  latitude: location.latitude,
                  longitude: location.longitude
                }}
                size={{ width: titleSize, height: 28 }}
                draggable={false}
              >
                <ExpandableAnnotation place={location} />
              </CustomAnnotation>
            )
          })}
        </Map>
      </div>
      <div className="relative w-full h-96">
        <Map
          ref={mapRef}
          onChange={(map, annotations) => {
            map.showItems(annotations, {
              padding: new mapkit.Padding({ top: 20, bottom: 20 })
            })
          }}
        >
          {hotelLocations.map((location, index) => {
            const titleSize = location.title.length * 7 + 8;
            return (
              <CustomAnnotation
                key={index}
                title={location.title}
                coordinate={{
                  latitude: location.latitude,
                  longitude: location.longitude
                }}
                size={{ width: titleSize, height: 28 }}
                callout={{
                  calloutShouldAppearForAnnotation: () => true,
                  calloutAnchorOffsetForAnnotation: (annotation, size) => {
                    const map = annotation.map!
                    const domPoint = map.convertCoordinateToPointOnPage(annotation.coordinate)
                    const mapElement = mapRef.current!;
                    const mapRect = mapElement.getBoundingClientRect();
                    const scrollX = window.scrollX ?? 0;
                    const scrollY = window.scrollY ?? 0;
                    const localPoint = {
                      x: domPoint.x - (mapRect.left + scrollX),
                      y: domPoint.y - (mapRect.top + scrollY),
                    };
                    type Position = "top" | "middle" | "bottom";
                    const mapHeight = mapRect.height;
                    const annotationPosition = localPoint.y / (mapHeight / 3);
                    const position: Position = annotationPosition < 1 ? "top" : annotationPosition < 2 ? "middle" : "bottom";
                    let y = 0
                    switch (position) {
                      case "top": y = -36; break;
                      case "middle": y = 90; break;
                      case "bottom": y = 8 + 180; break;
                    }
                    return new DOMPoint(90, y)
                  },
                  calloutElementForAnnotation: (annotation) => {
                    return (
                      <div className="bg-white text-gray-800 drop-shadow-lg rounded-lg p-2"
                        style={{
                          width: 180,
                          height: 180
                        }}
                      >
                        <h2 className="font-bold">{location.title}</h2>
                        <p className="text-sm">{location.description}</p>
                      </div>
                    )
                  }
                }}
                draggable={false}
              >
                <div
                  className="flex justify-center items-center w-auto text-nowrap text-center py-1 px-2 text-xs font-semibold rounded-2xl border-2 border-blue-400 backdrop-blur-3xl drop-shadow-md bg-white/70 text-gray-900 shrink-0 hover:scale-110 transition-transform duration-200">
                  {location.title}
                </div>
              </CustomAnnotation>
            )
          })}
        </Map>
      </div>
      <div className="relative w-full h-96">
        <Map id="target" />
        <div className="absolute flex w-full bottom-2 justify-center items-center">
          <button
            className="text-sm backdrop-blur-xl px-2 py-1 bg-black bg-opacity-40 rounded-full"
            onClick={showLocations}
          >Current Location</button>
        </div>
      </div>
      <div className="relative w-full h-96">
        <Map
          onChange={(map, annotations) => {
            map.showItems(annotations, {
              padding: new mapkit.Padding(24, 24, 24, 24)
            })
          }}
        >
          {places.map((place, index) =>
            <CustomAnnotation
              key={index}
              title={place.name}
              coordinate={place.coordinate}
            >
              <div className="absolute flex w-auto text-nowrap py-1 px-2 text-sm font-semibold rounded-2xl border-2 border-blue-400 drop-shadow-md bg-white/70 text-gray-900 shrink-0 backdrop-blur-3xl -translate-x-[50%] -translate-y-[50%]">{place.name}</div>
            </CustomAnnotation>
          )}
        </Map>
        <div className="absolute flex w-full top-2 justify-start items-center left-2">
          <SearchBar />
        </div>
      </div>
      <div className="relative w-full h-96">
        <Map
          onAppear={(map) => {
            const coordinate = new mapkit.Coordinate(35.1815, 136.9066)
            const annotation = new mapkit.MarkerAnnotation(coordinate)
            map.showItems([annotation], { animate: true })
          }}
          onRegionChangeEnd={(event) => {
            console.log(event.target.visibleMapRect)
          }}
        />
      </div>
    </main >
  );
}

const ExpandableAnnotation = ({ place }: { place: Place }) => {
  const [isHovered, setIsHovered] = useState(false);
  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => setIsHovered(false);

  return (
    <div
      className="flex justify-center items-center"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div className="bg-white drop-shadow-md border-gray-500 border-2 min-w-3 min-h-3 rounded-md grow-0 shrink">
        {isHovered && (
          <span className="p-2 text-sm text-gray-700">{place.title}</span>
        )}
      </div>
    </div>
  );
};
