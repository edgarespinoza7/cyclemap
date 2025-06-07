export default function Loading() {
  // This UI will be shown while `getBikeNetworks()` in `MainLayout.tsx` is resolving
  return (
    <div className="flex h-[100dvh] items-center justify-center bg-primary">
      <p className="text-xs text-white">Loading network data...</p>
    </div>
  );
}