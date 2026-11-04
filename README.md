# NEON CITY

Mobile-first third-person WebGL city exploration prototype built with React and Three.js. All game geometry and canvas facade textures are generated in code; no imported 3D assets are used.

## Run locally

```sh
npm install
npm run dev
```

Open the printed Vite URL in a modern browser. The game is designed for landscape orientation on phones; rotate your device for the intended controls.

## World streaming

The procedural city streams a 5 × 5 neighborhood of 120 m chunks around the player and disposes distant chunks. The map places the city center, Civic Center, airport/industrial north, beachfront and stadium east, suburbs south, and Old Town west. A circular minimap and atlas support custom waypoints. The day/night period is ten minutes and clear/rain/fog states are selectable from the HUD.

All models, textures, and audio are original procedural work. Performance varies with device, browser, and GPU; the 30 FPS target is not guaranteed on every phone.
