---
name: let-it-fly-architecture
overview: 基于 prompt.md 构建 Flight World Engine — 滚动驱动的电影级3D探索平台。包含四大阶段（飞机选择→场景加载→电影飞行→自由探索）、配置驱动的多世界系统、CatmullRomCurve3飞行路径、电影级摄像机系统、后期处理管线、音频系统等。
design:
  architecture:
    framework: html
  styleKeywords:
    - Minimalist Immersive
    - Cinematic
    - Dreamlike
    - Paper Texture
    - Warm Earth Tones
    - Zero-UI Flight
  fontSystem:
    fontFamily: Arial, sans-serif
    heading:
      size: clamp(4rem,15vw,12rem)
      weight: 700
    subheading:
      size: clamp(1rem,2vw,1.5rem)
      weight: 500
    body:
      size: clamp(0.875rem,1.2vw,1.125rem)
      weight: 400
  colorSystem:
    primary:
      - "#aecae5"
      - "#ead0b8"
    background:
      - "#F8FBFD"
      - "#EEF6FA"
      - "#E7EFF5"
    text:
      - "#4b5b68"
      - "#888f96"
    functional:
      - "#e9a696"
      - "#b2c2a3"
      - "#f2c57d"
todos:
  - id: project-setup
    content: 初始化Vite项目、package.json、vite.config.js、index.html骨架与CSS基础样式
    status: pending
  - id: core-engine
    content: 实现Engine核心（Renderer/Scene/Camera/Loop）与工具函数（lerp/clamp/pseudoNoise）
    status: pending
    dependencies:
      - project-setup
  - id: config-system
    content: 创建WORLDS与PLANES配置模块，定义数据结构与默认世界
    status: pending
    dependencies:
      - project-setup
  - id: world-loading
    content: 实现WorldLoader(GLB加载)与SceneProcessor(包围盒归一化/居中/缩放)
    status: pending
    dependencies:
      - core-engine
  - id: plane-system
    content: 实现PlaneLoader(飞机GLB加载)与CargoSlot(预留挂载点)和选择界面UI
    status: pending
    dependencies:
      - core-engine
  - id: flight-system
    content: 实现FlightPath(CatmullRomCurve3)、FlightController(滚动→速度)、PlaneMotion(位置/旋转/wobble)、LandingSequence
    status: pending
    dependencies:
      - config-system
      - world-loading
      - plane-system
  - id: camera-system
    content: 实现CameraRig(摄像机spline跟随/lookAt/FOV/shake)与CameraSequence(五阶段电影运镜)
    status: pending
    dependencies:
      - flight-system
  - id: audio-effects-controls
    content: 实现AudioManager(淡入/循环)、PostProcessing(Bloom/FXAA/Grain/Vignette)、ScrollHandler与ExplorationControls
    status: pending
    dependencies:
      - core-engine
  - id: stage-integration
    content: 实现StageManager状态机与四个Stage(选择/加载/飞行/探索)，串联完整体验流程
    status: pending
    dependencies:
      - flight-system
      - camera-system
      - audio-effects-controls
---

