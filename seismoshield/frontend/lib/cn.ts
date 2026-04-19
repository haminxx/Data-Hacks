import clsx, { type ClassValue } from "clsx";

/**
 * Tiny className composer used by the design-system components. We don't
 * need the full `tailwind-merge` dance for our use cases, so this is a
 * direct passthrough to clsx.
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
