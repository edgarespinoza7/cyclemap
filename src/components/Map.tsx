"use client";

import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useRef, useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { useParams, usePathname } from "next/navigation";
import type { FeatureCollection, Point } from "geojson";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

type NetworkSummary = {
  id: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
    city: string;
    country: string;
  };
};

interface Station {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  free_bikes: number;
  empty_slots: number;
  extra: {
    address: string;
    uid: string;
    renting: number;
    returning: number;
    last_updated: number;
    has_ebikes: boolean;
    ebikes: number;
    payment: string[];
    "payment-terminal": boolean;
    slots: number;
    rental_uris: {
      [key: string]: string;
    };
  };
}

// Define layer and source IDs
const NETWORK_SOURCE_ID = "network-locations";
const NETWORK_LAYER_ID = "network-points-layer";
const NETWORK_HIGHLIGHT_LAYER_ID = "network-points-highlight-layer";
// --- Add Station Source/Layer IDs ---
const STATION_SOURCE_ID = "station-locations";
const STATION_LAYER_ID = "station-points-layer";
// --- End Station Source/Layer IDs ---

export default function Map({ networks }: { networks: NetworkSummary[] }) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const params = useParams();
  const pathname = usePathname();

  // State for Stations
  const [currentStations, setCurrentStations] = useState<Station[] | null>(
    null
  );

  // Function to convert network summary data to GeoJSON
  const convertNetworksToGeoJSON = useCallback(
    (networkData: NetworkSummary[]): FeatureCollection<Point> => {
      return {
        type: "FeatureCollection",
        features: networkData.map((n) => ({
          type: "Feature",
          // Use network ID for the feature ID if possible and unique
          // id: n.id, // Optional: Mapbox can use this for feature state
          geometry: {
            type: "Point",
            coordinates: [n.location.longitude, n.location.latitude],
          },
          properties: {
            id: n.id, // Store id in properties for filtering/popups
            name: n.name,
            city: n.location.city,
            country: n.location.country,
            dataType: "network", // Differentiate from stations if needed
          },
        })),
      };
    },
    []
  );

  // --- Add Function to convert station data to GeoJSON ---
  const convertStationsToGeoJSON = useCallback(
    (stationData: Station[]): FeatureCollection<Point> => {
      return {
        type: "FeatureCollection",
        features: stationData.map((s) => ({
          type: "Feature",
          // Use station ID for the feature ID if possible and unique
          // id: s.id, // Optional
          geometry: {
            type: "Point",
            coordinates: [s.longitude, s.latitude],
          },
          properties: {
            id: s.id,
            name: s.name,
            free_bikes: s.free_bikes,
            empty_slots: s.empty_slots,
            dataType: "station", // Differentiate from networks if needed
          },
        })),
      };
    },
    []
  );

  // --- Function to fetch stations for a specific network ---
  const fetchStationsForNetwork = async (networkId: string) => {
    try {
      const response = await fetch(
        `http://api.citybik.es/v2/networks/${networkId}`
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch stations for ${networkId}`);
      }
      const data = await response.json();
      setCurrentStations(data.network.stations || []); // Set state
    } catch (error) {
      console.error("Error fetching station data:", error);
      setCurrentStations(null); // Clear stations on error
    }
  };
  // --- End Fetch Stations Function ---

  // Effect to initialize the map
  // and set up layers and event listeners
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: [0, 20],
      zoom: 2,
      projection: "mercator",
      antialias: true,
    });

    mapRef.current = map;

    map.on("load", () => {
      if (!mapRef.current) return;
      const mapInstance = mapRef.current; // Use local variable for clarity

      // 1. Add Source and Layers for Networks
      const networkGeojsonData = convertNetworksToGeoJSON(networks);
      mapInstance.addSource(NETWORK_SOURCE_ID, {
        type: "geojson",
        data: networkGeojsonData,
      });

      // Add a layer for the network points
      mapInstance.addLayer({
        id: NETWORK_LAYER_ID,
        type: "circle",
        source: NETWORK_SOURCE_ID,
        paint: {
          "circle-radius": 4,
          "circle-color": "rgba(249, 115, 22, 0.7)", // Orange for networks
          "circle-stroke-width": 1,
          "circle-stroke-color": "rgb(249, 115, 22)",
          "circle-opacity": [
            // Fade slightly on hover out
            "case",
            ["boolean", ["feature-state", "hover"], false],
            1,
            0.7,
          ],
        },
      });

      // Add a highlight layer for the network points
      mapInstance.addLayer({
        id: NETWORK_HIGHLIGHT_LAYER_ID,
        type: "circle",
        source: NETWORK_SOURCE_ID,
        paint: {
          "circle-radius": 6,
          "circle-color": "rgba(234, 88, 12, 1)",
          "circle-stroke-width": 2,
          "circle-stroke-color": "rgba(124, 45, 18, 1)",
        },
        filter: ["==", ["get", "id"], ""], // Initially filter out everything
      });

      // 2. Add Source and Layer for Stations (initially empty)
      mapInstance.addSource(STATION_SOURCE_ID, {
        type: "geojson",
        data: convertStationsToGeoJSON([]), // Start with empty data
      });

      // Add a layer for the station points
      mapInstance.addLayer({
        id: STATION_LAYER_ID,
        type: "circle",
        source: STATION_SOURCE_ID,
        paint: {
          "circle-radius": 4, // Smaller circles for stations
          "circle-color": "rgba(34, 197, 94, 0.8)", // Green for stations
          "circle-stroke-width": 1,
          "circle-stroke-color": "rgb(22, 163, 74)",
        },
        // Initially hide station layer until zoomed in on a network? Optional.
        // 'minzoom': 10 // Example: Only show stations when zoom level is 10+
      });

      // --- Network Hover Effects ---
      let hoveredNetworkId: string | number | null = null;

      mapInstance.on("mouseenter", NETWORK_LAYER_ID, (e) => {
        if (e.features && e.features.length > 0) {
          mapInstance.getCanvas().style.cursor = "pointer";
          const featureId = e.features[0].properties?.id; // Get ID from properties
          if (hoveredNetworkId !== null && hoveredNetworkId !== featureId) {
            // Update feature state using the property ID
            mapInstance.setFeatureState(
              { source: NETWORK_SOURCE_ID, id: hoveredNetworkId }, // Note: setFeatureState might need numeric ID or promoteId usage
              { hover: false }
            );
          }
          hoveredNetworkId = featureId;
          if (hoveredNetworkId !== null) {
            mapInstance.setFeatureState(
              { source: NETWORK_SOURCE_ID, id: hoveredNetworkId },
              { hover: true }
            );
          }
        }
      });

      mapInstance.on("mouseleave", NETWORK_LAYER_ID, () => {
        mapInstance.getCanvas().style.cursor = "";
        if (hoveredNetworkId !== null) {
          mapInstance.setFeatureState(
            { source: NETWORK_SOURCE_ID, id: hoveredNetworkId },
            { hover: false }
          );
        }
        hoveredNetworkId = null;
      });

      // --- Network Click Popup ---
      mapInstance.on("click", NETWORK_LAYER_ID, (e) => {
        // ... (keep existing network popup logic) ...
        if (!e.features || e.features.length === 0) return;
        const feature = e.features[0];
        const coordinates = (feature.geometry as Point).coordinates.slice();
        const properties = feature.properties;

        if (
          typeof coordinates[0] !== "number" ||
          typeof coordinates[1] !== "number"
        )
          return;

        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
          coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }

        const popMessage = `<div class="p-2 max-w-xs"><p class="font-bold text-center text-base">${properties?.name}</p><p class="text-sm text-center">${properties?.city}, ${properties?.country}</p></div>`;

        if (popupRef.current) popupRef.current.remove();
        popupRef.current = new mapboxgl.Popup({
          offset: 15,
          closeButton: false,
        })
          .setLngLat(coordinates as [number, number])
          .setHTML(popMessage)
          .addTo(mapInstance);
      });
      // --- End Network Click ---

      // --- Station Click Popup (Optional) ---
      mapInstance.on("click", STATION_LAYER_ID, (e) => {
        if (!e.features || e.features.length === 0) return;
        const feature = e.features[0];
        const coordinates = (feature.geometry as Point).coordinates.slice();
        const properties = feature.properties; // Contains name, free_bikes, etc.

        if (
          typeof coordinates[0] !== "number" ||
          typeof coordinates[1] !== "number"
        )
          return;

        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
          coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }

        // Customize popup for stations
        const popMessage = `<div class="p-2 max-w-xs">
        <p class="font-bold text-base break-all">${properties?.name}</p>
        <div class="flex justify-between items-center text-sm mt-2">
        <p>Free Bikes </p>
        <p className="font-bold">${properties?.free_bikes}</p>
        </div>
        <div class="flex justify-between items-center text-sm">
        <p>Empty Slots</p>
        <p className="font-bold">${properties?.empty_slots}</p>
        </div>
        </div>`;

        if (popupRef.current) popupRef.current.remove();
        popupRef.current = new mapboxgl.Popup({
          offset: 15,
          closeButton: false,
        })
          .setLngLat(coordinates as [number, number])
          .setHTML(popMessage)
          .addTo(mapInstance);
      });
      // --- End Station Click ---
    });

    // Map Cleanup
    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
      if (popupRef.current) {
        popupRef.current.remove();
        popupRef.current = null;
      }
    };
    // Run only once on mount
  }, [convertNetworksToGeoJSON, convertStationsToGeoJSON, networks]); // Add convertStationsToGeoJSON here if needed outside useEffect

  // Effect to Handle Route Changes (Zoom, Highlight, Fetch/Display Stations)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const networkId = params.id as string | undefined;

    // Update Network Highlight Layer
    map.setFilter(
      NETWORK_HIGHLIGHT_LAYER_ID,
      networkId ? ["==", ["get", "id"], networkId] : ["==", ["get", "id"], ""]
    );

    // --- Logic for fetching and displaying stations ---
    const stationSource = map.getSource(STATION_SOURCE_ID) as
      | mapboxgl.GeoJSONSource
      | undefined;

    if (networkId) {
      // We are on a network detail page
      const targetNetwork = networks.find((n) => n.id === networkId);

      // Fly to network location
      if (targetNetwork?.location) {
        map.flyTo({
          center: [
            targetNetwork.location.longitude,
            targetNetwork.location.latitude,
          ],
          zoom: 12, // Zoom closer for detail view
          essential: true,
        });
      }

      // Fetch stations for this network ID
      fetchStationsForNetwork(networkId); // This will update currentStations state
    } else {
      // We are on the main list page (or other page without network id)
      setCurrentStations(null); // Clear station state

      // Fly back to overview
      if (pathname === "/") {
        if (map.getZoom() > 4) {
          // Only fly back if zoomed in
          map.flyTo({ center: [0, 20], zoom: 2, essential: true });
        }
        // Close any open popup when returning home
        if (popupRef.current) {
          popupRef.current.remove();
          popupRef.current = null;
        }
      }

      // Clear station data from map source
      if (stationSource) {
        stationSource.setData(convertStationsToGeoJSON([]));
      }
    }
    // --- End Station Logic ---
  }, [params, pathname, networks, convertStationsToGeoJSON]); // Add convertStationsToGeoJSON

  // --- Effect to Update Station Layer When State Changes ---
  useEffect(() => {
    const map = mapRef.current;
    const stationSource = map?.getSource(STATION_SOURCE_ID) as
      | mapboxgl.GeoJSONSource
      | undefined;

    if (map && map.isStyleLoaded() && stationSource) {
      // Update the GeoJSON data for the station source
      stationSource.setData(convertStationsToGeoJSON(currentStations || []));
    }
  }, [currentStations, convertStationsToGeoJSON]); // Depend on station state
  // --- End Station Update Effect ---

  // Function that handles the "Near me" button click
  // It uses the Geolocation API to get the user's current position and set it as the map center

  const handleLocate = () => {
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
          zoom: 8,
        });
      },
      (error) => console.error("Geolocation error:", error),
      {
        enableHighAccuracy: true,
        timeout: 5000,
        maximumAge: 0,
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
// --- End Zoom Functions ---
