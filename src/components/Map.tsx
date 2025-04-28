"use client";

import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useRef, useCallback } from "react";
import type { MapMouseEvent } from "mapbox-gl";
import { Button } from "@/components/ui/button";
import { useParams, usePathname } from "next/navigation";
import type { FeatureCollection, Point } from 'geojson';

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

// Define layer and source IDs
const SOURCE_ID = 'network-locations';
const LAYER_ID = 'network-points-layer';
const HIGHLIGHT_LAYER_ID = 'network-points-highlight-layer'; // For highlighting

export default function Map({ networks }: { networks: Network[] }) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  const popupRef = useRef<mapboxgl.Popup | null>(null); // Define popupRef
  const params = useParams(); 
  const pathname = usePathname(); 

  const convertToGeoJSON = useCallback((networkData: Network[]): FeatureCollection<Point> => {
    return {
      type: "FeatureCollection",
      features: networkData.map((n) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [n.location.longitude, n.location.latitude],
        },
        properties: { 
          id: n.id,
          name: n.name,
          city: n.location.city,
          country: n.location.country,
          
        },
      })),
    };
  }, []); 

  useEffect(() => {
    if (!mapContainer.current) return;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [0, 20],
      zoom: 2,
      projection: "mercator",
      antialias: true,
    });

    mapRef.current = map;

    map.on('load', () => {
      if (!mapRef.current) return; // Check if map still exists

      const geojsonData = convertToGeoJSON(networks);

      // Add the source
      mapRef.current.addSource(SOURCE_ID, {
        type: 'geojson',
        data: geojsonData,
      });

      // Add the main layer for network points (using circles here)
      mapRef.current.addLayer({
        id: LAYER_ID,
        type: 'circle',
        source: SOURCE_ID,
        paint: {
          'circle-radius': 4, // Base radius
          'circle-color': 'rgba(249, 115, 22, 0.7)', // Base color (orange-500/70)
          'circle-stroke-width': 1,
          'circle-stroke-color': 'rgb(249, 115, 22)', // orange-500
          // --- Add hover effect using feature-state ---
          'circle-opacity': [
            'case',
            ['boolean', ['feature-state', 'hover'], false],
            1, // Fully opaque when hovered
            0.7, // Default opacity
          ],
        },
      });

      // Add a layer specifically for highlighting the selected point
      mapRef.current.addLayer({
          id: HIGHLIGHT_LAYER_ID,
          type: 'circle',
          source: SOURCE_ID,
          paint: {
              'circle-radius': 9, // Slightly larger than hover
              'circle-color': 'rgba(234, 88, 12, 1)', // Darker orange
              'circle-stroke-width': 2,
              'circle-stroke-color': 'rgba(124, 45, 18, 1)', // Even darker border
          },
          filter: ['==', ['get', 'id'], ''] // Initially filter out everything
      });

      // --- Interaction Handlers ---
      let hoveredFeatureId: string | number | null = null;

      // Mouse Enter for Hover Effect
      mapRef.current.on('mouseenter', LAYER_ID, (e: MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] }) => {
          if (e.features && e.features.length > 0) {
              mapRef.current!.getCanvas().style.cursor = 'pointer';
              if (hoveredFeatureId !== null) {
                  mapRef.current!.setFeatureState({ source: SOURCE_ID, id: hoveredFeatureId }, { hover: false });
              }
              hoveredFeatureId = e.features[0].id ?? e.features[0].properties?.id; // GeoJSON features might not have top-level id
              if (hoveredFeatureId !== null) {
                 mapRef.current!.setFeatureState({ source: SOURCE_ID, id: hoveredFeatureId }, { hover: true });
              }
          }
      });

      // Mouse Leave for Hover Effect
      mapRef.current.on('mouseleave', LAYER_ID, () => {
          mapRef.current!.getCanvas().style.cursor = '';
          if (hoveredFeatureId !== null) {
              mapRef.current!.setFeatureState({ source: SOURCE_ID, id: hoveredFeatureId }, { hover: false });
          }
          hoveredFeatureId = null;
      });


      // Click Handler for Popups
      mapRef.current.on('click', LAYER_ID, (e: MapMouseEvent & { features?: mapboxgl.MapboxGeoJSONFeature[] }) => {
        if (!e.features || e.features.length === 0) return;

        const feature = e.features[0];
        const coordinates = (feature.geometry as Point).coordinates.slice();
        const properties = feature.properties;

        // Ensure coordinates are numbers and not something else
        if (typeof coordinates[0] !== 'number' || typeof coordinates[1] !== 'number') {
            console.error("Invalid coordinates for popup:", coordinates);
            return;
        }

        // Ensure popup doesn't appear over controls or fly infinitely on mobile
        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
          coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }

        const popMessage = `<div class="p-2 max-w-xs"><p class="font-bold text-center text-base">${properties?.name}</p><p class="text-sm text-center">${properties?.city}, ${properties?.country}</p></div>`;

        // Remove existing popup if it exists
        if (popupRef.current) {
            popupRef.current.remove();
        }

        // Create and add new popup
        popupRef.current = new mapboxgl.Popup({ offset: 15, closeButton: false })
          .setLngLat(coordinates as [number, number])
          .setHTML(popMessage)
          .addTo(mapRef.current!);

        // Optional: Navigate when clicking the point on the map
        // if (properties?.id) {
        //    router.push(`/networks/${properties.id}`); // Assuming you have access to router here or pass it as prop
        // }
      });
    });

    // Cleanup function
    return () => {
      map.remove();
      mapRef.current = null;
      if (popupRef.current) {
          popupRef.current.remove();
          popupRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [convertToGeoJSON]); // Depend on the memoized function, networks prop is implicitly handled by it


  // Effect to react to route changes (highlighting)
  useEffect(() => {
    if (!mapRef.current || !mapRef.current.isStyleLoaded()) return; // Ensure map and style are ready

    const networkId = params.id as string | undefined;

    // Update the filter for the highlight layer
    mapRef.current.setFilter(HIGHLIGHT_LAYER_ID, networkId ? ['==', ['get', 'id'], networkId] : ['==', ['get', 'id'], '']);

    if (networkId) {
      const targetNetwork = networks.find(n => n.id === networkId);
      if (targetNetwork?.location) {
        mapRef.current.flyTo({
          center: [targetNetwork.location.longitude, targetNetwork.location.latitude],
          zoom: 12, // Zoom closer for detail view
          essential: true // Ensures animation completes
        });

        // Optional: Open popup for the selected network automatically
        // You might need to query the feature to get its exact coordinates if not readily available
        // map.queryRenderedFeatures(...) could be used here, then create/show popup.
        // For simplicity, we'll rely on the highlight layer for visual cue.

      }
    } else if (pathname === '/') {
      // Fly back to default view only if not already there or close
       if (mapRef.current.getZoom() > 4) { // Avoid unnecessary flyTo on initial load
           mapRef.current.flyTo({ center: [0, 20], zoom: 2, essential: true });
       }
       // Close any open popup when returning home
       if (popupRef.current) {
           popupRef.current.remove();
           popupRef.current = null;
       }
    }

  }, [params, pathname, networks]); // Include networks in case the list changes fundamentally


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
