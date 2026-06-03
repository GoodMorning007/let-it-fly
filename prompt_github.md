Here's the rewritten spec for a single plain HTML file:

---

# Paper Planes — Cinematic Scroll-Driven Experience (Plain HTML)

Build a cinematic scroll-driven paper plane experience using Three.js (loaded via CDN). The entire experience is a single `.html` file with embedded CSS and JavaScript. The page is a scroll-controlled animation mapped to a 500vh scroll runway (600vh on mobile below 768px width). No frameworks — just vanilla HTML, CSS, and JS with Three.js. The page has no visible UI chrome — just the 3D scene, text, and effects.

---

## Architecture

Everything lives in one HTML file:

- **`<style>`** — All CSS: global resets, fonts, layout, overlays, animations, loading screen, text overlays.
- **`<body>`** — Scroll runway div, canvas container, text overlay divs, post-effect divs, loading screen div.
- **`<script type="importmap">`** — Maps `"three"` to the CDN URL.
- **`<script type="module">`** — All JavaScript: Three.js setup, geometry, splines, animation loop, scroll/mouse tracking, text visibility logic, loading screen logic.

### Three.js via CDN (Import Map)

```html
<script type="importmap">
{
  "imports": {
    "three": "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.module.js"
  }
}
</script>
<script type="module">
import * as THREE from 'three';
// ... all JS here
</script>
```

---

## Fonts

Add to `<style>`:

```css
@import url('https://fonts.cdnfonts.com/css/humane');
@import url('https://fonts.cdnfonts.com/css/satoshi');
```

- **Humane** — tall condensed display font. Used for all titles. Always uppercase, letter-spacing `0.05em`, line-height `0.85`–`0.9`. Font stack: `'Humane', sans-serif`.
- **Satoshi** — geometric sans-serif. Used for all body copy, subtitles, and UI text. Font stack: `'Satoshi', 'Inter', sans-serif`.

---

## Color Palette (Exact Hex Values)

| Name | Hex | Usage |
|------|-----|-------|
| Paper White | `#F5F0EB` / `0xF5F0EB` | Body background, scene background (fold/launch/soar), plane material color, light text color |
| Ink | `#2A2520` / `0x2A2520` | Text color on light beats (fold/launch/soar), loading screen text, progress bar fill |
| Fold Shadow | `#D4C9BB` / `0xD4C9BB` | Desk surface color, wind trail line color, progress bar track |
| Golden Hour | `#C4956A` / `0xC4956A` | Directional light color during soar beat |
| Dusk Blue | `#7B8FA1` / `0x7B8FA1` | Directional light color during descent beat |
| Moss | `#8A9A7B` / `0x8A9A7B` | Terrain mesh color, hemisphere light ground color |
| Warm Light | `#FFE8D0` / `0xFFE8D0` | Initial directional light color (fold/launch) |
| Soft Light | `#E8DDD4` / `0xE8DDD4` | Directional light color during landing |
| Descent BG | `#D8DDE8` / `0xD8DDE8` | Scene background color during descent |
| Landing BG | `#EDE8E0` / `0xEDE8E0` | Scene background color during landing |
| Soar Fog | `#F0E0C8` / `0xF0E0C8` | Fog color during soar |
| Descent Fog | `#C0C8D8` / `0xC0C8D8` | Fog color during descent |
| Landing Fog | `#E8E0D8` / `0xE8E0D8` | Fog color during landing |
| Ambient Descent | `#8090B0` / `0x8090B0` | Ambient light color during descent |
| Ambient Landing | `#F0E8DD` / `0xF0E8DD` | Ambient light color during landing |
| Sky Blue | `#87CEEB` / `0x87CEEB` | Hemisphere light sky color |

### Selection Colors
```css
::selection {
  background: rgba(196, 149, 106, 0.3);
  color: #2A2520;
}
```

---

## Global Styles (in `<style>`)

```css
* { cursor: crosshair !important; margin: 0; padding: 0; box-sizing: border-box; }
html { scroll-behavior: auto; }
body { overflow-x: hidden; background-color: #F5F0EB; }
::selection { background: rgba(196, 149, 106, 0.3); color: #2A2520; }
```

---

## HTML Structure

```html
<body>
  <!-- Scroll runway — only scrollable content -->
  <div id="scroll-runway"></div>

  <!-- Three.js canvas container -->
  <div id="canvas-container"></div>

  <!-- Post-processing overlays -->
  <div id="cursor-spotlight"></div>
  <div id="vignette"></div>
  <div id="film-grain"></div>

  <!-- Text overlays -->
  <div id="text-overlays">
    <div id="beat-fold" class="beat-text"> ... </div>
    <div id="beat-launch" class="beat-text"> ... </div>
    <div id="beat-soar" class="beat-text"> ... </div>
    <div id="beat-descent" class="beat-text"> ... </div>
    <div id="beat-landing" class="beat-text"> ... </div>
    <div id="scroll-indicator"> ... </div>
    <div id="replay-prompt"> ... </div>
  </div>

  <!-- Loading screen -->
  <div id="loading-screen"> ... </div>
</body>
```

---

## Scroll System (JavaScript)

- The `#scroll-runway` div has `height: 500vh` (or `600vh` when `window.innerWidth < 768`), `position: relative`. This is the only scrollable content.
- Scroll progress is calculated as: `scrollY / (document.scrollHeight - window.innerHeight)`, clamped to [0, 1].
- Scroll velocity is tracked (absolute delta between current and last scrollY) but used only internally.
- Mouse position is normalized: `x = (clientX / innerWidth) * 2 - 1`, `y = -(clientY / innerHeight) * 2 + 1`.
- Both scroll and mousemove listeners use `{ passive: true }`.

### State Variables (module-level `let`)
```js
let scrollProgress = 0;
let mousePos = { x: 0, y: 0 };
let scrollDir = 1;
let previousT = 0;
```

---

## Paper Plane Geometry (JavaScript function)

A fully procedural `THREE.BufferGeometry` — no external models. Classic dart paper plane with 16 triangular faces, flat-shaded with per-face normals.

### Scale Factor
`const scale = 1.2` — applied to all vertex coordinates.

### Vertex Definitions (before scale multiplication)
All coordinates are `[x, y, z]` multiplied by `scale`:

| Vertex Name | Raw Coordinates | Scaled Coordinates |
|---|---|---|
| nose | `[0, 0, -2]` | `(0, 0, -2.4)` |
| tailCenter | `[0, 0.05, 1.2]` | `(0, 0.06, 1.44)` |
| tailLeft | `[-0.15, 0.08, 1.2]` | `(-0.18, 0.096, 1.44)` |
| tailRight | `[0.15, 0.08, 1.2]` | `(0.18, 0.096, 1.44)` |
| wingLeftInner | `[-0.3, 0.1, 0.6]` | `(-0.36, 0.12, 0.72)` |
| wingRightInner | `[0.3, 0.1, 0.6]` | `(0.36, 0.12, 0.72)` |
| wingLeftOuter | `[-1.1, -0.05, 0.4]` | `(-1.32, -0.06, 0.48)` |
| wingRightOuter | `[1.1, -0.05, 0.4]` | `(1.32, -0.06, 0.48)` |
| wingLeftTip | `[-0.9, -0.02, 1.0]` | `(-1.08, -0.024, 1.2)` |
| wingRightTip | `[0.9, -0.02, 1.0]` | `(1.08, -0.024, 1.2)` |
| belly | `[0, -0.08, 0.3]` | `(0, -0.096, 0.36)` |

### Face Winding Order (16 triangles)
Each face is defined as 3 vertices in order. Winding determines the face normal direction.

```
Face 0  — Top fuselage left:       nose, wingLeftInner, tailCenter
Face 1  — Top fuselage right:      nose, tailCenter, wingRightInner
Face 2  — Left wing upper front:   nose, wingLeftOuter, wingLeftInner
Face 3  — Right wing upper front:  nose, wingRightInner, wingRightOuter
Face 4  — Left wing upper back:    wingLeftInner, wingLeftOuter, wingLeftTip
Face 5  — Right wing upper back:   wingRightInner, wingRightTip, wingRightOuter
Face 6  — Left wing tail:          wingLeftInner, wingLeftTip, tailLeft
Face 7  — Right wing tail:         wingRightInner, tailRight, wingRightTip
Face 8  — Tail left:               tailCenter, tailLeft, wingLeftInner
Face 9  — Tail right:              tailCenter, wingRightInner, tailRight
Face 10 — Bottom left:             nose, belly, wingLeftOuter
Face 11 — Bottom right:            nose, wingRightOuter, belly
Face 12 — Bottom tail left:        belly, tailLeft, wingLeftOuter
Face 13 — Bottom tail right:       belly, wingRightOuter, tailRight
Face 14 — Bottom center left:      belly, tailCenter, tailLeft
Face 15 — Bottom center right:     belly, tailRight, tailCenter
```

### Normal Computation
Each face uses a flat normal: `cross(edge1, edge2).normalize()` where `edge1 = B - A`, `edge2 = C - A`. All three vertices of a face share the same normal (flat shading).

### UV Mapping
Planar projection: `u = (vertex.x / (1.1 * scale) + 1) * 0.5`, `v = (vertex.z / (2 * scale) + 1) * 0.5`.

### BufferGeometry Assembly
Position, normal, and UV are set as `Float32BufferAttribute` with item sizes 3, 3, and 2 respectively. No index buffer — each triangle has its own 3 vertices (non-indexed for flat shading).

### Plane Material
```js
new THREE.MeshStandardMaterial({
  color: 0xF5F0EB,      // Paper White
  roughness: 0.85,
  metalness: 0.0,
  flatShading: true,
  side: THREE.DoubleSide,
})
```
- `castShadow: true`
- `receiveShadow: true`

### Flat Sheet Geometry (unused morph target, exported)
`PlaneGeometry(2.4, 3.2, 1, 1)` rotated `-Math.PI / 2` on X axis.

---

## Three.js Scene Setup

### Scene
- `scene.background = new THREE.Color(0xF5F0EB)` (Paper White)
- `scene.fog = new THREE.FogExp2(0xF5F0EB, 0.0)` (starts with zero density)

### Camera
- `PerspectiveCamera(35, aspect, 0.1, 500)`
- Initial position: `(0, 2, 5)`

### Renderer
```js
new THREE.WebGLRenderer({
  antialias: true,
  alpha: false,
  powerPreference: 'high-performance',
})
```
- `setPixelRatio(Math.min(devicePixelRatio, 2))`
- `toneMapping: THREE.ACESFilmicToneMapping`
- `toneMappingExposure: 1.0`
- `shadowMap.enabled: true`
- `shadowMap.type: THREE.PCFSoftShadowMap`

### Container
The canvas is appended to `#canvas-container`, which is styled:
```css
#canvas-container {
  position: fixed;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
}
```

---

## Scene Objects

### Desk Surface
- `PlaneGeometry(8, 6)` rotated `-Math.PI / 2` on X
- Material: `MeshStandardMaterial({ color: 0xD4C9BB, roughness: 0.9, metalness: 0 })`
- Position: `(0, 0, 0)`
- `receiveShadow: true`

### Terrain (Landing)
- `PlaneGeometry(100, 60, 64, 64)` rotated `-Math.PI / 2` on X
- Height displacement per vertex: `h = sin(x * 0.1) * cos(z * 0.1) * 0.8 + sin(x * 0.3 + 1) * cos(z * 0.2) * 0.3`
- Vertex normals recomputed after displacement via `computeVertexNormals()`
- Material: `MeshStandardMaterial({ color: 0x8A9A7B, roughness: 0.95, metalness: 0, flatShading: true })`
- Position: `(0, -1, -140)`
- `receiveShadow: true`
- `visible: false` initially — becomes visible when `scrollProgress > 0.6`

### Clouds (40 groups)
- Each group has `5 + floor(random() * 5)` spheres (5–9 spheres per cloud)
- Each sphere: `SphereGeometry(r, 8, 6)` where `r = 1 + random() * 3`
- Sphere material (cloned per sphere): `MeshStandardMaterial({ color: 0xFFFFFF, roughness: 1, metalness: 0, transparent: true, opacity: 0.6 })`
- Sphere local position within group: `x: (random()-0.5)*4, y: (random()-0.5)*1.5, z: (random()-0.5)*3`
- Sphere Y-scale: `0.5 + random() * 0.3`
- Group world position: `x: (random()-0.5)*60, y: 8+random()*20, z: -20-random()*130`
- Cloud drift per frame: `cloud.position.x += sin(elapsed * 0.1 + cloudIndex) * 0.002`

### Wind Trail
- 50-point `THREE.Line`
- Material: `LineBasicMaterial({ color: 0xD4C9BB, transparent: true, opacity: 0.3 })`
- Initialized with 50 copies of `Vector3(0, 1, 0)`
- Each frame: `unshift(plane.position.clone())`, pop if > 50 points, rebuild `BufferGeometry.setFromPoints()`
- Opacity set to `0.2` when airborne (t > 0.1), `0` during fold
- Old geometry is `.dispose()`d each frame before replacement

---

## Lighting

### Directional Light
- Initial: `DirectionalLight(0xFFE8D0, 1.5)`, position `(-3, 5, 2)`
- `castShadow: true`
- `shadow.mapSize`: 1024 × 1024
- `shadow.camera.near`: 0.5
- `shadow.camera.far`: 50

### Ambient Light
- Initial: `AmbientLight(0xF5F0EB, 0.4)`

### Hemisphere Light
- `HemisphereLight(0x87CEEB, 0x8A9A7B, 0.3)` — sky blue / moss green

---

## Spline Control Points

Both splines: `CatmullRomCurve3([...], false, 'catmullrom', 0.5)` — not closed, catmullrom type, tension 0.5.

### Plane Flight Path Spline (14 points)
```
Index  0: (0, 1.0, 0)       — on desk (fold)
Index  1: (0, 1.0, 0)       — fold hold
Index  2: (0, 1.5, -3)      — launch start
Index  3: (0, 4, -12)       — launch climb
Index  4: (2, 12, -25)      — soar entry
Index  5: (-1, 18, -45)     — soar peak
Index  6: (3, 22, -65)      — soar high point
Index  7: (0, 20, -80)      — soar end
Index  8: (-2, 16, -95)     — descent start
Index  9: (1, 10, -110)     — descent mid
Index 10: (-1, 5, -125)     — descent low
Index 11: (0, 2, -135)      — approach
Index 12: (0, 0.8, -145)    — near ground
Index 13: (0, 0.3, -150)    — landing
```

### Camera Spline (14 points)
```
Index  0: (0, 2.5, 4)       — looking at desk (fold)
Index  1: (0, 2.5, 3)       — fold
Index  2: (0, 3, -1)        — launch
Index  3: (0, 6, -8)        — launch climb
Index  4: (3, 14, -20)      — soar entry
Index  5: (-2, 20, -40)     — soar
Index  6: (4, 24, -60)      — soar high
Index  7: (1, 22, -75)      — soar end
Index  8: (-3, 18, -90)     — descent start
Index  9: (2, 12, -105)     — descent mid
Index 10: (-1, 7, -120)     — descent low
Index 11: (1, 4, -131)      — landing approach
Index 12: (0, 2.5, -140)    — near landing
Index 13: (2, 1.8, -146)    — landing
```

---

## Pseudo-Noise Function

Used for organic wobble and camera shake:
```js
function pseudoNoise(t, freq = 1) {
  return Math.sin(t * freq * 6.28) * 0.5
       + Math.sin(t * freq * 2.71 * 6.28) * 0.3
       + Math.sin(t * freq * 4.17 * 6.28) * 0.2;
}
```
Three sine waves with irrational frequency ratios (1.0, 2.71, 4.17) and amplitude weights (0.5, 0.3, 0.2).

---

## Animation Loop — Per-Frame Logic

The animation runs on `requestAnimationFrame` in a continuous loop. All transitions use `lerp(current, target, factor)` per frame for smooth interpolation.

### Utility Functions
```js
function lerp(a, b, t) { return a + (b - a) * t; }
function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
```

### Scroll Direction Tracking
```
scrollDelta = currentT - previousT
if |scrollDelta| > 0.0001:
  scrollDir = lerp(scrollDir, delta > 0 ? 1 : -1, 0.1)
isReverse = scrollDir < 0
```
Initial `scrollDir = 1`. The 0.1 lerp factor creates a smooth direction change.

### Spline Sampling
`splineT = clamp(scrollProgress, 0, 0.999)` — never reaches 1.0 to avoid spline endpoint issues.

### Plane Position
1. Sample `planeSpline.getPoint(splineT)` for base position
2. Add organic wobble (only when `t > 0.1`, i.e. airborne):
   - `position.x += pseudoNoise(elapsed * 0.5, 0.7) * 0.15`
   - `position.y += pseudoNoise(elapsed * 0.3, 1.1) * 0.08`

### Plane Rotation

**During Fold (t < 0.1):**
- `foldT = t / 0.1` (0→1 through fold beat)
- Flat quaternion: `Euler(-PI/2 + mouseY * 0.14 * (1-foldT), mouseX * 0.14 * (1-foldT), 0)` — starts flat on desk with mouse parallax, parallax fades as fold progresses
- Fly quaternion: lookAt from planePos toward planePos+tangent, up vector (0,1,0)
- Final: `slerpQuaternions(flatQuat, flyQuat, foldT * foldT)` — squared easing (slow start, fast end)
- Scale: `s = 0.5 + foldT * 0.5` → uniform scale from 0.5 to 1.0

**During Flight (t >= 0.1):**
- Scale: `(1, 1, 1)` always
- Get tangent from `planeSpline.getTangent(splineT)`
- If reverse scrolling: `tangent.negate()` (flips plane 180°)
- Compute lookAt quaternion from tangent direction
- Banking: sample a point 0.02 ahead on spline (`splineT + 0.02`, or `-0.02` if reverse), clamped to [0, 0.999]
  - `bankAngle = (aheadPoint.x - planePos.x) * 0.3`
  - Apply as axis-angle rotation around normalized tangent vector
  - Multiply into target quaternion
- Apply via `plane.quaternion.slerp(targetQuat, 0.08)` — smooth follow

### Camera Position

**Forward Scroll:**
- Sample `cameraSpline.getPoint(splineT)`

**Reverse Scroll (isReverse && t > 0.1):**
- Compute behind-direction: `tangent.clone().negate().normalize()` (tangent was already negated for the plane, so negating again gives the original forward direction = behind the flipped plane's tail)
- `reverseCamPos = plane.position + behindDir * 8` (8 units behind)
- `reverseCamPos.y += 2.5` (elevated)
- Blend: `forwardCamPos.lerp(reverseCamPos, min(1, |scrollDir|))`

**Camera Shake (always):**
- `shakeAmp = 0.002 + (t > 0.1 && t < 0.3 ? 0.005 : 0)` — extra shake during launch
- `position.x += pseudoNoise(elapsed, 0.5) * shakeAmp * 10`
- `position.y += pseudoNoise(elapsed + 100, 0.5) * shakeAmp * 10`

**Final:** `camera.position.lerp(targetCamPos, 0.06)`

### Camera Look-At
- Base look-at: `plane.position.clone()` with `y += 0.3`
- If reverse: add `tangent.normalize() * 3.0` to look-at position (bias ahead of plane nose)
- Apply: `camera.lookAt(lookAtPos)` directly (no lerp on look-at)

### FOV Transitions
```
fold:    35    (tight, intimate)
launch:  65    (wide, dramatic)
soar:    50    (balanced)
descent: 45    (slightly tighter)
landing: 40    (calm, focused)
```
Applied via `camera.fov = lerp(camera.fov, targetFOV, 0.03)`, then `camera.updateProjectionMatrix()`.

---

## Per-Beat Lighting Transitions

All transitions use `color.lerp(targetColor, factor)` and `lerp(current, target, factor)` per frame.

### Fold
- dirLight.color → `#FFE8D0` (factor 0.02)
- dirLight.intensity → 1.5 (factor 0.02)
- dirLight.position → `(-3, 5, 2)` (factor 0.02)
- ambientLight.intensity → 0.3 (factor 0.02)

### Launch
- dirLight.color → `#FFE8D0` (factor 0.02)
- dirLight.intensity → 2.5 (factor 0.03)
- ambientLight.intensity → 0.6 (factor 0.03)

### Soar
- dirLight.color → `#C4956A` Golden Hour (factor 0.015)
- dirLight.intensity → 2.0 (factor 0.02)
- dirLight.position → `(-5, 8, -3)` (factor 0.01)
- ambientLight.intensity → 0.5 (factor 0.02)
- toneMappingExposure → 1.2 (factor 0.02)

### Descent
- dirLight.color → `#7B8FA1` Dusk Blue (factor 0.02)
- dirLight.intensity → 1.2 (factor 0.02)
- ambientLight.color → `#8090B0` (factor 0.01)
- ambientLight.intensity → 0.5 (factor 0.02)
- toneMappingExposure → 0.9 (factor 0.02)

### Landing
- dirLight.color → `#E8DDD4` (factor 0.02)
- dirLight.intensity → 1.0 (factor 0.02)
- ambientLight.color → `#F0E8DD` (factor 0.02)
- ambientLight.intensity → 0.7 (factor 0.02)
- toneMappingExposure → 1.0 (factor 0.02)

---

## Per-Beat Fog Transitions

Fog type: `FogExp2` (exponential squared).

| Beat | Target Density | Lerp Factor | Target Color | Color Lerp Factor |
|------|---------------|-------------|--------------|-------------------|
| Fold | 0.0 | 0.02 | (unchanged) | — |
| Launch | 0.003 | 0.02 | `#F5F0EB` Paper White | 0.02 |
| Soar | 0.005 | 0.01 | `#F0E0C8` warm golden | 0.01 |
| Descent | 0.008 | 0.015 | `#C0C8D8` cool blue | 0.015 |
| Landing | 0.006 | 0.02 | `#E8E0D8` warm neutral | 0.02 |

---

## Per-Beat Background Color Transitions

`scene.background` is a `THREE.Color`, lerped each frame:

| Beat | Target Color | Lerp Factor |
|------|-------------|-------------|
| Fold | `#F5F0EB` Paper White | 0.01 |
| Launch | `#F5F0EB` Paper White | 0.01 |
| Soar | `#F5F0EB` Paper White | 0.01 |
| Descent | `#D8DDE8` | 0.01 |
| Landing | `#EDE8E0` | 0.01 |

---

## Beat Boundaries (for getBeat function)

The beat lookup uses `>=` start and `<` end. If no beat matches (t = 1.0), return the last beat (landing).

```
fold:     [0.00, 0.10)
launch:   [0.10, 0.25)
soar:     [0.25, 0.55)
descent:  [0.55, 0.80)
landing:  [0.80, 1.00)
```

---

## Text Overlays (HTML + JavaScript DOM manipulation)

### Container
```html
<div id="text-overlays"></div>
```
```css
#text-overlays {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 30;
}
```

### Beat Text Content & Visibility Ranges

Text visibility uses separate ranges from the 3D beat boundaries (text appears/disappears at different times than lighting changes). JavaScript checks `scrollProgress` each frame and updates DOM element styles accordingly.

| Beat | Visible Range | Title | Subtitle | Body | Text Color |
|------|--------------|-------|----------|------|------------|
| fold | `[0, 0.08]` | THE FOLD | Every flight begins as a flat sheet. | A crease. A decision. The quiet intimacy of making something from nothing. | `#2A2520` |
| launch | `[0.12, 0.22]` | THE LAUNCH | The moment of release. | That breath between holding on and letting go — when potential becomes kinetic. | `#2A2520` |
| soar | `[0.30, 0.50]` | THE SOAR | Above everything. | Weightless. Golden light catches every fold. The world below is quiet. | `#2A2520` |
| descent | `[0.58, 0.75]` | THE DESCENT | All flights have an arc. | Not falling — gliding. The beauty is in the trajectory, not just the altitude. | `#F5F0EB` |
| landing | `[0.83, 0.97]` | THE LANDING | Stillness, earned. | A gentle arrival. Every fold, every current, every moment — leading here. | `#F5F0EB` |

### Text Block Positioning
Each beat's text block container:
```css
.beat-text {
  position: absolute;
  bottom: 0;
  left: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: flex-end;
  padding: 3rem;
  max-width: 36rem;
}
@media (min-width: 768px) {
  .beat-text { padding: 4rem; }
}
```

### Fade-Out Behavior
When scroll passes `beat.range[1]`, text fades out over the next 0.05 of scroll progress (applied via JS `element.style`):
- Opacity: `max(0, 1 - (t - rangeEnd) / 0.05)`
- Transform: `translateX(${(t - rangeEnd) / 0.05 * 40}px)` — slides 40px right as it fades

### StaggerText (Titles) — DOM Construction in JavaScript
On init, each title's text is split into characters. Each character is wrapped in two nested `<span>` elements:
- Outer `<span>`: `display: inline-block; overflow: hidden;`
- Inner `<span>`: carries the transform and opacity

**Character states (applied via JS `element.style`):**
- **Inactive:** `transform: translateY(110%) rotate(-5deg)`, `opacity: 0`
- **Active:** `transform: translateY(0) rotate(0deg)`, `opacity: 1`
- Transition delay per character: `index * 30ms` (only on enter, set to `0ms` on exit via JS)
- Transition duration: `600ms`
- Timing function: `cubic-bezier(0.22, 0.61, 0.36, 1)`
- Spaces converted to `\u00A0` (non-breaking space)
- CSS on inner spans: `transition: transform 600ms cubic-bezier(0.22, 0.61, 0.36, 1), opacity 600ms cubic-bezier(0.22, 0.61, 0.36, 1);`

### Title Styling
```css
.beat-title {
  font-family: 'Humane', sans-serif;
  font-size: clamp(3rem, 10vw, 10rem);
  letter-spacing: 0.05em;
  line-height: 0.9;
  text-transform: uppercase;
  margin-bottom: 1rem;
}
```

### FadeLine (Subtitles & Body) — DOM elements with JS-driven transitions
- **Inactive:** `transform: translateY(20px)`, `opacity: 0`
- **Active:** `transform: translateY(0)`, `opacity: 1`
- CSS: `transition: transform 800ms cubic-bezier(0.22, 0.61, 0.36, 1), opacity 800ms cubic-bezier(0.22, 0.61, 0.36, 1);`
- Delay on enter only (set via `transition-delay` in JS, reset to `0ms` on exit)

### Subtitle Styling
```css
.beat-subtitle {
  font-family: 'Satoshi', 'Inter', sans-serif;
  font-size: clamp(1rem, 2vw, 1.5rem);
  letter-spacing: -0.02em;
  opacity: 0.8;
  max-width: 32rem;
}
```
Enter delay: `400ms`.

### Body Copy Styling
```css
.beat-body {
  font-family: 'Satoshi', 'Inter', sans-serif;
  font-size: clamp(0.875rem, 1.2vw, 1.125rem);
  opacity: 0.6;
  line-height: 1.7;
  margin-top: 0.75rem;
  max-width: 28rem;
}
```
Enter delay: `700ms`.

### Scroll Indicator (Bottom Center)
Visible when `t < 0.03`. Opacity set via JS: `1 - t / 0.03`.
```css
#scroll-indicator {
  position: absolute;
  bottom: 3rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}
```
- Text: "SCROLL TO BEGIN"
- Font: Satoshi, `0.75rem`, letter-spacing `0.15em`, uppercase, color `#2A2520`, opacity `0.5`
- Below: a `<div>` styled as `width: 1px; height: 2rem; background: #2A2520; opacity: 0.3;` with CSS `animation: pulse 2s ease-in-out infinite;`

### Replay Prompt (Bottom Center)
Visible when `t > 0.95`. Opacity set via JS: `min(1, (t - 0.95) / 0.03)`.
```css
#replay-prompt {
  position: absolute;
  bottom: 3rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  pointer-events: auto;
  cursor: pointer;
}
```
- Text: "SCROLL TO FLY AGAIN", same styling as scroll indicator but color `#F5F0EB`
- Below: a `<div>` styled as `width: 1px; height: 2rem; background: #F5F0EB; opacity: 0.3; transform: rotate(180deg);` with pulse animation
- onclick: `window.scrollTo({ top: 0, behavior: 'smooth' })`

---

## CSS Post-Processing Effects

Mouse position is converted to percentage in JavaScript:
```js
const mx = ((mousePos.x + 1) / 2) * 100;  // 0–100%
const my = ((mousePos.y + 1) / 2) * 100;   // 0–100% (note: Y is inverted from screen coords)
```
These values are applied to DOM elements via `element.style.background` each frame.

### 1. Cursor Spotlight (z-index 19)
```css
#cursor-spotlight {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 19;
  transition: background 0.15s ease;
}
```
JS sets: `background: radial-gradient(circle 300px at ${mx}% ${my}%, rgba(245, 240, 235, 0.08), transparent)`

### 2. Vignette (z-index 20)
```css
#vignette {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 20;
  background: radial-gradient(ellipse 70% 70% at 50% 50%, transparent 50%, rgba(42, 37, 32, 0.25) 100%);
}
```

### 3. Film Grain (z-index 21)
```css
#film-grain {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 21;
  opacity: 0.04;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
  background-size: 256px 256px;
  mix-blend-mode: multiply;
  animation: grain 0.5s steps(4) infinite;
}
```

### Grain & Pulse Keyframes
```css
@keyframes grain {
  0%   { transform: translate(0, 0); }
  25%  { transform: translate(-2px, 2px); }
  50%  { transform: translate(2px, -2px); }
  75%  { transform: translate(-1px, -1px); }
  100% { transform: translate(0, 0); }
}
@keyframes pulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.1; }
}
```

---

## Loading Screen (HTML + JavaScript)

### HTML Structure
```html
<div id="loading-screen">
  <div id="loading-texture"></div>
  <div id="loading-content">
    <h1 id="loading-title">PAPER PLANES</h1>
    <p id="loading-text">Folding...</p>
    <div id="progress-track">
      <div id="progress-fill"></div>
    </div>
  </div>
</div>
```

### States (managed via JS variable)
Three phases: `'loading'` → `'revealing'` → `'done'`.

### Loading Phase (JavaScript)
- Simulated progress: `setInterval` every 100ms, increment by `random() * 8`, capped at 85%
- When scene is ready: set progress to 100%, after 400ms set phase to `'revealing'` (apply CSS transform), after 1600ms set phase to `'done'` and set `display: none`
- Scene reports ready via `setTimeout(onReady, 300)` after first init

### CSS
```css
#loading-screen {
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 100;
  background-color: #F5F0EB;
  transition: transform 1s cubic-bezier(0.22, 0.61, 0.36, 1);
}
#loading-screen.revealing {
  transform: translateY(-100%);
}
```

**Paper texture overlay:**
```css
#loading-texture {
  position: absolute;
  inset: 0;
  opacity: 0.03;
  background-image: url("data:image/svg+xml,..."); /* same noise SVG as grain */
}
```

**Title:**
```css
#loading-title {
  font-family: 'Humane', sans-serif;
  font-size: clamp(4rem, 15vw, 12rem);
  letter-spacing: 0.05em;
  line-height: 0.85;
  color: #2A2520;
  text-transform: uppercase;
  margin-bottom: 48px;
}
```

**Loading text:**
```css
#loading-text {
  font-family: 'Satoshi', 'Inter', sans-serif;
  font-size: 0.875rem;
  color: #2A2520;
  opacity: 0.5;
  letter-spacing: 0.1em;
  margin-bottom: 16px;
}
```

**Progress bar:**
```css
#progress-track {
  width: 120px;
  height: 1px;
  background: #D4C9BB;
  position: relative;
  overflow: hidden;
}
#progress-fill {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 0%;
  background: #2A2520;
  transition: width 0.3s ease;
}
```

### Reveal Animation
JS adds class `revealing` to `#loading-screen`, which triggers `transform: translateY(-100%)`. After transition completes, set `display: none`.

---

## Resize Handling

On window resize:
- Update `camera.aspect = w / h`
- `camera.updateProjectionMatrix()`
- `renderer.setSize(w, h)`
- Recalculate scroll runway height (`500vh` or `600vh` based on `window.innerWidth < 768`)

### Cleanup
Not needed for a single-page HTML file (no unmount lifecycle), but the resize listener is added once and persists.

---

## Z-Index Stack

```
 0  — Three.js canvas container (#canvas-container)
19  — Cursor spotlight (#cursor-spotlight)
20  — Vignette overlay (#vignette)
21  — Film grain overlay (#film-grain)
30  — Text overlays (#text-overlays)
100 — Loading screen (#loading-screen)
```

---

## Key Implementation Notes

1. **All transitions are frame-rate-dependent lerps**, not time-based. They use `lerp(current, target, factor)` per `requestAnimationFrame` call. This creates smooth exponential decay toward targets.

2. **Beat detection** uses a simple loop through beat boundaries with `>=` start, `<` end. Fallback is the last beat.

3. **The animation loop runs continuously** via `requestAnimationFrame`. Each frame reads the current `scrollProgress` and `mousePos` from module-level variables (updated by event listeners).

4. **Cloud randomness is seeded by Math.random()** at init time — clouds will be in different positions each page load. This is intentional.

5. **Trail geometry is recreated every frame** (dispose old, create new from points array). This is a simple approach for a 50-point line.

6. **The scroll runway div has no visible content** — it exists solely to create scrollable height for the scroll-to-progress mapping.

7. **Text overlay beat visibility ranges are DIFFERENT from 3D beat boundaries** — text appears and disappears at different scroll positions than lighting/fog changes, creating intentional gaps of no text between beats.

8. **All DOM references are cached** — `document.getElementById()` is called once at init and stored in variables. The animation loop only reads/writes `.style` properties on cached references.

9. **Three.js is loaded via import map** as an ES module. All code lives inside a single `<script type="module">` block.