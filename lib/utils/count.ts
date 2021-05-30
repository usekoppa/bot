export function count(str: string, searchKey: string) {
  const matcher = new RegExp(
    searchKey.toString().replace(/(?=[.\\+*?[^\]$(){}|])/g, "\\"),
    "g"
  );

  // eslint-disable-next-line @typescript-eslint/prefer-regexp-exec
  const matches = str.match(matcher);
  return matches ? matches.length : 0;
}
