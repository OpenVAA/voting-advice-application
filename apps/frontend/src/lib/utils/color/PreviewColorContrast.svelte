<!--@component
This is a preview component for trying out the color contrast utility. For use in documentation.

### Usage

```tsx
<PreviewColorContrast/>
```
-->

<script lang="ts">
  import { adjustContrast, calcContrast } from './adjustContrast';
  import { luminance } from './luminance';
  import { parseColorString } from './parseColorString';
  import { rgbToHex } from './rgbToHex';
  import type { RGB } from './rgb';

  let origColor = $state('#000000');
  let bgColor = $state('#d1ebee');

  const computed = $derived.by(() => {
    let parsedColor = '';
    let color = '#000000';
    let contrast = 0;
    let origContrast = 0;
    let origLuminance = 0;
    let bgLum = 0;
    let adjLum = 0;

    const rgb = parseColorString(origColor);
    const bgRgb = parseColorString(bgColor);
    if (rgb != null) {
      origLuminance = luminance(rgb);
      parsedColor = rgbToHex(rgb);
      if (bgRgb != null) {
        origContrast = calcContrast(rgb, bgRgb).contrast;
        if (origContrast < 4.5) {
          color = adjustContrast(rgb, bgRgb);
          const adjRgb = parseColorString(color) as RGB;
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
    return { parsedColor, color, contrast, origContrast, origLuminance, bgLum, adjLum };
  });
</script>

<div class="m-lg gap-lg flex max-w-xl flex-col items-stretch">
  <h1>Color contrast utility</h1>
  <p>
    Type in a foreground and a background color and see the new color adjusted to reach a minimum contrast of ~4.5 on
    the background while trying to preserve the hue. See console for errors.
  </p>
  <div class="p-lg" style:background-color={bgColor} style:color={origColor}>Original color</div>
  <div class="p-lg" style:background-color={bgColor} style:color={computed.color}>Adjusted color</div>
  <label>
    Original color = {computed.parsedColor} • Contrast = {computed.origContrast.toFixed(2)} • Luminance = {computed.origLuminance.toFixed(
      2
    )}
    <input bind:value={origColor} type="text" class="input w-full" />
  </label>
  <label>
    Adjusted color • Contrast = {computed.contrast.toFixed(2)} • Luminance = {computed.adjLum.toFixed(2)}
    <input disabled value={computed.color} type="text" class="input w-full" />
  </label>
  <label>
    Bg color • Luminance = {computed.bgLum.toFixed(2)}
    <input bind:value={bgColor} type="text" class="input w-full" />
  </label>
</div>
