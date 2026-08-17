# Video

A video player that also includes a switcher between the video and a text transcript. The player also supports a variety of controls that mimic social media video controls.

The player can be initialized without providing any content in which case it will be hidden until the content is provided using the `load` function.

It's best to supply a number of sources, such as `mp4` and `webm` to support different browsers and devices. You also need to supply a `poster` image and VTT `captions` for accessibility reasons. `aspectRatio` is required for sizing the player correctly. A text `transcript` is recommended to be supplied, but if it's missing, one will be created from the `captions`.

You can hide some of the controls using the `hideControls` property, in which case you should implement the functionality otherwise by binding to the control functions (see below).

The player will try to unmute the video when the user first interacts with it. You can disable this by setting `autoUnmute` to `false`.

User choices are stored in the `videoPreferences` store so that they persist across page loads. The preferences included are `muted`, `textTracksHidden` and `transcriptVisible`.

### Content properties

If not provided, the `video` element will be hidden until these properties are provided using the `load` function.

- `title`: The title of the video for labelling.
- `sources`: The source URLs of the video.
- `captions`: The source URL for the video's captions.
- `poster`: The poster image URL for the video.
- `aspectRatio`: The aspect ratio of the video. This is needed so that the component can be sized correctly even before the data is loaded. Default: `1/1`
- `transcript`: Optional transcript text for the video as a HTML string. If empty, `captions` will be used instead.

### Other properties

- `hideControls`: The controls to hide. All are shown if the list is not defined. Default: `undefined`
- `autoPlay`: Whether to autoPlay the video (when content is provided). Default: `true`
- `autoUnmute`: Whether to automatically try to unmute the video when the user interacts with it. Default: `true`
- `showCaptions`: Whether to show captions by default. Default: `true`
- `showTranscript`: Whether to show the transcript instead of the video by default. Default: `false`
- `skipByCue`: Whether to skip using the captions' cues. Default: `true`
- `skipAmount`: The amount in seconds to skip if not using cues. Default: `10`

### Callbacks

- `onTrack`: A callback triggered when the video tracking event should be sent. Send to `TrackingService.startEvent` or `track` to track.
- `onEnded`: Forwarded from the `<video>` element.

### Bindable properties

- `atEnd`: Bindable: Whether the video is at the end (with a small margin)
- `mode`: Bindable: Whether the video or the transcript is visible.

### Bindable functions

- `togglePlay`: Toggle video playback or replay.
- `toggleSound`: Toggle sound
- `toggleCaptions`: Show or hide captions.
- `toggleTranscript`: Toggle transcript visibility.
- `jump`: Skip the video a number of steps based on text track cues or `skipAmount` if cues are not available. If the video is in the end, a `steps` of `-1` will be skip to the beginning of the last cue. If `steps` would result in a negative index or one greater than the number of cues, the video will be scrolled to the beginning or the end.
- `gotoAndPlay`: Scroll the video to the given time and play.
- `load`: Change the video contents, i.e. sources, captions, poster and transcript, and optionally other properties.

### Tracking events

- `video`: The video player creates an analytics event for each video viewed which combines a number of properties. See the `VideoTrackingEventData` in `Video.type.ts` for a complete description. The event is started and submitted when:
  - the component is created/destroyed
  - when the video shown is changed with `reload`
  - when the page's visibility changes to `hidden`.

### Usage

```tsx
<Video
  title="Video title"
  sources={['https://openvaa.org/video.webm', 'https://openvaa.org/video.mp4']}
  captions="https://openvaa.org/video.vtt"
  poster="https://openvaa.org/video.jpg"
  aspectRatio={4 / 5}
  transcript="<p>Transcript text</p>"
/>
```

## Source

[frontend/src/lib/components/video/Video.svelte](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/video/Video.svelte)

[frontend/src/lib/components/video/Video.type.ts](https://github.com/OpenVAA/voting-advice-application/blob/main/frontend/src/lib/components/video/Video.type.ts)
