/** Single source of truth for labels, routes, and screen availability. */
export const STUDIO_NAVIGATION = [
  { id: "import", label: "Import", href: "/" },
  {
    id: "suggestions",
    label: "Suggestions",
    href: "/suggestions",
  },
  { id: "editor", label: "Editor", href: "/editor" },
  { id: "clips", label: "Clips", href: "/clips" },
  { id: "export", label: "Export", href: "/export" },
] as const;

export type StudioSectionId = (typeof STUDIO_NAVIGATION)[number]["id"];
export const IMPORT_ROUTE = STUDIO_NAVIGATION[0].href;
export const getStudioSection = (id: StudioSectionId) =>
  STUDIO_NAVIGATION.find((item) => item.id === id)!;
export const editorHref = (clipId: string) =>
  `${getStudioSection("editor").href}?clip=${encodeURIComponent(clipId)}`;
