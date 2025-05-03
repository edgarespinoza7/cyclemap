import { getBikeNetworks } from "@/lib/api";
import NetworkList from "@/components/NetworkList";
import { Network } from "@/lib/types";

export default async function HomePage() {
  const networks: Network[] = await getBikeNetworks();

  return <NetworkList networks={networks} />;
}

