'use strict';
(function(){

// ==================== SABİTLER ====================
const TILE = 32;
const MAP_W = 60, MAP_H = 60;

// Tile türleri
const T_GRASS = 0, T_DIRT = 1, T_TILLED = 2, T_WATERED = 3,
      T_WATER = 4, T_PATH = 5, T_STONE = 6;

// Nesne türleri
const O_NONE = 0, O_TREE = 1, O_ROCK = 2, O_WEED = 3,
      O_BED = 4, O_BIN = 5, O_HOUSE = 6, O_SHOP = 7;

// Alet ve eşya ID'leri
const TOOL_HOE = 0, TOOL_CAN = 1, TOOL_AXE = 2, TOOL_PICK = 3,
      TOOL_SCYTHE = 4,
      SEED_PARSNIP = 10, SEED_POTATO = 11, SEED_CAULIFLOWER = 12,
      SEED_STRAWBERRY = 13,
      ITEM_PARSNIP = 20, ITEM_POTATO = 21, ITEM_CAULIFLOWER = 22,
      ITEM_STRAWBERRY = 23, ITEM_WOOD = 24, ITEM_STONE = 25,
      ITEM_WEED = 26, ITEM_CAN = 27;

const ITEMS = {
  [TOOL_HOE]:       {n:'Çapa',       type:'tool',  icon:'hoe'},
  [TOOL_CAN]:       {n:'Sulama Kabı',type:'tool',  icon:'can'},
  [TOOL_AXE]:       {n:'Balta',      type:'tool',  icon:'axe'},
  [TOOL_PICK]:      {n:'Kazma',      type:'tool',  icon:'pick'},
  [TOOL_SCYTHE]:    {n:'Orak',       type:'tool',  icon:'scythe'},
  [SEED_PARSNIP]:   {n:'Parsnip Tohumu', type:'seed', crop:SEED_PARSNIP, days:4, buy:20,  sell:35,  c:'#f0e090'},
  [SEED_POTATO]:    {n:'Patates Tohumu', type:'seed', crop:SEED_POTATO, days:6, buy:50,  sell:80,  c:'#a08060'},
  [SEED_CAULIFLOWER]:{n:'Karnabahar Tohumu', type:'seed', crop:SEED_CAULIFLOWER, days:12, buy:80, sell:175, c:'#f5f5e0'},
  [SEED_STRAWBERRY]:{n:'Çilek Tohumu', type:'seed', crop:SEED_STRAWBERRY, days:8, buy:100, sell:120, c:'#e04060', regrow:4},
  [ITEM_PARSNIP]:   {n:'Parsnip',    type:'crop',  sell:35,  c:'#f0e090'},
  [ITEM_POTATO]:    {n:'Patates',    type:'crop',  sell:80,  c:'#c8a080'},
  [ITEM_CAULIFLOWER]:{n:'Karnabahar',type:'crop',  sell:175, c:'#f5f5e0'},
  [ITEM_STRAWBERRY]:{n:'Çilek',      type:'crop',  sell:120, c:'#e04060'},
  [ITEM_WOOD]:      {n:'Odun',       type:'mat',   sell:5,   c:'#6b3f1a'},
  [ITEM_STONE]:     {n:'Taş',        type:'mat',   sell:3,   c:'#888'},
  [ITEM_WEED]:      {n:'Ot',         type:'mat',   sell:1,   c:'#3a8a3a'}
};

// ==================== HARITA ====================
let map = [];
let objects = [];
let crops = []; // crops[y][x] = {seed, growth, watered, dead}
let soilWatered = []; // crops[y][x].watered ve T_WATERED tile birlikte çalışır

// ==================== OYUNCU ====================
const player = {
  x: 8 * TILE, y: 20 * TILE,
  w: 20, h: 24,
  vx: 0, vy: 0,
  facing: 'down',
  animT: 0,
  moving: false,
  energy: 100, maxEnergy: 100,
  money: 500,
  swingT: 0, swingX: 0, swingY: 0
};

// ==================== ENVANTER ====================
const INV = Array(6).fill(null).map(()=>({id:0,count:0}));
let sel = 0;

INV[0] = {id: TOOL_HOE, count:1};
INV[1] = {id: TOOL_CAN, count:1};
INV[2] = {id: TOOL_AXE, count:1};
INV[3] = {id: TOOL_PICK, count:1};
INV[4] = {id: SEED_PARSNIP, count:15};
INV[5] = {id: 0, count:0};

// ==================== ZAMAN ====================
let day = 1;
let gameMinutes = 6 * 60; // 06:00
const DAY_START = 6 * 60;
const DAY_END = 26 * 60; // 02:00 ertesi gün
let timeSpeed = 3; // 1 gerçek saniye = 3 oyun dakikası

// ==================== GÖRSEL ====================
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let VW = 0, VH = 0;
function resize(){
  VW = canvas.width = innerWidth;
  VH = canvas.height = innerHeight;
  ctx.imageSmoothingEnabled = false;
}
resize();
addEventListener('resize', resize);

// ==================== NOISE ====================
function hash2(x,y,s){
  let h = (x|0)*374761393 + (y|0)*668265263 + (s|0)*2246822519;
  h = Math.imul(h ^ (h>>>13), 1274126177);
  return ((h ^ (h>>>16))>>>0) / 4294967295;
}

// ==================== HARİTA OLUŞTUR ====================
function initMap(){
  map = []; objects = []; crops = [];
  for (let y=0; y<MAP_H; y++){
    map[y] = new Uint8Array(MAP_W);
    objects[y] = new Uint8Array(MAP_W);
    crops[y] = new Array(MAP_W).fill(null);
    for (let x=0; x<MAP_W; x++){
      map[y][x] = T_GRASS;
    }
  }
  // Kenar ağaçları
  for (let y=0; y<MAP_H; y++){
    for (let x=0; x<MAP_W; x++){
      if (x<2 || x>=MAP_W-2 || y<2 || y>=MAP_H-2){
        objects[y][x] = O_TREE;
      }
    }
  }
  // Gölet (sağ üst)
  for (let y=6; y<22; y++){
    for (let x=46; x<58; x++){
      const dx = (x-52)/5.5, dy = (y-14)/7;
      if (dx*dx + dy*dy < 1){
        map[y][x] = T_WATER;
      }
    }
  }
  // Yol (üstten aşağı, sol taraf)
  for (let y=10; y<50; y++) map[y][10] = T_PATH;
  for (let x=10; x<48; x++) map[48][x] = T_PATH;
  // Ev yeri (sol üst) — 6x5 ev
  const hx = 3, hy = 4;
  for (let y=hy; y<hy+5; y++){
    for (let x=hx; x<hx+6; x++){
      if (y===hy || y===hy+4 || x===hx || x===hx+5){
        objects[y][x] = O_HOUSE;
      } else {
        map[y][x] = T_PATH;
      }
    }
  }
  // Yatak evin içinde
  objects[hy+2][hx+2] = O_BED;
  // Gönderi kutusu evin dışında
  objects[hy+5][hx+5] = O_BIN;
  // Dükkan (alt sağ)
  const sx = 42, sy = 50;
  for (let y=sy; y<sy+4; y++){
    for (let x=sx; x<sx+6; x++){
      if (y===sy || y===sy+3 || x===sx || x===sx+5){
        objects[y][x] = O_SHOP;
      } else {
        map[y][x] = T_PATH;
      }
    }
  }
  // Rastgele ağaçlar
  for (let i=0; i<90; i++){
    const x = 3 + Math.floor(Math.random()*(MAP_W-6));
    const y = 3 + Math.floor(Math.random()*(MAP_H-6));
    if (objects[y][x]) continue;
    if (map[y][x] !== T_GRASS) continue;
    if (x>=8 && x<=40 && y>=14 && y<=42) continue; // tarım alanı
    objects[y][x] = O_TREE;
  }
  // Rastgele kayalar
  for (let i=0; i<50; i++){
    const x = 3 + Math.floor(Math.random()*(MAP_W-6));
    const y = 3 + Math.floor(Math.random()*(MAP_H-6));
    if (objects[y][x]) continue;
    if (map[y][x] !== T_GRASS) continue;
    if (x>=8 && x<=40 && y>=14 && y<=42) continue;
    objects[y][x] = O_ROCK;
  }
  // Otlar
  for (let i=0; i<60; i++){
    const x = 3 + Math.floor(Math.random()*(MAP_W-6));
    const y = 3 + Math.floor(Math.random()*(MAP_H-6));
    if (objects[y][x]) continue;
    if (map[y][x] !== T_GRASS) continue;
    objects[y][x] = O_WEED;
  }
}

// ==================== YARDIMCILAR ====================
function tileAt(px, py){
  const tx = Math.floor(px/TILE), ty = Math.floor(py/TILE);
  if (tx<0 || tx>=MAP_W || ty<0 || ty>=MAP_H) return {tx:0,ty:0,oob:true};
  return {tx, ty, tile:map[ty][tx], obj:objects[ty][tx], crop:crops[ty][tx]};
}
function isSolid(tx, ty){
  if (tx<0 || tx>=MAP_W || ty<0 || ty>=MAP_H) return true;
  const o = objects[ty][tx];
  if (o===O_TREE || o===O_ROCK || o===O_HOUSE || o===O_SHOP) return true;
  if (map[ty][tx]===T_WATER) return true;
  return false;
}

// ==================== ENVANTER ====================
function invAdd(id, n){
  if (!n) n = 1;
  const maxStack = 99;
  for (const s of INV){
    if (s.id===id && s.count<maxStack){
      const a = Math.min(maxStack - s.count, n);
      s.count += a; n -= a;
      if (n<=0){ updateHotbar(); return true; }
    }
  }
  for (const s of INV){
    if (s.count===0 || s.id===0){
      s.id = id;
      s.count = Math.min(maxStack, n);
      n -= s.count;
      if (n<=0){ updateHotbar(); return true; }
    }
  }
  updateHotbar();
  return false;
}
function invRemove(id, n){
  for (const s of INV){
    if (s.id===id && s.count>0){
      const t = Math.min(s.count, n);
      s.count -= t; n -= t;
      if (s.count<=0) s.id = 0;
      if (n<=0){ updateHotbar(); return true; }
    }
  }
  updateHotbar();
  return false;
}
function invCount(id){
  let n = 0;
  for (const s of INV) if (s.id===id) n += s.count;
  return n;
}

// ==================== HOTBAR UI ====================
function updateHotbar(){
  const hb = document.getElementById('hotbar');
  if (hb.children.length !== 6){
    hb.innerHTML = '';
    for (let i=0; i<6; i++){
      const s = document.createElement('div');
      s.className = 'slot';
      s.innerHTML = `<span class="key">${i+1}</span><span class="count"></span>`;
      s.addEventListener('click', ()=>{ sel = i; updateHotbar(); });
      hb.appendChild(s);
    }
  }
  for (let i=0; i<6; i++){
    const s = hb.children[i];
    s.classList.toggle('active', i===sel);
    const inv = INV[i];
    const cnt = s.querySelector('.count');
    const old = s.querySelector('canvas');
    if (old) old.remove();
    if (inv.id > 0 && inv.count > 0){
      const ic = document.createElement('canvas');
      ic.width = 64; ic.height = 64;
      drawItemIcon(ic.getContext('2d'), inv.id, 64);
      s.insertBefore(ic, cnt);
      cnt.textContent = inv.count > 1 ? inv.count : '';
    } else {
      cnt.textContent = '';
    }
  }
}

// ==================== İKON ÇİZİMİ ====================
function drawItemIcon(c, id, size){
  c.clearRect(0, 0, size, size);
  const s = size / 16;
  const info = ITEMS[id];
  if (!info) return;
  if (info.type === 'tool'){
    if (info.icon === 'hoe'){
      c.strokeStyle = '#6a4a2a'; c.lineWidth = 2*s;
      c.beginPath(); c.moveTo(5*s, 13*s); c.lineTo(11*s, 5*s); c.stroke();
      c.fillStyle = '#a8a8b8';
      c.fillRect(9*s, 3*s, 5*s, 3*s);
    } else if (info.icon === 'can'){
      c.fillStyle = '#6a8ac0';
      c.fillRect(3*s, 6*s, 8*s, 7*s);
      c.fillStyle = '#4a6a9a';
      c.beginPath(); c.moveTo(11*s, 6*s); c.lineTo(14*s, 3*s); c.lineTo(14*s, 5*s); c.lineTo(11*s, 8*s); c.closePath(); c.fill();
      c.fillStyle = '#8aaae0';
      c.fillRect(4*s, 7*s, 6*s, 2*s);
    } else if (info.icon === 'axe'){
      c.strokeStyle = '#6a4a2a'; c.lineWidth = 2*s;
      c.beginPath(); c.moveTo(5*s, 13*s); c.lineTo(11*s, 5*s); c.stroke();
      c.fillStyle = '#a8a8b8';
      c.beginPath(); c.moveTo(9*s, 2*s); c.lineTo(14*s, 5*s); c.lineTo(13*s, 8*s); c.lineTo(9*s, 6*s); c.closePath(); c.fill();
    } else if (info.icon === 'pick'){
      c.strokeStyle = '#6a4a2a'; c.lineWidth = 2*s;
      c.beginPath(); c.moveTo(5*s, 13*s); c.lineTo(11*s, 6*s); c.stroke();
      c.strokeStyle = '#a8a8b8'; c.lineWidth = 2*s;
      c.beginPath(); c.moveTo(8*s, 3*s); c.lineTo(14*s, 5*s); c.stroke();
    } else if (info.icon === 'scythe'){
      c.strokeStyle = '#6a4a2a'; c.lineWidth = 2*s;
      c.beginPath(); c.moveTo(4*s, 14*s); c.lineTo(9*s, 4*s); c.stroke();
      c.strokeStyle = '#c8c8d8'; c.lineWidth = 2*s;
      c.beginPath(); c.arc(9*s, 4*s, 4*s, Math.PI*0.9, Math.PI*1.9); c.stroke();
    }
  } else if (info.type === 'seed'){
    c.fillStyle = '#8a6a3a';
    c.beginPath(); c.arc(8*s, 9*s, 4*s, 0, Math.PI*2); c.fill();
    c.fillStyle = info.c || '#8a6a3a';
    c.beginPath(); c.arc(8*s, 8*s, 3*s, 0, Math.PI*2); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.4)';
    c.beginPath(); c.arc(6.5*s, 6.5*s, 1*s, 0, Math.PI*2); c.fill();
    c.fillStyle = '#3a6a1a';
    c.fillRect(7.5*s, 3*s, 1*s, 3*s);
  } else if (info.type === 'crop'){
    c.fillStyle = '#3a8a3a';
    c.fillRect(7*s, 8*s, 2*s, 6*s);
    c.fillStyle = info.c;
    c.beginPath(); c.arc(8*s, 7*s, 4*s, 0, Math.PI*2); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.4)';
    c.beginPath(); c.arc(6.5*s, 5.5*s, 1.5*s, 0, Math.PI*2); c.fill();
  } else if (info.type === 'mat'){
    c.fillStyle = info.c;
    c.beginPath(); c.arc(8*s, 8*s, 5*s, 0, Math.PI*2); c.fill();
    c.fillStyle = 'rgba(0,0,0,0.2)';
    c.beginPath(); c.arc(7*s, 9*s, 3*s, 0, Math.PI*2); c.fill();
  }
}

// ==================== UI GÜNCELLE ====================
function updateTopUI(){
  document.getElementById('moneyTxt').textContent = player.money + 'g';
  document.getElementById('energyFill').style.width = (player.energy / player.maxEnergy * 100) + '%';
  document.getElementById('energyTxt').textContent = Math.ceil(player.energy) + '/' + player.maxEnergy;
  const t = gameMinutes;
  const h = Math.floor(t / 60) % 24;
  const m = Math.floor(t % 60);
  document.getElementById('clockTxt').textContent = h + ':' + String(m).padStart(2, '0');
  document.getElementById('dayTxt').textContent = 'Gün ' + day;
}

let toastT;
function toast(msg){
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastT);
  toastT = setTimeout(()=>el.classList.remove('show'), 1800);
}

// ==================== SES ====================
let actx = null;
function beep(freq, dur, type, vol){
  type = type || 'square'; vol = vol || 0.03;
  try {
    if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.value = vol;
    o.connect(g); g.connect(actx.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + dur);
    o.stop(actx.currentTime + dur);
  } catch(e){}
}

// ==================== KAMERA ====================
const camera = { x: 0, y: 0 };
function updateCamera(){
  const tx = player.x - VW/2;
  const ty = player.y - VH/2;
  camera.x += (tx - camera.x) * 0.15;
  camera.y += (ty - camera.y) * 0.15;
  if (camera.x < 0) camera.x = 0;
  if (camera.y < 0) camera.y = 0;
  if (camera.x > MAP_W*TILE - VW) camera.x = MAP_W*TILE - VW;
  if (camera.y > MAP_H*TILE - VH) camera.y = MAP_H*TILE - VH;
}

// ==================== GİRDİ ====================
const keys = {};
const mouse = { x:0, y:0, wx:0, wy:0, tx:0, ty:0, clicked:false };

addEventListener('keydown', e=>{
  keys[e.key.toLowerCase()] = true;
  if (['arrowup','arrowdown','arrowleft','arrowright',' '].includes(e.key.toLowerCase())) e.preventDefault();
  if (e.key >= '1' && e.key <= '6'){ sel = parseInt(e.key)-1; updateHotbar(); }
  if (e.key.toLowerCase() === 'e') tryInteract();
});
addEventListener('keyup', e=>{ keys[e.key.toLowerCase()] = false; });
addEventListener('blur', ()=>{ for (const k in keys) keys[k]=false; });

canvas.addEventListener('mousemove', e=>{
  const r = canvas.getBoundingClientRect();
  mouse.x = e.clientX - r.left;
  mouse.y = e.clientY - r.top;
});
canvas.addEventListener('mousedown', e=>{
  if (e.button === 0){
    mouse.clicked = true;
    useTool();
  }
});
canvas.addEventListener('contextmenu', e=>e.preventDefault());

// Touch butonları
function bindTouch(id, on, off){
  const el = document.getElementById(id);
  if (!el) return;
  ['touchstart','mousedown'].forEach(ev=>el.addEventListener(ev, e=>{e.preventDefault(); on();}));
  if (off) ['touchend','touchcancel','mouseup','mouseleave'].forEach(ev=>el.addEventListener(ev, e=>{e.preventDefault(); off();}));
}
bindTouch('tbUp', ()=>keys['w']=true, ()=>keys['w']=false);
bindTouch('tbDown', ()=>keys['s']=true, ()=>keys['s']=false);
bindTouch('tbLeft', ()=>keys['a']=true, ()=>keys['a']=false);
bindTouch('tbRight', ()=>keys['d']=true, ()=>keys['d']=false);
bindTouch('tbAct', ()=>{ const cx = player.x + (player.facing==='right'?TILE:-TILE); const cy = player.y + (player.facing==='down'?TILE:-TILE); mouse.wx = Math.floor(cx/TILE); mouse.wy = Math.floor(cy/TILE); useTool(); });
bindTouch('tbE', ()=>{ tryInteract(); });

// ==================== HAREKET & ÇARPIŞMA ====================
function movePlayer(dt){
  const spd = 2.4;
  let dx = 0, dy = 0;
  if (keys['a'] || keys['arrowleft']) dx -= 1;
  if (keys['d'] || keys['arrowright']) dx += 1;
  if (keys['w'] || keys['arrowup']) dy -= 1;
  if (keys['s'] || keys['arrowdown']) dy += 1;
  player.moving = (dx!==0 || dy!==0);
  if (player.moving){
    if (dy < 0) player.facing = 'up';
    else if (dy > 0) player.facing = 'down';
    else if (dx < 0) player.facing = 'left';
    else if (dx > 0) player.facing = 'right';
    if (dx !== 0 && dy !== 0){ dx *= 0.707; dy *= 0.707; }
    player.animT += dt * 8;
  } else {
    player.animT = 0;
  }
  // Yatay
  let nx = player.x + dx * spd;
  if (!hitSolid(nx, player.y, player.w, player.h)) player.x = nx;
  // Dikey
  let ny = player.y + dy * spd;
  if (!hitSolid(player.x, ny, player.w, player.h)) player.y = ny;
}

function hitSolid(px, py, w, h){
  const corners = [
    [px, py], [px+w, py], [px, py+h], [px+w, py+h]
  ];
  for (const [cx, cy] of corners){
    const tx = Math.floor(cx/TILE), ty = Math.floor(cy/TILE);
    if (isSolid(tx, ty)) return true;
  }
  return false;
}

// ==================== ALET KULLAN ====================
function useTool(){
  const inv = INV[sel];
  if (!inv.id || inv.count<=0) return;

  // Mouse'dan tile konumu
  mouse.wx = Math.floor((mouse.x + camera.x)/TILE);
  mouse.wy = Math.floor((mouse.y + camera.y)/TILE);

  const ptx = Math.floor((player.x + player.w/2)/TILE);
  const pty = Math.floor((player.y + player.h/2)/TILE);

  const dx = mouse.wx - ptx, dy = mouse.wy - pty;
  if (Math.abs(dx) > 2 || Math.abs(dy) > 2) return;

  const info = ITEMS[inv.id];
  if (!info) return;

  // Alet
  if (info.type === 'tool'){
    player.swingT = 0.25;
    player.swingX = mouse.wx;
    player.swingY = mouse.wy;
    if (info.icon === 'hoe') return useHoe(mouse.wx, mouse.wy);
    if (info.icon === 'can') return useCan(mouse.wx, mouse.wy);
    if (info.icon === 'axe') return useAxe(mouse.wx, mouse.wy);
    if (info.icon === 'pick') return usePick(mouse.wx, mouse.wy);
    if (info.icon === 'scythe') return useScythe(mouse.wx, mouse.wy);
  }
  // Tohum
  if (info.type === 'seed'){
    if (player.energy < 1){ toast('⚡ Enerjin yok!'); return; }
    const t = map[mouse.wy]?.[mouse.wx];
    if (t !== T_TILLED && t !== T_WATERED){ toast('❌ Buraya ekemezsin (önce çapa ile sür)'); return; }
    if (crops[mouse.wy][mouse.wx]){ toast('❌ Burada zaten bitki var'); return; }
    crops[mouse.wy][mouse.wx] = { seed: inv.id, growth: 0, watered: false, dead: false };
    invRemove(inv.id, 1);
    player.energy -= 1;
    beep(500, 0.05, 'triangle', 0.03);
    player.swingT = 0.25;
    player.swingX = mouse.wx;
    player.swingY = mouse.wy;
  }
  // Mahsul kaldırma (elle)
  if (info.type === 'crop'){
    // Mahsulü yere koy (sağ tık gibi)
  }
}

function useHoe(tx, ty){
  if (player.energy < 2){ toast('⚡ Enerjin yok!'); return; }
  const t = map[ty]?.[tx];
  if (t !== T_GRASS && t !== T_DIRT) return;
  if (objects[ty][tx] !== O_NONE) return;
  if (crops[ty][tx]) return;
  map[ty][tx] = T_TILLED;
  player.energy -= 2;
  beep(200, 0.06, 'square', 0.04);
  addParticles(tx*TILE+TILE/2, ty*TILE+TILE/2, '#8B4513', 4);
}

function useCan(tx, ty){
  // Su kaynağına yakın mı?
  let nearWater = false;
  const ptx = Math.floor((player.x + player.w/2)/TILE);
  const pty = Math.floor((player.y + player.h/2)/TILE);
  for (let yy=-2; yy<=2; yy++){
    for (let xx=-2; xx<=2; xx++){
      const m = map[pty+yy]?.[ptx+xx];
      if (m === T_WATER) nearWater = true;
    }
  }
  const t = map[ty]?.[tx];
  if (t === T_TILLED && player.energy >= 1){
    map[ty][tx] = T_WATERED;
    if (crops[ty][tx]) crops[ty][tx].watered = true;
    player.energy -= 1;
    beep(400, 0.06, 'sine', 0.03);
    addParticles(tx*TILE+TILE/2, ty*TILE+TILE/2, '#5a9ac0', 5);
    return;
  }
  if (nearWater){
    beep(500, 0.1, 'sine', 0.04);
    toast('💧 Sulama kabı dolduruldu');
  }
}

function useAxe(tx, ty){
  if (player.energy < 4){ toast('⚡ Enerjin yok!'); return; }
  if (objects[ty]?.[tx] === O_TREE){
    objects[ty][tx] = O_NONE;
    invAdd(ITEM_WOOD, 2 + Math.floor(Math.random()*3));
    player.energy -= 4;
    beep(150, 0.15, 'sawtooth', 0.05);
    addParticles(tx*TILE+TILE/2, ty*TILE+TILE/2, '#6b3f1a', 8);
  } else if (objects[ty]?.[tx] === O_WEED){
    objects[ty][tx] = O_NONE;
    invAdd(ITEM_WEED, 1);
    player.energy -= 1;
    beep(300, 0.05, 'square', 0.03);
  }
}

function usePick(tx, ty){
  if (player.energy < 5){ toast('⚡ Enerjin yok!'); return; }
  if (objects[ty]?.[tx] === O_ROCK){
    objects[ty][tx] = O_NONE;
    invAdd(ITEM_STONE, 1 + Math.floor(Math.random()*2));
    player.energy -= 5;
    beep(120, 0.12, 'sawtooth', 0.05);
    addParticles(tx*TILE+TILE/2, ty*TILE+TILE/2, '#888', 8);
  }
}

function useScythe(tx, ty){
  if (objects[ty]?.[tx] === O_WEED){
    objects[ty][tx] = O_NONE;
    invAdd(ITEM_WEED, 1);
    beep(300, 0.05, 'square', 0.03);
  }
}

// ==================== ETKİLEŞİM (E) ====================
function tryInteract(){
  const ptx = Math.floor((player.x + player.w/2)/TILE);
  const pty = Math.floor((player.y + player.h/2)/TILE);
  for (let yy=-1; yy<=1; yy++){
    for (let xx=-1; xx<=1; xx++){
      const o = objects[pty+yy]?.[ptx+xx];
      if (o === O_BED){ showBedPanel(); return; }
      if (o === O_BIN){ useBin(); return; }
      if (o === O_SHOP){ openShop(); return; }
    }
  }
  // Mahsul toplama
  const c = crops[pty][ptx];
  if (c && c.growth >= ITEMS[c.seed].days){
    harvest(ptx, pty);
  }
}

function useBin(){
  let soldCount = 0, total = 0;
  for (let i=0; i<INV.length; i++){
    const s = INV[i];
    if (!s.id) continue;
    const info = ITEMS[s.id];
    if (info.type === 'crop' || info.type === 'mat'){
      total += info.sell * s.count;
      soldCount += s.count;
      s.id = 0; s.count = 0;
    }
  }
  if (soldCount === 0){ toast('📦 Satılacak mahsul yok'); return; }
  player.money += total;
  toast('📦 ' + soldCount + ' eşya satıldı: +' + total + 'g');
  beep(800, 0.15, 'triangle', 0.05);
  updateHotbar();
  updateTopUI();
}

// ==================== MAHSUL TOPLAMA ====================
function harvest(tx, ty){
  const c = crops[ty][tx];
  if (!c) return;
  const info = ITEMS[c.seed];
  const itemId = c.seed + 10; // seed → crop eşleşme
  const cropItemMap = {
    [SEED_PARSNIP]: ITEM_PARSNIP,
    [SEED_POTATO]: ITEM_POTATO,
    [SEED_CAULIFLOWER]: ITEM_CAULIFLOWER,
    [SEED_STRAWBERRY]: ITEM_STRAWBERRY
  };
  const item = cropItemMap[c.seed];
  invAdd(item, 1);
  beep(700, 0.1, 'triangle', 0.05);
  addParticles(tx*TILE+TILE/2, ty*TILE+TILE/2, info.c, 6);
  if (info.regrow){
    c.growth = info.days - info.regrow;
  } else {
    crops[ty][tx] = null;
    map[ty][tx] = T_TILLED;
  }
}

// ==================== UYKU ====================
function showBedPanel(){
  document.getElementById('bedPanel').classList.add('show');
  document.getElementById('bedDayInfo').textContent = 'Gün ' + day + ' sona erecek. Yarın ' + (day+1) + '. gün başlayacak.';
}
document.getElementById('sleepNo').addEventListener('click', ()=>{
  document.getElementById('bedPanel').classList.remove('show');
});
document.getElementById('sleepYes').addEventListener('click', ()=>{
  document.getElementById('bedPanel').classList.remove('show');
  sleep();
});

function sleep(){
  // Mahsulleri büyüt
  for (let y=0; y<MAP_H; y++){
    for (let x=0; x<MAP_W; x++){
      const c = crops[y][x];
      if (!c) continue;
      if (c.watered){
        c.growth++;
      }
      c.watered = false;
      // Su kaybı: tile tekrar tilled olur
      if (map[y][x] === T_WATERED) map[y][x] = T_TILLED;
    }
  }
  day++;
  gameMinutes = DAY_START;
  player.energy = player.maxEnergy;
  player.x = 4 * TILE + 8;
  player.y = 6 * TILE + 8;
  // Otomatik kaydet
  save();
  toast('🌅 Gün ' + day + ' başladı!');
  beep(600, 0.3, 'sine', 0.04);
}

// ==================== DÜKKAN ====================
let shopTab = 'buy';
function openShop(){
  document.getElementById('shopPanel').classList.add('show');
  renderShop();
}
function renderShop(){
  document.querySelectorAll('.tab').forEach(t=>{
    t.classList.toggle('active', t.dataset.tab === shopTab);
  });
  const c = document.getElementById('shopContent');
  c.innerHTML = '';
  if (shopTab === 'buy'){
    const stock = [SEED_PARSNIP, SEED_POTATO, SEED_CAULIFLOWER, SEED_STRAWBERRY];
    for (const id of stock){
      const info = ITEMS[id];
      const row = document.createElement('div');
      row.className = 'shopItem';
      const canAfford = player.money >= info.buy;
      if (!canAfford) row.classList.add('no');
      row.innerHTML = `
        <div class="ic"></div>
        <div class="info"><b>${info.n}</b><small>${info.days} günde büyür · Satış: ${info.sell}g</small></div>
        <div class="price">${info.buy}g</div>
      `;
      const canvas2 = document.createElement('canvas');
      canvas2.width = 40; canvas2.height = 40;
      drawItemIcon(canvas2.getContext('2d'), id, 40);
      row.querySelector('.ic').appendChild(canvas2);
      row.addEventListener('click', ()=>{
        if (player.money < info.buy){ toast('❌ Yetersiz para'); return; }
        player.money -= info.buy;
        invAdd(id, 1);
        beep(600, 0.08, 'sine', 0.04);
        updateTopUI();
        renderShop();
      });
      c.appendChild(row);
    }
  } else {
    // Sat
    for (let i=0; i<INV.length; i++){
      const s = INV[i];
      if (!s.id) continue;
      const info = ITEMS[s.id];
      if (info.type !== 'crop' && info.type !== 'mat') continue;
      const row = document.createElement('div');
      row.className = 'shopItem sell';
      row.innerHTML = `
        <div class="ic"></div>
        <div class="info"><b>${info.n} × ${s.count}</b><small>Satış fiyatı</small></div>
        <div class="price">+${info.sell * s.count}g</div>
      `;
      const canvas2 = document.createElement('canvas');
      canvas2.width = 40; canvas2.height = 40;
      drawItemIcon(canvas2.getContext('2d'), s.id, 40);
      row.querySelector('.ic').appendChild(canvas2);
      row.addEventListener('click', ()=>{
        player.money += info.sell * s.count;
        s.id = 0; s.count = 0;
        beep(800, 0.1, 'triangle', 0.05);
        updateHotbar(); updateTopUI(); renderShop();
      });
      c.appendChild(row);
    }
  }
}
document.getElementById('closeShop').addEventListener('click', ()=>{
  document.getElementById('shopPanel').classList.remove('show');
});
document.querySelectorAll('.tab').forEach(t=>{
  t.addEventListener('click', ()=>{ shopTab = t.dataset.tab; renderShop(); });
});

// ==================== PARÇACIKLAR ====================
const particles = [];
function addParticles(x, y, color, n){
  for (let i=0; i<n; i++){
    particles.push({
      x, y,
      vx: (Math.random()-0.5)*3,
      vy: -Math.random()*3,
      color,
      life: 0.6,
      maxLife: 0.6,
      size: 3
    });
  }
}
function updateParticles(dt){
  for (let i=particles.length-1; i>=0; i--){
    const p = particles[i];
    p.x += p.vx; p.y += p.vy;
    p.vy += 0.15;
    p.life -= dt;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

// ==================== GÜNCELLE ====================
function update(dt){
  movePlayer(dt);
  updateCamera();
  updateParticles(dt);

  // Zaman akışı
  if (!document.getElementById('bedPanel').classList.contains('show') &&
      !document.getElementById('shopPanel').classList.contains('show')){
    gameMinutes += dt * timeSpeed;
  }
  // Enerji bittiğinde
  if (player.energy < 0) player.energy = 0;
  // Otomatik uyku (02:00)
  if (gameMinutes >= DAY_END){
    sleep();
  }
  updateTopUI();
}

// ==================== RENDER ====================
function render(){
  ctx.fillStyle = '#87ceeb';
  ctx.fillRect(0, 0, VW, VH);

  const x0 = Math.max(0, Math.floor(camera.x/TILE) - 1);
  const x1 = Math.min(MAP_W-1, Math.ceil((camera.x + VW)/TILE) + 1);
  const y0 = Math.max(0, Math.floor(camera.y/TILE) - 1);
  const y1 = Math.min(MAP_H-1, Math.ceil((camera.y + VH)/TILE) + 1);

  // Tile'ları çiz
  for (let y=y0; y<=y1; y++){
    for (let x=x0; x<=x1; x++){
      const t = map[y][x];
      const sx = Math.floor(x*TILE - camera.x);
      const sy = Math.floor(y*TILE - camera.y);
      drawTile(ctx, sx, sy, t, x, y);
    }
  }
  // Mahsuller
  for (let y=y0; y<=y1; y++){
    for (let x=x0; x<=x1; x++){
      const c = crops[y][x];
      if (!c) continue;
      const sx = Math.floor(x*TILE - camera.x);
      const sy = Math.floor(y*TILE - camera.y);
      drawCrop(ctx, sx, sy, c);
    }
  }
  // Nesneler (ağaç, kaya vb)
  for (let y=y0; y<=y1; y++){
    for (let x=x0; x<=x1; x++){
      const o = objects[y][x];
      if (!o) continue;
      const sx = Math.floor(x*TILE - camera.x);
      const sy = Math.floor(y*TILE - camera.y);
      drawObject(ctx, sx, sy, o, x, y);
    }
  }
  // Parçacıklar
  for (const p of particles){
    ctx.globalAlpha = p.life / p.maxLife;
    ctx.fillStyle = p.color;
    ctx.fillRect(p.x - camera.x, p.y - camera.y, p.size, p.size);
  }
  ctx.globalAlpha = 1;
  // Oyuncu
  drawPlayer();
  // Alet hedef göstergesi
  drawToolTarget();
}

function drawTile(c, sx, sy, t, tx, ty){
  if (t === T_GRASS){
    c.fillStyle = '#6aaa3a';
    c.fillRect(sx, sy, TILE, TILE);
    c.fillStyle = '#5a9a2a';
    for (let i=0; i<4; i++){
      const px = sx + (hash2(tx, ty, i)*TILE)|0;
      const py = sy + (hash2(tx, ty, i+10)*TILE)|0;
      c.fillRect(px, py, 2, 2);
    }
  } else if (t === T_DIRT){
    c.fillStyle = '#8B6a3a';
    c.fillRect(sx, sy, TILE, TILE);
    c.fillStyle = '#6a4a1a';
    for (let i=0; i<3; i++){
      const px = sx + (hash2(tx, ty, i)*TILE)|0;
      const py = sy + (hash2(tx, ty, i+10)*TILE)|0;
      c.fillRect(px, py, 2, 2);
    }
  } else if (t === T_TILLED){
    c.fillStyle = '#5a3a1a';
    c.fillRect(sx, sy, TILE, TILE);
    c.fillStyle = '#4a2a10';
    for (let i=0; i<3; i++){
      c.fillRect(sx, sy + 6 + i*8, TILE, 1);
    }
  } else if (t === T_WATERED){
    c.fillStyle = '#3a2510';
    c.fillRect(sx, sy, TILE, TILE);
    c.fillStyle = '#2a1808';
    for (let i=0; i<3; i++){
      c.fillRect(sx, sy + 6 + i*8, TILE, 1);
    }
    c.fillStyle = 'rgba(90,154,192,0.25)';
    c.fillRect(sx, sy, TILE, TILE);
  } else if (t === T_WATER){
    c.fillStyle = '#3a6a9a';
    c.fillRect(sx, sy, TILE, TILE);
    const wave = Math.sin((tx + ty + performance.now()*0.002) * 0.5) * 2;
    c.fillStyle = 'rgba(140,190,230,0.6)';
    c.fillRect(sx + 3, sy + 8 + wave, TILE - 6, 2);
    c.fillRect(sx + 6, sy + 20 + wave, TILE - 12, 2);
  } else if (t === T_PATH){
    c.fillStyle = '#b09068';
    c.fillRect(sx, sy, TILE, TILE);
    c.fillStyle = '#9a7858';
    for (let i=0; i<3; i++){
      const px = sx + (hash2(tx, ty, i+20)*TILE)|0;
      const py = sy + (hash2(tx, ty, i+30)*TILE)|0;
      c.fillRect(px, py, 3, 3);
    }
  } else if (t === T_STONE){
    c.fillStyle = '#888';
    c.fillRect(sx, sy, TILE, TILE);
  }
}

function drawObject(c, sx, sy, o, tx, ty){
  if (o === O_TREE){
    // Gölge
    c.fillStyle = 'rgba(0,0,0,0.25)';
    c.beginPath(); c.ellipse(sx + TILE/2, sy + TILE - 2, 10, 4, 0, 0, Math.PI*2); c.fill();
    // Gövde
    c.fillStyle = '#5a3a1a';
    c.fillRect(sx + 12, sy + 16, 8, 16);
    // Yapraklar
    const r1 = 14, r2 = 12, r3 = 10;
    c.fillStyle = '#2a6a2a';
    c.beginPath(); c.arc(sx + 16, sy + 12, r1, 0, Math.PI*2); c.fill();
    c.fillStyle = '#3a8a3a';
    c.beginPath(); c.arc(sx + 12, sy + 10, r2, 0, Math.PI*2); c.fill();
    c.beginPath(); c.arc(sx + 20, sy + 14, r2, 0, Math.PI*2); c.fill();
    c.fillStyle = '#4a9a3a';
    c.beginPath(); c.arc(sx + 16, sy + 8, r3, 0, Math.PI*2); c.fill();
  } else if (o === O_ROCK){
    c.fillStyle = 'rgba(0,0,0,0.25)';
    c.beginPath(); c.ellipse(sx + TILE/2, sy + TILE - 3, 12, 4, 0, 0, Math.PI*2); c.fill();
    c.fillStyle = '#7a7a7a';
    c.beginPath();
    c.moveTo(sx + 4, sy + TILE - 4);
    c.lineTo(sx + 6, sy + 12);
    c.lineTo(sx + 14, sy + 6);
    c.lineTo(sx + 22, sy + 10);
    c.lineTo(sx + 28, sy + TILE - 4);
    c.closePath(); c.fill();
    c.fillStyle = '#9a9a9a';
    c.beginPath();
    c.moveTo(sx + 8, sy + 14);
    c.lineTo(sx + 14, sy + 9);
    c.lineTo(sx + 20, sy + 12);
    c.lineTo(sx + 12, sy + 16);
    c.closePath(); c.fill();
  } else if (o === O_WEED){
    c.fillStyle = '#3a7a2a';
    for (let i=0; i<5; i++){
      const a = (i/5) * Math.PI * 2;
      c.beginPath();
      c.moveTo(sx + TILE/2, sy + TILE - 6);
      c.lineTo(sx + TILE/2 + Math.cos(a)*7, sy + TILE - 14);
      c.lineWidth = 2;
      c.strokeStyle = '#3a7a2a';
      c.stroke();
    }
    c.fillStyle = '#ffd24a';
    c.beginPath(); c.arc(sx + TILE/2, sy + TILE - 8, 3, 0, Math.PI*2); c.fill();
  } else if (o === O_BED){
    // Yatak (kırmızı)
    c.fillStyle = '#5a3a1a';
    c.fillRect(sx + 2, sy + 4, 28, 24);
    c.fillStyle = '#e8e0d0';
    c.fillRect(sx + 4, sy + 6, 24, 8);
    c.fillStyle = '#c44a3a';
    c.fillRect(sx + 4, sy + 14, 24, 12);
    c.fillStyle = '#8a3020';
    c.fillRect(sx + 4, sy + 14, 24, 2);
  } else if (o === O_BIN){
    // Gönderi kutusu
    c.fillStyle = '#5a3a1a';
    c.fillRect(sx + 3, sy + 8, 26, 22);
    c.fillStyle = '#8a6a3a';
    c.fillRect(sx + 3, sy + 8, 26, 6);
    c.fillStyle = '#3a2510';
    c.fillRect(sx + 8, sy + 6, 16, 4);
    c.fillStyle = '#ffd24a';
    c.beginPath(); c.arc(sx + 16, sy + 18, 3, 0, Math.PI*2); c.fill();
  } else if (o === O_HOUSE){
    // Sadece ev kenarları (iç kısım yer olarak kullanılır)
    c.fillStyle = '#8a3a2a';
    c.fillRect(sx, sy, TILE, TILE);
    c.fillStyle = '#6a2a1a';
    c.fillRect(sx + 2, sy + 2, TILE - 4, TILE - 4);
    c.fillStyle = '#a04a3a';
    c.fillRect(sx + 4, sy + 4, TILE - 8, TILE - 8);
  } else if (o === O_SHOP){
    c.fillStyle = '#5a4a3a';
    c.fillRect(sx, sy, TILE, TILE);
    c.fillStyle = '#7a6a5a';
    c.fillRect(sx + 2, sy + 2, TILE - 4, TILE - 4);
    c.fillStyle = '#ffd24a';
    c.fillRect(sx + 6, sy + 6, TILE - 12, TILE - 12);
  }
}

function drawCrop(c, sx, sy, crop){
  const info = ITEMS[crop.seed];
  const stage = Math.min(1, crop.growth / info.days);
  const stageIdx = Math.min(info.days, crop.growth);
  // Sap
  const stemH = 4 + stage * 16;
  c.strokeStyle = '#2a6a2a';
  c.lineWidth = 2;
  c.beginPath();
  c.moveTo(sx + 16, sy + 28);
  c.lineTo(sx + 16, sy + 28 - stemH);
  c.stroke();
  // Yapraklar (erken aşama)
  if (stage < 1){
    c.fillStyle = '#3a8a3a';
    c.beginPath();
    c.ellipse(sx + 10, sy + 22 - stemH/2, 5, 3, -0.4, 0, Math.PI*2);
    c.fill();
    c.beginPath();
    c.ellipse(sx + 22, sy + 22 - stemH/2, 5, 3, 0.4, 0, Math.PI*2);
    c.fill();
  }
  // Olgun meyve
  if (crop.growth >= info.days){
    c.fillStyle = info.c;
    c.beginPath();
    c.arc(sx + 16, sy + 28 - stemH - 3, 7, 0, Math.PI*2);
    c.fill();
    c.fillStyle = 'rgba(255,255,255,0.35)';
    c.beginPath();
    c.arc(sx + 13, sy + 28 - stemH - 5, 2.5, 0, Math.PI*2);
    c.fill();
  } else if (stageIdx > 0){
    // Küçük meyve
    c.fillStyle = info.c;
    c.globalAlpha = 0.7;
    c.beginPath();
    c.arc(sx + 16, sy + 28 - stemH, 4 * stage, 0, Math.PI*2);
    c.fill();
    c.globalAlpha = 1;
  }
}

function drawPlayer(){
  const sx = Math.floor(player.x - camera.x);
  const sy = Math.floor(player.y - camera.y);

  // Gölge
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(sx + player.w/2, sy + player.h - 2, player.w/2, 3, 0, 0, Math.PI*2);
  ctx.fill();

  const bob = player.moving ? Math.sin(player.animT) * 1.5 : 0;

  // Bacaklar
  ctx.fillStyle = '#3a3a5a';
  ctx.fillRect(sx + 4, sy + 16 + bob, 5, 8);
  ctx.fillRect(sx + 11, sy + 16 - bob, 5, 8);

  // Gövde
  ctx.fillStyle = '#4a7ac0';
  ctx.fillRect(sx + 4, sy + 8 + bob, 12, 9);

  // Kollar
  ctx.fillStyle = '#4a7ac0';
  if (player.facing === 'left' || player.facing === 'right'){
    ctx.fillRect(sx + 2, sy + 10 + bob, 3, 7);
    ctx.fillRect(sx + 15, sy + 10 + bob, 3, 7);
  } else {
    ctx.fillRect(sx + 2, sy + 10 + bob, 3, 6);
    ctx.fillRect(sx + 15, sy + 10 + bob, 3, 6);
  }

  // Kafa (deri)
  ctx.fillStyle = '#f0c090';
  ctx.fillRect(sx + 5, sy + 1 + bob, 10, 9);

  // Saç
  ctx.fillStyle = '#5a2a10';
  if (player.facing === 'up'){
    ctx.fillRect(sx + 4, sy + bob, 12, 7);
  } else {
    ctx.fillRect(sx + 4, sy + bob, 12, 4);
    ctx.fillRect(sx + 3, sy + 2 + bob, 2, 5);
    ctx.fillRect(sx + 15, sy + 2 + bob, 2, 5);
  }

  // Yüz (yön)
  if (player.facing === 'down'){
    ctx.fillStyle = '#000';
    ctx.fillRect(sx + 7, sy + 5 + bob, 2, 2);
    ctx.fillRect(sx + 11, sy + 5 + bob, 2, 2);
    ctx.fillStyle = '#c08060';
    ctx.fillRect(sx + 9, sy + 8 + bob, 2, 1);
  } else if (player.facing === 'left'){
    ctx.fillStyle = '#000';
    ctx.fillRect(sx + 6, sy + 5 + bob, 2, 2);
  } else if (player.facing === 'right'){
    ctx.fillStyle = '#000';
    ctx.fillRect(sx + 12, sy + 5 + bob, 2, 2);
  }

  // Alet sallanırken
  if (player.swingT > 0){
    const info = ITEMS[INV[sel].id];
    if (info){
      const prog = 1 - player.swingT / 0.25;
      const ttx = player.swingX * TILE - camera.x + TILE/2;
      const tty = player.swingY * TILE - camera.y + TILE/2;
      ctx.save();
      ctx.translate(ttx, tty);
      ctx.rotate(Math.sin(prog * Math.PI) * 0.9);
      const ic = document.createElement('canvas');
      ic.width = 32; ic.height = 32;
      drawItemIcon(ic.getContext('2d'), INV[sel].id, 32);
      ctx.drawImage(ic, -16, -16);
      ctx.restore();
    }
  }
}

function drawToolTarget(){
  const tx = Math.floor((mouse.x + camera.x)/TILE);
  const ty = Math.floor((mouse.y + camera.y)/TILE);
  const ptx = Math.floor((player.x + player.w/2)/TILE);
  const pty = Math.floor((player.y + player.h/2)/TILE);
  if (Math.abs(tx - ptx) > 2 || Math.abs(ty - pty) > 2) return;
  if (tx < 0 || tx >= MAP_W || ty < 0 || ty >= MAP_H) return;
  const sx = tx * TILE - camera.x;
  const sy = ty * TILE - camera.y;
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 2;
  ctx.strokeRect(sx + 0.5, sy + 0.5, TILE - 1, TILE - 1);
}

// ==================== KAYDET / YÜKLE ====================
function save(){
  try {
    const data = {
      day, gameMinutes,
      player: { x: player.x, y: player.y, energy: player.energy, money: player.money },
      INV, map: map.map(r => Array.from(r)),
      objects: objects.map(r => Array.from(r)),
      crops: crops.map(r => r.map(c => c ? { seed: c.seed, growth: c.growth, watered: c.watered } : null))
    };
    localStorage.setItem('farm_save_v1', JSON.stringify(data));
  } catch(e){ console.warn(e); }
}
function load(){
  try {
    const raw = localStorage.getItem('farm_save_v1');
    if (!raw) return false;
    const d = JSON.parse(raw);
    day = d.day;
    gameMinutes = d.gameMinutes;
    player.x = d.player.x;
    player.y = d.player.y;
    player.energy = d.player.energy;
    player.money = d.player.money;
    for (let i=0; i<6; i++) INV[i] = d.INV[i];
    map = d.map.map(r => new Uint8Array(r));
    objects = d.objects.map(r => new Uint8Array(r));
    crops = d.crops.map(r => r.map(c => c ? { seed: c.seed, growth: c.growth, watered: c.watered } : null));
    return true;
  } catch(e){ return false; }
}

// ==================== BAŞLAT ====================
function init(){
  if (!load()){
    initMap();
    player.x = 5 * TILE;
    player.y = 6 * TILE;
  }
  updateHotbar();
  updateTopUI();
  toast('🌅 Hoş geldin! Toprağını sür, ek ve para kazan!');
}

let lastT = performance.now();
function loop(now){
  let dt = (now - lastT) / 1000;
  lastT = now;
  if (dt > 0.1) dt = 0.1;
  if (player.swingT > 0) player.swingT -= dt;
  update(dt);
  render();
  requestAnimationFrame(loop);
}

init();
requestAnimationFrame(loop);

})();
