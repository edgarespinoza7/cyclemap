
import { getBikeNetworks } from "@/lib/api";
import countries from "@/data/countries.json";
import Link from "next/link";

const countryMap = countries.data.reduce((map, country) => {
  map[country.code] = country.name;
  return map;
}, {} as Record<string, string>);

interface Network {
  id: string;
  name: string;
  location: {
    city: string;
    country: string;
  };
  stations: { name: string; freeBikes: number; emptySlots: number }[];
}

export default async function NetworkDetails({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params; 

  const networks = await getBikeNetworks();

  const network = await networks.find((network: Network) => network.id === id);

  console.log(network);

  if (!network) {
    return <div>Network not found</div>;
  }

  return (
    <div className="p-6 space-y-4">
      <Link href="/" className="text-orange-500">Go Back</Link>
      <h1 className="text-2xl font-bold">{network.name}</h1>
      <p className="text-sm text-muted-foreground">
        {network.location.city}, {countryMap[network.location.country] || network.location.country}
      </p>
      <h2 className="text-lg font-semibold">Stations</h2>
    </div>
  );
}
