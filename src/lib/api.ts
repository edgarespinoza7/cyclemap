export async function getBikeNetworks() {
  const res = await fetch('https://api.citybik.es/v2/networks', {
    next: { revalidate: 3600 },
  });
  const data = await res.json();
  return data.networks;
}

// export async function getNetworkDetails(id) {
//   const res = await fetch(`https://api.citybik.es/v2/networks/${id}`, {
//     next: { revalidate: 3600 },
//   });
//   const data = await res.json();
//   return data.networks;
// }