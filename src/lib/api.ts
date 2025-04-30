import { NetworkDetails } from "./types";

const API_BASE_URL = "http://api.citybik.es/v2";

// Fetches all bike networks from the CityBikes API
export async function getBikeNetworks() {
  const res = await fetch(`${API_BASE_URL}/networks`, {
    next: { revalidate: 3600 },
  });
  const data = await res.json();
  return data.networks;
}

// Fetches details of a specific bike network by its ID from the CityBikes API
export async function getNetworkDetailsById(
  id: string,
  revalidateSeconds: number = 600
): Promise<NetworkDetails | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/networks/${id}`, {
      next: { revalidate: revalidateSeconds },
    });
    if (!res.ok) {
      console.error(`API Error for ${id}: ${res.status} ${res.statusText}`);
      return null;
    }

    const data = await res.json();
    return data.network as NetworkDetails;
  } catch (error) {
    console.error(`Failed to fetch network details for ${id}:`, error);
    return null;
  }
}
