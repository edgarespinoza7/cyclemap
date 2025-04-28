// src/app/(main)/page.tsx
import { getBikeNetworks } from "@/lib/api";
import NetworkList from "@/components/NetworkList";

// Define or import Network type if needed by NetworkList props
interface Network {
  id: string;
  name: string;
  location: {
    city: string;
    country: string;
    // Add latitude/longitude if NetworkList needs them, though it seems not currently
  };
}

export default async function HomePage() {
  // Fetch networks specifically for the list component
  // Note: This might duplicate the fetch in the layout, which is okay for simplicity
  // unless the dataset is huge or performance is critical.
  const networks: Network[] = await getBikeNetworks();

  // This content will be rendered inside the {children} of MainLayout
  return <NetworkList networks={networks} />;
}

