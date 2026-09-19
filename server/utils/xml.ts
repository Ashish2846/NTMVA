export type XmlNode = Record<string, unknown>;

export function asNode(value: unknown): XmlNode | undefined {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as XmlNode)
    : undefined;
}

export function asArray(value: unknown): unknown[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (value === undefined || value === null) {
    return [];
  }

  return [value];
}

export function attr(node: unknown, name: string): string | undefined {
  const objectNode = asNode(node);
  const attrs = asNode(objectNode?.$);
  const value = attrs?.[name];
  return typeof value === "string" ? value : undefined;
}

export function childArray(node: unknown, name: string): unknown[] {
  const objectNode = asNode(node);
  return asArray(objectNode?.[name]);
}

export function firstChild(node: unknown, name: string): unknown | undefined {
  return childArray(node, name)[0];
}

export function textFromScripts(node: unknown): string {
  const hostScripts = childArray(firstChild(node, "hostscript"), "script");
  const portScripts = childArray(node, "script");
  return [...hostScripts, ...portScripts]
    .map((script) => `${attr(script, "id") ?? ""} ${attr(script, "output") ?? ""}`)
    .join(" ")
    .toLowerCase();
}
