import { constants } from '$lib/utils/constants';
import { isAbsoluteUrl } from '$lib/utils/links';
import type { Image } from '@openvaa/data';
import type { StrapiImage } from '../strapiData.type';

/**
 * Parse image properties from one or two possibly defined `StrapiImage`s, providing the full image url as a default for the thumbnail.
 * @param image - The image object that will be used to get the `url` props.
 * @param darkImage - An optional dark image object that will be used to get the `urlDark` props
 * @returns An `Image` object containing the image properties, or `undefined` if `image` is missing.
 */
export function parseImage(image?: StrapiImage, darkImage?: StrapiImage): Image | undefined {
  if (!image) return undefined;
  const { url } = image;
  const thumbnailUrl = image.formats?.thumbnail?.url || url;
  const urlDark = darkImage?.url;
  const thumbnailDark = darkImage?.formats?.thumbnail?.url || urlDark;
  return {
    url: formatUrl(url),
    urlDark: urlDark ? formatUrl(urlDark) : undefined,
    formats: {
      thumbnail: {
        url: formatUrl(thumbnailUrl),
        urlDark: thumbnailDark ? formatUrl(thumbnailDark) : undefined
      }
    }
  };
}

function formatUrl(url: string): string {
  return isAbsoluteUrl(url) ? url : `${constants.PUBLIC_BROWSER_BACKEND_URL}${url}`;
}
