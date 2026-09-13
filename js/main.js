// ============ ГЛАВНЫЙ ЦИКЛ ============
const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");

let W = 0, H = 0;

function resize() {
  W = canvas.width = window.innerWidth;
  H = canvas.height = window.innerHeight;
  // Не сбрасываем камеру при ресайзе — только если она вне карты
}

// Карта создаётся после того, как всё готово
STATE.map = new GameMap(CONFIG.MAP_W, CONFIG.MAP_H);

// Центр камеры на игроке
function centerCameraOnPlayer() {
  const cam = STATE.camera;
  const T = CONFIG.TILE * cam.zoom;
  cam.x = (3 + 2.5) * T - W / 2;
  cam.y = (CONFIG.MAP_H - 6 + 2.5) * T - H / 2;
}

window.addEventListener("resize", () => {
  resize();
});

// Старт — после загрузки
window.addEventListener("load", () => {
  resize();
  centerCameraOnPlayer();
  requestAnimationFrame(loop);
});

// ============ ВВОД ============
const keys = {};
window.addEventListener("keydown", e => {
  keys[e.key.toLowerCase()] = true;
  if (e.key === " ") { togglePause(); e.preventDefault(); }
});
window.addEventListener("keyup", e => { keys[e.key.toLowerCase()] = false; });

canvas.addEventListener("wheel", e => {
  e.preventDefault();
  const cam = STATE.camera;
  const oldZoom = cam.zoom;
  const delta = e.deltaY < 0 ? 1.15 : 0.87;
  cam.zoom = Math.max(0.4, Math.min(2.5, cam.zoom * delta));
  const mx = e.clientX, my = e.clientY;
  const wx = (mx + cam.x) / oldZoom;
  const wy = (my + cam.y) / oldZoom;
  cam.x = wx * cam.zoom - mx;
  cam.y = wy * cam.zoom - my;
}, { passive: false });

function screenToTile(mx, my) {
  const cam = STATE.camera;
  const wx = (mx + cam.x) / cam.zoom;
  const wy = (my + cam.y) / cam.zoom;
  return { x: Math.floor(wx / CONFIG.TILE), y: Math.floor(wy / CONFIG.TILE) };
}

canvas.addEventListener("click", e => {
  const rect = canvas.getBoundingClientRect();
  const t = screenToTile(e.clientX - rect.left, e.clientY - rect.top);
  if (STATE.map.inBounds(t.x, t.y)) {
    STATE.selected = t;
    updateSelectionUI();
  }
});

document.getElementById("btn-pause").addEventListener("click", togglePause);
document.querySelectorAll(".speed").forEach(btn => {
  btn.addEventListener("click", () => {
    STATE.speed = parseInt(btn.dataset.speed);
    document.querySelectorAll(".speed").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
  });
});
document.querySelector('.speed[data-speed="1"]').classList.add("active");

function togglePause() {
  STATE.paused = !STATE.paused;
  document.getElementById("btn-pause").textContent = STATE.paused ? "▶" : "⏸";
}

// ============ UI ============
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
  if (!sel) { document.getElementById("selection").textContent = "—"; return; }
  const t = STATE.map.getTile(sel.x, sel.y);
  if (!t) { document.getElementById("selection").textContent = "—"; return; }
  const ownerName = t.owner === 0 ? "нейтрал" : t.owner === 1 ? "твой" : "враг";
  document.getElementById("selection").innerHTML =
    `<b>(${sel.x}, ${sel.y})</b><br>${CONFIG.TILE_NAMES[t.type]}<br>${ownerName}`;
}

// ============ КАМЕРА ============
function updateCamera(dt) {
  const speed = 500 / STATE.camera.zoom;
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
  ctx.fillRect(0, 0, W, H);

  // Считаем сколько тайлов влезает (с запасом)
  const x0 = Math.max(0, Math.floor(cam.x / T));
  const y0 = Math.max(0, Math.floor(cam.y / T));
  const x1 = Math.min(map.w - 1, Math.ceil((cam.x + W) / T));
  const y1 = Math.min(map.h - 1, Math.ceil((cam.y + H) / T));

  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const sx = x * T - cam.x;
      const sy = y * T - cam.y;

      ctx.fillStyle = CONFIG.TILE_COLORS[map.tiles[y][x]];
      ctx.fillRect(sx, sy, T, T);

      const owner = map.owner[y][x];
      if (owner === 1) {
        ctx.fillStyle = "rgba(80, 140, 255, 0.25)";
        ctx.fillRect(sx, sy, T, T);
      } else if (owner === 2) {
        ctx.fillStyle = "rgba(255, 80, 80, 0.25)";
        ctx.fillRect(sx, sy, T, T);
      }

      ctx.strokeStyle = "rgba(0,0,0,0.3)";
      ctx.lineWidth = 1;
      ctx.strokeRect(sx + 0.5, sy + 0.5, T - 1, T - 1);
    }
  }

  if (STATE.selected) {
    const s = STATE.selected;
    const sx = s.x * T - cam.x;
    const sy = s.y * T - cam.y;
    ctx.strokeStyle = "#ffd479";
    ctx.lineWidth = 3;
    ctx.strokeRect(sx + 1.5, sy + 1.5, T - 3, T - 3);
  }
}

// ============ ЦИКЛ ============
let uiTimer = 0;
let lastT = 0;

function loop(t) {
  const dtReal = Math.min((t - lastT) / 1000 || 0, 0.1);
  lastT = t;

  if (!STATE.paused) {
    const dt = dtReal * STATE.speed;
    STATE.elapsed += dt;
    updateCamera(dtReal);
  }

  draw();

  uiTimer += dtReal;
  if (uiTimer > 0.1) { updateTopbar(); uiTimer = 0; }

  requestAnimationFrame(loop);
}
