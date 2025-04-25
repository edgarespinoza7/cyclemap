"use client";

import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

type Network = {
  id: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
    city: string;
    country: string;
  };
};

export default function Map({ networks }: { networks: Network[] }) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [lngLat, setLngLat] = useState<[number, number] | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    if (!mapContainer.current) return;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [0, 20],
      zoom: 2,
      projection: "mercator",
    });

    mapRef.current = map;

    // Clear existing markers
    markers.current.forEach((marker) => marker.remove());
    markers.current = [];

    networks.forEach((n) => {
      const el = document.createElement("div");

      const popMessage = `<div class="p-2"><p class="font-bold text-center text-lg">${n.name}</p><p>${n.location.city}, ${n.location.country}</p></div>`;

      const marker = new mapboxgl.Marker({
        element: el,
        className:
          "h-2 w-2 bg-orange-500/60 rounded-full border border-orange-500 cursor-pointer transition-all",
      })
        .setLngLat([n.location.longitude, n.location.latitude])
        .setPopup(new mapboxgl.Popup().setHTML(popMessage))
        .addTo(map);

      markers.current.push(marker);
    });

    return () => map.remove();
  }, [networks]);

  useEffect(() => {
    if (lngLat && mapRef.current) {
      mapRef.current.flyTo({ center: lngLat, zoom: 8 });
    }
  }, [lngLat]);

  const handleLocate = () => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLngLat([position.coords.longitude, position.coords.latitude]);
      },
      (error) => console.error("Geolocation error:", error)
    );
  };

  const handleZoomIn = () => {
    if (mapRef.current) {
      mapRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      mapRef.current.zoomOut();
    }
  };

  return (
    <div className="relative h-full w-full rounded-xl shadow">
      <div ref={mapContainer} className="absolute inset-0 h-full w-full" />
      <div className="absolute top-4 left-4 z-10">
        <Button onClick={handleLocate}>Near me</Button>
      </div>
      <div className="absolute top-4 right-4 z-10 flex flex-col space-y-2">
        <Button onClick={handleZoomIn}>+</Button>
        <Button onClick={handleZoomOut}>-</Button>
      </div>
    </div>
  );
}
