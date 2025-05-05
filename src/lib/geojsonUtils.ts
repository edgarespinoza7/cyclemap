import type { FeatureCollection, Point } from "geojson";
import type { Network, Station } from "./types";

// Convert network map data to GeoJSON FeatureCollection
export const convertNetworksToGeoJSON = (
  networkData: Network[]
): FeatureCollection<Point> => {
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
        dataType: "network",
      },
    })),
  };
};

// Convert station data to GeoJSON FeatureCollection
export const convertStationsToGeoJSON = (
  stationData: Station[]
): FeatureCollection<Point> => {
  return {
    type: "FeatureCollection",
    features: stationData.map((s) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [s.longitude, s.latitude],
      },
      properties: {
        id: s.id,
        name: s.name,
        free_bikes: s.free_bikes,
        empty_slots: s.empty_slots,
        dataType: "station",
      },
    })),
  };
};
