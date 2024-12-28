"use client"

import { findMap, Map } from "@1amageek/mapkit"
import { useEffect } from "react";

export default function Home() {

  const map = findMap("target")

  const showLocations = () => {
    if (!map) return;
    const hotelLocations = [
      { latitude: 35.1815, longitude: 136.9066, title: "Hotel Nagoya Station" }, // 名古屋駅
      { latitude: 35.1709, longitude: 136.8815, title: "Hotel Nagoya Castle" },  // 名古屋城
      { latitude: 35.1543, longitude: 136.9139, title: "Hotel Osu" },            // 大須
      { latitude: 35.1880, longitude: 136.8975, title: "Hotel Sakae" },          // 栄
      { latitude: 35.1168, longitude: 136.9342, title: "Hotel Atsuta" },         // 熱田神宮
      { latitude: 35.1683, longitude: 136.8957, title: "Hotel Fushimi" },        // 伏見
      { latitude: 35.1771, longitude: 136.8895, title: "Hotel Marunouchi" },     // 丸の内
      { latitude: 35.1931, longitude: 136.9275, title: "Hotel Motoyama" },       // 本山
      { latitude: 35.1449, longitude: 136.9569, title: "Hotel Kanayama" },       // 金山
      { latitude: 35.1032, longitude: 136.9083, title: "Hotel Higashi Betsuin" } // 東別院
    ];
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

  return (
    <main className="grid grid-cols-2 w-full h-full gap-2 p-4">
      <div className="w-full h-96">
        <Map
          location={{
            latitude: 35.6895, // 東京の緯度
            longitude: 139.6917, // 東京の経度
          }} />
      </div>
      <div className="w-full h-96">
        <Map
          region={{
            center: {
              latitude: 34.6937,
              longitude: 135.5023,
            },
            span: {
              latitudeDelta: 0.1,
              longitudeDelta: 0.1,
            },
          }}
        />
      </div>
      <div className="w-full h-96">
        <Map
          onAppear={(map) => {
            const coordinate = new mapkit.Coordinate(35.1815, 136.9066)
            const annotation = new mapkit.MarkerAnnotation(coordinate)
            map.showItems([annotation], { animate: true })
          }}
        />
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
    </main>
  );
}
