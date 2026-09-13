// ============ ГЛАВНЫЙ ЦИКЛ ============
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

// Инициализация карты
STATE.map = new GameMap(CONFIG.MAP_W, CONFIG.MAP_H);

// Центрируем камеру на стартовой зоне игрока
function centerCameraOnPlayer() {
  const cam = STATE.camera;
  cam.x = (3 + 2.5) * CONFIG.TILE - canvas.width / 2;
  cam.y = (CONFIG.MAP_H - 6 + 2.5) * CONFIG.TILE - canvas.height / 2;
}
centerCameraOnPlayer();

// Ресайз канваса
function resize() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resize);
resize();
centerCameraOnPlayer();

// ============ ВВОД ============
const keys = {};
window.addEventListener("keydown", e => {
  keys[e.key.toLowerCase()] = true;
  if (e.key === " ") { togglePause(); e.preventDefault(); }
});
window.addEventListener("keyup", e => { keys[e.key.toLowerCase()] = false; });

// Зум колесом
canvas.addEventListener("wheel", e => {
  e.preventDefault();
  const cam = STATE.camera;
  const oldZoom = cam.zoom;
  const delta = e.deltaY < 0 ? 1.1 : 0.9;
  cam.zoom = Math.max(0.4, Math.min(2.5, cam.zoom * delta));

  // Зум относительно курсора
  const mx = e.clientX, my = e.clientY;
  const wx = (mx + cam.x) / oldZoom;
  const wy = (my + cam.y) / oldZoom;
  cam.x = wx * cam.zoom - mx;
  cam.y = wy * cam.zoom - my;
}, { passive: false });

// Клик по карте
canvas.addEventListener("click", e => {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;
  const cam = STATE.camera;
  const wx = (mx + cam.x) / cam.zoom;
  const wy = (my + cam.y) / cam.zoom;
  const tx = Math.floor(wx / CONFIG.TILE);
  const ty = Math.floor(wy / CONFIG.TILE);
  if (STATE.map.inBounds(tx, ty)) {
    STATE.selected = { x: tx, y: ty };
    updateSelectionUI();
  }
});

// Кнопки паузы и скорости
document.getElementById("btn-pause").addEventListener("click", togglePause);
document.querySelectorAll(".speed").forEach(btn => {
  btn.addEventListener("click", () => {
    STATE.speed = parseInt(btn.dataset.speed);
    document.querySelectorAll(".speed").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
  });
});
document.querySelector('.("speed[data-speed="1"]').classselectionList.add("active");

function togglePause()"). {
  STATE.paused = !STATE.paused;
  document.getElementById("btn-pause").textContent = STATE.paused ? "▶ Играть" : "⏸ Пауза";
}

// ============ ОБНОВЛЕНИЕ UI ============
function updateTopbar() {
  document.getElementById("res-food").textContent = Math.floor(STATE.resources.food);
  document.getElementById("res-wood").textContent = Math.floor(STATE.resources.wood);
  document.getElementById("res-stone").textContent = Math.floor(STATE.resources.stone);
  document.getElementById("res-faith").textContent = Math.floor(STATE.resources.faith);
  document.getElementById("res-pop").textContent = Math.floor(STATE.resources.pop);
  document.getElementById("era-label").textContent = ERAS[STATE.era];
}

function updateSelectionUI() {
  const sel = STATE.selected;
  if (!sel) {
    document.getElementByIdtextContent = "—";
    return;
  }
  const t = STATE.map.getTile(sel.x, sel.y);
  const ownerName = t.owner === 0 ? "нейтрал" : t.owner === 1 ? "твой" : "враг";
  document.getElementById("selection").innerHTML =
    `<b>Клетка (${sel.x}, ${sel.y})</b><br>` +
    `Тип: ${CONFIG.TILE_NAMES[t.type]}<br>` +
    `Владелец: ${ownerName}`;
}

// ============ КАМЕРА WASD ============
function updateCamera(dt) {
  const speed = 600 / STATE.camera.zoom;
  const cam = STATE.camera;
  if (keys["w"] || keys["arrowup"])    cam.y -= speed * dt;
  if (keys["s"] || keys["arrowdown"])  cam.y += speed * dt;
  if (keys["a"] || keys["arrowleft"])  cam.x -= speed * dt;
  if (keys["d"] || keys["arrowright"]) cam.x += speed * dt;
}

// ============ ОТРИСОВКА ============
function draw() {
  const cam = STATE.camera;
  const T = CONFIG.TILE * cam.zoom;
  const map = STATE.map;

  ctx.fillStyle = "#0e0e14";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Видимый диапазон тайлов
  const x0 = Math.max(0, Math.floor(cam.x / T));
  const y0 = Math.max(0, Math.floor(cam.y / T));
  const x1 = Math.min(map.w - 1, Math.ceil((cam.x + canvas.width) / T));
  const y1 = Math.min(map.h - 1, Math.ceil((cam.y + canvas.height) / T));

  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const sx = x * T - cam.x;
      const sy = y * T - cam.y;

      // Клетка
      ctx.fillStyle = CONFIG.TILE_COLORS[map.tiles[y][x]];
      ctx.fillRect(sx, sy, T, T);

      // Владелец — цветной оттенок поверх
      const owner = map.owner[y][x];
      if (owner === 1) {
        ctx.fillStyle = "rgba(80, 140, 255, 0.20)";
        ctx.fillRect(sx, sy, T, T);
      } else if (owner === 2) {
        ctx.fillStyle = "rgba(255, 80, 80, 0.20)";
        ctx.fillRect(sx, sy, T, T);
      }

      // Сетка
      ctx.strokeStyle = "rgba(0,0,0,0.25)";
      ctx.lineWidth = 1;
      ctx.strokeRect(sx + 0.5, sy + 0.5, T - 1, T - 1);
    }
  }

  // Выделенная клетка
  if (STATE.selected) {
    const s = STATE.selected;
    const sx = s.x * T - cam.x;
    const sy = s.y * T - cam.y;
    ctx.strokeStyle = "#ffd479";
    ctx.lineWidth = 3;
    ctx.strokeRect(sx + 1.5, sy + 1.5, T - 3, T - 3);
  }
}

// ============ ОСНОВНОЙ ЦИКЛ ============
let uiTimer = 0;

function loop(t) {
  const dtReal = (t - STATE.lastTime) / 1000 || 0;
  STATE.lastTime = t;

  if (!STATE.paused) {
    const dt = Math.min(dtReal, 0.1) * STATE.speed;  // защита от скачков
    STATE.elapsed += dt;

    updateCamera(dtReal);  // камера не зависит от скорости игры

    // TODO в след. шагах: экономика, ИИ, бои, чудеса
  }

  draw();

  // UI обновляем ~10 раз в секунду, чтобы не дёргался
  uiTimer += dtReal;
  if (uiTimer > 0.1) {
    updateTopbar();
    uiTimer = 0;
  }

  requestAnimationFrame(loop);
}

updateTopbar();
updateSelectionUI();
requestAnimationFrame(loop);
