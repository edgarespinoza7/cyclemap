import { getBikeNetworks } from "@/lib/api";
import Map from "@/components/Map";
import { MapInteractionProvider } from "@/context/MapInteractionContext";

type Network = {
  id: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
    city: string;
    country: string;
  };
};

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const networks: Network[] = await getBikeNetworks();

  return (
    <MapInteractionProvider>
      <div className="h-screen flex flex-col md:flex-row ">
        {/* Sidebar Area */}
        <div className="w-[550px] min-h-[40vh] md:h-screen overflow-auto flex flex-col">
          {/* Dynamic content from page.tsx or networks/[id]/page.tsx goes here */}
          <div className="flex-grow overflow-y-auto">{children}</div>
        </div>

        {/* Map Area */}
        <div className="flex-1 w-full h-screen">
          <Map networks={networks} />
        </div>
      </div>
    </MapInteractionProvider>
  );
}
