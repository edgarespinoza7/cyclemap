"use client";

import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import {
  convertNetworksToGeoJSON,
  convertStationsToGeoJSON,
} from "@/lib/geojsonUtils";
import type { Point } from "geojson";
import type { NetworkMapSummary, Station } from "@/lib/types";
import { getNetworkDetailsById } from "@/lib/api";
import { Locate, Plus, Minus } from "lucide-react";
import { useMapInteraction } from "@/context/MapInteractionContext";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

// Default Map View Settings
const DEFAULT_MAP_CENTER: [number, number] = [0, 20];
const DEFAULT_MAP_ZOOM = 2;
const DETAIL_MAP_ZOOM = 12;

// Network Source/Layer IDs
const NETWORK_SOURCE_ID = "network-locations";
const NETWORK_LAYER_ID = "network-points-layer";
const NETWORK_HIGHLIGHT_LAYER_ID = "network-points-highlight-layer";
// Station Source/Layer IDs
const STATION_SOURCE_ID = "station-locations";
const STATION_LAYER_ID = "station-points-layer";

// --- Helper Functions ---

/**
 * Creates and displays a Mapbox GL Popup.
 * Removes any existing popup managed by the popupRef.
Unchanged lines
 * @param htmlContent The HTML content for the popup.
 * @param popupRef Ref to store the popup instance.
 */

const createAndShowPopup = (
  map: mapboxgl.Map,
  coordinates: [number, number],
  htmlContent: string,
  popupRef: React.MutableRefObject<mapboxgl.Popup | null>
) => {
  if (popupRef.current) {
    popupRef.current.remove();
  }
  popupRef.current = new mapboxgl.Popup({
    offset: 15,
    closeButton: false,
    closeOnClick: false, // Keep open until explicitly closed or replaced
  })
    .setLngLat(coordinates)
    .setHTML(htmlContent)
    .addTo(map);
  return popupRef.current; // Return the new popup instance
};

/**
 * Checks if the map needs to fly to a new location/zoom.
 * Avoids unnecessary animations if the map is already close to the target.
 */
const shouldFlyTo = (
  map: mapboxgl.Map,
  targetCoords: [number, number],
  targetZoom: number,
  tolerance = 0.001 // How close is considered "close enough"
): boolean => {
  const currentCenter = map.getCenter();
  const currentZoom = map.getZoom();
  const lngDiff = Math.abs(currentCenter.lng - targetCoords[0]);
  const latDiff = Math.abs(currentCenter.lat - targetCoords[1]);
  const zoomDiff = Math.abs(currentZoom - targetZoom);

  return lngDiff > tolerance || latDiff > tolerance || zoomDiff > 0.1;
};

export default function Map({ networks }: { networks: NetworkMapSummary[] }) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const params = useParams();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { selectedStation } = useMapInteraction();
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

  // --- Map Setup Functions ---
  /** Sets up the sources and layers for networks and stations */
  const setupMapLayers = (map: mapboxgl.Map, initialNetworkId?: string) => {
    // 1. Add Source and Layers for Networks
    const networkGeojsonData = convertNetworksToGeoJSON(networks);
    if (!map.getSource(NETWORK_SOURCE_ID)) {
      map.addSource(NETWORK_SOURCE_ID, {
        type: "geojson",
        data: networkGeojsonData,
      });
    }

    if (!map.getLayer(NETWORK_LAYER_ID)) {
      map.addLayer({
        id: NETWORK_LAYER_ID,
        type: "circle",
        source: NETWORK_SOURCE_ID,
        paint: {
          "circle-radius": 4,
          "circle-color": "rgba(249, 115, 22, 0.7)", // Orange color for networks
          "circle-stroke-width": 1,
          "circle-stroke-color": "rgb(249, 115, 22)",
          "circle-opacity": [
            // Use feature-state for hover effect
            "case",
            ["boolean", ["feature-state", "hover"], false],
            1, // Opacity when hovered
            0.7, // Default opacity
          ],
        },
      });
    }

    if (!map.getLayer(NETWORK_HIGHLIGHT_LAYER_ID)) {
      map.addLayer({
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
          : ["==", ["get", "id"], ""], // Initially filter to nothing if no ID
      });
    }

    // 2. Adds Source and Layer for Stations (initially empty)
    if (!map.getSource(STATION_SOURCE_ID)) {
      map.addSource(STATION_SOURCE_ID, {
        type: "geojson",
        data: convertStationsToGeoJSON([]), // Start empty
      });
    }

    if (!map.getLayer(STATION_LAYER_ID)) {
      map.addLayer({
        id: STATION_LAYER_ID,
        type: "circle",
        source: STATION_SOURCE_ID,
        paint: {
          "circle-radius": 5,
          "circle-color": "rgba(243, 123, 68, 0.8)", // Slightly different orange for stations
          "circle-stroke-width": 1,
          "circle-stroke-color": "rgb(243, 123, 68)",
        },
      });
    }
  };

  /** Sets up map event listeners (hover, click) */
  const setupMapEventListeners = (map: mapboxgl.Map) => {
    let hoveredNetworkId: string | number | null = null;

    // --- Network Hover Listeners ---
    map.on("mouseenter", NETWORK_LAYER_ID, (e) => {
      // ... (rest of mouseenter logic remains the same)
      if (e.features && e.features.length > 0) {
        map.getCanvas().style.cursor = "pointer";
        const featureId = e.features[0].id; // Use feature id directly if available and numeric
        if (hoveredNetworkId !== null && hoveredNetworkId !== featureId) {
          map.setFeatureState(
            { source: NETWORK_SOURCE_ID, id: hoveredNetworkId },
            { hover: false }
          );
        }
        hoveredNetworkId = featureId ?? null;
        if (hoveredNetworkId !== null) {
          map.setFeatureState(
            { source: NETWORK_SOURCE_ID, id: hoveredNetworkId },
            { hover: true }
          );
        }
      }
    });

    map.on("mouseleave", NETWORK_LAYER_ID, () => {
      // ... (rest of mouseleave logic remains the same)
      map.getCanvas().style.cursor = "";
      if (hoveredNetworkId !== null) {
        map.setFeatureState(
          { source: NETWORK_SOURCE_ID, id: hoveredNetworkId },
          { hover: false }
        );
      }
      hoveredNetworkId = null;
    });

    // --- Network Click Listener ---
    map.on("click", NETWORK_LAYER_ID, (e) => {
      // ... (rest of network click logic remains the same, but use createAndShowPopup)
      if (!e.features || e.features.length === 0) return;
      const feature = e.features[0];
      const coordinates = (feature.geometry as Point).coordinates.slice();
      const properties = feature.properties;

      if (
        typeof coordinates[0] !== "number" ||
        typeof coordinates[1] !== "number"
      )
        return;

      // Adjust longitude for map wrapping
      while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
      }

      const popMessage = `
      <div class="p-2 max-w-xs text-center">
        <p class="font-bold text-lg text-[#363698]">${properties?.name}</p>
        <p class="text-sm mb-2">${properties?.city}, ${properties?.country}</p>
        <button id="view-network-button" data-network-id="${properties?.id}" class="text-xs focus:outline-none cursor-pointer hover:bg-[#E2EAFD] py-1.5 px-2.5 border border-[#CAD7FB] rounded-full text-[#363698]">View Details</button>
      </div>`;

      const popup = createAndShowPopup(
        map,
        coordinates as [number, number],
        popMessage,
        popupRef
      );

      // Add event listener to the button inside the new popup
      const popupNode = popup?.getElement();
      const viewButton = popupNode?.querySelector("#view-network-button");
      if (viewButton) {
        // Use a one-time listener or manage removal if popup can be closed manually
        viewButton.addEventListener(
          "click",
          (event) => {
            const target = event.target as HTMLButtonElement;
            const networkId = target.getAttribute("data-network-id");
            if (networkId) {
              router.push(`/networks/${networkId}`);
            }
          },
          { once: true }
        ); // Add listener only once
      }
    });

    // --- Station Click Listener ---
    map.on("click", STATION_LAYER_ID, (e) => {
      // ... (rest of station click logic remains the same, but use createAndShowPopup)
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

      const popMessage = `<div class="p-2 max-w-md min-w-45 ">
      <p class="font-bold text-base text-[#363698] break-all">${
        properties?.name
      }</p>
      <div class="flex justify-between items-center text-sm mt-2">
      <p class="text-muted-foreground">Free Bikes</p>
      <p class="font-bold">${properties?.free_bikes ?? "N/A"}</p>
      </div>
      <div class="flex justify-between items-center text-sm">
      <p class="text-muted-foreground">Empty Slots</p>
      <p class="font-bold">${properties?.empty_slots ?? "N/A"}</p>
      </div>
      </div>`;

      createAndShowPopup(
        map,
        coordinates as [number, number],
        popMessage,
        popupRef
      );
    });
  };

  // Initializes the map and set up layers and event listeners
  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    // Determine initial map center based on Url path
    const initialNetworkId = params.id as string | undefined;
    let initialCenter = DEFAULT_MAP_CENTER;
    let initialZoom = DEFAULT_MAP_ZOOM;

    if (initialNetworkId) {
      const targetNetwork = networks.find((n) => n.id === initialNetworkId);
      if (targetNetwork?.location) {
        initialCenter = [
          targetNetwork.location.longitude,
          targetNetwork.location.latitude,
        ];
        initialZoom = DETAIL_MAP_ZOOM; // Zoom closer for detail view
      }
    }

    const map = new mapboxgl.Map({
      container: mapContainer.current!,
      style: "mapbox://styles/mapbox/light-v11",
      center: initialCenter,
      zoom: initialZoom,
      projection: "mercator",
      antialias: true,
    });

    mapRef.current = map;

    map.on("load", () => {
      if (!mapRef.current) return;

      const map = mapRef.current;
      setupMapLayers(map, initialNetworkId);
      setupMapEventListeners(map);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Reason: We only want to initialize the map instance once.
  // Subsequent route changes and view updates are handled by the second useEffect.

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

    // Logic for fetching and displaying station
    if (networkId) {
      const targetNetwork = networks.find((n) => n.id === networkId);

      if (targetNetwork?.location) {
        const targetCoords: [number, number] = [
          targetNetwork.location.longitude,
          targetNetwork.location.latitude,
        ];

        // Fly to network location only if needed (i.e., during navigation, not reload)
        if (shouldFlyTo(map, targetCoords, DETAIL_MAP_ZOOM)) {
          popupRef.current?.remove();
          popupRef.current = null;

          map.flyTo({
            center: [
              targetNetwork.location.longitude,
              targetNetwork.location.latitude,
            ],
            zoom: 12, // Zoom closer for detail view
            essential: true,
          });
        }
        // Fetch stations for the selected network
        fetchStationsForNetwork(networkId);
      } else {
        // Network ID in URL, but not found in networks list? Handle error or clear state.
        console.warn(
          `Network with ID ${networkId} not found in provided list.`
        );
        setCurrentStations(null); // Clear station state
        // Optionally fly home if network not found
        // if (shouldFlyTo(map, DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM)) { ... }
      }
    } else {
      setCurrentStations(null); // Clear station state as we are not viewing a specific network

      // Fly back to overview if on the home page and map isn't already there
      // This handles both navigating back AND clearing filters like "All Countries"
      if (pathname === "/") {
        if (shouldFlyTo(map, DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM)) {
          // Close any existing popup *before* flying
          popupRef.current?.remove();
          popupRef.current = null;
          // Fly back to the default overview
          map.flyTo({
            center: DEFAULT_MAP_CENTER,
            zoom: DEFAULT_MAP_ZOOM,
            essential: true,
          });
        }
      }

      if (popupRef.current) {
        popupRef.current.remove();
        popupRef.current = null;
      }
    }
  }, [params, pathname, searchParams, networks]); // React to route, path, query params, and network list changes

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

  // Handles showing popup when selectedStation changes via context
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded() || !selectedStation) {
      // If no station selected, ensure popup is closed
      if (popupRef.current) {
        popupRef.current.remove();
        popupRef.current = null;
      }
      return;
    }

    // A station IS selected via context
    const { longitude, latitude, name, free_bikes, empty_slots } =
      selectedStation;
    const coordinates: [number, number] = [longitude, latitude];

    // Create popup content
    const popMessage = `<div class="p-2 max-w-md min-w-45">
      <p class="font-bold text-base break-all text-[#363698]">${name}</p>
      <div class="flex justify-between items-center text-sm mt-2">
        <p class="text-muted-foreground">Free Bikes</p>
        <p class="font-bold">${free_bikes ?? "N/A"}</p>
      </div>
      <div class="flex justify-between items-center text-sm">
        <p class="text-muted-foreground">Empty Slots</p>
        <p class="font-bold">${empty_slots ?? "N/A"}</p>
      </div>
    </div>`;

    // Use the helper function to create/show the popup
    createAndShowPopup(map, coordinates, popMessage, popupRef);

    // Optional: Fly to the station if desired when selected from the list
    // map.flyTo({ center: coordinates, zoom: 15 }); // Adjust zoom as needed
  }, [selectedStation]); // Re-run when the selected station from context changes

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

  // Zoom in / zoom out handlers
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
