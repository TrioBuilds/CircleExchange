export const areas = [
  { id: 'local:pune:baner:alacrity', name: 'Alacrity Apartment' },
  { id: 'local:pune:baner', name: 'Baner' },
  { id: 'local:pune', name: 'Pune' },
];
export function hierarchy(id: string) {
  const index = areas.findIndex(area => area.id === id);
  return index < 0 ? [] : areas.slice(index);
}

// Baner neighborhood reference point (Wikidata Q4801087), not a boundary.
export function suggestArea(lat: number, lon: number, accuracy: number) {
  if (![lat, lon, accuracy].every(Number.isFinite) || accuracy < 0 || accuracy > 500) return null;
  // Approximate center from the user-supplied public Alacrity Apartment map.
  // https://share.google/aIMwxd7MZYfDGOpmu — suggest proximity, never residency.
  const apartmentDistance = Math.hypot((lat - 18.5565184) * 111320, (lon - 73.7574912) * 105500);
  if (apartmentDistance + accuracy <= 200) return areas[0];
  if (apartmentDistance + accuracy <= 1000) return areas[1];
  const distance = Math.hypot((lat - 18.56) * 111320, (lon - 73.79028) * 105500);
  return distance + accuracy <= 2500 ? areas[1] : null;
}
