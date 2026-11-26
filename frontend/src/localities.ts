export const areas = [
  { id: 'local:pune:baner:alacrity', name: 'Alacrity Apartment' },
  { id: 'local:pune:baner', name: 'Baner' },
  { id: 'local:pune', name: 'Pune' },
];
export function hierarchy(id: string) {
  const index = areas.findIndex((area) => area.id === id);
  return index < 0 ? [] : areas.slice(index);
}

type LocationMatch =
  | { status: 'matched'; area: (typeof areas)[number] }
  | { status: 'outside' }
  | { status: 'uncertain' };

// Baner neighborhood reference point (Wikidata Q4801087), not a boundary.
export function matchLocation(lat: number, lon: number, accuracy: number): LocationMatch {
  if (
    ![lat, lon, accuracy].every(Number.isFinite) ||
    Math.abs(lat) > 90 ||
    Math.abs(lon) > 180 ||
    accuracy < 0 ||
    accuracy > 500
  )
    return { status: 'uncertain' };
  // Approximate center from the user-supplied public Alacrity Apartment map.
  // https://share.google/aIMwxd7MZYfDGOpmu — suggest proximity, never residency.
  const apartmentDistance = Math.hypot((lat - 18.5565184) * 111320, (lon - 73.7574912) * 105500);
  // shortcut: pilot circles use conservative proximity coverage; validate polygons before automatic apartment enrollment.
  const distance = Math.hypot((lat - 18.56) * 111320, (lon - 73.79028) * 105500);
  if (apartmentDistance + accuracy <= 1000 || distance + accuracy <= 2500) {
    return { status: 'matched', area: areas[1] };
  }
  if (apartmentDistance - accuracy > 1000 && distance - accuracy > 2500) {
    return { status: 'outside' };
  }
  return { status: 'uncertain' };
}
