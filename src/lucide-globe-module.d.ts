/** Lucide subpath `icons/*` is JS-only; Astro/TS resolve it at build time (see lucide-react package exports). */
declare module "lucide-react/icons/globe" {
  export const __iconNode: ReadonlyArray<
    readonly [string, Record<string, unknown>]
  >;
}
