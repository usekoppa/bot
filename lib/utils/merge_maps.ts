export function mergeMaps<K, V>(...[...maps]: Map<K, V>[]) {
  const merged = new Map<K, V>();
  for (const map of maps) {
    for (const [key, value] of map) merged.set(key, value);
  }

  return merged;
}
