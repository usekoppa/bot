export function extractFromCommandString(
  prefix: string,
  cmdStr: string
): [callKey: string, args: string[]] {
  const [callKey, ...args] = cmdStr
    .slice(prefix.length)
    .toLowerCase()
    .trim()
    .split(/ /g);

  return [callKey, args];
}
