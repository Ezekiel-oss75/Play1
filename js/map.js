// ============ КАРТА ============
class GameMap {
  constructor(w, h) {
    this.w = w;
    this.h = h;
    this.tiles = [];   // двумерный массив типов
    this.owner = [];   // 0 = нейтрал, 1 = игрок, 2 = ИИ
    this.generate();
  }

  generate() {
    for (let y = 0; y < this.h; y++) {
      const row = [];
      const ownRow = [];
      for (let x = 0; x < this.w; x++) {
        row.push(this._randomTile(x, y));
        ownRow.push(0);
      }
      this.tiles.push(row);
      this.owner.push(ownRow);
    }
    // Стартовые зоны: игрок слева-внизу, ИИ справа-вверху
    this._claimArea(3, this.h - 6, 5, 5, 1);
    this._claimArea(this.w - 8, 1, 5, 5, 2);
  }

  _randomTile(x, y) {
    const n = Math.random();
    if (n < 0.10) return CONFIG.TILE_TYPES.WATER;
    if (n < 0.25) return CONFIG.TILE_TYPES.FOREST;
    if (n < 0.32) return CONFIG.TILE_TYPES.MOUNTAIN;
    return CONFIG.TILE_TYPES.GRASS;
  }

  _claimArea(x, y, w, h, owner) {
    for (let j = y; j < y + h; j++) {
      for (let i = x; i < x + w; i++) {
        if (this.inBounds(i, j)) this.owner[j][i] = owner;
      }
    }
  }

  inBounds(x, y) {
    return x >= 0 && y >= 0 && x < this.w && y < this.h;
  }

  getTile(x, y) {
    if (!this.inBounds(x, y)) return null;
    return {
      type: this.tiles[y][x],
      owner: this.owner[y][x],
      x, y,
    };
  }
}
