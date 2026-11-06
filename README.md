# Beacon & Tide

An original 3D lighthouse game with six harbor charts. Aim by tapping or dragging on the harbor, or use the beam direction slider. Boats advance while lit. Earn stars for docking the fleet, meeting the crossing time, and keeping the fleet under steady light. Pause or close the page to save your voyage.

Open `index.html` or `standalone.html` in a WebGL browser. Both include the renderer and all assets. Three.js is bundled under its license in `vendor`. Run `node build.cjs` to rebuild and `node tests.mjs` to run regression checks.

GameWave integration uses actual voyage starts and ends. Positive likes unlock an amber lens and direct comments unlock fireworks. Both are optional and awarded once per saved profile. The game starts independently of the SDK. Saved state is limited to Beacon & Tide.
