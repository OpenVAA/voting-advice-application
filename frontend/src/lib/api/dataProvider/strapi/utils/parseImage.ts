import { constants } from '$lib/utils/constants';
import { isAbsoluteUrl } from '$lib/utils/links';
import type { StrapiImageData } from '../strapiDataProvider.type';

/**
 * Parse image properties from Strapi, providing the full image url as a default for the thumbnail.
 */
export function parseImage(image: StrapiImageData): ImageProps {
  const thumbnailUrl = image.formats?.thumbnail?.url || image.url;

  const absoluteUrl = isAbsoluteUrl(image.url) ? image.url : `${constants.PUBLIC_BACKEND_URL}${image.url}`;
  const absoluteThumbnailUrl = isAbsoluteUrl(thumbnailUrl)
    ? thumbnailUrl
    : `${constants.PUBLIC_BACKEND_URL}${thumbnailUrl}`;

  return {
    url: absoluteUrl,
    thumbnail: {
      url: absoluteThumbnailUrl
    }
  };
}
