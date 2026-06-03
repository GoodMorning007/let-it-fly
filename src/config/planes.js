/**
 * Planes Configuration — Classic only for intro
 */

export const PLANES = [
  {
    id: 'paper_plane_1',
    label: 'Classic',
    model: '/planes/paper_plane_1.glb',
    preview: '/planes/plane1.jpg',
  },
];

let selectedPlaneId = 'paper_plane_1'; // Always Classic
let selectedCargo = null;

export function setSelectedPlane(id) { selectedPlaneId = id; }
export function getSelectedPlane() { return PLANES[0]; }
export function getSelectedPlaneId() { return selectedPlaneId; }
export function setSelectedCargo(cargo) { selectedCargo = cargo; }
export function getSelectedCargo() { return selectedCargo; }
