/** Single source of truth for labels, routes, and screen availability. */
export const STUDIO_NAVIGATION = [
  { id: "import", label: "Import", href: "/", available: true },
  {
    id: "suggestions",
    label: "Suggestions",
    href: "/suggestions",
    available: false,
  },
  { id: "editor", label: "Editor", href: "/editor", available: false },
  { id: "clips", label: "Clips", href: "/clips", available: false },
  { id: "export", label: "Export", href: "/export", available: false },
] as const;

export type StudioSectionId = (typeof STUDIO_NAVIGATION)[number]["id"];
export const IMPORT_ROUTE = STUDIO_NAVIGATION[0].href;
export const getStudioSection = (id: StudioSectionId) =>
  STUDIO_NAVIGATION.find((item) => item.id === id)!;
