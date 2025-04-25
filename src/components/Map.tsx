"use client";

import mapboxgl from "mapbox-gl";
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
      const marker = new mapboxgl.Marker()
        .setLngLat([n.location.longitude, n.location.latitude])
        .setPopup(
          new mapboxgl.Popup().setHTML(
            `<strong>${n.name}</strong><br>${n.location.city}, ${n.location.country}`
          )
        )
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

  return (
    <div className="relative h-full w-full rounded-xl shadow">
      <div ref={mapContainer} className="absolute inset-0" />
      <div className="absolute top-4 left-4 z-10">
        <Button onClick={handleLocate}>Near me</Button>
      </div>
    </div>
  );
}
