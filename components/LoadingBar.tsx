"use client";

interface LoadingBarProps {
  active: boolean;
  accent: "sky" | "star";
}

export default function LoadingBar({ active, accent }: LoadingBarProps) {
  if (!active) return null;

  return (
    <div role="progressbar" aria-busy="true" aria-label="Loading" className="mikabu-loading-track w-full">
      <div className={`mikabu-loading-segment ${accent === "star" ? "bg-star" : "bg-sky"}`} />
    </div>
  );
}
