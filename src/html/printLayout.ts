import { promoteStyledSuperscripts } from "./superscript";

export function cleanPrintLayoutArtifacts(root: ParentNode): void {
  promoteStyledSuperscripts(root);
  removePrintTableOfContents(root);
  removePageBreaks(root);
  removeEmptyPrintSpacers(root);
}

function removePrintTableOfContents(root: ParentNode): void {
  for (const heading of Array.from(root.querySelectorAll<HTMLElement>("p,div"))) {
    if (cleanText(heading) !== "TABLE OF CONTENTS") continue;

    const tableBlock = heading.nextElementSibling;
    if (!tableBlock || !looksLikePrintToc(tableBlock)) continue;

    tableBlock.remove();
    heading.remove();
  }
}

function removePageBreaks(root: ParentNode): void {
  for (const rule of Array.from(root.querySelectorAll<HTMLHRElement>("hr[style]"))) {
    const style = rule.getAttribute("style")?.toLowerCase() ?? "";
    if (!style.includes("page-break")) continue;

    const previous = previousPageBreakContent(rule);
    const next = rule.nextElementSibling;
    if (previous && isStandalonePageMarker(previous)) {
      previous.remove();
    }
    if (next && isEmptyPrintSpacer(next)) {
      next.remove();
    }
    rule.remove();
  }
}

function previousPageBreakContent(rule: Element): Element | null {
  let previous = rule.previousElementSibling;
  while (previous && isIgnorablePageBreakNeighbor(previous)) {
    const current = previous;
    previous = previous.previousElementSibling;
    current.remove();
  }
  return previous;
}

function removeEmptyPrintSpacers(root: ParentNode): void {
  for (const element of Array.from(root.querySelectorAll<HTMLElement>("[style]"))) {
    if (isEmptyPrintSpacer(element)) {
      element.remove();
    }
  }
}

function isStandalonePageMarker(element: Element): boolean {
  const style = element.getAttribute("style")?.toLowerCase() ?? "";
  const text = cleanText(element);

  return (
    /position\s*:\s*relative/.test(style) &&
    /height\s*:\s*\d+(?:\.\d+)?pt/.test(style) &&
    /^(?:[ivxlcdm]+|\d{1,4})$/i.test(text)
  );
}

function isEmptyPrintSpacer(element: Element): boolean {
  const style = element.getAttribute("style")?.toLowerCase() ?? "";
  const text = (element.textContent ?? "").replace(/\s+/g, "").trim();

  return /min-height\s*:\s*\d+(?:\.\d+)?pt/.test(style) && !text;
}

function isIgnorablePageBreakNeighbor(element: Element): boolean {
  return isEmptyAnchor(element) || isEmptyPrintSpacer(element);
}

function isEmptyAnchor(element: Element): boolean {
  return Boolean(element.id) && !cleanText(element) && element.children.length === 0;
}

function looksLikePrintToc(element: Element): boolean {
  const text = cleanText(element);
  return text.includes("Page") && element.querySelectorAll("a[href*='#']").length >= 3;
}

function cleanText(element: Element): string {
  return (element.textContent ?? "").replace(/\s+/g, " ").trim();
}
