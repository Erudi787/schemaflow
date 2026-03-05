/**
 * Merge class names conditionally.
 * Filters out falsy values and joins remaining with spaces.
 */
export function cn(...inputs: (string | false | null | undefined)[]): string {
    return inputs.filter(Boolean).join(' ')
}

/**
 * Calculates optimal text color (black or white) based on hex background.
 * Uses the YIQ equation for perceived brightness.
 */
export function getContrastYIQ(hexcolor?: string): 'black' | 'white' {
    if (!hexcolor) return 'white'; // Default fallback

    // Strip hash if present
    hexcolor = hexcolor.replace('#', '');

    // Handle 3-digit hex
    if (hexcolor.length === 3) {
        hexcolor = hexcolor.split('').map(c => c + c).join('');
    }

    // Convert to RGB
    const r = parseInt(hexcolor.substr(0, 2), 16);
    const g = parseInt(hexcolor.substr(2, 2), 16);
    const b = parseInt(hexcolor.substr(4, 2), 16);

    // Calculate perceived brightness
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;

    // Threshold is 128 (0-255 scale)
    return yiq >= 128 ? 'black' : 'white';
}
