import countriesData from "@/data/countries.json";

interface CountryInfo {
  code: string;
  name: string;
}

export type CountryCodeMap = Record<string, string>;

const createCountryMap = (): CountryCodeMap => {

  if (!countriesData || !Array.isArray(countriesData.data)) {
    console.error("Invalid countries data format. Expected { data: [...] }");
    return {}; // Return empty map on error
  }

  return countriesData.data.reduce((map, country: CountryInfo) => {
    map[country.code] = country.name;
    return map;
  }, {} as CountryCodeMap); // Initialize with an empty object typed as CountryCodeMap
};

export const countryMap = createCountryMap();