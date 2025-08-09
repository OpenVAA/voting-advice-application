/**
 * # Admin App outermost server loader
 *
 * Gets the jwt auth token from the cookie and adds it to page data from which it will be picked up by the `AdminContext`.
 */

import type { LayoutServerLoad } from './$types';

export async function load({ cookies }): Promise<LayoutServerLoad> {
  const token = cookies.get('token');
  return { token };
}
