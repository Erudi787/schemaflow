/**
 * Merge class names conditionally.
 * Filters out falsy values and joins remaining with spaces.
 */
export function cn(...inputs: (string | false | null | undefined)[]): string {
    return inputs.filter(Boolean).join(' ')
}
