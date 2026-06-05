export function serializeXhtmlChildren(root: ParentNode): string {
  const serializer = new XMLSerializer();
  return Array.from(root.childNodes)
    .map((node) => serializer.serializeToString(node))
    .join("")
    .replaceAll(' xmlns="http://www.w3.org/1999/xhtml"', "");
}
