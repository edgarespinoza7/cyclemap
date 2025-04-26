import { getBikeNetworks } from "@/lib/api";
import NetworkList from "@/components/NetworkList";


export default async function HomePage() {

  const networks = await getBikeNetworks();

  return (
    <div className="h-screen">
      <div className="p-6 overflow-y-auto">
        <div className="text-2xl font-bold mb-4 text-orange-500">
          <span>CycleMap</span>
        </div>
        <h1 className="text-3xl font-bold mb-4">Discover bike networks</h1>
        <p className="mb-4 text-sm text-muted-foreground">
          Lorem ipsum dolor sit amet consectetur adipisicing elit. Doloribus ut
          mollitia odit magnam, atque, voluptatibus praesentium quis blanditiis
          repellat at assumenda illo.
        </p>
        <NetworkList networks={networks} />
      </div>

   
    </div>
  );
}
