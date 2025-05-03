import { getBikeNetworks } from "@/lib/api";
import Map from "@/components/Map";
import { MapInteractionProvider } from "@/context/MapInteractionContext";
import { Network } from "@/lib/types";



export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const networks: Network[] = await getBikeNetworks();

  return (
    <MapInteractionProvider>
      <div className="flex h-[100dvh] flex-col md:flex-row">
        {/* Sidebar Area */}
        <div className="order-2 md:order-1 w-full md:w-[550px] h-[60vh] md:h-screen overflow-auto border-t md:border-t-0">
          {/* Dynamic content */}
          <div className="flex-grow overflow-y-auto">
            {children}
          </div>
        </div>

        {/* Map Area */}
        <div className="order-1 md:order-2 w-full h-[40vh] md:h-screen md:flex-1">
          <Map networks={networks} />
        </div>
      </div>
    </MapInteractionProvider>
  );
}
