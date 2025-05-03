import React from "react";
import { Bike } from "lucide-react";

const Header = () => {
  return (
    <div className="p-2">
      <div className="mb-2 text-secondary flex items-center gap-2">
        <div>
          <Bike className="size-6" />
        </div>
        <span className="text-xl font-semibold">CycleMap</span>
      </div>
      <h1 className="text-3xl font-semibold mb-4 text-primary">
        Discover bike networks
      </h1>
      <p className="text-sm text-muted-foreground">
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Aperiam nemo iusto hic corporis molestias nulla nihil dolore ullam? Doloremque, qui!
      </p>
    </div>
  );
};

export default Header;
