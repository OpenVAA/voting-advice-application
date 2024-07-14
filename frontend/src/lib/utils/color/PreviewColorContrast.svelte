<script lang="ts">
  import { adjustContrast, calcContrast } from './adjustContrast';
  import { luminance } from './luminance';
  import { parseColor } from './parseColor';
  import type { RGB } from './rgb';
  import { rgbToHex } from './rgbToHex';

  let origColor = '#000000';
  let parsedColor = '';
  let color = '#000000';
  let bgColor = '#d1ebee';
  let contrast: number;
  let origContrast: number;
  let origLuminance: number;
  let bgLum: number;
  let adjLum: number;

  $: {
    const rgb = parseColor(origColor);
    const bgRgb = parseColor(bgColor);
    if (rgb != null) {
      origLuminance = luminance(rgb);
      parsedColor = rgbToHex(rgb);
      const bgRgb = parseColor(bgColor);
      if (rgb != null && bgRgb != null) {
        origContrast = calcContrast(rgb, bgRgb).contrast;
        if (origContrast < 4.5) {
          color = adjustContrast(rgb, bgRgb);
          const adjRgb = parseColor(color) as RGB;
          adjLum = luminance(adjRgb);
          contrast = calcContrast(adjRgb, bgRgb).contrast;
        } else {
          adjLum = luminance(rgb);
          contrast = origContrast;
        }
      }
    } else {
      parsedColor = 'error';
      origContrast = -1;
    }
    if (bgRgb != null) {
      bgLum = luminance(bgRgb);
    } else {
      bgLum = -1;
    }
  }
</script>

<!--@component
This is a preview component for trying out the color contrast utility. For use in documentation.

### Usage

```tsx
<PreviewColorContrast/>
```
-->

<div class="m-lg flex max-w-xl flex-col items-stretch gap-lg">
  <h1>Color contrast utility</h1>
  <p>
    Type in a foreground and a background color and see the new color adjusted to reach a minimum
    contrast of ~4.5 on the background while trying to preserve the hue. See console for errors.
  </p>
  <div class="p-lg" style:background-color={bgColor} style:color={origColor}>Original color</div>
  <div class="p-lg" style:background-color={bgColor} style:color>Adjusted color</div>
  <label>
    Original color = {parsedColor} • Contrast = {origContrast.toFixed(2)} • Luminance = {origLuminance.toFixed(
      2
    )}
    <input bind:value={origColor} type="text" class="input input-bordered w-full" />
  </label>
  <label>
    Adjusted color • Contrast = {contrast.toFixed(2)} • Luminance = {adjLum.toFixed(2)}
    <input disabled bind:value={color} type="text" class="input input-bordered w-full" />
  </label>
  <label>
    Bg color • Luminance = {bgLum.toFixed(2)}
    <input bind:value={bgColor} type="text" class="input input-bordered w-full" />
  </label>
</div>
