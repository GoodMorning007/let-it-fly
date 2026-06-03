/**
 * Worlds Configuration
 *
 * Each world defines:
 * - id: Unique identifier
 * - title: Display name
 * - scene: Path to GLB scene file
 * - music: Path to audio file (optional)
 * - scale: Manual scene scale (no auto-normalization)
 * - position: Scene world position offset
 * - landingPoint: Exploration start point [x, y, z]
 * - cameraTarget: Default look-at target [x, y, z]
 * - cameraPosition: Initial camera position [x, y, z]
 * - flightPath: Plane flight path control points (Skyscraper)
 * - cameraPath: Camera flight path control points (Skyscraper)
 * - cameraEvents: Cinematic camera event sequence (Skyscraper)
 * - theme: Visual theme parameters at progress nodes (Skyscraper)
 * - maxSpeed: Maximum flight speed (Skyscraper)
 *
 * Note: flightPath/cameraPath/cameraEvents/theme/maxSpeed
 *   are reserved for future flight system integration.
 */

export const WORLDS = [
  {
    id: 'happy_birthday',
    title: 'Happy Birthday',
    scene: '/scenes/happy_birthday.glb',
    music: '/audio/happy_birthday.mp3',

    // Manual placement — no auto-normalization
    scale: 1.0,
    position: [0, 0, 0],

    // Exploration start
    landingPoint: [-4.55, 2.75, -0.87],
    cameraTarget: [-4.55, 2.75, -0.87],
    cameraPosition: [-20.02, 9.34, -1.01],

    // --- Flight path: 三圈盘旋 → 低空观察 → 失速降落 (26点) ---
    flightPath: [
      [-38.00, 20.00,  8.00],   //  P1: 起飞
      [-29.00, 22.00, 37.00],   //  P2: 左后高点
      [  0.00, 24.00, 48.00],   //  P3: 正后最高点 🌐
      [ 28.00, 22.00, 35.00],   //  P4: 右后
      [ 42.00, 19.00,  8.00],   //  P5: 右前
      [ 28.00, 17.00,-20.00],   //  P6: 右侧下降
      [  0.00, 15.00,-32.00],   //  P7: 主体前方
      [-22.00, 14.50,-18.00],   //  P8: 左前
      [-30.00, 13.50,  5.00],   //  P9: 收缩
      [-24.00, 12.00, 12.00],   // P10: 收缩
      [-28.77, 14.24,  7.12],   // P11: 收缩
      [-25.00, 12.50,  5.00],   // P12: 收缩
      [-21.00, 11.00,  3.20],   // P13: 收缩
      [-18.09,  9.81,  1.34],   // P14: 收缩
      [-10.00, 10.50, 10.00],   // P15: 第二圈起
      [  4.00, 11.00, 12.00],   // P16: 右转
      [ 14.00, 10.20,  4.00],   // P17: 右侧低飞
      [ 10.00,  9.20, -8.00],   // P18: 前方掠过
      [ -2.00,  8.50,-12.00],   // P19: 左前
      // [-12.00,  8.80, -6.00],   // P20: 回环
      // [ -8.00,  7.50,  2.00],   // P21: 失速摆动
      // [ -3.00,  6.20, -1.50],   // P22: 失速摆动
      // [ -7.00,  5.30,  1.00],   // P23: 失速摆动
      // [ -2.00,  4.40, -0.80],   // P24: 失速摆动
      [ -5.00,  3.60,  0.50],   // P25: 失速摆动
      [ -3.25, 3.19, -1.08],   // P26: 🎯 降落
    ],

    // Camera path: 26点 电影运镜（第三人称为主，局部贴近模拟第一人称）
    cameraPath: [
      [-44, 26, 14],     //  1: 起飞远景 📷 第三人称 宽
      [-34, 28, 42],     //  2: 跟飞上升
      [ -5, 30, 53],     //  3: 顶点俯拍 广角
      [ 33, 28, 40],     //  4: 右侧环视
      [ 47, 25, 14],     //  5: 右侧边缘
      [ 33, 23,-16],     //  6: 右侧跟降
      [  5, 21,-37],     //  7: 前方俯瞰 🌐
      [-27, 20,-14],     //  8: 左前追踪
      [-36, 19, 10],     //  9: 收缩中景
      [-29, 17, 17],     // 10: 右侧中景
      [-34, 19, 12],     // 11: 稍后中景
      [-30, 17,  9],     // 12: 追踪收紧
      [-26, 15,  7],     // 13: 追踪收紧
      [-23, 14,  5],     // 14: 中距离追踪
      [-15, 14, 14],     // 15: 右侧近拍 📷 第三/第一人称切换区
      [  0, 15, 17],     // 16: 头顶近拍
      [ 11, 13,  8],     // 17: 🔥 紧贴跟随（模拟第一人称）
      [  7, 12, -5],     // 18: 🔥 近距离掠过后方
      [ -5, 11, -8],     // 19: 近距离追踪
      // [-14, 11, -2],     // 20: 近距离追踪
      // [ -9,  9,  4],     // 21: 🔥 紧贴飞机后上方
      // [ -4,  8,  0],     // 22: 🔥 机头视角（第一人称感）
      // [ -8,  7,  3],     // 23: 摆动跟拍
      // [ -3,  6,  0],     // 24: 最终接近
      [ -6,  5,  2],     // 25: 着陆前
      [-7.45, 5.81, -2.91],     // 26: 🎯 着陆视角
    ],

    cameraEvents: [
      { progress: 0.00, type: 'reveal',       params: { fov: 35 } },
      { progress: 0.08, type: 'wide_orbit',   params: { fov: 38 } },
      { progress: 0.25, type: 'aerial',       params: { fov: 42 } },
      { progress: 0.40, type: 'track',        params: { fov: 40 } },
      { progress: 0.55, type: 'close_track',  params: { fov: 45 } },
      { progress: 0.70, type: 'first_person', params: { fov: 50 } },
      { progress: 0.85, type: 'wobble_follow',params: { fov: 40 } },
      { progress: 1.00, type: 'land',         params: { fov: 35 } },
    ],

    theme: {
      fog: [
        { progress: 0.0, density: 0.0, color: '#F5F0EB' },
        { progress: 0.5, density: 0.004, color: '#F0E0D0' },
        { progress: 1.0, density: 0.003, color: '#F5F0EB' },
      ],
      bloom: [
        { progress: 0.0, strength: 0.4 },
        { progress: 0.5, strength: 0.3 },
        { progress: 1.0, strength: 0.2 },
      ],
      ambient: [
        { progress: 0.0, color: '#FFF5E8', intensity: 0.5 },
        { progress: 0.5, color: '#FFE4C4', intensity: 0.6 },
        { progress: 1.0, color: '#FFF0E0', intensity: 0.7 },
      ],
      sky: [
        { progress: 0.0, background: '#F5F0EB', exposure: 1.0 },
        { progress: 0.5, background: '#F5F0EB', exposure: 1.1 },
        { progress: 1.0, background: '#F5F0EB', exposure: 1.0 },
      ],
    },

    maxSpeed: 0.0005,
  },

  {
    id: 'flowers',
    title: 'Flowers',
    scene: '/scenes/Flowers.glb',
    music: '/audio/flowers.mp3',

    scale: 1.0,
    position: [0, 0, 0],

    landingPoint: [0, 2, -15],
    cameraTarget: [0, 3, 0],
    cameraPosition: [8, 5, 10],

    flightPath: [
      [-120, 80, 180],
      [-80, 60, 120],
      [-40, 40, 80],
      [-10, 25, 40],
      [15, 18, 15],
      [10, 10, -5],
      [0, 2, -15],
    ],

    cameraPath: [
      [-130, 85, 190],
      [-90, 65, 130],
      [-50, 45, 90],
      [-15, 30, 50],
      [20, 22, 20],
      [15, 14, 0],
      [5, 5, -10],
    ],

    cameraEvents: [
      { progress: 0.0, type: 'reveal', params: { fov: 35, distance: 1.2 } },
      { progress: 0.15, type: 'approach', params: { fov: 50, distance: 1.0 } },
      { progress: 0.35, type: 'orbit', params: { fov: 50, side: 'left', radius: 10 } },
      { progress: 0.55, type: 'track', params: { fov: 45, distance: 0.8 } },
      { progress: 0.75, type: 'lead', params: { fov: 40, ahead: 5 } },
      { progress: 0.9, type: 'land', params: { fov: 40, shake: 0.0 } },
    ],

    theme: {
      fog: [
        { progress: 0.0, density: 0.0, color: '#F5F0EB' },
        { progress: 0.3, density: 0.005, color: '#F0E0C8' },
        { progress: 0.6, density: 0.008, color: '#C0C8D8' },
        { progress: 1.0, density: 0.006, color: '#E8E0D8' },
      ],
      bloom: [
        { progress: 0.0, strength: 0.3 },
        { progress: 0.3, strength: 0.5 },
        { progress: 0.6, strength: 0.3 },
        { progress: 1.0, strength: 0.2 },
      ],
      ambient: [
        { progress: 0.0, color: '#F5F0EB', intensity: 0.4 },
        { progress: 0.3, color: '#FFE8D0', intensity: 0.6 },
        { progress: 0.6, color: '#8090B0', intensity: 0.5 },
        { progress: 1.0, color: '#F0E8DD', intensity: 0.7 },
      ],
      sky: [
        { progress: 0.0, background: '#F5F0EB', exposure: 1.0 },
        { progress: 0.3, background: '#F5F0EB', exposure: 1.2 },
        { progress: 0.6, background: '#D8DDE8', exposure: 0.9 },
        { progress: 1.0, background: '#EDE8E0', exposure: 1.0 },
      ],
    },

    maxSpeed: 0.0008,
  },
];
