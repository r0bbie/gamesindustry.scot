import type L from "leaflet";

/**
 * Fetches Scotland's boundary polygon from the ONS Open Geography Portal
 * and adds a subtle highlight overlay to the given Leaflet map.
 * Fails silently if the fetch fails or the map has been removed.
 */
export async function addScotlandOverlay(
  map: L.Map,
  Leaflet: typeof L
): Promise<void> {
  const url =
    "https://services1.arcgis.com/ESMARspQHYMw9BZ9/arcgis/rest/services/Countries_December_2023_Boundaries_UK_BGC/FeatureServer/0/query" +
    "?where=CTRY23NM%3D%27Scotland%27&outFields=CTRY23NM&f=geojson&outSR=4326";

  try {
    const res = await fetch(url);
    if (!res.ok) return;
    const geojson = await res.json();

    // Guard: map may have been unmounted while the fetch was in-flight
    if (!map.getContainer()) return;

    Leaflet.geoJSON(geojson as GeoJSON.FeatureCollection, {
      style: {
        color: "#003399",       // Scottish saltire blue
        weight: 2,
        opacity: 0.55,
        fillColor: "#0055BB",
        fillOpacity: 0.06,
      },
      interactive: false,       // clicks pass through to the map beneath
    }).addTo(map);
  } catch {
    // Network failure – map still works fine without the overlay
  }
}
