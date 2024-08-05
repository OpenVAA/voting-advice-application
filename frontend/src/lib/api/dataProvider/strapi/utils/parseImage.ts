import { constants } from '$lib/utils/constants';
import type { StrapiImageData } from '../strapiDataProvider.type';

/**
 * Parse image properties from Strapi, providing the full image url as a default for the thumbnail.
 */

export const parseImage = (image: StrapiImageData): ImageProps => {
  const url = `${constants.PUBLIC_BACKEND_URL}${image.url}`;
  return {
    url,
    thumbnail: {
      url: image.formats?.thumbnail
        ? `${constants.PUBLIC_BACKEND_URL}${image.formats.thumbnail.url}`
        : url
    }
  };
};
