import { getBikeNetworks } from "@/lib/api";
import NetworkList from "@/components/NetworkList";
import Map from "@/components/Map";

export default async function HomePage() {
  const networks = await getBikeNetworks();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 h-screen">
      <div className="p-6 overflow-y-auto md:col-span-1">
        <div className="text-2xl font-bold mb-4 text-orange-500">
          <span>CycleMap</span>
        </div>
        <h1 className="text-3xl font-bold mb-4">Discover bike networks</h1>
        <p className="mb-4 text-sm text-muted-foreground">
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Doloribus ut
          mollitia odit magnam, atque, voluptatibus praesentium quis blanditiis
          repellat at assumenda illo. Quia obcaecati aliquam id pariatur
          delectus, recusandae magni.
        </p>
        <NetworkList networks={networks} />
      </div>

      <div className="h-full w-full md:col-span-2">
        <Map networks={networks} />
      </div>
    </div>
  );
}
