export function serializeXhtmlChildren(root: ParentNode): string {
  const serializer = new XMLSerializer();
  return closeVoidElements(
    Array.from(root.childNodes)
      .map((node) => serializer.serializeToString(node))
      .join("")
      .replaceAll(' xmlns="http://www.w3.org/1999/xhtml"', "")
  );
}

function closeVoidElements(html: string): string {
  return html.replace(/<(br|hr|img|col|source|wbr|link|meta)\b([^<>]*?)\/?>(?:<\/\1>)?/gi, (_match, tag: string, attrs: string) => {
    const body = attrs.replace(/\s*\/\s*$/, "").replace(/\s+$/, "");
    return `<${tag}${body}/>`;
  });
}
