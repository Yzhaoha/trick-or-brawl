# Trick or Brawl: dev notes

## Build
- Edit `src/index.html` (game) and `src/platform/*` (Poki and CrazyGames SDK wrappers), then run `python3 build.py`.
- Output: `poki/`, `crazygames/`, `dist/trick-or-brawl-{poki,crazygames}.zip` (index.html at the zip root), and the repo root (a copy of the Poki build; GitHub Pages serves it).
- Every external file (three.js r160, @poki/netlib, fonts) is vendored in `src/vendor/`. Only the SDK and ad stacks are loaded from outside.

## Platform rules already handled
- Poki: gameplayStart/Stop never sent twice in a row; a commercialBreak on resume from pause (solo only) and between matches; Esc pauses.
- CrazyGames: SDK v3 inits after the body exists; a midgame ad only between matches; muteAudio setting followed; Data module for saves; Esc reserved (P pauses).
- Online play is kept (Poki netlib WebRTC).

## Voxel / toy-block art (in progress)
- Preview behind `?style=voxel` (default look unchanged). Test links: add `&v=<commit>` so phones skip the GitHub Pages cache.
- Approved direction: flat-colour solid blocks, a dark outline round every block (CHIBI_OUT backface box), camera-lit stepped matcap (voxMonMat, keeps the hit-flash emissive), and the face drawn on a canvas-texture plane (eyes with a highlight, brows, blush, mouth). The ground stays smooth.
- Done: the wolf (`buildVoxel` in src/index.html, helpers `tb()` and `decal()`).
- To do: vamp, mummy, witch and ghost in the same style (the ghost stays transparent); then maybe campfires, pedestals and buckets; then switch the default look.

## Other to-dos
- Poki profanity word list for online names; Poki static and animated thumbnails; new covers and video for the new look.
- A one-off three.js "byteLength" render error was seen once in the CG build and never reproduced.
- Known limit: if the host's tab goes to the background, the room freezes (no host migration).
- Never submit to a portal without the user's explicit yes; portal forms are filled in the user's own browser on their Mac.
