"use client";

import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useParams, usePathname } from "next/navigation";

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

  // const markers = useRef<mapboxgl.Marker[]>([]);
  const markers = useRef<Record<string, mapboxgl.Marker>>({}); // Use object for easy lookup
  const popups = useRef<Record<string, mapboxgl.Popup>>({}); // Store popups too

  const params = useParams(); // Get route parameters { id: '...' }
  const pathname = usePathname(); // Get current path '/networks/...'

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
    // markers.current.forEach((marker) => marker.remove());
    // markers.current = [];

    networks.forEach((n) => {

      const el = document.createElement("div");
      el.className = "map-marker";

      const popMessage = `<div class="p-2"><p class="font-bold text-center text-lg">${n.name}</p><p>${n.location.city}, ${n.location.country}</p></div>`;
      const popup = new mapboxgl.Popup({ offset: 15 }).setHTML(popMessage);

      const marker = new mapboxgl.Marker({
        element: el,
        className:
          "h-2 w-2 bg-orange-500/60 rounded-full border border-orange-500 cursor-pointer transition-all",
      })
        .setLngLat([n.location.longitude, n.location.latitude])
        .setPopup(popup)
        .addTo(map);

      // markers.current.push(marker);
      markers.current[n.id] = marker; // Store marker by network ID
      popups.current[n.id] = popup; // Store popup by network ID
    });

    return () => {
      map.remove();
      mapRef.current = null;
      markers.current = {};
      popups.current = {};
    }; 
  }, [networks]);

  useEffect(() => {
    if (!mapRef.current) return;

    const networkId = params.id as string | undefined; // Get network ID from URL params

    // Reset styles/popups for all markers first
    Object.values(markers.current).forEach(marker => {
      marker.getElement().classList.remove('map-marker-active');
      const popup = marker.getPopup();
      if (popup && popup.isOpen()) {
          marker.togglePopup();
      }
    });


    if (networkId && markers.current[networkId]) {
      const marker = markers.current[networkId];
      const popup = popups.current[networkId];
      const location = networks.find(n => n.id === networkId)?.location;

      if (location) {
        // Fly to the location
        mapRef.current.flyTo({
          center: [location.longitude, location.latitude],
          zoom: 8, // Or a suitable zoom level
        });

        // Highlight the marker (e.g., add a CSS class)
        marker.getElement().classList.add('map-marker-active');

        // Open the popup after a short delay to allow flyTo to progress
        setTimeout(() => {
            if (!popup.isOpen()) {
                 marker.togglePopup();
            }
        }, 500); // Adjust delay as needed

      }
    } else if (pathname === '/') {
        // Optional: Fly back to default view when on the home page
         mapRef.current.flyTo({ center: [0, 20], zoom: 2 });
    }

  }, [params, pathname, networks]); // Dependencies: params, pathname, networks

  // Function that handles the "Near me" button click
  // It uses the Geolocation API to get the user's current position and set it as the map center
  
  const handleLocate = () => {
    // Ensure the map instance exists before trying to use it
    if (!mapRef.current) {
      console.error("Map is not initialized yet.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const currentCoords: [number, number] = [
          position.coords.longitude,
          position.coords.latitude,
        ];
        // Directly fly the map to the user's location
        mapRef.current?.flyTo({
           center: currentCoords,
           zoom: 8 // Adjust zoom level as desired
        });
      },
      (error) => console.error("Geolocation error:", error),
      {
        enableHighAccuracy: true, // Optional: Request more accurate position
        timeout: 5000,          // Optional: Set timeout
        maximumAge: 0           // Optional: Don't use cached position
      }
    );
  };

  // Functions that handle zoom in and out
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
    <div className="relative h-full w-full">
      <div ref={mapContainer} className="absolute inset-0 h-full w-full" />
      <style jsx global>{`
        .map-marker {
          height: 10px;
          width: 10px;
          background-color: rgba(249, 115, 22, 0.6); /* orange-500/60 */
          border-radius: 9999px; /* rounded-full */
          border: 1px solid rgb(249 115 22); /* border-orange-500 */
          cursor: pointer;
          transition: all 0.2s ease-in-out;
        }
        .map-marker:hover {
          transform: scale(1.5);
          background-color: rgba(249, 115, 22, 0.9);
        }
        .map-marker-active {
           transform: scale(1.8);
           background-color: rgba(234, 88, 12, 1); /* darker orange */
           border-color: rgba(124, 45, 18, 1);
           z-index: 10; /* Ensure it's above others */
        }
        .mapboxgl-popup-content {
            padding: 0 !important; /* Override default padding if needed */
            box-shadow: 0 1px 2px rgba(0,0,0,.1);
            border-radius: 4px;
        }
      `}</style>
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
