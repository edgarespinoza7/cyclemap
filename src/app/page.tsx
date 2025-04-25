import { getBikeNetworks } from "@/lib/api";
import NetworkList from "@/components/NetworkList";
import Map from "@/components/Map";

export default async function HomePage() {
  const networks = await getBikeNetworks();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 h-screen">
      {/* First column: occupies 1/3 of the screen on medium screens and above */}
      <div className="p-6 overflow-y-auto md:col-span-1">
        <h1 className="text-3xl font-bold mb-4">Discover bike networks</h1>
        <NetworkList networks={networks} />
      </div>
      {/* Second column: occupies 2/3 of the screen on medium screens and above */}
      <div className="h-full w-full md:col-span-2">
        <Map networks={networks} />
      </div>
    </div>
  );
}
