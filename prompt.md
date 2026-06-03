# Flight World Engine — Scroll Driven Cinematic Exploration Platform (Three.js)

Build a cinematic exploration platform using Three.js.

The application is NOT a traditional website.

It is a scroll-driven interactive journey system where a paper airplane flies through immersive 3D worlds loaded from external GLB files.

The primary focus is environmental storytelling and scene exploration.

No text overlays, no narrative captions, and no UI distractions during flight.

The user experiences the world through the airplane's journey.

---

# Core Experience

The experience consists of four stages:

1. Plane Selection
2. Scene Loading
3. Cinematic Flight Journey
4. Free Exploration Mode

The airplane acts as a guide that introduces the world.

Once the destination is reached, control transfers to the user for free exploration.

---

# Technical Stack

Single Page Application.

Required:

* Three.js
* GLTFLoader
* OrbitControls
* EffectComposer
* UnrealBloomPass
* FXAA
* ACES Filmic Tone Mapping

No React.

No Vue.

No framework dependency.

Vanilla JavaScript only.

---

# World Configuration System

All worlds are loaded through configuration.

Example:

```js
const WORLDS = [
{
id: "happy_birthday",

title: "Happy Birthday",

scene:
"/assets/scenes/happy_birthday.glb",

music:
"/assets/audio/happy_birthday.mp3",

landingPoint:
[0,2,-15],

cameraTarget:
[0,6,-10],

flightPath:
[
[-120,80,180],
[-80,60,120],
[-40,40,80],
[-10,25,40],
[15,18,15],
[10,10,-5],
[0,2,-15]
]
}
];
```

The engine must support unlimited worlds.

No world-specific logic inside the engine.

Everything is configuration-driven.

---

# Plane System

The airplane is selectable before entering a world.

Example structure:

```js
const PLANES = [
{
id:"classic",
model:"/assets/planes/classic.glb"
},
{
id:"dreamer",
model:"/assets/planes/dreamer.glb"
}
];
```

The chosen plane persists throughout the journey.

---

# Cargo System (Future Expansion)

Must be supported architecturally.

Not implemented visually yet.

Reserve:

```js
selectedCargo
```

Examples:

```text
gift_box
letter
flower
photo
memory
```

The airplane system must allow attaching cargo models later.

---

# Flight Mode

After a plane is selected:

Load world.

Load music.

Load airplane.

Initialize flight path.

Begin cinematic mode.

---

# Flight Path System

Flight paths use:

THREE.CatmullRomCurve3

No linear movement.

No straight lines.

The path must feel organic.

Bird-like.

Wind-driven.

Natural.

Every world has its own spline.

---

# Scroll Driven Speed

Scroll does NOT control position.

Scroll controls velocity.

Scrolling down:

accelerate

Scrolling up:

decelerate

State:

```js
currentSpeed
targetSpeed
```

Use smooth interpolation.

Maximum speed configurable per world.

The airplane continuously flies.

The user controls pace.

---

# Airplane Motion

The airplane follows the spline.

Rotation derives from spline tangent.

Apply:

* pitch
* yaw
* roll

based on flight direction.

Add subtle procedural motion:

```js
pseudoNoise()
```

for:

* wind wobble
* lift fluctuations
* turbulence

Motion must never feel robotic.

---

# Camera System

The camera is cinematic.

The camera is NOT locked behind the plane.

The camera follows its own spline.

Each world defines:

```js
cameraSpline
```

The camera can:

* orbit
* overtake
* track
* lead
* flank

the airplane.

The result should resemble a film sequence.

---

# Cinematic Sequence

Recommended structure:

Far Reveal

↓

Approach

↓

Environmental Flythrough

↓

Close Pass

↓

Landing

Each stage blends smoothly.

No hard cuts.

Only spline-based transitions.

---

# Landing Sequence

When flight progress reaches 100%:

Gradually reduce speed.

Reduce camera movement.

Lower altitude.

Land at:

```js
landingPoint
```

within the scene.

The airplane remains visible.

---

# Free Exploration Mode

After landing:

Disable flight system.

Enable:

OrbitControls

User can:

* rotate
* zoom
* inspect
* explore

the environment freely.

The world remains fully interactive.

Music continues playing.

---

# GLB Scene Handling

Scenes are external files.

Examples:

```text
happy_birthday.glb
forest.glb
island.glb
city.glb
space.glb
```

The engine must automatically:

* load
* center
* scale
* optimize

GLB scenes.

No hardcoded coordinates.

Bounding box calculations required.

---

# Environment Storytelling

No text overlays.

No chapter titles.

No subtitles.

No body copy.

The world itself tells the story.

Everything should feel like:

* Journey
* Sky
* Flower
* Monument Valley style exploration

---

# Audio System

Each world defines:

```js
music
```

Behavior:

On flight start:

Fade in over 3 seconds.

Loop automatically.

Volume configurable.

Landing does NOT stop music.

Exploration mode continues music.

---

# Visual Effects

Required:

Film Grain

Vignette

Bloom

Color Grading

Atmospheric Fog

FXAA

ACES Filmic Tone Mapping

Optional:

Chromatic Aberration

Lens Distortion

---

# Atmosphere

The experience should feel:

dreamlike

gentle

cinematic

emotional

peaceful

exploratory

The user should feel that they are entering a miniature world rather than viewing a 3D model.

---

# Engine Goal

The platform is a cinematic world explorer.

The airplane introduces the world.

The world becomes the destination.

The user ultimately transitions from passive observer to active explorer.
