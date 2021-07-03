export function extractContentStrings(
  prefix: string,
  content: string
): [callKey: string, args: string] {
  const [callKey, ...rest] = content
    .slice(prefix.length)
    .toLowerCase()
    .trim()
    .split(/\s/g);

  return [callKey, rest.join(" ").trim()];
}
