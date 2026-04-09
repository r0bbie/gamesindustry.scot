import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { addScotlandOverlay } from "@/lib/maps";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const CATEGORY_LABELS: Record<string, string> = {
  developer: "Developer",
  tooling: "Tooling",
  service_provider: "Service Provider",
  publisher: "Publisher",
  supporting_org: "Supporting Organisation",
  games_media: "Games Media",
};

interface MapCompany {
  id: string;
  name: string;
  slug: string;
  categories: string[];
  location?: string;
  coordinates: { lat: number; lng: number };
}

interface MapViewProps {
  companies: MapCompany[];
}

export default function MapView({ companies }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      minZoom: 5,
      maxBounds: L.latLngBounds(L.latLng(49.0, -14.0), L.latLng(62.5, 5.0)),
      maxBoundsViscosity: 1.0,
    }).setView([56.49, -4.2], 7);
    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 18,
    }).addTo(map);

    addScotlandOverlay(map, L);

    for (const company of companies) {
      const marker = L.marker([
        company.coordinates.lat,
        company.coordinates.lng,
      ]).addTo(map);

      marker.bindPopup(
        `<div style="min-width:150px">
          <strong><a href="/companies/${company.slug}">${company.name}</a></strong>
          ${company.location ? `<br/>${company.location}` : ""}
          <br/><span style="font-size:11px;color:#666">${company.categories.map(c => CATEGORY_LABELS[c] ?? c).join(' · ')}</span>
        </div>`
      );
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [companies]);

  return (
    <div ref={containerRef} style={{ height: "600px", width: "100%" }} />
  );
}
