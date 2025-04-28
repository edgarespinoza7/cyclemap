// src/app/(main)/layout.tsx
import { getBikeNetworks } from "@/lib/api";
import Map from "@/components/Map";
import Header from "@/components/Header"; // Keep Header if it's static for this section

// Define the Network type here or import it if shared
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
  // Fetch networks needed for the map markers initially
  // This runs server-side
  const networks: Network[] = await getBikeNetworks();

  return (
    <div className="h-screen flex flex-col md:flex-row">
      {/* Sidebar Area */}
      <div className="flex-1/4 min-h-[40vh] md:h-screen overflow-auto flex flex-col">
        {/* Static Header for the sidebar section */}
        <Header />
        {/* Dynamic content from page.tsx or networks/[id]/page.tsx goes here */}
        <div className="flex-grow overflow-y-auto"> {/* Ensure content scrolls */}
          {children}
        </div>
      </div>

      {/* Map Area - This will persist */}
      <div className="flex-3/4 h-screen">
        {/* Pass the networks fetched server-side to the Map */}
        <Map networks={networks} />
      </div>
    </div>
  );
}
