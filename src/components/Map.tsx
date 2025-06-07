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
import type { Network, Station } from "@/lib/types";
import { Locate, Plus, Minus } from "lucide-react";
import { useMapInteraction } from "@/context/MapInteractionContext";
import { fetchStationsForNetwork } from "@/lib/api";

mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN!;

// Default Map View Settings
const DEFAULT_MAP_CENTER: [number, number] = [0, 20];
const DEFAULT_MAP_ZOOM = 2;
const DETAIL_MAP_ZOOM = 10;

// Network Source/Layer IDs
const NETWORK_SOURCE_ID = "network-locations";
const NETWORK_LAYER_ID = "network-points-layer";
const NETWORK_HIGHLIGHT_LAYER_ID = "network-points-highlight-layer";

// Station Source/Layer IDs
const STATION_SOURCE_ID = "station-locations";
const STATION_LAYER_ID = "station-points-layer";

// -- Helper Functions
/// Creates and shows a popup on the map
const createAndShowPopup = (
  map: mapboxgl.Map,
  coordinates: [number, number],
  htmlContent: string,
  popupRef: React.RefObject<mapboxgl.Popup | null>
) => {
  // Clean up any existing popup
  if (popupRef.current) {
    popupRef.current.remove();
  }
  // Create a new popup instance
  popupRef.current = new mapboxgl.Popup({
    offset: 15,
    closeButton: false,
    closeOnClick: true, // Keep open until explicitly closed or replaced
  })
    .setLngLat(coordinates)
    .setHTML(htmlContent)
    .addTo(map);
  return popupRef.current; // Return the new popup instance
};

// Checks if the map is already close to the target coordinates and zoom level
const shouldFlyTo = (
  map: mapboxgl.Map,
  targetCoords: [number, number],
  targetZoom: number,
  tolerance = 0.001 // Tolerance for lat/lng difference
): boolean => {
  // Get the map's current state
  const currentCenter = map.getCenter();
  const currentZoom = map.getZoom();

  // Calculate the differences between current and target states
  const lngDiff = Math.abs(currentCenter.lng - targetCoords[0]); // Difference in longitude
  const latDiff = Math.abs(currentCenter.lat - targetCoords[1]); // Difference in latitude
  const zoomDiff = Math.abs(currentZoom - targetZoom); // Difference in zoom

  // Decide if the differences are significant enough to warrant a "flyTo" animation
  return lngDiff > tolerance || latDiff > tolerance || zoomDiff > 0.1;
};

export default function Map({ networks }: { networks: Network[] }) {
  // Refs for DOM element and Mapbox instances
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);

  // Next.js Routing Hooks
  const params = useParams();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  // Custom Context Hook
  const { selectedStation } = useMapInteraction();
  // State for Stations data
  const [currentStations, setCurrentStations] = useState<Station[] | null>(
    null
  );

  // Map Setup Functions
  // Sets up the sources and layers for networks and stations
  const setupMapLayers = (map: mapboxgl.Map, initialNetworkId?: string) => {
    // 1. Add Source and Layers for Networks
    // Network data must be converted into GeoJSON format
    const networkGeojsonData = convertNetworksToGeoJSON(networks);
    // Check if the source for network locations already exists. If not, add it.
    if (!map.getSource(NETWORK_SOURCE_ID)) {
      map.addSource(NETWORK_SOURCE_ID, {
        type: "geojson",
        data: networkGeojsonData,
      });
    }

    // Add a layer to visually represent the networks.
    if (!map.getLayer(NETWORK_LAYER_ID)) {
      map.addLayer({
        id: NETWORK_LAYER_ID,
        type: "circle",
        source: NETWORK_SOURCE_ID,
        paint: {
          // Styling rules for the circles
          "circle-radius": 4,
          "circle-color": "rgba(249, 115, 22, 0.7)", // Orange color for networks
          "circle-stroke-width": 1,
          "circle-stroke-color": "rgb(249, 115, 22)",
          "circle-opacity": [
            "case",
            ["boolean", ["feature-state", "hover"], false], // Check if 'hover' state is true
            1, // If true, opacity is 1
            0.7, // Default opacity
          ],
        },
      });
    }

    // Add another layer for highlighting a selected network.
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
        // This filter determines WHICH network gets highlighted.
        filter: initialNetworkId
          ? ["==", ["get", "id"], initialNetworkId]
          : ["==", ["get", "id"], ""], // Initially filter to nothing if no ID
      });
    }

    // 2. Adds Source and Layer for Stations (initially empty)
    if (!map.getSource(STATION_SOURCE_ID)) {
      map.addSource(STATION_SOURCE_ID, {
        type: "geojson",
        // Start empty. Will be updated when a specific network is selected and its stations are fetched
        data: convertStationsToGeoJSON([]),
      });
    }

    // Add a layer to display the stations.
    if (!map.getLayer(STATION_LAYER_ID)) {
      map.addLayer({
        id: STATION_LAYER_ID,
        type: "circle",
        source: STATION_SOURCE_ID, // Use the station data source
        paint: {
          // Styling for station circles
          "circle-radius": 5,
          "circle-color": "rgba(243, 123, 68, 0.8)", // Slightly different orange for stations
          "circle-stroke-width": 1,
          "circle-stroke-color": "rgb(243, 123, 68)",
        },
      });
    }
  };

  // Sets up map event listeners (hover, click)
  const setupMapEventListeners = (map: mapboxgl.Map) => {
    // 1. Keep track of which network is currently being hovered over
    let hoveredNetworkId: string | number | null = null;

    //  2. Network Hover Listeners
    map.on("mouseenter", NETWORK_LAYER_ID, (e) => {
      // ... (rest of mouseenter logic remains the same)
      if (e.features && e.features.length > 0) {
        map.getCanvas().style.cursor = "pointer";
        const featureId = e.features[0].id; // Get the ID of the hovered network

        // If we were previously hovering over a different network,
        // reset its 'hover' state to false.
        if (hoveredNetworkId !== null && hoveredNetworkId !== featureId) {
          map.setFeatureState(
            { source: NETWORK_SOURCE_ID, id: hoveredNetworkId },
            { hover: false }
          );
        }
        hoveredNetworkId = featureId ?? null; // Store the ID of the currently hovered network
        // Set the 'hover' state of the current network to true.
        // Used in the NETWORK_LAYER_ID's paint properties to change its opacity
        if (hoveredNetworkId !== null) {
          map.setFeatureState(
            { source: NETWORK_SOURCE_ID, id: hoveredNetworkId },
            { hover: true }
          );
        }
      }
    });

    map.on("mouseleave", NETWORK_LAYER_ID, () => {
      map.getCanvas().style.cursor = ""; // Change mouse cursor back to default
      // If we were hovering over a network, reset its 'hover' state to false.
      if (hoveredNetworkId !== null) {
        map.setFeatureState(
          { source: NETWORK_SOURCE_ID, id: hoveredNetworkId },
          { hover: false }
        );
      }
      hoveredNetworkId = null; // No network is hovered anymore
    });

    // 3. Network Click Listener
    map.on("click", NETWORK_LAYER_ID, (e) => {
      if (!e.features || e.features.length === 0) return; // No feature clicked
      const feature = e.features[0];
      const coordinates = (feature.geometry as Point).coordinates.slice();
      const properties = feature.properties; // Data like name, city, country, id

      if (
        typeof coordinates[0] !== "number" ||
        typeof coordinates[1] !== "number"
      )
        return;

      // Adjust longitude if the map has wrapped around (e.g., showing multiple world copies)
      // This ensures the popup appears on the clicked instance of the feature.
      while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
      }

      // Create the HTML content for the Networks popup
      const popMessage = `
      <div class="p-2 max-w-xs text-center">
        <p class="font-bold text-lg text-primary">${properties?.name}</p>
        <p class="text-sm text-muted-foreground   mb-2">${properties?.city}, ${properties?.country}</p>
        <button id="view-network-button" data-network-id="${properties?.id}" class="mt-2 text-xs focus:outline-none cursor-pointer hover:bg-accent transition-colors duration-150 ease-in-out py-1.5 px-4 border border-[#CAD7FB] rounded-full text-primary">View Details</button>
      </div>`;

      // Use the helper function to create and show the popup
      const popup = createAndShowPopup(
        map,
        coordinates as [number, number],
        popMessage,
        popupRef // The React ref to store the popup instance
      );

      // Add event listener to the button inside the new popup
      const popupNode = popup?.getElement();
      const viewButton = popupNode?.querySelector("#view-network-button");
      if (viewButton) {
        // This listener will run only once for this specific button instance.
        viewButton.addEventListener(
          "click",
          (event) => {
            const target = event.target as HTMLButtonElement;
            const networkId = target.getAttribute("data-network-id");
            if (networkId) {
              // Use Next.js router to navigate to the network's detail page
              router.push(`/networks/${networkId}`);
            }
          },
          { once: true } // Ensures the listener is removed after one click
        );
      }
    });

    // 4. Station Click Listener
    map.on("click", STATION_LAYER_ID, (e) => {
      if (!e.features || e.features.length === 0) return; // No feature clicked
      const feature = e.features[0];
      const coordinates = (feature.geometry as Point).coordinates.slice();
      const properties = feature.properties; // Data like station name, free_bikes, empty_slots

      if (
        typeof coordinates[0] !== "number" ||
        typeof coordinates[1] !== "number"
      )
        return;

      // Adjust longitude for map wrapping
      while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
      }

      // Create HTML content for the station popup
      const popMessage = `<div class="p-2 max-w-md min-w-45 ">
      <p class="font-bold text-base text-primary break-all">${
        properties?.name
      }</p>
      <div class="flex justify-between items-center text-sm mt-2">
      <p class="text-muted-foreground">Free Bikes</p>
      <p class="font-bold text-primary">${properties?.free_bikes ?? "N/A"}</p>
      </div>
      <div class="flex justify-between items-center text-sm">
      <p class="text-muted-foreground">Empty Slots</p>
      <p class="font-bold text-primary">${properties?.empty_slots ?? "N/A"}</p>
      </div>
      </div>`;

      // Use the helper function to create and show the popup
      createAndShowPopup(
        map,
        coordinates as [number, number],
        popMessage,
        popupRef // The React ref to store the popup instance
      );
    });

    // 5. Station Hover Listeners
    map.on("mouseenter", STATION_LAYER_ID, () => {
      map.getCanvas().style.cursor = "pointer"; // Change cursor to pointer
    });

    map.on("mouseleave", STATION_LAYER_ID, () => {
      map.getCanvas().style.cursor = ""; // Change cursor back to default
    });
  };

  // --Initializes the map and set up layers and event listeners
  useEffect(() => {
    // 1. Guard Clause: Prevent re-initialization
    // If the map container div isn't available yet (mapContainer.current is null)
    if (!mapContainer.current || mapRef.current) return;

    // 2. Determine Initial Map View (Center & Zoom)
    const initialNetworkId = params.id as string | undefined;
    let initialCenter = DEFAULT_MAP_CENTER;
    let initialZoom = DEFAULT_MAP_ZOOM;

    // If there's an initialNetworkId in the URL (a detail page)
    if (initialNetworkId) {
      // Find the corresponding network from the 'networks' prop
      const targetNetwork = networks.find((n) => n.id === initialNetworkId);
      // If the network is found and has location data
      if (targetNetwork?.location) {
        // Set the initial map center to this network's coordinates
        initialCenter = [
          targetNetwork.location.longitude,
          targetNetwork.location.latitude,
        ];
        // Set the initial zoom to a more detailed level
        initialZoom = DETAIL_MAP_ZOOM;
      }
    }

    // 3. Create the Mapbox Map Instance
    const map = new mapboxgl.Map({
      container: mapContainer.current!, // The DOM element where the map will be rendered
      style: "mapbox://styles/mapbox/light-v11", // The base map style
      center: initialCenter,
      zoom: initialZoom,
      projection: "mercator",
      antialias: true, // Improves rendering quality
    });

    // 4. Store the Map Instance in a Ref
    // This allows other parts of the component
    // to access and interact with the map instance
    mapRef.current = map;

    // 5. Actions to Perform Once the Map is Fully Loaded
    // The 'load' event fires after the map's resources (style, sprites, fonts)
    // have been completely loaded. It's safe to add sources, layers, and listeners now
    map.on("load", () => {
      if (!mapRef.current) return; // Safety check, map might have been removed

      const loadedMap = mapRef.current; // Use the ref for consistency
      // Call the helper function to add data sources and visual layers
      setupMapLayers(loadedMap, initialNetworkId);
      // Call the helper function to set up click/hover event listeners
      setupMapEventListeners(map);

      // Fetch stations immediately if we loaded on a detail page
      if (initialNetworkId) {
        fetchStationsForNetwork(initialNetworkId, setCurrentStations);
      }
    });

    // 6. Cleanup Function (Runs when the component unmounts)
    // Prevents memory leaks and unexpected behavior
    return () => {
      mapRef.current?.remove(); // Removes the Mapbox map instance and its resources
      mapRef.current = null; // Clear the ref

      // Also remove any active popup
      if (popupRef.current) {
        popupRef.current.remove();
        popupRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // Reason: We only want to initialize the map instance once.
  // Subsequent route changes and view updates are handled by the second useEffect.

  // --Handles Route Changes (Zoom, Highlight, Fetch/Display Stations)
  useEffect(() => {
    // 1. Get the map instance and check if it's ready
    const map = mapRef.current;
    // If the map isn't initialized yet or its style isn't fully loaded, do nothing
    if (!map || !map.isStyleLoaded()) return;

    // 2. Get the current network ID from URL parameters
    const networkId = params.id as string | undefined;

    // 3. Update the Network Highlight Layer
    // If 'networkId' exists, filter the highlight layer to show only that network
    // Otherwise show nothing
    map.setFilter(
      NETWORK_HIGHLIGHT_LAYER_ID,
      networkId ? ["==", ["get", "id"], networkId] : ["==", ["get", "id"], ""]
    );

    // 4. Logic for when a specific network is selected (networkId exists in URL)
    if (networkId) {
      // Find the network object from the 'networks' prop using the ID
      const targetNetwork = networks.find((n) => n.id === networkId);

      if (targetNetwork?.location) {
        // If the network is found and has location data
        const targetCoords: [number, number] = [
          targetNetwork.location.longitude,
          targetNetwork.location.latitude,
        ];

        // Fly to network location only if needed (i.e., during navigation, not reload)
        if (shouldFlyTo(map, targetCoords, DETAIL_MAP_ZOOM)) {
          // If there's an open popup, remove it before flying
          popupRef.current?.remove();
          popupRef.current = null;

          // Animate the map to the network's location and zoom in
          map.flyTo({
            center: [
              targetNetwork.location.longitude,
              targetNetwork.location.latitude,
            ],
            zoom: 10, // Zoom closer for detail view
            essential: true, // Marks the animation as essential
          });
        }
        // Fetch stations for the selected network and update the 'currentStations' state
        fetchStationsForNetwork(networkId, setCurrentStations);
      } else {
        // If a networkId is in the URL but not found in your 'networks' list.
        console.warn(
          `Network with ID ${networkId} not found in provided list.`
        );
        setCurrentStations(null); // Clear any previously shown stations
      }
    } else {
      // 5. Logic for when NO specific network is selected (hompage or filters cleared)
      setCurrentStations(null); // Clear any displayed stations

      // Fly back to overview if on the home page and map isn't already there
      // This handles both navigating back and clearing filters like "All Countries"
      if (pathname === "/") {
        if (shouldFlyTo(map, DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM)) {
          // Close any existing popup before flying back
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

      // Regardless of whether it's the homepage or just no networkId,
      // if a popup is open, close it
      if (popupRef.current) {
        popupRef.current.remove();
        popupRef.current = null;
      }
    }
  }, [params, pathname, searchParams, networks]); // This effect will re-run whenever path, query params, and network list changes

  // --Updates Station Layer When State Changes
  useEffect(() => {
    // 1. Get the current map instance
    const map = mapRef.current;
    // 2. Try to get the GeoJSON data source for stations from the map
    const stationSource = map?.getSource(STATION_SOURCE_ID) as
      | mapboxgl.GeoJSONSource
      | undefined;

    // 3. Check if everything is ready
    if (map && map.isStyleLoaded() && stationSource) {
      // 4. If all good, update the data for the stationSource.
      stationSource.setData(convertStationsToGeoJSON(currentStations || []));
    }
  }, [currentStations]); // This useEffect re-runs only when the `currentStations` state changes

  // --Handles showing popup when selectedStation changes via context (Station list Table)
  useEffect(() => {
    // 1. Get the map instance
    const map = mapRef.current;
    // 2. Guard Clause: Check if map is ready and if a station is selected
    if (!map || !map.isStyleLoaded() || !selectedStation) {
      // If no station selected, ensure popup is closed
      if (popupRef.current) {
        popupRef.current.remove();
        popupRef.current = null;
      }
      return; // Stop the effect if conditions aren't met
    }

    // 3. Logic when a station is selected via context
    // Destructure the necessary properties from the selectedStation object
    const { longitude, latitude, name, free_bikes, empty_slots } =
      selectedStation;
    // Format the coordinates
    const coordinates: [number, number] = [longitude, latitude];

    // 4. Create the HTML content for the station popup
    const popMessage = `<div class="p-2 max-w-md min-w-45">
      <p class="font-bold text-base break-all text-primary">${name}</p>
      <div class="flex justify-between items-center text-sm mt-2">
        <p class="text-muted-foreground">Free Bikes</p>
        <p class="font-bold">${free_bikes ?? "N/A"}</p>
      </div>
      <div class="flex justify-between items-center text-sm">
        <p class="text-muted-foreground">Empty Slots</p>
        <p class="font-bold">${empty_slots ?? "N/A"}</p>
      </div>
    </div>`;

    // 5. Use the helper function to create and show the popup on the map
    createAndShowPopup(map, coordinates, popMessage, popupRef);
  }, [selectedStation]); // Re-run when the selected station from context changes

  // --Handles the "Near me" button
  const handleLocate = () => {
    // 1. Check if the map is ready
    if (!mapRef.current) {
      console.error("Map is not initialized yet.");
      return;
    }

    // 2. Use the browser's Geolocation API
    navigator.geolocation.getCurrentPosition(
      // 3. This function runs if the location is successfully found
      (position) => {
        const currentCoords: [number, number] = [
          position.coords.longitude,
          position.coords.latitude,
        ];
        // Directly fly the map to the user's location
        mapRef.current?.flyTo({
          center: currentCoords,
          zoom: DETAIL_MAP_ZOOM,
          essential: true,
        });
      },
      // 4. Error Callback: runs if there's an error getting the location
      (error) => console.error("Geolocation error:", error),
      // 5. Options for getCurrentPosition:
      {
        enableHighAccuracy: true, // Request the most accurate position possible (can use more battery)
        timeout: 5000, // Stop trying to get the location after 5 seconds
        maximumAge: 0, // Don't use a cached position; get a fresh one
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
          className="bg-primary rounded-2xl hover:bg-primary/90 text-white shadow-xs flex items-center gap-2 px-4 py-2 cursor-pointer"
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
          className="rounded-t-2xl rounded-b-none cursor-pointer"
        >
          <Plus className="text-primary " />
        </Button>
        <Button
          variant="ghost"
          onClick={handleZoomOut}
          className="rounded-b-2xl rounded-t-none cursor-pointer"
        >
          <Minus className="text-primary" />
        </Button>
      </div>
    </div>
  );
}
