/**
 * SelectionStage — Active Theory Cinematic Plane Selection
 *
 * Full-bleed dark screen. Three large cards with plane preview images.
 * Single golden accent. Bebas Neue typography. High contrast.
 */

import { PLANES, setSelectedPlane } from '../config/planes.js';
import { WORLDS } from '../config/worlds.js';

export class SelectionStage {
  constructor(stageManager) {
    this.stageManager = stageManager;
    this.element = document.getElementById('selection-screen');
    this.cardsContainer = document.getElementById('plane-cards');
    this.selectedId = null;
  }

  enter() {
    if (this.element) this.element.classList.remove('hidden');
    this._buildCards();
    this.stageManager.sharedState.selectedWorldId = WORLDS[0]?.id || null;
  }

  exit() {
    if (this.element) this.element.classList.add('hidden');
  }

  /**
   * Build plane selection cards with preview images
   * @private
   */
  _buildCards() {
    if (!this.cardsContainer) return;
    this.cardsContainer.innerHTML = '';

    PLANES.forEach((plane) => {
      const card = document.createElement('div');
      card.className = 'plane-card';
      card.dataset.planeId = plane.id;

      card.innerHTML = `
        <div class="plane-card-preview">
          <img src="${plane.preview}" alt="${plane.label}" loading="lazy" />
        </div>
        <div class="plane-card-label">${plane.label}</div>
      `;

      card.addEventListener('click', () => this._selectPlane(plane.id));
      this.cardsContainer.appendChild(card);
    });
  }

  _selectPlane(planeId) {
    this.selectedId = planeId;
    this.cardsContainer?.querySelectorAll('.plane-card').forEach((card) => {
      card.classList.toggle('selected', card.dataset.planeId === planeId);
    });
    setSelectedPlane(planeId);
    this.stageManager.sharedState.selectedPlaneId = planeId;
    setTimeout(() => this.stageManager.next(), 700);
  }
}
