import { getBikeNetworks } from "@/lib/api";
import NetworkList from "@/components/NetworkList";

interface Network {
  id: string;
  name: string;
  location: {
    city: string;
    country: string;
  };
}

export default async function HomePage() {
  const networks: Network[] = await getBikeNetworks();

  return <NetworkList networks={networks} />;
}

