import type { Image } from '@openvaa/data';

/**
 * Get the url for a specific format url from the `Image` object if available, or the full-size url.
 * @param image - The image object
 * @param format - The desired format, if available. Defaulting to the normal image.
 * @param dark - Whether to use the dark thumbnail (if available), defaulting to the normal image.
 */
export function getImageUrl({
  image,
  format,
  dark
}: {
  image: Image;
  format?: keyof NonNullable<Image['formats']>;
  dark?: boolean;
}): string {
  // The requested format level or the default
  const formatLevel = format && image.formats?.[format] ? image.formats[format] : image;
  // If the dark variant is request, try to get it from the chosen format or the default format
  if (dark) {
    const url = formatLevel.urlDark || image.urlDark;
    if (url) return url;
  }
  // Either the dark variant was not requested or is not available
  return formatLevel.url;
}
