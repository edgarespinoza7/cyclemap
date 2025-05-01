"use client";

import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useParams, usePathname } from "next/navigation";
import {
  convertNetworksToGeoJSON,
  convertStationsToGeoJSON,
} from "@/lib/geojsonUtils";
import type { Point } from "geojson";
import type { NetworkMapSummary, Station } from "@/lib/types";
import { getNetworkDetailsById } from "@/lib/api";
import { Locate, Plus, Minus } from "lucide-react";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

// Network Source/Layer IDs
const NETWORK_SOURCE_ID = "network-locations";
const NETWORK_LAYER_ID = "network-points-layer";
const NETWORK_HIGHLIGHT_LAYER_ID = "network-points-highlight-layer";
// Station Source/Layer IDs
const STATION_SOURCE_ID = "station-locations";
const STATION_LAYER_ID = "station-points-layer";

export default function Map({ networks }: { networks: NetworkMapSummary[] }) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const params = useParams();
  const pathname = usePathname();

  // State for Stations
  const [currentStations, setCurrentStations] = useState<Station[] | null>(
    null
  );

  // Fetchs stations for a specific network
  const fetchStationsForNetwork = async (networkId: string) => {
    try {
      const networkDetails = await getNetworkDetailsById(networkId);
      if (!networkDetails) {
        throw new Error(`Network with ID ${networkId} not found`);
      }
      setCurrentStations(networkDetails.stations || []);
    } catch (error) {
      console.error("Error fetching station data:", error);
      setCurrentStations(null);
    }
  };

  // Initializes the map and set up layers and event listeners
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    // Determine initial map center based on Url path
    const initialNetworkId = params.id as string | undefined;
    let initialCenter: [number, number] = [0, 20]; // Default center
    let initialZoom = 2; // Default zoom level

    if (initialNetworkId) {
      const targetNetwork = networks.find((n) => n.id === initialNetworkId);
      if (targetNetwork?.location) {
        initialCenter = [
          targetNetwork.location.longitude,
          targetNetwork.location.latitude,
        ];
        initialZoom = 12; // Zoom closer for detail view
      }
    }

    const map = new mapboxgl.Map({
      container: mapContainer.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: initialCenter,
      zoom: initialZoom,
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
          "circle-color": "rgba(249, 115, 22, 0.7)", // Orange color for networks
          "circle-stroke-width": 1,
          "circle-stroke-color": "rgb(249, 115, 22)",
          "circle-opacity": [
            "case",
            ["boolean", ["feature-state", "hover"], false],
            1,
            0.7,
          ],
        },
      });

      // Adds a highlight layer for the network points
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
        filter: initialNetworkId
          ? ["==", ["get", "id"], initialNetworkId]
          : ["==", ["get", "id"], ""],
      });

      // 2. Adds Source and Layer for Stations (initially empty)
      mapInstance.addSource(STATION_SOURCE_ID, {
        type: "geojson",
        data: convertStationsToGeoJSON([]),
      });

      // Adds a layer for the station points
      mapInstance.addLayer({
        id: STATION_LAYER_ID,
        type: "circle",
        source: STATION_SOURCE_ID,
        paint: {
          "circle-radius": 4,
          "circle-color": "rgba(34, 197, 94, 0.8)", // Green color for stations
          "circle-stroke-width": 1,
          "circle-stroke-color": "rgb(22, 163, 74)",
        },
      });

      // Network Hover Effects
      let hoveredNetworkId: string | number | null = null;

      mapInstance.on("mouseenter", NETWORK_LAYER_ID, (e) => {
        if (e.features && e.features.length > 0) {
          mapInstance.getCanvas().style.cursor = "pointer";
          const featureId = e.features[0].properties?.id;
          if (hoveredNetworkId !== null && hoveredNetworkId !== featureId) {
            // Updates feature state using the property ID
            mapInstance.setFeatureState(
              { source: NETWORK_SOURCE_ID, id: hoveredNetworkId },
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

      // Network Click Popup
      mapInstance.on("click", NETWORK_LAYER_ID, (e) => {
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

      // Station Click Popup
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
        const popMessage = `<div class="p-2 max-w-md min-w-45">
        <p class="font-bold text-base break-all">${properties?.name}</p>
        <div class="flex justify-between items-center text-sm mt-2">
        <p class="text-muted-foreground">Free Bikes</p>
        <p class="font-bold">${properties?.free_bikes}</p>
        </div>
        <div class="flex justify-between items-center text-sm">
        <p class="text-muted-foreground">Empty Slots</p>
        <p class="font-bold">${properties?.empty_slots}</p>
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
      // Fetch stations immediately if we loaded on a detail page
      if (initialNetworkId) {
        fetchStationsForNetwork(initialNetworkId);
      }
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
  }, [networks]);

  // Handles Route Changes (Zoom, Highlight, Fetch/Display Stations)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;

    const networkId = params.id as string | undefined;

    // Updates Network Highlight Layer
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

      // Check if we need to animate the map view
      let needsFlyTo = true;

      if (targetNetwork?.location) {
        const currentCenter = map.getCenter();
        const currentZoom = map.getZoom();
        const targetCoords: [number, number] = [
          targetNetwork.location.longitude,
          targetNetwork.location.latitude,
        ];
        // Check if map is already roughly centered and zoomed (avoids flyTo on reload)
        if (
          Math.abs(currentCenter.lng - targetCoords[0]) < 0.001 &&
          Math.abs(currentCenter.lat - targetCoords[1]) < 0.001 &&
          Math.abs(currentZoom - 12) < 0.1
        ) {
          needsFlyTo = false;
        }
      }

      // Fly to network location only if needed (i.e., during navigation, not reload)
      if (needsFlyTo && targetNetwork?.location) {
        map.flyTo({
          center: [
            targetNetwork.location.longitude,
            targetNetwork.location.latitude,
          ],
          zoom: 12, // Zoom closer for detail view
          essential: true,
        });
      }
      // Fetch stations if not already loaded or if network changed
      // (Simple fetch here is okay, but could be optimized further if needed)
      fetchStationsForNetwork(networkId);
    } else {
      // We are on the main list page (or other page without network id)
      setCurrentStations(null); // Clear station state

      // Fly back to overview
      if (pathname === "/") {
        if (map.getZoom() > 4) {
          const currentCenter = map.getCenter();
          const currentZoom = map.getZoom();
          let needsFlyTo = true;
          if (
            Math.abs(currentCenter.lng - 0) < 0.001 &&
            Math.abs(currentCenter.lat - 20) < 0.001 &&
            Math.abs(currentZoom - 2) < 0.1
          ) {
            needsFlyTo = false;
          }
          if (needsFlyTo) {
            map.flyTo({ center: [0, 20], zoom: 2, essential: true });
          }
        }
        // Close any open popup when returning home
        if (popupRef.current) {
          popupRef.current.remove();
          popupRef.current = null;
        }
      }

      if (stationSource) {
        stationSource.setData(convertStationsToGeoJSON([]));
      }
    }
  }, [params, pathname, networks]);

  // Updates Station Layer When State Changes
  useEffect(() => {
    const map = mapRef.current;
    const stationSource = map?.getSource(STATION_SOURCE_ID) as
      | mapboxgl.GeoJSONSource
      | undefined;

    if (map && map.isStyleLoaded() && stationSource) {
      stationSource.setData(convertStationsToGeoJSON(currentStations || []));
    }
  }, [currentStations]);

  // Handles the "Near me" button
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

  // Zoom in and zoom out handlers
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
      <div className="absolute top-8 left-8 z-10">
        <Button
          onClick={handleLocate}
          className="bg-[#363698] rounded-2xl hover:bg-[#5050DB]"
        >
          <span>
            <Locate />
          </span>
          Near me
        </Button>
      </div>
      <div className="absolute top-8 right-6 z-10 flex flex-col shadow-xl bg-white rounded-2xl">
        <Button
          variant="ghost"
          onClick={handleZoomIn}
          className="rounded-t-2xl rounded-b-none"
        >
          <Plus className="text-[#363698] " />
        </Button>
        <Button
          variant="ghost"
          onClick={handleZoomOut}
          className="rounded-b-2xl rounded-t-none"
        >
          <Minus className="text-[#363698]" />
        </Button>
      </div>
    </div>
  );
}
