export function mergeMaps<K, V>(...[...maps]: Map<K, V>[]): Map<K, V> {
  return new Map(
    (function* () {
      for (const map of maps.map(map => map.entries())) {
        yield* map;
      }
    })()
  );
}
