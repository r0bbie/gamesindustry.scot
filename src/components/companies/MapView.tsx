import { useEffect, useMemo, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster";
import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";
import { addScotlandOverlay } from "@/lib/maps";
import { getCategorySingularName, isCompanyNonActiveStatus } from "@/lib/constants";
import { FilterToggle } from "@/components/ui/FilterToolbar";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

interface MapCompany {
  id: string;
  name: string;
  slug: string;
  categories: string[];
  status: string;
  location?: string;
  coordinates: { lat: number; lng: number };
}

interface MapViewProps {
  companies: MapCompany[];
}

export default function MapView({ companies }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const clusterRef = useRef<any | null>(null);
  const focusAppliedRef = useRef(false);

  // Read ?focus=<slug> once on mount
  const focusSlug = useMemo(() => {
    if (typeof window === "undefined") return null;
    return new URLSearchParams(window.location.search).get("focus");
  }, []);

  // If the focus target is non-active, default the toggle to on so its marker exists.
  const [includeDefunct, setIncludeDefunct] = useState(() => {
    if (!focusSlug) return false;
    const target = companies.find((c) => c.slug === focusSlug);
    return target ? isCompanyNonActiveStatus(target.status) : false;
  });

  const visibleCompanies = useMemo(
    () =>
      includeDefunct
        ? companies
        : companies.filter((c) => !isCompanyNonActiveStatus(c.status)),
    [companies, includeDefunct],
  );

  // Mount map (once)
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

    // Cluster markers so cities with many studios (e.g. Dundee, Edinburgh,
    // Glasgow) don't drop dozens of pins on the same point. Clicking a
    // cluster zooms in; if studios share an exact coordinate, the remaining
    // markers spiderfy into a fan so each is selectable.
    const clusterGroup = (L as any).markerClusterGroup({
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      maxClusterRadius: 40,
      disableClusteringAtZoom: 13,
    });
    clusterRef.current = clusterGroup;
    map.addLayer(clusterGroup);

    return () => {
      map.remove();
      mapRef.current = null;
      clusterRef.current = null;
    };
  }, []);

  // Repopulate markers whenever the visible set changes
  useEffect(() => {
    const cluster = clusterRef.current;
    if (!cluster) return;
    cluster.clearLayers();
    let focusMarker: L.Marker | null = null;
    for (const company of visibleCompanies) {
      const marker = L.marker([
        company.coordinates.lat,
        company.coordinates.lng,
      ]);
      marker.bindPopup(
        `<div style="min-width:150px">
          <strong><a href="/companies/${company.slug}">${company.name}</a></strong>
          ${company.location ? `<br/>${company.location}` : ""}
          <br/><span style="font-size:11px;color:#666">${company.categories.map((c) => getCategorySingularName(c)).join(" · ")}</span>
        </div>`,
      );
      cluster.addLayer(marker);
      if (focusSlug && company.slug === focusSlug) focusMarker = marker;
    }

    // If we arrived via ?focus=<slug>, zoom to that marker (spiderfying if
    // it's clustered) and pop its tooltip. Apply once per page load so toggling
    // the defunct filter later doesn't re-snap the view.
    if (focusMarker && !focusAppliedRef.current) {
      focusAppliedRef.current = true;
      cluster.zoomToShowLayer(focusMarker, () => {
        focusMarker?.openPopup();
      });
    }
  }, [visibleCompanies, focusSlug]);

  return (
    <div>
      <div className="isolate overflow-hidden rounded-xl border border-border">
        <div ref={containerRef} style={{ height: "600px", width: "100%" }} />
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-end gap-3">
        <p className="text-sm text-muted-foreground">
          Showing {visibleCompanies.length} of {companies.length} companies
        </p>
        <FilterToggle
          label="Include defunct"
          active={includeDefunct}
          onToggle={() => setIncludeDefunct((v) => !v)}
        />
      </div>
    </div>
  );
}
