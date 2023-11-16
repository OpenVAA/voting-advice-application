// The icons in the folder `svg/material` are from Google Material
// Design icons/symbols and fall under the Apache V 2.0 license:
// https://github.com/google/material-design-icons/blob/master/LICENSE
// They are sourced from https://github.com/marella/material-design-icons/
// blob/main/svg/round/<file_name>.svg, where `file_name` is name of the
// SVG file.
//
// The icons in the folder `svg/custom` use the same license as the main
// repository.
//
// NB. Icons must be contained in a subfolder of `svg` one level deep.
// Thus, 'icon(.svg)' and 'foo/bar/icon(.svg)' are not allowed, but
// 'foo/icon(.svg)' is.
//
// When adding new icons, keep in mind that they are expected to not
// contain any strokes (the color is applied to the fill) and to be
// monochromatic and have a 1:1 aspect ratio.
//
// An easy way to get the files is:
// 1. Put the file urls on their own lines in a text file, e.g.:
//    https://raw.githubusercontent.com/marella/material-design-icons/
//    main/svg/round/playlist_add_check.svg
// 2. Use `xargs -n 1 curl -O < urls.txt` to download them en masse.
// 3. Extract the svg contents from them with search and replace:
//    - Find:    <svg.*?>(.*)</svg>
//    - Replace: export default '$1';
// 4. Change the file suffices to `.ts`.

/** Supported icon names */
export type IconName = keyof typeof ICONS;

/** All the available icons and tuples of their folders and filenames
 * without the SVG extension in the `svg` folder */
export const ICONS: Record<string, readonly [folder: string, filename: string]> = {
  addToList: ['material', 'playlist_add_check'],
  alliance: ['material', 'link'],
  candidate: ['material', 'person'],
  candidates: ['material', 'group'],
  check: ['material', 'check'],
  close: ['material', 'close'],
  collapse: ['material', 'expand_less'],
  constituency: ['material', 'person_pin_circle'],
  download: ['material', 'download'],
  election: ['material', 'how_to_vote'],
  expand: ['material', 'expand_more'],
  feedback: ['material', 'feedback'],
  filter: ['material', 'filter_alt'],
  help: ['material', 'help'],
  hide: ['material', 'visibility_off'],
  home: ['material', 'home'],
  important: ['material', 'priority_high'],
  info: ['material', 'info'],
  list: ['material', 'format_list_bulleted'],
  locked: ['material', 'lock'],
  logout: ['material', 'logout'],
  menu: ['material', 'menu'],
  missingIcon: ['custom', 'missing_icon'],
  next: ['material', 'arrow_forward_ios'],
  opinion: ['custom', 'opinion'],
  party: ['material', 'flag'],
  photo: ['material', 'photo_camera'],
  previewProfile: ['material', 'switch_account'],
  previous: ['material', 'arrow_back_ios'],
  profile: ['material', 'face'],
  removeFromList: ['material', 'playlist_remove'],
  results: ['material', 'format_list_numbered'],
  search: ['material', 'search'],
  settings: ['material', 'settings'],
  show: ['material', 'visibility'],
  skip: ['custom', 'skip'],
  sort: ['material', 'sort_by_alpha'],
  tip: ['material', 'lightbulb']
} as const;