import { getBikeNetworks } from "@/lib/api";
import NetworkList from "@/components/NetworkList";
import Map from "@/components/Map"; // Ensure this path points to the correct Map component

import Header from "@/components/Header";

export default async function HomePage() {

  
  const networks = await getBikeNetworks();

  return (
    <div className="h-screen flex flex-col md:flex-row">
      <div className="flex-1/4 min-h-[40vh] md:h-screen overflow-auto">
        <Header />
        <NetworkList networks={networks} />
      </div>
   
      <div className="flex-3/4 h-screen">
        <Map networks={networks} />
      </div>
    </div>
  );
}
