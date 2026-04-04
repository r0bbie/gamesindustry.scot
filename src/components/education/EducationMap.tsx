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

interface MapSchool {
  name: string;
  slug: string;
  hq?: string;
  coordinates: { lat: number; lng: number };
}

interface EducationMapProps {
  schools: MapSchool[];
}

export default function EducationMap({ schools }: EducationMapProps) {
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

    for (const school of schools) {
      const marker = L.marker([
        school.coordinates.lat,
        school.coordinates.lng,
      ]).addTo(map);

      marker.bindPopup(
        `<div style="min-width:150px">
          <strong><a href="/education/schools/${school.slug}">${school.name}</a></strong>
          ${school.hq ? `<br/>${school.hq}` : ""}
        </div>`
      );
    }

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [schools]);

  return (
    <div ref={containerRef} style={{ height: "500px", width: "100%" }} />
  );
}
