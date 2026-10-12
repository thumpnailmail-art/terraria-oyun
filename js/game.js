/* ============================================================
 * YEŞİL VADİ - Çiftlik Simülasyon Oyunu
 * Copyright (c) 2026 [SENİN ADIN]. Tüm Hakları Saklıdır.
 * 
 * Bu kod telif hakkı ile korunmaktadır. İzinsiz kopyalanamaz,
 * dağıtılamaz veya değiştirilerek yayınlanamaz.
 * 
 * İletişim: [E-POSTA ADRESİN]
 * ============================================================ */

import { TILE, MAP_W, MAP_H, MINE_W, MINE_H, MINE_LEVELS, T, O, SEASONS, WEATHER, ITEMS, CROPS, NPCS, PRICES, getSeasonSeed } from './data.js';
import { World, hash2 } from './world.js';
import { Player, NPC, Animal, drawHumanoid, drawAnimal } from './entities.js';

// Gizli imza (kopyalayan tespit edilsin)
const _YV_SIGNATURE = 'yvd2026_' + 'thumpnailmail' + '_tr_' + '9f4a7e2b8c1d5f0a3e6b';

// ==================== GLOBAL DURUM ====================
let world = null;
let player = null;
let npcs = [];
let animals = [];
let particles = [];
let floaters = [];
let inv = [];
let sel = 0;
let camera = { x: 0, y: 0 };
let input = { up: false, down: false, left: false, right: false };
let mouse = { x: 0, y: 0, wx: 0, wy: 0, down: false };
let paused = false;
let shopOpen = false;
let shopTab = 'buy';
let currentShopNPC = null;
let lastTime = performance.now();
let timeSpeed = 2;
let fishing = null;
let gameReady = false;
let toastT = null;
let dlgT = null;

// ==================== CANVAS ====================
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let VW = 0, VH = 0;

function resize() {
  VW = canvas.width = window.innerWidth;
  VH = canvas.height = window.innerHeight;
  ctx.imageSmoothingEnabled = false;
}
window.addEventListener('resize', resize);
resize();

// ==================== SES ====================
let actx = null;
function beep(freq, dur, type, vol) {
  type = type || 'square'; vol = vol || 0.03;
  try {
    if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
    const o = actx.createOscillator();
    const g = actx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.value = vol;
    o.connect(g); g.connect(actx.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + dur);
    o.stop(actx.currentTime + dur);
  } catch (e) {}
}

// ==================== TOAST ====================
function toast(msg) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastT);
  toastT = setTimeout(() => el.classList.remove('show'), 1800);
}

// ==================== DIALOG ====================
function showDialog(name, portrait, text) {
  const box = document.getElementById('dialogBox');
  if (!box) return;
  document.getElementById('dlgPortrait').textContent = portrait;
  document.getElementById('dlgName').textContent = name;
  document.getElementById('dlgText').textContent = text;
  box.classList.add('show');
  clearTimeout(dlgT);
  dlgT = setTimeout(() => box.classList.remove('show'), 4000);
}

// ==================== ENVANTER ====================
function invAdd(id, n) {
  if (!n) n = 1;
  const maxStack = 99;
  for (const s of inv) {
    if (s.id === id && s.count < maxStack) {
      const a = Math.min(maxStack - s.count, n);
      s.count += a; n -= a;
      if (n <= 0) { updateHotbar(); return true; }
    }
  }
  for (const s of inv) {
    if (!s.id || s.count === 0) {
      s.id = id;
      s.count = Math.min(maxStack, n);
      n -= s.count;
      if (n <= 0) { updateHotbar(); return true; }
    }
  }
  updateHotbar();
  return false;
}

function invRemove(id, n) {
  for (const s of inv) {
    if (s.id === id && s.count > 0) {
      const t = Math.min(s.count, n);
      s.count -= t; n -= t;
      if (s.count <= 0) s.id = null;
      if (n <= 0) { updateHotbar(); return true; }
    }
  }
  updateHotbar();
  return false;
}

function invCount(id) {
  let n = 0;
  for (const s of inv) if (s.id === id) n += s.count;
  return n;
}

function isSellable(id) {
  const t = ITEMS[id]?.type;
  return t === 'crop' || t === 'forage' || t === 'fish' || t === 'mat' || t === 'animal' || t === 'food';
}

// ==================== PARÇACIK ====================
function emitParticles(x, y, color, count, speed) {
  count = count || 6;
  speed = speed || 1.5;
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    particles.push({
      x, y,
      vx: Math.cos(a) * speed * (0.5 + Math.random()),
      vy: Math.sin(a) * speed * (0.5 + Math.random()) - 1,
      color,
      life: 0.6 + Math.random() * 0.3,
      maxLife: 0.6,
      size: 2 + Math.random() * 2
    });
  }
}

function addFloater(x, y, text, color) {
  floaters.push({ x, y, text, color: color || '#fff', life: 1.4, maxLife: 1.4 });
}

// ==================== UI ====================
function updateHUD() {
  if (!player || !world) return;
  document.getElementById('moneyTxt').textContent = player.money + 'g';
  document.getElementById('energyFill').style.width = (player.energy / player.maxEnergy * 100) + '%';
  document.getElementById('hpFill').style.width = (player.hp / player.maxHp * 100) + '%';
  const h = Math.floor(world.minute / 60) % 24;
  const m = Math.floor(world.minute % 60);
  document.getElementById('clockTxt').textContent = String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
  document.getElementById('dayTxt').textContent = 'Gün ' + world.day;
  const sIcon = document.getElementById('seasonTxt');
  if (sIcon) sIcon.textContent = SEASONS[world.season].icon + ' ' + SEASONS[world.season].name;
  const wIcon = document.getElementById('weatherTxt');
  if (wIcon) wIcon.textContent = ['☀️','☁️','🌧️','⛈️','🌨️'][world.weather] || '☀️';
}

function updateHotbar() {
  const hb = document.getElementById('hotbar');
  if (!hb) return;
  if (hb.children.length !== 8) {
    hb.innerHTML = '';
    for (let i = 0; i < 8; i++) {
      (function (idx) {
        const s = document.createElement('div');
        s.className = 'slot';
        s.innerHTML = '<span class="key">' + (idx + 1) + '</span><span class="count"></span>';
        s.addEventListener('click', () => { sel = idx; updateHotbar(); });
        hb.appendChild(s);
      })(i);
    }
  }
  for (let i = 0; i < 8; i++) {
    const s = hb.children[i];
    s.classList.toggle('active', i === sel);
    const it = inv[i];
    const cnt = s.querySelector('.count');
    const old = s.querySelector('canvas');
    if (old) old.remove();
    if (it && it.id && it.count > 0) {
      const ic = document.createElement('canvas');
      ic.width = 64; ic.height = 64;
      drawItemIcon(ic.getContext('2d'), it.id, 64);
      s.insertBefore(ic, cnt);
      cnt.textContent = it.count > 1 ? it.count : '';
    } else {
      cnt.textContent = '';
    }
  }
}

function drawItemIcon(c, id, size) {
  c.clearRect(0, 0, size, size);
  const s = size / 16;
  const info = ITEMS[id];
  if (!info) return;

  if (info.type === 'tool') {
    const t = info.tool;
    const tier = info.tier || 0;
    const metalColor = tier === 0 ? '#a8a8b8' : (tier === 1 ? '#c8d0d8' : '#ffe080');
    if (t === 'hoe') {
      c.strokeStyle = '#6a4a2a'; c.lineWidth = 2 * s;
      c.beginPath(); c.moveTo(5 * s, 13 * s); c.lineTo(11 * s, 5 * s); c.stroke();
      c.fillStyle = metalColor; c.fillRect(9 * s, 3 * s, 5 * s, 3 * s);
    } else if (t === 'can') {
      c.fillStyle = tier === 0 ? '#6a8ac0' : (tier === 1 ? '#8aaae0' : '#e0c060');
      c.fillRect(3 * s, 6 * s, 8 * s, 7 * s);
      c.fillStyle = '#4a6a9a';
      c.beginPath();
      c.moveTo(11 * s, 6 * s); c.lineTo(14 * s, 3 * s); c.lineTo(14 * s, 5 * s); c.lineTo(11 * s, 8 * s);
      c.closePath(); c.fill();
    } else if (t === 'axe') {
      c.strokeStyle = '#6a4a2a'; c.lineWidth = 2 * s;
      c.beginPath(); c.moveTo(5 * s, 13 * s); c.lineTo(11 * s, 5 * s); c.stroke();
      c.fillStyle = metalColor;
      c.beginPath();
      c.moveTo(9 * s, 2 * s); c.lineTo(14 * s, 5 * s); c.lineTo(13 * s, 8 * s); c.lineTo(9 * s, 6 * s);
      c.closePath(); c.fill();
    } else if (t === 'pick') {
      c.strokeStyle = '#6a4a2a'; c.lineWidth = 2 * s;
      c.beginPath(); c.moveTo(5 * s, 13 * s); c.lineTo(11 * s, 6 * s); c.stroke();
      c.strokeStyle = metalColor; c.lineWidth = 2 * s;
      c.beginPath(); c.moveTo(8 * s, 3 * s); c.lineTo(14 * s, 5 * s); c.stroke();
    } else if (t === 'scythe') {
      c.strokeStyle = '#6a4a2a'; c.lineWidth = 2 * s;
      c.beginPath(); c.moveTo(4 * s, 14 * s); c.lineTo(9 * s, 4 * s); c.stroke();
      c.strokeStyle = '#c8c8d8'; c.lineWidth = 2 * s;
      c.beginPath(); c.arc(9 * s, 4 * s, 4 * s, Math.PI * 0.9, Math.PI * 1.9); c.stroke();
    } else if (t === 'rod') {
      c.strokeStyle = '#8a5a2a'; c.lineWidth = 2 * s;
      c.beginPath(); c.moveTo(4 * s, 14 * s); c.lineTo(11 * s, 3 * s); c.stroke();
      c.strokeStyle = '#ddd'; c.lineWidth = 0.5 * s;
      c.beginPath(); c.moveTo(11 * s, 3 * s); c.lineTo(13 * s, 10 * s); c.stroke();
    }
  } else if (info.type === 'seed') {
    c.fillStyle = '#8a6a3a';
    c.beginPath(); c.arc(8 * s, 9 * s, 4 * s, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#7ac04a';
    c.beginPath(); c.arc(8 * s, 8 * s, 3 * s, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.4)';
    c.beginPath(); c.arc(6.5 * s, 6.5 * s, 1 * s, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#3a6a1a'; c.fillRect(7.5 * s, 2 * s, 1 * s, 4 * s);
  } else if (info.type === 'crop') {
    c.fillStyle = '#3a8a3a'; c.fillRect(7 * s, 8 * s, 2 * s, 6 * s);
    c.fillStyle = info.c || '#ffd24a';
    c.beginPath(); c.arc(8 * s, 7 * s, 4 * s, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.4)';
    c.beginPath(); c.arc(6.5 * s, 5.5 * s, 1.5 * s, 0, Math.PI * 2); c.fill();
  } else if (info.type === 'fish') {
    c.fillStyle = info.c || '#a0c0ff';
    c.beginPath(); c.ellipse(8 * s, 8 * s, 5 * s, 3 * s, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#000';
    c.beginPath(); c.arc(6 * s, 7 * s, 0.7 * s, 0, Math.PI * 2); c.fill();
    c.fillStyle = info.c || '#a0c0ff';
    c.beginPath();
    c.moveTo(12 * s, 8 * s); c.lineTo(15 * s, 5 * s); c.lineTo(15 * s, 11 * s);
    c.closePath(); c.fill();
  } else if (info.type === 'animal') {
    c.fillStyle = info.c || '#f0e8c8';
    if (id.indexOf('egg') >= 0) {
      c.beginPath(); c.ellipse(8 * s, 9 * s, 4 * s, 5 * s, 0, 0, Math.PI * 2); c.fill();
    } else if (id.indexOf('milk') >= 0) {
      c.fillRect(5 * s, 5 * s, 6 * s, 8 * s);
      c.fillStyle = '#8ac04a'; c.fillRect(5 * s, 5 * s, 6 * s, 2 * s);
    }
  } else if (info.type === 'food') {
    c.fillStyle = info.c || '#d4a870';
    c.beginPath(); c.arc(8 * s, 8 * s, 5 * s, 0, Math.PI * 2); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.3)';
    c.beginPath(); c.arc(6 * s, 6 * s, 2 * s, 0, Math.PI * 2); c.fill();
  } else if (info.type === 'mat') {
    c.fillStyle = info.c || '#888';
    if (id === 'wood') {
      c.fillRect(3 * s, 5 * s, 10 * s, 6 * s);
      c.fillStyle = '#8a5a2a'; c.fillRect(3 * s, 5 * s, 10 * s, 1 * s);
    } else if (id === 'stone') {
      c.beginPath();
      c.moveTo(3 * s, 11 * s); c.lineTo(5 * s, 5 * s); c.lineTo(11 * s, 4 * s); c.lineTo(13 * s, 10 * s);
      c.closePath(); c.fill();
    } else if (id.indexOf('ore') >= 0) {
      c.fillStyle = '#666';
      c.beginPath(); c.arc(8 * s, 8 * s, 5 * s, 0, Math.PI * 2); c.fill();
      c.fillStyle = info.c;
      c.beginPath(); c.arc(7 * s, 7 * s, 2 * s, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.arc(10 * s, 10 * s, 1.5 * s, 0, Math.PI * 2); c.fill();
    } else if (id.indexOf('bar') >= 0) {
      c.fillStyle = info.c;
      c.fillRect(4 * s, 7 * s, 8 * s, 4 * s);
      c.fillStyle = 'rgba(255,255,255,0.4)';
      c.fillRect(4 * s, 7 * s, 8 * s, 1 * s);
    } else if (id === 'fiber') {
      c.strokeStyle = info.c; c.lineWidth = 1.5 * s;
      for (let i = 0; i < 4; i++) {
        c.beginPath();
        c.moveTo((4 + i * 2.5) * s, 12 * s);
        c.lineTo((5 + i * 2.5) * s, 4 * s);
        c.stroke();
      }
    } else {
      c.fillRect(4 * s, 4 * s, 8 * s, 8 * s);
    }
  }
}

// ==================== GİRDİ ====================
function setupInput() {
  window.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
    if (k === 'escape') { togglePause(); return; }
    if (paused) return;
    if (k === 'w' || k === 'arrowup') input.up = true;
    if (k === 's' || k === 'arrowdown') input.down = true;
    if (k === 'a' || k === 'arrowleft') input.left = true;
    if (k === 'd' || k === 'arrowright') input.right = true;
    if (k === 'e') tryInteract();
    if (e.key >= '1' && e.key <= '8') { sel = parseInt(e.key) - 1; updateHotbar(); }
  });
  window.addEventListener('keyup', (e) => {
    const k = e.key.toLowerCase();
    if (k === 'w' || k === 'arrowup') input.up = false;
    if (k === 's' || k === 'arrowdown') input.down = false;
    if (k === 'a' || k === 'arrowleft') input.left = false;
    if (k === 'd' || k === 'arrowright') input.right = false;
  });
  window.addEventListener('blur', () => {
    input.up = input.down = input.left = input.right = false;
  });

  canvas.addEventListener('mousemove', (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
  });
  canvas.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    if (paused || shopOpen) return;
    mouse.down = true;
    useTool();
  });
  canvas.addEventListener('mouseup', () => { mouse.down = false; });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  const bindTouch = (id, on, off) => {
    const el = document.getElementById(id);
    if (!el) return;
    ['touchstart', 'mousedown'].forEach((ev) => el.addEventListener(ev, (e) => { e.preventDefault(); on(); }));
    if (off) ['touchend', 'touchcancel', 'mouseup', 'mouseleave'].forEach((ev) => el.addEventListener(ev, (e) => { e.preventDefault(); off(); }));
  };
  bindTouch('tbUp', () => input.up = true, () => input.up = false);
  bindTouch('tbDown', () => input.down = true, () => input.down = false);
  bindTouch('tbLeft', () => input.left = true, () => input.left = false);
  bindTouch('tbRight', () => input.right = true, () => input.right = false);
  bindTouch('tbE', () => tryInteract());
  bindTouch('tbAct', () => {
    if (!player) return;
    const cx = player.x + player.w / 2 + (player.facing === 'right' ? TILE : -TILE);
    const cy = player.y + player.h / 2 + (player.facing === 'down' ? TILE : -TILE);
    mouse.x = cx - camera.x;
    mouse.y = cy - camera.y;
    useTool();
  });

  const closeShopBtn = document.getElementById('closeShop');
  if (closeShopBtn) closeShopBtn.addEventListener('click', () => {
    shopOpen = false;
    document.getElementById('shopPanel').classList.remove('show');
  });
  document.querySelectorAll('.tab').forEach((t) => {
    t.addEventListener('click', () => {
      shopTab = t.dataset.tab;
      document.querySelectorAll('.tab').forEach((x) => x.classList.toggle('active', x.dataset.tab === shopTab));
      renderShop();
    });
  });
  const rb = document.getElementById('resumeBtn');
  if (rb) rb.addEventListener('click', togglePause);
  const sb = document.getElementById('saveBtn');
  if (sb) sb.addEventListener('click', () => { saveGame(); toast('💾 Kaydedildi!'); });
  const nb = document.getElementById('newBtn');
  if (nb) nb.addEventListener('click', () => {
    if (!confirm('Yeni oyun başlatılsın mı? Mevcut kayıt silinecek.')) return;
    localStorage.removeItem('yesil_vadi_save');
    location.reload();
  });
}

function togglePause() {
  if (shopOpen) return;
  paused = !paused;
  const p = document.getElementById('pausePanel');
  if (p) p.classList.toggle('show', paused);
}

// ==================== ARAÇ KULLAN ====================
function useTool() {
  if (!player) return;
  const item = inv[sel];
  if (!item || !item.id) return;
  const info = ITEMS[item.id];
  if (!info) return;

  mouse.wx = Math.floor((mouse.x + camera.x) / TILE);
  mouse.wy = Math.floor((mouse.y + camera.y) / TILE);
  const ptx = Math.floor((player.x + player.w / 2) / TILE);
  const pty = Math.floor((player.y + player.h / 2) / TILE);

  const dx = mouse.wx - ptx, dy = mouse.wy - pty;
  if (Math.abs(dx) > 3 || Math.abs(dy) > 3) return;

  if (info.type === 'tool') {
    player.swingT = 0.25;
    player.swingX = mouse.wx;
    player.swingY = mouse.wy;
    if (info.tool === 'hoe') return useHoe(mouse.wx, mouse.wy);
    if (info.tool === 'can') return useCan(mouse.wx, mouse.wy);
    if (info.tool === 'axe') return useAxe(mouse.wx, mouse.wy);
    if (info.tool === 'pick') return usePick(mouse.wx, mouse.wy);
    if (info.tool === 'scythe') return useScythe(mouse.wx, mouse.wy);
    if (info.tool === 'rod') return useRod(mouse.wx, mouse.wy);
  } else if (info.type === 'seed') {
    return plantSeed(mouse.wx, mouse.wy, item);
  } else if (info.type === 'food') {
    if (player.energy >= player.maxEnergy && player.hp >= player.maxHp) { toast('❌ Zaten toksun!'); return; }
    player.energy = Math.min(player.maxEnergy, player.energy + (info.energy || 0));
    player.hp = Math.min(player.maxHp, player.hp + (info.hp || 0));
    invRemove(item.id, 1);
    toast('🍽️ ' + info.name + ' yedin!');
    beep(700, 0.15, 'sine', 0.05);
    return;
  }
}

function useHoe(tx, ty) {
  const t = world.getTile(tx, ty);
  if (t !== T.GRASS && t !== T.DIRT) return;
  if (world.getObj(tx, ty) !== O.NONE) return;
  if (world.getCrop(tx, ty)) return;
  if (!player.useEnergy(2)) { toast('⚡ Çok yorgunsun!'); return; }
  world.setTile(tx, ty, T.TILLED);
  emitParticles(tx * TILE + TILE / 2, ty * TILE + TILE / 2, '#8B4513', 6, 1.5);
  beep(180, 0.05, 'square', 0.04);
}

function useCan(tx, ty) {
  const ptx = Math.floor((player.x + player.w / 2) / TILE);
  const pty = Math.floor((player.y + player.h / 2) / TILE);
  let nearWater = false;
  for (let yy = -2; yy <= 2; yy++) {
    for (let xx = -2; xx <= 2; xx++) {
      const m = world.getTile(ptx + xx, pty + yy);
      if (m === T.WATER) nearWater = true;
    }
  }
  const t = world.getTile(tx, ty);
  if (t === T.TILLED || t === T.WATERED) {
    if (t === T.WATERED) { toast('💧 Zaten sulu'); return; }
    if (player.water <= 0) { toast('💧 Kabı doldur (su kenarında kullan)'); return; }
    if (!player.useEnergy(1)) { toast('⚡ Çok yorgunsun!'); return; }
    player.water--;
    world.setTile(tx, ty, T.WATERED);
    const c = world.getCrop(tx, ty);
    if (c) c.watered = true;
    emitParticles(tx * TILE + TILE / 2, ty * TILE + TILE / 2, '#5a9ac0', 8, 1.8);
    beep(400, 0.06, 'sine', 0.03);
    return;
  }
  if (nearWater) {
    const cap = ITEMS[inv[sel].id].cap || 20;
    player.water = cap;
    player.maxWater = cap;
    beep(500, 0.15, 'sine', 0.04);
    toast('💧 Sulama kabı dolduruldu (' + player.water + ')');
  }
}

function useAxe(tx, ty) {
  const o = world.getObj(tx, ty);
  if (o === O.TREE || o === O.PINE) {
    if (!player.useEnergy(4)) { toast('⚡ Çok yorgunsun!'); return; }
    world.setObj(tx, ty, O.NONE);
    invAdd('wood', 2 + Math.floor(Math.random() * 3));
    emitParticles(tx * TILE + TILE / 2, ty * TILE + TILE / 2, '#6b3f1a', 12, 2.5);
    beep(120, 0.15, 'sawtooth', 0.05);
    addFloater(tx * TILE + TILE / 2, ty * TILE, '+Odun', '#a07040');
  } else if (o === O.WEED) {
    if (!player.useEnergy(1)) return;
    world.setObj(tx, ty, O.NONE);
    invAdd('fiber', 1);
    emitParticles(tx * TILE + TILE / 2, ty * TILE + TILE / 2, '#7ac04a', 4, 1.2);
    beep(300, 0.05, 'square', 0.03);
  }
}

function usePick(tx, ty) {
  const o = world.getObj(tx, ty);
  const t = world.getTile(tx, ty);
  if (o === O.ROCK) {
    if (!player.useEnergy(5)) { toast('⚡ Çok yorgunsun!'); return; }
    world.setObj(tx, ty, O.NONE);
    invAdd('stone', 1 + Math.floor(Math.random() * 2));
    if (Math.random() < 0.15) invAdd('copper_ore', 1);
    emitParticles(tx * TILE + TILE / 2, ty * TILE + TILE / 2, '#888', 12, 2.5);
    beep(90, 0.14, 'sawtooth', 0.05);
    addFloater(tx * TILE + TILE / 2, ty * TILE, '+Taş', '#cccccc');
  } else if (o === O.ORE_NODE) {
    if (!player.useEnergy(6)) return;
    world.setObj(tx, ty, O.NONE);
    const isMine = world.isMine();
    const lvl = world.mineLevel;
    const r = Math.random();
    if (isMine) {
      if (lvl < 5) {
        if (r < 0.6) invAdd('copper_ore', 2);
        else if (r < 0.9) invAdd('iron_ore', 1);
        else invAdd('coal', 2);
      } else if (lvl < 12) {
        if (r < 0.4) invAdd('iron_ore', 2);
        else if (r < 0.75) invAdd('gold_ore', 1);
        else invAdd('coal', 3);
      } else {
        if (r < 0.5) invAdd('gold_ore', 2);
        else if (r < 0.8) invAdd('iron_ore', 3);
        else invAdd('coal', 4);
      }
    } else {
      if (r < 0.6) invAdd('copper_ore', 2);
      else if (r < 0.9) invAdd('iron_ore', 1);
      else invAdd('gold_ore', 1);
    }
    emitParticles(tx * TILE + TILE / 2, ty * TILE + TILE / 2, '#ffd860', 15, 3);
    beep(150, 0.2, 'triangle', 0.06);
    addFloater(tx * TILE + TILE / 2, ty * TILE, '+Cevher', '#ffd860');
  } else if (t === T.MINE_WALL && world.isMine()) {
    if (!player.useEnergy(3)) return;
    world.setTile(tx, ty, T.MINE_FLOOR);
    emitParticles(tx * TILE + TILE / 2, ty * TILE + TILE / 2, '#666', 10, 2);
    beep(100, 0.1, 'square', 0.04);
  }
}

function useScythe(tx, ty) {
  const o = world.getObj(tx, ty);
  if (o === O.WEED || o === O.FLOWER) {
    world.setObj(tx, ty, O.NONE);
    invAdd('fiber', 1);
    emitParticles(tx * TILE + TILE / 2, ty * TILE + TILE / 2, '#7ac04a', 6, 1.8);
    beep(350, 0.05, 'square', 0.03);
  }
}

function useRod(tx, ty) {
  if (fishing) return;
  const t = world.getTile(tx, ty);
  if (t !== T.WATER) { toast('🎣 Suya doğru at!'); return; }
  if (!player.useEnergy(4)) { toast('⚡ Çok yorgunsun!'); return; }
  player.swingT = 0.3;
  player.swingX = tx;
  player.swingY = ty;
  const waitTime = 2000 + Math.random() * 3000;
  fishing = { tx, ty, startT: performance.now(), waitTime, phase: 'wait' };
  beep(400, 0.15, 'sine', 0.03);
  toast('🎣 Oltayı attın, bekle...');
}

function updateFishing(now) {
  if (!fishing) return;
  const elapsed = now - fishing.startT;
  if (fishing.phase === 'wait') {
    if (elapsed > fishing.waitTime) {
      fishing.phase = 'hook';
      fishing.hookT = now;
      beep(800, 0.1, 'sine', 0.05);
      toast('❗ Çekiyor! Sol tık ile çek!');
    }
  } else if (fishing.phase === 'hook') {
    if (now - fishing.hookT > 1500) {
      toast('❌ Balık kaçtı!');
      fishing = null;
    }
  }
}

function tryHookFish() {
  if (!fishing || fishing.phase !== 'hook') return;
  const fishList = ['carp', 'sunfish', 'catfish', 'bass', 'trout', 'salmon'];
  const fish = fishList[Math.floor(Math.random() * fishList.length)];
  invAdd(fish, 1);
  emitParticles(fishing.tx * TILE + TILE / 2, fishing.ty * TILE + TILE / 2, '#a0c0ff', 10, 2);
  addFloater(fishing.tx * TILE + TILE / 2, fishing.ty * TILE, '+' + ITEMS[fish].name, '#a0c0ff');
  beep(800, 0.15, 'sine', 0.05);
  toast('🎣 ' + ITEMS[fish].name + ' yakaladın!');
  fishing = null;
}

function plantSeed(tx, ty, item) {
  const info = ITEMS[item.id];
  const t = world.getTile(tx, ty);
  if (t !== T.TILLED && t !== T.WATERED) { toast('❌ Önce çapa ile toprağı sür'); return; }
  if (world.getCrop(tx, ty)) { toast('❌ Burada zaten ekin var'); return; }
  if (world.getObj(tx, ty) !== O.NONE) return;
  if (info.season !== undefined && info.season !== world.season) {
    toast('❌ Bu tohum bu mevsimde büyümez!');
    return;
  }
  if (!player.useEnergy(1)) { toast('⚡ Çok yorgunsun!'); return; }
  world.setCrop(tx, ty, {
    crop: info.crop,
    growth: 0,
    watered: t === T.WATERED,
    dead: false,
    harvests: 0
  });
  invRemove(item.id, 1);
  player.swingT = 0.25;
  player.swingX = tx;
  player.swingY = ty;
  emitParticles(tx * TILE + TILE / 2, ty * TILE + TILE / 2, '#7ac04a', 4, 1.5);
  beep(500, 0.05, 'triangle', 0.03);
}

// ==================== ETKİLEŞİM (E) ====================
function tryInteract() {
  if (shopOpen || paused || !player) return;
  const ptx = Math.floor((player.x + player.w / 2) / TILE);
  const pty = Math.floor((player.y + player.h / 2) / TILE);

  for (const npc of npcs) {
    const nd = Math.hypot((npc.x + npc.w / 2) - (player.x + player.w / 2), (npc.y + npc.h / 2) - (player.y + player.h / 2));
    if (nd < 50) {
      const line = npc.getDialog();
      showDialog(npc.name, npc.def.portrait, line);
      if (npc.id === 'pierre' || npc.id === 'marnie' || npc.id === 'clint') {
        setTimeout(() => openShop(npc), 600);
      }
      return;
    }
  }

  for (const a of animals) {
    const nd = Math.hypot((a.x + a.w / 2) - (player.x + player.w / 2), (a.y + a.h / 2) - (player.y + player.h / 2));
    if (nd < 45) {
      if (a.produceReady) {
        const prod = a.collect();
        if (prod) { invAdd(prod, 1); addFloater(a.x + a.w / 2, a.y, '+' + ITEMS[prod].name, '#ffd24a'); beep(700, 0.1, 'triangle', 0.05); }
      } else if (!a.fed && invCount('hay') > 0) {
        invRemove('hay', 1);
        a.feed();
        toast('🌾 Hayvanı besledin');
        beep(500, 0.08, 'sine', 0.04);
      } else if (!a.fed) {
        toast('❌ Saman yok');
      } else {
        toast('⏳ Henüz ürün hazır değil');
      }
      return;
    }
  }

  for (let yy = -1; yy <= 1; yy++) {
    for (let xx = -1; xx <= 1; xx++) {
      const o = world.getObj(ptx + xx, pty + yy);
      const t = world.getTile(ptx + xx, pty + yy);
      if (o === O.BED) { sleepPrompt(); return; }
      if (o === O.BIN) { useBin(); return; }
      if (o === O.MINE_ENTRANCE) {
        if (world.isMine()) {
          world.changeMineLevel(0);
          player.x = 24 * TILE;
          player.y = 24 * TILE;
          toast('🌞 Yeryüzüne döndün');
        } else {
          world.enterMine();
          player.x = Math.floor(MINE_W / 2) * TILE;
          player.y = 3 * TILE;
          toast('⛏️ Maden kat 1');
        }
        return;
      }
      if (o === O.KITCHEN) { toast('🍳 Mutfak (yakında)'); return; }
      if (t === T.LADDER && world.isMine()) {
        const above = world.getTile(ptx + xx, pty + yy - 1);
        if (above === T.MINE_EXIT) {
          world.changeMineLevel(0);
          player.x = 24 * TILE;
          player.y = 26 * TILE;
          toast('🌞 Yeryüzüne döndün');
          return;
        }
        const nextLevel = world.mineLevel + 1;
        if (nextLevel > MINE_LEVELS) { toast('🏔️ En alt kat'); return; }
        world.changeMineLevel(nextLevel);
        player.x = Math.floor(MINE_W / 2) * TILE;
        player.y = 3 * TILE;
        toast('⛏️ Maden kat ' + nextLevel);
        return;
      }
    }
  }

  const c = world.getCrop(ptx, pty);
  if (c) {
    const cd = CROPS[c.crop];
    if (cd && c.growth >= cd.days) {
      harvest(ptx, pty);
    } else if (c.dead) {
      world.setCrop(ptx, pty, null);
      world.setTile(ptx, pty, T.TILLED);
      toast('🥀 Ölü ekin temizlendi');
    } else {
      toast('🌱 Henüz büyümemiş (' + c.growth + '/' + cd.days + ')');
    }
  }
}

function harvest(tx, ty) {
  const c = world.getCrop(tx, ty);
  if (!c) return;
  const cd = CROPS[c.crop];
  if (!cd) return;
  const itemId = c.crop;
  let amount = 1;
  if (Math.random() < 0.15) amount++;
  invAdd(itemId, amount);
  addFloater(tx * TILE + TILE / 2, ty * TILE, '+' + ITEMS[itemId].name, '#ffd24a');
  emitParticles(tx * TILE + TILE / 2, ty * TILE + TILE / 2, ITEMS[itemId].c || '#ffd24a', 8, 2);
  beep(700, 0.1, 'triangle', 0.05);
  if (cd.regrow > 0 && c.harvests < 3) {
    c.growth = cd.days - cd.regrow;
    c.harvests++;
    c.watered = false;
  } else {
    world.setCrop(tx, ty, null);
    world.setTile(tx, ty, T.TILLED);
  }
}

function useBin() {
  let total = 0, count = 0;
  for (let i = 0; i < inv.length; i++) {
    const s = inv[i];
    if (!s.id) continue;
    if (isSellable(s.id)) {
      total += (ITEMS[s.id].sell || 0) * s.count;
      count += s.count;
      s.id = null; s.count = 0;
    }
  }
  if (count === 0) { toast('📦 Satılacak eşya yok'); return; }
  player.money += total;
  updateHUD(); updateHotbar();
  toast('📦 ' + count + ' eşya satıldı: +' + total + 'g');
  beep(800, 0.15, 'triangle', 0.05);
}

// ==================== UYKU ====================
function sleepPrompt() {
  if (confirm('🛏️ Uyumak ister misin? Yarın yeni bir gün başlayacak.')) sleep();
}

function sleep() {
  world.nextDay();
  player.x = 5 * TILE;
  player.y = 6 * TILE;
  player.energy = player.maxEnergy;
  player.hp = player.maxHp;
  updateHUD();
  saveGame();
  toast('🌅 Gün ' + world.day + ' başladı!');
  beep(600, 0.3, 'sine', 0.04);
}

// ==================== MAĞAZA ====================
function openShop(npc) {
  currentShopNPC = npc;
  shopOpen = true;
  const p = document.getElementById('shopPanel');
  if (p) p.classList.add('show');
  const t = document.getElementById('shopTitle');
  if (t) t.textContent = '🏪 ' + npc.name + ' - ' + npc.def.role;
  renderShop();
}

function renderShop() {
  const c = document.getElementById('shopContent');
  if (!c) return;
  c.innerHTML = '';
  if (!currentShopNPC) return;

  if (shopTab === 'buy') {
    if (currentShopNPC.id === 'pierre') {
      const stock = getSeasonSeed(world.season);
      if (stock.length === 0) {
        c.innerHTML = '<div style="text-align:center;padding:20px;color:#a08a60;font-size:12px">Bu mevsimde tohum yok. Kışın dinlen!</div>';
        return;
      }
      for (const id of stock) {
        const info = ITEMS[id];
        if (!info) continue;
        const canAfford = player.money >= info.buy;
        const row = document.createElement('div');
        row.className = 'shopItem' + (canAfford ? '' : ' no');
        const cd = CROPS[info.crop];
        row.innerHTML = '<div class="ic"></div><div class="info"><b>' + info.name + '</b><small>' + (cd ? cd.days + ' gün' : '?') + ' · Satış: ' + (ITEMS[info.crop]?.sell || 0) + 'g</small></div><div class="price">' + info.buy + 'g</div>';
        const ic = document.createElement('canvas');
        ic.width = 44; ic.height = 44;
        drawItemIcon(ic.getContext('2d'), id, 44);
        row.querySelector('.ic').appendChild(ic);
        row.addEventListener('click', () => {
          if (player.money < info.buy) { toast('❌ Yetersiz para'); return; }
          player.money -= info.buy;
          invAdd(id, 1);
          beep(600, 0.08, 'sine', 0.04);
          updateHUD(); updateHotbar(); renderShop();
        });
        c.appendChild(row);
      }
    } else if (currentShopNPC.id === 'marnie') {
      const items = [
        { id: 'chicken', name: 'Tavuk', price: PRICES.chicken, desc: 'Yumurta üretir', icon: '🐔' },
        { id: 'cow', name: 'İnek', price: PRICES.cow, desc: 'Süt üretir', icon: '🐄' },
        { id: 'hay', name: 'Saman', price: PRICES.hay, desc: 'Hayvan yemi', icon: '🌾' }
      ];
      for (const it of items) {
        const canAfford = player.money >= it.price;
        const row = document.createElement('div');
        row.className = 'shopItem' + (canAfford ? '' : ' no');
        row.innerHTML = '<div class="ic" style="font-size:24px;display:flex;align-items:center;justify-content:center">' + it.icon + '</div><div class="info"><b>' + it.name + '</b><small>' + it.desc + '</small></div><div class="price">' + it.price + 'g</div>';
        row.addEventListener('click', () => {
          if (player.money < it.price) { toast('❌ Yetersiz para'); return; }
          player.money -= it.price;
          if (it.id === 'hay') {
            invAdd('hay', 5);
          } else {
            const spawnX = (56 + Math.random() * 3) * TILE;
            const spawnY = (20 + Math.random() * 3) * TILE;
            animals.push(new Animal(it.id, spawnX, spawnY));
            toast('🐾 ' + it.name + ' aldın!');
          }
          beep(600, 0.08, 'sine', 0.04);
          updateHUD(); updateHotbar(); renderShop();
        });
        c.appendChild(row);
      }
    } else if (currentShopNPC.id === 'clint') {
      let any = false;
      for (const toolBase of ['hoe', 'can', 'axe', 'pick']) {
        let hasBase = false;
        for (const s of inv) if (s.id === toolBase) hasBase = true;
        if (!hasBase) continue;
        any = true;
        const upgradeKey = toolBase + '_iron';
        const upgradeInfo = ITEMS[upgradeKey];
        const oreCost = 5;
        const moneyCost = 2000;
        const canAfford = player.money >= moneyCost && invCount('copper_bar') >= oreCost;
        const row = document.createElement('div');
        row.className = 'shopItem' + (canAfford ? '' : ' no');
        row.innerHTML = '<div class="ic"></div><div class="info"><b>' + upgradeInfo.name + '</b><small>' + oreCost + 'x Bakır Külçe + ' + moneyCost + 'g</small></div><div class="price">' + moneyCost + 'g</div>';
        const ic = document.createElement('canvas');
        ic.width = 44; ic.height = 44;
        drawItemIcon(ic.getContext('2d'), upgradeKey, 44);
        row.querySelector('.ic').appendChild(ic);
        row.addEventListener('click', () => {
          if (!canAfford) { toast('❌ Yetersiz malzeme'); return; }
          player.money -= moneyCost;
          invRemove('copper_bar', oreCost);
          invRemove(toolBase, 1);
          invAdd(upgradeKey, 1);
          beep(900, 0.2, 'triangle', 0.06);
          toast('⚒️ ' + upgradeInfo.name + ' aldın!');
          updateHUD(); updateHotbar(); renderShop();
        });
        c.appendChild(row);
      }
      if (!any) c.innerHTML = '<div style="text-align:center;padding:20px;color:#a08a60;font-size:12px">Alet yükseltmek için önce alet lazım</div>';
    }
  } else {
    let any = false;
    for (let i = 0; i < inv.length; i++) {
      const s = inv[i];
      if (!s.id) continue;
      if (!isSellable(s.id)) continue;
      any = true;
      const info = ITEMS[s.id];
      const row = document.createElement('div');
      row.className = 'shopItem sell';
      row.innerHTML = '<div class="ic"></div><div class="info"><b>' + info.name + ' × ' + s.count + '</b><small>' + info.type + '</small></div><div class="price">+' + ((info.sell || 0) * s.count) + 'g</div>';
      const ic = document.createElement('canvas');
      ic.width = 44; ic.height = 44;
      drawItemIcon(ic.getContext('2d'), s.id, 44);
      row.querySelector('.ic').appendChild(ic);
      row.addEventListener('click', () => {
        player.money += (info.sell || 0) * s.count;
        s.id = null; s.count = 0;
        beep(800, 0.1, 'triangle', 0.05);
        updateHUD(); updateHotbar(); renderShop();
      });
      c.appendChild(row);
    }
    if (!any) c.innerHTML = '<div style="text-align:center;padding:20px;color:#a08a60;font-size:12px">Satılacak eşya yok</div>';
  }
}

// ==================== KAMERA ====================
function updateCamera() {
  if (!player) return;
  const w = world.isMine() ? MINE_W : MAP_W;
  const h = world.isMine() ? MINE_H : MAP_H;
  const tx = player.x + player.w / 2 - VW / 2;
  const ty = player.y + player.h / 2 - VH / 2;
  camera.x += (tx - camera.x) * 0.15;
  camera.y += (ty - camera.y) * 0.15;
  const maxX = Math.max(0, w * TILE - VW);
  const maxY = Math.max(0, h * TILE - VH);
  camera.x = Math.max(0, Math.min(maxX, camera.x));
  camera.y = Math.max(0, Math.min(maxY, camera.y));
}

// ==================== UPDATE ====================
function update(dt) {
  if (!gameReady) return;
  if (paused || shopOpen) return;

  updateFishing(performance.now());
  if (fishing && fishing.phase === 'hook' && mouse.down) {
    tryHookFish();
    mouse.down = false;
  }

  player.update(dt, world, input);
  for (const n of npcs) n.update(dt, world);
  for (const a of animals) a.update(dt, world);

  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx; p.y += p.vy;
    p.vy += 0.15; p.vx *= 0.97; p.vy *= 0.97;
    p.life -= dt;
    if (p.life <= 0) particles.splice(i, 1);
  }
  for (let i = floaters.length - 1; i >= 0; i--) {
    const f = floaters[i];
    f.y -= 30 * dt;
    f.life -= dt;
    if (f.life <= 0) floaters.splice(i, 1);
  }

  world.updateAmbient(dt);
  const res = world.advanceTime(dt, timeSpeed);
  if (res === 'sleep') sleep();

  updateCamera();
  updateHUD();
}

// ==================== RENDER ====================
function render() {
  if (!gameReady || !world || !player) return;

  if (world.isMine()) {
    ctx.fillStyle = '#0a0505';
    ctx.fillRect(0, 0, VW, VH);
  } else {
    const sky = world.getSkyColors();
    const g = ctx.createLinearGradient(0, 0, 0, VH);
    g.addColorStop(0, sky.top);
    g.addColorStop(1, sky.bot);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VW, VH);
    drawSunMoon();
    drawDistantHills();
  }

  const w = world.isMine() ? MINE_W : MAP_W;
  const h = world.isMine() ? MINE_H : MAP_H;
  const x0 = Math.max(0, Math.floor(camera.x / TILE) - 1);
  const x1 = Math.min(w - 1, Math.ceil((camera.x + VW) / TILE) + 1);
  const y0 = Math.max(0, Math.floor(camera.y / TILE) - 1);
  const y1 = Math.min(h - 1, Math.ceil((camera.y + VH) / TILE) + 1);
  const season = SEASONS[world.season];

  if (!world.isMine()) {
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        if (world.walls[y][x]) {
          const sx = Math.floor(x * TILE - camera.x);
          const sy = Math.floor(y * TILE - camera.y);
          ctx.fillStyle = 'rgba(40,25,15,0.75)';
          ctx.fillRect(sx, sy, TILE, TILE);
        }
      }
    }
  }

  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) drawTile(x, y, season);
  }

  if (!world.isMine()) {
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        const c = world.crops[y][x];
        if (c) drawCrop(x, y, c);
      }
    }
  }

  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      const o = world.getObj(x, y);
      if (o) drawObject(x, y, o);
    }
  }

  for (const a of animals) {
    const sx = a.x - camera.x;
    const sy = a.y - camera.y;
    if (sx < -60 || sx > VW + 60 || sy < -60 || sy > VH + 60) continue;
    drawAnimal(ctx, sx, sy, a);
    if (a.produceReady) {
      ctx.fillStyle = '#ffd24a';
      ctx.font = 'bold 14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('!', sx + a.w / 2, sy - 4);
      ctx.textAlign = 'left';
    }
  }

  for (const n of npcs) {
    const sx = n.x - camera.x;
    const sy = n.y - camera.y;
    if (sx < -60 || sx > VW + 60 || sy < -60 || sy > VH + 60) continue;
    const wf = n.moving ? Math.sin(n.animT) : 0;
    drawHumanoid(ctx, sx, sy, n.w, n.h, {
      facing: n.facing,
      walkFrame: wf,
      skinColor: n.def.skinColor,
      shirtColor: n.def.shirtColor,
      pantsColor: n.def.pantsColor,
      hairColor: n.def.hairColor
    });
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillText(n.name, sx + n.w / 2 + 1, sy - 6);
    ctx.fillStyle = '#ffd24a';
    ctx.fillText(n.name, sx + n.w / 2, sy - 7);
    ctx.textAlign = 'left';
  }

  drawPlayer();

  if (fishing) {
    const px = player.x + player.w / 2 - camera.x;
    const py = player.y + player.h / 2 - camera.y;
    const fx = fishing.tx * TILE + TILE / 2 - camera.x;
    const fy = fishing.ty * TILE + TILE / 2 - camera.y;
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(fx, fy);
    ctx.stroke();
    ctx.fillStyle = fishing.phase === 'hook' ? '#ff3030' : '#ffd24a';
    ctx.beginPath();
    ctx.arc(fx, fy, 4 + (fishing.phase === 'hook' ? Math.sin(performance.now() * 0.02) * 2 : 0), 0, Math.PI * 2);
    ctx.fill();
  }

  for (const p of particles) {
    const a = p.life / p.maxLife;
    ctx.globalAlpha = a;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - camera.x - p.size / 2, p.y - camera.y - p.size / 2, p.size, p.size);
  }
  ctx.globalAlpha = 1;

  for (const f of floaters) {
    const a = Math.min(1, f.life / f.maxLife * 2);
    ctx.globalAlpha = a;
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#000';
    ctx.fillText(f.text, f.x - camera.x + 1, f.y - camera.y + 1);
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x - camera.x, f.y - camera.y);
    ctx.globalAlpha = 1;
  }
  ctx.textAlign = 'left';

  drawWeather();
  drawAmbient();

  if (world.isMine()) {
    const px = player.x + player.w / 2 - camera.x;
    const py = player.y + player.h / 2 - camera.y;
    const rg = ctx.createRadialGradient(px, py, 30, px, py, 200);
    rg.addColorStop(0, 'rgba(0,0,0,0)');
    rg.addColorStop(1, 'rgba(0,0,0,0.9)');
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, VW, VH);
  } else {
    const dl = world.getDayLight();
    if (dl < 0.9) {
      const px = player.x + player.w / 2 - camera.x;
      const py = player.y + player.h / 2 - camera.y;
      const darkness = (1 - dl) * 0.7;
      const rg = ctx.createRadialGradient(px, py, 60, px, py, 400);
      rg.addColorStop(0, 'rgba(0,0,20,0)');
      rg.addColorStop(1, 'rgba(0,0,20,' + darkness + ')');
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, VW, VH);
    }
  }

  if (world.lightningFlash > 0) {
    ctx.fillStyle = 'rgba(255,255,255,' + world.lightningFlash + ')';
    ctx.fillRect(0, 0, VW, VH);
  }

  drawToolTarget();

  // === GİZLİ CANVAS İMZASI (telif kanıtı) ===
  ctx.globalAlpha = 0.008;
  ctx.font = 'bold 60px monospace';
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.fillText('[SENİN ADIN] · YEŞİL VADİ · 2026', VW / 2, VH / 2);
  ctx.globalAlpha = 1;
  ctx.textAlign = 'left';
}

function drawTile(x, y, season) {
  const t = world.getTile(x, y);
  const sx = Math.floor(x * TILE - camera.x);
  const sy = Math.floor(y * TILE - camera.y);
  const hh = hash2(x, y, world.seed);
  if (t === T.GRASS) {
    ctx.fillStyle = season.grass;
    ctx.fillRect(sx, sy, TILE, TILE);
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    for (let i = 0; i < 3; i++) {
      const px = sx + (hash2(x, y, i * 10) * TILE) | 0;
      const py = sy + (hash2(x, y, i * 10 + 5) * TILE) | 0;
      ctx.fillRect(px, py, 2, 2);
    }
  } else if (t === T.DIRT) {
    ctx.fillStyle = '#8B6a3a';
    ctx.fillRect(sx, sy, TILE, TILE);
    ctx.fillStyle = '#6a4a1a';
    for (let i = 0; i < 3; i++) ctx.fillRect(sx + (hash2(x, y, i * 10) * TILE) | 0, sy + (hash2(x, y, i * 10 + 5) * TILE) | 0, 2, 2);
  } else if (t === T.TILLED) {
    ctx.fillStyle = '#5a3a1a';
    ctx.fillRect(sx, sy, TILE, TILE);
    ctx.fillStyle = '#3a2a10';
    for (let i = 0; i < 3; i++) ctx.fillRect(sx, sy + 6 + i * 8, TILE, 1);
  } else if (t === T.WATERED) {
    ctx.fillStyle = '#3a2510';
    ctx.fillRect(sx, sy, TILE, TILE);
    ctx.fillStyle = '#2a1808';
    for (let i = 0; i < 3; i++) ctx.fillRect(sx, sy + 6 + i * 8, TILE, 1);
    ctx.fillStyle = 'rgba(90,154,192,0.2)';
    ctx.fillRect(sx, sy, TILE, TILE);
  } else if (t === T.WATER) {
    ctx.fillStyle = '#3a6a9a';
    ctx.fillRect(sx, sy, TILE, TILE);
    const wave = Math.sin((x + y + performance.now() * 0.002) * 0.5) * 2;
    ctx.fillStyle = 'rgba(140,190,230,0.6)';
    ctx.fillRect(sx + 3, sy + 8 + wave, TILE - 6, 2);
  } else if (t === T.PATH) {
    ctx.fillStyle = '#b09068';
    ctx.fillRect(sx, sy, TILE, TILE);
    ctx.fillStyle = '#9a7858';
    for (let i = 0; i < 3; i++) ctx.fillRect(sx + (hash2(x, y, i * 10) * TILE) | 0, sy + (hash2(x, y, i * 10 + 5) * TILE) | 0, 3, 3);
  } else if (t === T.SAND) {
    ctx.fillStyle = '#e0c878';
    ctx.fillRect(sx, sy, TILE, TILE);
    ctx.fillStyle = '#c8b060';
    for (let i = 0; i < 3; i++) ctx.fillRect(sx + (hash2(x, y, i * 7) * TILE) | 0, sy + (hash2(x, y, i * 7 + 3) * TILE) | 0, 2, 2);
  } else if (t === T.WOOD) {
    ctx.fillStyle = '#a8724a';
    ctx.fillRect(sx, sy, TILE, TILE);
    ctx.fillStyle = '#8a5a3a';
    ctx.fillRect(sx, sy + 10, TILE, 1);
    ctx.fillRect(sx, sy + 22, TILE, 1);
  } else if (t === T.STONE) {
    ctx.fillStyle = '#666';
    ctx.fillRect(sx, sy, TILE, TILE);
  } else if (t === T.MINE_FLOOR) {
    ctx.fillStyle = '#3a2a20';
    ctx.fillRect(sx, sy, TILE, TILE);
    ctx.fillStyle = '#2a1a10';
    for (let i = 0; i < 3; i++) ctx.fillRect(sx + (hash2(x, y, i * 10) * TILE) | 0, sy + (hash2(x, y, i * 10 + 5) * TILE) | 0, 2, 2);
  } else if (t === T.MINE_WALL) {
    ctx.fillStyle = '#4a3a2a';
    ctx.fillRect(sx, sy, TILE, TILE);
    ctx.fillStyle = '#5a4a3a';
    ctx.fillRect(sx + 2, sy + 2, TILE - 4, TILE - 4);
    ctx.fillStyle = '#3a2a1a';
    ctx.fillRect(sx + 6, sy + 6, TILE - 12, TILE - 12);
  } else if (t === T.LADDER) {
    ctx.fillStyle = '#3a2a20';
    ctx.fillRect(sx, sy, TILE, TILE);
    ctx.fillStyle = '#a87a4a';
    ctx.fillRect(sx + 6, sy, 3, TILE);
    ctx.fillRect(sx + TILE - 9, sy, 3, TILE);
    for (let i = 0; i < 4; i++) ctx.fillRect(sx + 6, sy + 4 + i * 8, TILE - 12, 2);
  } else if (t === T.MINE_EXIT) {
    ctx.fillStyle = '#3a2a20';
    ctx.fillRect(sx, sy, TILE, TILE);
    ctx.fillStyle = '#ffd24a';
    ctx.beginPath();
    ctx.arc(sx + TILE / 2, sy + TILE / 2, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(sx + TILE / 2, sy + TILE / 2, 5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawObject(x, y, o) {
  const sx = Math.floor(x * TILE - camera.x);
  const sy = Math.floor(y * TILE - camera.y);
  const hh = hash2(x, y, world.seed);
  const season = SEASONS[world.season];
  if (o === O.TREE) {
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(sx + TILE / 2, sy + TILE - 2, 12, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#5a3a1a';
    ctx.fillRect(sx + 12, sy + 14, 8, 18);
    let leafColors;
    if (season.id === 0) leafColors = ['#2a6a2a', '#3a8a3a', '#4a9a3a'];
    else if (season.id === 1) leafColors = ['#3a8a3a', '#5aaa3a', '#6aba3a'];
    else if (season.id === 2) leafColors = ['#8a4a1a', '#c85a2a', '#e08820'];
    else leafColors = ['#5a8a9a', '#7aaaB0', '#a0d0e0'];
    ctx.fillStyle = leafColors[0];
    ctx.beginPath(); ctx.arc(sx + 16, sy + 10, 14, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = leafColors[1];
    ctx.beginPath(); ctx.arc(sx + 12, sy + 8, 11, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(sx + 20, sy + 12, 11, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = leafColors[2];
    ctx.beginPath(); ctx.arc(sx + 16, sy + 5, 9, 0, Math.PI * 2); ctx.fill();
  } else if (o === O.PINE) {
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(sx + TILE / 2, sy + TILE - 2, 10, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#4a2a10';
    ctx.fillRect(sx + 14, sy + 20, 4, 12);
    const pineColor = season.id === 3 ? '#5a8a7a' : '#2a5a2a';
    const pineHi = season.id === 3 ? '#7aaa9a' : '#4a7a3a';
    for (let i = 0; i < 3; i++) {
      const size = 14 - i * 3;
      const yOff = 20 - i * 7;
      ctx.fillStyle = i === 2 ? pineHi : pineColor;
      ctx.beginPath();
      ctx.moveTo(sx + 16, sy + yOff - size);
      ctx.lineTo(sx + 16 - size, sy + yOff);
      ctx.lineTo(sx + 16 + size, sy + yOff);
      ctx.closePath(); ctx.fill();
    }
  } else if (o === O.ROCK) {
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(sx + TILE / 2, sy + TILE - 3, 12, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7a7a7a';
    ctx.beginPath();
    ctx.moveTo(sx + 4, sy + TILE - 4);
    ctx.lineTo(sx + 6, sy + 12);
    ctx.lineTo(sx + 14, sy + 6);
    ctx.lineTo(sx + 22, sy + 10);
    ctx.lineTo(sx + 28, sy + TILE - 4);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#9a9a9a';
    ctx.beginPath();
    ctx.moveTo(sx + 8, sy + 14);
    ctx.lineTo(sx + 14, sy + 9);
    ctx.lineTo(sx + 20, sy + 12);
    ctx.lineTo(sx + 12, sy + 16);
    ctx.closePath(); ctx.fill();
  } else if (o === O.WEED) {
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + hh;
      ctx.strokeStyle = '#3a7a2a'; ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sx + TILE / 2, sy + TILE - 6);
      ctx.lineTo(sx + TILE / 2 + Math.cos(a) * 7, sy + TILE - 14);
      ctx.stroke();
    }
  } else if (o === O.FLOWER) {
    const color = ['#ff80c0', '#ffd24a', '#c080ff', '#ffffff'][(hh * 100 | 0) % 4];
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(sx + TILE / 2 + Math.cos(a) * 3, sy + 20 + Math.sin(a) * 3, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#ffd24a';
    ctx.beginPath();
    ctx.arc(sx + TILE / 2, sy + 20, 2, 0, Math.PI * 2);
    ctx.fill();
  } else if (o === O.BED) {
    ctx.fillStyle = '#5a3a1a';
    ctx.fillRect(sx + 2, sy + 4, 28, 26);
    ctx.fillStyle = '#e8e0d0';
    ctx.fillRect(sx + 4, sy + 6, 24, 8);
    ctx.fillStyle = '#c44a3a';
    ctx.fillRect(sx + 4, sy + 14, 24, 14);
  } else if (o === O.BIN) {
    ctx.fillStyle = '#5a3a1a';
    ctx.fillRect(sx + 3, sy + 8, 26, 22);
    ctx.fillStyle = '#8a6a3a';
    ctx.fillRect(sx + 3, sy + 8, 26, 6);
    ctx.fillStyle = '#3a2510';
    ctx.fillRect(sx + 8, sy + 6, 16, 4);
    ctx.fillStyle = '#ffd24a';
    ctx.beginPath(); ctx.arc(sx + 16, sy + 18, 3, 0, Math.PI * 2); ctx.fill();
  } else if (o === O.HOUSE) {
    ctx.fillStyle = '#8a3a2a';
    ctx.fillRect(sx, sy, TILE, TILE);
    ctx.fillStyle = '#6a2a1a';
    ctx.fillRect(sx + 2, sy + 2, TILE - 4, TILE - 4);
    ctx.fillStyle = '#a04a3a';
    ctx.fillRect(sx + 4, sy + 4, TILE - 8, TILE - 8);
  } else if (o === O.SHOP) {
    ctx.fillStyle = '#5a4a3a';
    ctx.fillRect(sx, sy, TILE, TILE);
    ctx.fillStyle = '#8a6a3a';
    ctx.fillRect(sx + 2, sy + 2, TILE - 4, TILE - 4);
    ctx.fillStyle = '#ffd24a';
    ctx.fillRect(sx + 6, sy + 6, TILE - 12, TILE - 12);
  } else if (o === O.BARN) {
    ctx.fillStyle = '#8a3a2a';
    ctx.fillRect(sx, sy, TILE, TILE);
    ctx.fillStyle = '#6a2a1a';
    ctx.fillRect(sx + 2, sy + 2, TILE - 4, TILE - 4);
    ctx.fillStyle = '#c44a3a';
    ctx.beginPath();
    ctx.moveTo(sx + 16, sy + 4);
    ctx.lineTo(sx + 2, sy + 16);
    ctx.lineTo(sx + 30, sy + 16);
    ctx.closePath(); ctx.fill();
  } else if (o === O.COOP) {
    ctx.fillStyle = '#c8a050';
    ctx.fillRect(sx, sy, TILE, TILE);
    ctx.fillStyle = '#a88030';
    ctx.fillRect(sx + 2, sy + 2, TILE - 4, TILE - 4);
    ctx.fillStyle = '#8a5a1a';
    ctx.beginPath();
    ctx.moveTo(sx + 16, sy + 4);
    ctx.lineTo(sx + 4, sy + 16);
    ctx.lineTo(sx + 28, sy + 16);
    ctx.closePath(); ctx.fill();
  } else if (o === O.WELL) {
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(sx + TILE / 2, sy + TILE - 2, 14, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#5a5a6a';
    ctx.beginPath();
    ctx.arc(sx + 16, sy + 20, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3a3a4a';
    ctx.beginPath();
    ctx.arc(sx + 16, sy + 20, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3a6a9a';
    ctx.beginPath();
    ctx.arc(sx + 16, sy + 20, 7, 0, Math.PI * 2);
    ctx.fill();
  } else if (o === O.MINE_ENTRANCE) {
    ctx.fillStyle = '#2a1a1a';
    ctx.fillRect(sx, sy, TILE, TILE);
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(sx + TILE / 2, sy + TILE / 2, 12, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#6a4a2a';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#5a4a3a';
    ctx.fillRect(sx + 4, sy + 2, 4, TILE - 4);
    ctx.fillRect(sx + TILE - 8, sy + 2, 4, TILE - 4);
  } else if (o === O.FENCE) {
    ctx.fillStyle = '#8a6a3a';
    ctx.fillRect(sx, sy + 14, TILE, 3);
    ctx.fillRect(sx, sy + 22, TILE, 3);
    ctx.fillRect(sx + 6, sy + 6, 4, TILE - 6);
  } else if (o === O.ORE_NODE) {
    ctx.fillStyle = '#5a5a5a';
    ctx.beginPath();
    ctx.arc(sx + TILE / 2, sy + TILE / 2, 12, 0, Math.PI * 2);
    ctx.fill();
    const colors = ['#d47a4a', '#c89878', '#ffd860', '#a8f0e8'];
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = colors[i];
      const a = (i / 4) * Math.PI * 2 + hh;
      ctx.beginPath();
      ctx.arc(sx + 16 + Math.cos(a) * 6, sy + 16 + Math.sin(a) * 6, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (o === O.KITCHEN) {
    ctx.fillStyle = '#5a3a1a';
    ctx.fillRect(sx, sy, TILE, TILE);
    ctx.fillStyle = '#8a6a3a';
    ctx.fillRect(sx + 2, sy + 8, TILE - 4, TILE - 12);
    ctx.fillStyle = '#ff6622';
    ctx.beginPath();
    ctx.arc(sx + 16, sy + 16, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawCrop(x, y, c) {
  const sx = Math.floor(x * TILE - camera.x);
  const sy = Math.floor(y * TILE - camera.y);
  const cd = CROPS[c.crop];
  if (!cd) return;
  const stage = c.dead ? 0 : Math.min(1, c.growth / cd.days);
  const stemH = 4 + stage * 18;
  if (c.dead) {
    ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sx + 16, sy + 28);
    ctx.lineTo(sx + 16, sy + 12);
    ctx.stroke();
    return;
  }
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(sx + 16, sy + 28, 6, 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#2a6a2a'; ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(sx + 16, sy + 28);
  ctx.lineTo(sx + 16, sy + 28 - stemH);
  ctx.stroke();
  if (stage < 1) {
    ctx.fillStyle = '#3a8a3a';
    ctx.beginPath();
    ctx.ellipse(sx + 10, sy + 22 - stemH / 2, 5, 3, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(sx + 22, sy + 22 - stemH / 2, 5, 3, 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
  if (c.growth >= cd.days) {
    ctx.fillStyle = cd.c;
    ctx.beginPath();
    ctx.arc(sx + 16, sy + 28 - stemH - 3, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.arc(sx + 13, sy + 28 - stemH - 5, 2.5, 0, Math.PI * 2);
    ctx.fill();
    const t = (performance.now() * 0.003) % 1;
    ctx.fillStyle = 'rgba(255,220,120,' + (0.3 - t * 0.3) + ')';
    ctx.beginPath();
    ctx.arc(sx + 16, sy + 28 - stemH - 3, 10 + t * 10, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlayer() {
  if (!player) return;
  const sx = Math.floor(player.x - camera.x);
  const sy = Math.floor(player.y - camera.y);
  const wf = player.moving ? Math.sin(player.animT) : 0;
  drawHumanoid(ctx, sx, sy, player.w, player.h, {
    facing: player.facing,
    walkFrame: wf,
    skinColor: '#f0c090',
    shirtColor: '#4a7ac0',
    pantsColor: '#3a3a5a',
    hairColor: '#5a2a10'
  });
  if (player.swingT > 0) {
    const item = inv[sel];
    if (item && item.id) {
      const prog = 1 - player.swingT / 0.25;
      const ttx = player.swingX * TILE - camera.x + TILE / 2;
      const tty = player.swingY * TILE - camera.y + TILE / 2;
      ctx.save();
      ctx.translate(ttx, tty);
      ctx.rotate(Math.sin(prog * Math.PI) * 0.9);
      const ic = document.createElement('canvas');
      ic.width = 32; ic.height = 32;
      drawItemIcon(ic.getContext('2d'), item.id, 32);
      ctx.drawImage(ic, -16, -16);
      ctx.restore();
    }
  }
}

function drawSunMoon() {
  if (world.isMine()) return;
  const dl = world.getDayLight();
  const t = world.minute / (24 * 60);
  const angle = (t - 0.25) * Math.PI * 2;
  const r = Math.min(VW, VH) * 0.4;
  const cx = VW / 2, cy = VH * 0.8;
  const sx = cx + Math.cos(angle) * r;
  const sy = cy + Math.sin(angle) * r;
  if (dl > 0.3) {
    ctx.fillStyle = 'rgba(255,220,100,' + (dl * 0.3) + ')';
    ctx.beginPath(); ctx.arc(sx, sy, 60, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,240,150,' + dl + ')';
    ctx.beginPath(); ctx.arc(sx, sy, 30, 0, Math.PI * 2); ctx.fill();
  }
  if (dl < 0.5) {
    const a = 1 - dl * 2;
    if (a > 0) {
      ctx.fillStyle = 'rgba(220,230,255,' + a + ')';
      ctx.beginPath(); ctx.arc(sx, sy, 25, 0, Math.PI * 2); ctx.fill();
      for (let i = 0; i < 40; i++) {
        const sxi = hash2(i, 1, 1) * VW;
        const syi = hash2(i, 2, 1) * VH * 0.6;
        const tw = 0.5 + Math.sin(performance.now() * 0.002 + i) * 0.5;
        ctx.fillStyle = 'rgba(255,255,255,' + (a * tw * 0.8) + ')';
        ctx.fillRect(sxi, syi, 2, 2);
      }
    }
  }
}

function drawDistantHills() {
  const season = SEASONS[world.season];
  const dl = world.getDayLight();
  const hillColors = [
    ['#5a8a4a', '#4a7a3a'],
    ['#7a9a4a', '#6a8a3a'],
    ['#8a7a4a', '#7a6a3a'],
    ['#8a9aa8', '#7a8a98']
  ][season.id];
  for (let layer = 0; layer < 2; layer++) {
    const baseY = VH * 0.55 + layer * 40;
    const color = layer === 0 ? hillColors[0] : hillColors[1];
    ctx.fillStyle = color;
    ctx.globalAlpha = (0.4 + layer * 0.3) * (0.3 + dl * 0.7);
    ctx.beginPath();
    ctx.moveTo(0, VH);
    const plx = -camera.x * (0.1 + layer * 0.15);
    for (let x = 0; x <= VW; x += 16) {
      const wx = x + plx;
      const y = baseY - Math.sin(wx * 0.008 + layer) * 30 - Math.sin(wx * 0.02) * 15;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(VW, VH);
    ctx.closePath(); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawWeather() {
  if (world.isMine()) return;
  for (const p of world.rain) {
    const sx = p.x - camera.x;
    const sy = p.y - camera.y;
    if (sx < -20 || sx > VW + 20 || sy < -20 || sy > VH + 20) continue;
    if (p.snow) {
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath();
      ctx.arc(sx, sy, 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = 'rgba(180,200,240,0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + p.vx * 0.5, sy + 8);
      ctx.stroke();
    }
  }
}

function drawAmbient() {
  if (world.isMine()) return;
  const dl = world.getDayLight();
  if (dl > 0.5) {
    for (const b of world.butterflies) {
      const sx = b.x - camera.x;
      const sy = b.y - camera.y;
      if (sx < -30 || sx > VW + 30 || sy < -30 || sy > VH + 30) continue;
      const ws = Math.abs(Math.sin(b.phase * 2)) * 0.8 + 0.4;
      ctx.fillStyle = b.hue;
      ctx.globalAlpha = Math.min(1, b.life);
      ctx.beginPath(); ctx.ellipse(sx - 4, sy, 4 * ws, 3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(sx + 4, sy, 4 * ws, 3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#333';
      ctx.fillRect(sx - 1, sy - 2, 2, 4);
      ctx.globalAlpha = 1;
    }
  }
  if (dl < 0.5) {
    const a = 1 - dl * 2;
    for (const f of world.fireflies) {
      const sx = f.x - camera.x;
      const sy = f.y - camera.y;
      if (sx < -20 || sx > VW + 20 || sy < -20 || sy > VH + 20) continue;
      const glow = f.bright * a;
      ctx.fillStyle = 'rgba(255,255,120,' + (glow * 0.6) + ')';
      ctx.beginPath(); ctx.arc(sx, sy, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,180,' + glow + ')';
      ctx.beginPath(); ctx.arc(sx, sy, 2, 0, Math.PI * 2); ctx.fill();
    }
  }
  for (const l of world.leaves) {
    const sx = l.x - camera.x;
    const sy = l.y - camera.y;
    if (sx < -20 || sx > VW + 20 || sy < -20 || sy > VH + 20) continue;
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(l.phase);
    ctx.fillStyle = l.hue;
    ctx.globalAlpha = Math.min(1, l.life);
    ctx.fillRect(-3, -2, 6, 4);
    ctx.restore();
    ctx.globalAlpha = 1;
  }
}

function drawToolTarget() {
  if (paused || shopOpen || !player) return;
  const tx = Math.floor((mouse.x + camera.x) / TILE);
  const ty = Math.floor((mouse.y + camera.y) / TILE);
  const ptx = Math.floor((player.x + player.w / 2) / TILE);
  const pty = Math.floor((player.y + player.h / 2) / TILE);
  if (Math.abs(tx - ptx) > 3 || Math.abs(ty - pty) > 3) return;
  const sx = tx * TILE - camera.x;
  const sy = ty * TILE - camera.y;
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.strokeRect(sx + 1, sy + 1, TILE - 2, TILE - 2);
  ctx.setLineDash([]);
}

// ==================== SAVE / LOAD ====================
function saveGame() {
  try {
    const data = {
      world: world.serialize(),
      player: player.serialize(),
      inv: inv,
      sel: sel,
      animals: animals.map((a) => a.serialize())
    };
    localStorage.setItem('yesil_vadi_save', JSON.stringify(data));
  } catch (e) { console.warn(e); }
}

function loadGame() {
  try {
    const raw = localStorage.getItem('yesil_vadi_save');
    if (!raw) return false;
    const d = JSON.parse(raw);
    world = World.deserialize(d.world);
    player = Player.deserialize(d.player);
    inv = [];
    for (let i = 0; i < 8; i++) inv[i] = (d.inv && d.inv[i]) ? d.inv[i] : { id: null, count: 0 };
    sel = d.sel || 0;
    animals = [];
    if (d.animals) for (const ad of d.animals) animals.push(Animal.deserialize(ad));
    spawnNPCs();
    return true;
  } catch (e) {
    console.error(e);
    return false;
  }
}

function spawnNPCs() {
  npcs = [];
  for (const id of Object.keys(NPCS)) npcs.push(new NPC(id));
}

// ==================== BAŞLAT ====================
function init() {
  const loaded = loadGame();
  if (!loaded) {
    world = new World();
    player = new Player(5 * TILE, 6 * TILE);
    inv = [];
    for (let i = 0; i < 8; i++) inv[i] = { id: null, count: 0 };
    inv[0] = { id: 'hoe', count: 1 };
    inv[1] = { id: 'can', count: 1 };
    inv[2] = { id: 'axe', count: 1 };
    inv[3] = { id: 'pick', count: 1 };
    inv[4] = { id: 'scythe', count: 1 };
    inv[5] = { id: 'seed_parsnip', count: 15 };
    inv[6] = { id: 'rod', count: 1 };
    inv[7] = { id: null, count: 0 };
    animals = [];
    spawnNPCs();
  }
  updateHotbar();
  updateHUD();
  gameReady = true;

  // Loading ekranını gizle
  const loadingEl = document.getElementById('loading');
  if (loadingEl) loadingEl.classList.add('hide');

  setTimeout(() => {
    showDialog('Robin', '👩‍🔧', 'Merhaba! Yeşil Vadi\'ye hoş geldin! Toprağını sür, ek ve para kazan. Sol tık ile aletini kullan, E ile etkileşime geç. İyi şanslar!');
  }, 600);
}

// ==================== ANA DÖNGÜ ====================
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.1, (now - lastTime) / 1000);
  lastTime = now;
  if (!gameReady) return;
  update(dt);
  render();
}

// ==================== CAYDIRICI KORUMA ====================
document.addEventListener('contextmenu', (e) => {
  if (e.target.tagName === 'CANVAS') e.preventDefault();
});

document.addEventListener('keydown', (e) => {
  if (
    e.key === 'F12' ||
    (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j')) ||
    (e.ctrlKey && (e.key === 'U' || e.key === 'u'))
  ) {
    e.preventDefault();
    console.clear();
    console.log('%c⛔ Bu kod telif hakkı ile korunmaktadır.', 'color:#ff4444;font-size:20px;font-weight:bold');
    console.log('%c© 2026 [SENİN ADIN] - Tüm Hakları Saklıdır', 'color:#ffd24a;font-size:14px');
    return false;
  }
});

console.log('%c⛔ YEŞİL VADİ', 'color:#ffd24a;font-size:30px;font-weight:bold;text-shadow:2px 2px 0 #000');
console.log('%cBu oyunun kodu telif hakkı ile korunmaktadır.', 'color:#fff;font-size:14px');
console.log('%c© 2026 [SENİN ADIN] — Tüm Hakları Saklıdır', 'color:#888;font-size:12px');
console.log('%cİzinsiz kopyalama yasal işlem gerektirir.', 'color:#ff4444;font-size:12px;font-weight:bold');

// ==================== ÇALIŞTIR ====================
setupInput();
init();
requestAnimationFrame(loop);
