// ============ КОНФИГ ИГРЫ ============
const CONFIG = {
  MAP_W: 32,
  MAP_H: 32,
  TILE: 40,             // базовый размер тайла в пикселях

  // Типы клеток
  TILE_TYPES: {
    GRASS: 0,
    FOREST: 1,
    MOUNTAIN: 2,
    WATER: 3,
  },

  // Цвета клеток
  TILE_COLORS: {
    0: "#3a5a40",  // трава
    1: "#2d4a2f",  // лес
    2: "#5a5a60",  // гора
    3: "#2a4a7a",  // вода
  },

  TILE_NAMES: {
    0: "Трава",
    1: "Лес",
    2: "Гора",
    3: "Вода",
  },

  // Стартовые ресурсы игрока
  START_RESOURCES: {
    food: 50,
    wood: 50,
    stone: 20,
    faith: 0,
    pop: 3,
  },
};

// Текущее состояние игры (глобальное)
const STATE = {
  // Ресурсы игрока
  resources: { ...CONFIG.START_RESOURCES },
  // Ресурсы ИИ-бога (пока не используется, задел на будущее)
  aiResources: { ...CONFIG.START_RESOURCES },

  // Время
  paused: false,
  speed: 1,
  lastTime: 0,
  elapsed: 0,  // секунды игрового времени

  // Камера
  camera: { x: 0, y: 0, zoom: 1 },

  // Карта (заполнится в map.js)
  map: null,

  // Выбранная клетка
  selected: null,  // {x, y}

  // Эпоха (0..5)
  era: 0,
};

const ERAS = [
  "Каменный век",
  "Бронзовый век",
  "Железный век",
  "Средневековье",
  "Пороховая эпоха",
  "Индустриальная эпоха",
];
