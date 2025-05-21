"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { countryMap } from "@/lib/countryUtils";
import type { Network } from "@/lib/types";
import { MapPin, BriefcaseBusiness, MoveRight } from "lucide-react";



interface NetworkCardProps {
  network: Network;
}

export default function NetworkCard({ network }: NetworkCardProps) {
  // 1. Get the Next.js router instance
  const router = useRouter();

  const handleCardClick = (id: string) => {
    router.push(`/networks/${id}`);
  };

  return (
    <Card
      key={network.id} // Use network.id as the key for the card
      className=" hover:bg-accent transition-colors duration-300 p-2 border-b-1 border-b-accent"
    >
      <CardContent className="p-2 px-4">
        <CardTitle className="font-semibold text-xl text-primary py-2">
          {network.name}
        </CardTitle>
        <CardDescription className="pb-2 flex gap-2 items-center">
          <div className="text-secondary bg-[#EFF4FE] p-1 rounded-md">
            <MapPin className="stroke-1" />
          </div>
          {network.location.city},{" "}
          {countryMap[network.location.country] || network.location.country}
        </CardDescription>
        <div className="flex flex-col md:flex-row justify-between items-center gap-2 min-h-[40px]">
            <div className="flex gap-2 items-center flex-grow w-full md:w-auto">
              <CardDescription className="pb-2 flex gap-2 items-center flex-grow">
                <div className="text-secondary bg-[#EFF4FE] p-1 rounded-md">
                  <BriefcaseBusiness className="stroke-1" />
                </div>
                {/* {companyArray.join(", ") || "N/A"} */}
                {Array.isArray(network.company)
               ? network.company.join(", ") || "N/A"
               : network.company || "N/A"}
              </CardDescription>
              <Button
                className="bg-white text-secondary hover:bg-primary hover:text-white transition-colors duration-300 rounded-full w-10 h-10 flex-shrink-0 md:w-[60px] cursor-pointer shadow-md"
                onClick={() => handleCardClick(network.id)}
              >
                <MoveRight className="stroke-2 antialiased" />
              </Button>
            </div>
          {/* )} */}
        </div>
      </CardContent>
    </Card>
  );
}
