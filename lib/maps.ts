import type { Stop } from "@/lib/routes";

export function walkingDirectionsUrl(stops: Stop[]): string | null {
  if (stops.length < 2) return null;
  const coordinate = (stop: Stop) => `${stop.lat},${stop.lng}`;
  const params = new URLSearchParams({ api: "1", origin: coordinate(stops[0]), destination: coordinate(stops[stops.length - 1]), travelmode: "walking" });
  if (stops.length > 2) params.set("waypoints", stops.slice(1, -1).map(coordinate).join("|"));
  return `https://www.google.com/maps/dir/?${params}`;
}
