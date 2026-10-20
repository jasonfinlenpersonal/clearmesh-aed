import { MapExplorer } from "@/components/MapExplorer";

// Static shell; the AED list loads from /api/aeds in the browser so the
// service worker can serve both offline.
export default function HomePage() {
  return <MapExplorer />;
}
