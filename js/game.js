import { TILE, MAP_W, MAP_H, T, O, ITEMS, CROPS, SHOP_STOCK, NPCS, WEATHER, SEASONS, itemInfo, isTool, isSeed, isCrop, isForage, isFish, isSellable, getSellPrice } from './data.js';
import { World, hash2 } from './world.js';
import { Player, NPC, ParticleSystem, FloatingText, drawPlayerSprite, drawHumanoid } from './entities.js';

// ==================== GLOBAL ====================
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
let VW = 0, VH = 0;
let world, player;
let npcs = [];
let particles = new ParticleSystem();
let floaters = [];
const camera = { x:0, y:0 };
let inv = Array(8).fill(null).map(()=>({id:null, count:0}));
let sel = 0;
let paused = false;
let shopOpen = false;
let shopTab = 'buy';
let currentShopNPC = null;
let input = { up:false, down:false, left:false, right:false };
let timeSpeed = 4;
let lastT = performance.now();
let firstRun = true;

// ==================== RESIZE ====================
function resize(){
  VW = canvas.width = innerWidth;
  VH = canvas.height = innerHeight;
  ctx.imageSmoothingEnabled = false;
}
resize();
addEventListener('resize', resize);

// ==================== BAŞLAT ====================
function init(){
  const loaded = loadGame();
  if(!loaded){
    world = new World();
    player = new Player(4 * TILE + 6, 6 * TILE + 6);
    // Başlangıç eşyaları
    inv[0] = {id:'hoe', count:1};
    inv[1] = {id:'can', count:1};
    inv[2] = {id:'axe', count:1};
    inv[3] = {id:'pick', count:1};
    inv[4] = {id:'scythe', count:1};
    inv[5] = {id:'seed_parsnip', count:15};
    inv[6] = {id:'rod', count:1};
    inv[7] = {id:null, count:0};
    spawnNPCs();
  }
  updateHotbar();
  updateHUD();
  setupInput();
  if(firstRun){
    firstRun = false;
    setTimeout(()=>{
      document.getElementById('loading').classList.add('hide');
      showDialog('Robin', '👩‍🔧', 'Merhaba! Yeni çiftçiye hoş geldin! Toprağını sür, ek ve para kazan. Yardıma ihtiyacın olursa beni bul!');
    }, 800);
  } else {
    document.getElementById('loading').classList.add('hide');
  }
}

function spawnNPCs(){
  npcs = [
    new NPC('pierre', 47 * TILE, 52 * TILE),
    new NPC('robin', 22 * TILE, 52 * TILE),
    new NPC('marnie', 12 * TILE, 30 * TILE),
    new NPC('willy', 60 * TILE, 36 * TILE),
    new NPC('lewis', 24 * TILE, 54 * TILE)
  ];
}

// ==================== GİRDİ ====================
const keys = {};
const mouse = { x:0, y:0, wx:0, wy:0, tx:0, ty:0, down:false };

function setupInput(){
  addEventListener('keydown', e=>{
    const k = e.key.toLowerCase();
    if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k)) e.preventDefault();
    if(k === 'escape'){
      togglePause();
      return;
    }
    if(paused) return;
    if(k === 'w' || k === 'arrowup') input.up = true;
    if(k === 's' || k === 'arrowdown') input.down = true;
    if(k === 'a' || k === 'arrowleft') input.left = true;
    if(k === 'd' || k === 'arrowright') input.right = true;
    if(k === 'e') tryInteract();
    if(e.key >= '1' && e.key <= '8'){ sel = parseInt(e.key)-1; updateHotbar(); }
  });
  addEventListener('keyup', e=>{
    const k = e.key.toLowerCase();
    if(k === 'w' || k === 'arrowup') input.up = false;
    if(k === 's' || k === 'arrowdown') input.down = false;
    if(k === 'a' || k === 'arrowleft') input.left = false;
    if(k === 'd' || k === 'arrowright') input.right = false;
  });
  addEventListener('blur', ()=>{
    input.up = input.down = input.left = input.right = false;
  });

  canvas.addEventListener('mousemove', e=>{
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
  });
  canvas.addEventListener('mousedown', e=>{
    if(e.button !== 0) return;
    if(paused || shopOpen) return;
    mouse.down = true;
    useTool();
  });
  canvas.addEventListener('mouseup', ()=>{ mouse.down = false; });
  canvas.addEventListener('contextmenu', e=>e.preventDefault());

  // Touch
  const bindTouch = (id, on, off)=>{
    const el = document.getElementById(id);
    if(!el) return;
    ['touchstart','mousedown'].forEach(ev=>el.addEventListener(ev, e=>{e.preventDefault(); on();}));
    if(off)['touchend','touchcancel','mouseup','mouseleave'].forEach(ev=>el.addEventListener(ev, e=>{e.preventDefault(); off();}));
  };
  bindTouch('tbUp', ()=>input.up = true, ()=>input.up = false);
  bindTouch('tbDown', ()=>input.down = true, ()=>input.down = false);
  bindTouch('tbLeft', ()=>input.left = true, ()=>input.left = false);
  bindTouch('tbRight', ()=>input.right = true, ()=>input.right = false);
  bindTouch('tbE', ()=>tryInteract());
  bindTouch('tbAct', ()=>{
    // Fare konumunu player'ın önüne ayarla
    const cx = player.x + player.w/2 + (player.facing==='right'?TILE:-TILE);
    const cy = player.y + player.h/2 + (player.facing==='down'?TILE:-TILE);
    mouse.x = cx - camera.x;
    mouse.y = cy - camera.y;
    useTool();
  });
// _YV_SIGNATURE_ = "9f4a7e2b8c1d5f0a" + "3e6b9a2c" + "YeşilVadi2026" + "thumpnailmail-art";
  // UI
  document.getElementById('closeShop').addEventListener('click', ()=>{
    shopOpen = false;
    document.getElementById('shopPanel').classList.remove('show');
  });
  document.querySelectorAll('.tab').forEach(t=>{
    t.addEventListener('click', ()=>{
      shopTab = t.dataset.tab;
      document.querySelectorAll('.tab').forEach(x=>x.classList.toggle('active', x.dataset.tab === shopTab));
      renderShop();
    });
  });
  document.getElementById('resumeBtn').addEventListener('click', ()=>togglePause());
  document.getElementById('saveBtn').addEventListener('click', ()=>{ saveGame(); toast('💾 Kaydedildi!'); });
  document.getElementById('newBtn').addEventListener('click', ()=>{
    if(!confirm('Yeni oyun başlatılsın mı? Mevcut kayıt silinecek.')) return;
    localStorage.removeItem('yesil_vadi_save');
    location.reload();
  });
}

function togglePause(){
  if(shopOpen) return;
  paused = !paused;
  document.getElementById('pausePanel').classList.toggle('show', paused);
}

// ==================== ARAÇ KULLAN ====================
function useTool(){
  const item = inv[sel];
  if(!item || !item.id) return;
  const info = ITEMS[item.id];
  if(!info) return;

  // Hedef tile
  mouse.wx = Math.floor((mouse.x + camera.x) / TILE);
  mouse.wy = Math.floor((mouse.y + camera.y) / TILE);
  const ptx = Math.floor((player.x + player.w/2) / TILE);
  const pty = Math.floor((player.y + player.h/2) / TILE);

  // Menzil kontrolü
  const dx = mouse.wx - ptx, dy = mouse.wy - pty;
  if(Math.abs(dx) > 3 || Math.abs(dy) > 3) return;

  if(info.type === 'tool'){
    player.swingT = 0.25;
    player.swingX = mouse.wx;
    player.swingY = mouse.wy;
    if(info.tool === 'hoe') return useHoe(mouse.wx, mouse.wy);
    if(info.tool === 'can') return useCan(mouse.wx, mouse.wy);
    if(info.tool === 'axe') return useAxe(mouse.wx, mouse.wy);
    if(info.tool === 'pick') return usePick(mouse.wx, mouse.wy);
    if(info.tool === 'scythe') return useScythe(mouse.wx, mouse.wy);
    if(info.tool === 'rod') return useRod(mouse.wx, mouse.wy);
  } else if(info.type === 'seed'){
    return plantSeed(mouse.wx, mouse.wy, item);
  } else if(info.type === 'crop' || info.type === 'forage' || info.type === 'fish'){
    // Yemek? Yok. Kullanma.
  } else if(info.type === 'use'){
    // Enerji içeceği vs. (burada yok)
  }
}

function useHoe(tx, ty){
  const t = world.getTile(tx, ty);
  if(t !== T.GRASS && t !== T.DIRT) return;
  if(world.getObj(tx, ty) !== O.NONE) return;
  if(world.getCrop(tx, ty)) return;
  if(!player.useEnergy(2)){ toast('⚡ Çok yorgunsun!'); return; }
  world.setTile(tx, ty, T.TILLED);
  particles.emit(tx*TILE+TILE/2, ty*TILE+TILE/2, {
    count:6, color:'#8B4513', speed:1.5, gravity:0.3, life:0.5, size:3
  });
  beep(180, 0.05, 'square', 0.04);
}

function useCan(tx, ty){
  // Su doldurma
  const ptx = Math.floor((player.x + player.w/2) / TILE);
  const pty = Math.floor((player.y + player.h/2) / TILE);
  let nearWater = false;
  for(let yy=-2; yy<=2; yy++){
    for(let xx=-2; xx<=2; xx++){
      const m = world.getTile(ptx+xx, pty+yy);
      if(m === T.WATER || m === T.DEEP_WATER) nearWater = true;
    }
  }
  const t = world.getTile(tx, ty);
  if(t === T.TILLED){
    if(!player.useEnergy(1)){ toast('⚡ Çok yorgunsun!'); return; }
    world.setTile(tx, ty, T.WATERED);
    const c = world.getCrop(tx, ty);
    if(c) c.watered = true;
    particles.emit(tx*TILE+TILE/2, ty*TILE+TILE/2, {
      count:8, color:'#5a9ac0', speed:1.8, gravity:0.5, life:0.6, size:3
    });
    beep(400, 0.06, 'sine', 0.03);
    return;
  }
  if(nearWater && player.energy >= 1){
    // Su doldurma sesi
    beep(500, 0.1, 'sine', 0.03);
    toast('💧 Sulama kabı dolduruldu');
  }
}

function useAxe(tx, ty){
  const o = world.getObj(tx, ty);
  if(o === O.TREE || o === O.PINE_TREE){
    if(!player.useEnergy(4)){ toast('⚡ Çok yorgunsun!'); return; }
    world.setObj(tx, ty, O.NONE);
    invAdd('wood', 2 + Math.floor(Math.random()*3));
    particles.emit(tx*TILE+TILE/2, ty*TILE+TILE/2, {
      count:12, color:'#6b3f1a', speed:2.5, gravity:0.4, life:0.7, size:4
    });
    // Düşen yapraklar
    for(let i=0; i<5; i++){
      particles.emit(tx*TILE+TILE/2, ty*TILE+8, {
        count:1, color:'#3a7a3a', speed:1.5, gravity:0.2, life:1.2, size:3
      });
    }
    beep(120, 0.15, 'sawtooth', 0.05);
    floaters.push(new FloatingText(tx*TILE+TILE/2, ty*TILE, '+Odun', '#a07040'));
  } else if(o === O.WEED || o === O.BUSH){
    if(!player.useEnergy(1)) return;
    world.setObj(tx, ty, O.NONE);
    invAdd('fiber', 1);
    particles.emit(tx*TILE+TILE/2, ty*TILE+TILE/2, {
      count:4, color:'#7ac04a', speed:1.2, gravity:0.2, life:0.4, size:2
    });
    beep(300, 0.05, 'square', 0.03);
  }
}

function usePick(tx, ty){
  const o = world.getObj(tx, ty);
  if(o === O.ROCK){
    if(!player.useEnergy(5)){ toast('⚡ Çok yorgunsun!'); return; }
    world.setObj(tx, ty, O.NONE);
    invAdd('stone', 1 + Math.floor(Math.random()*2));
    if(Math.random() < 0.15) invAdd('copper_ore', 1);
    particles.emit(tx*TILE+TILE/2, ty*TILE+TILE/2, {
      count:12, color:'#888', speed:2.5, gravity:0.5, life:0.7, size:4
    });
    beep(90, 0.14, 'sawtooth', 0.05);
    floaters.push(new FloatingText(tx*TILE+TILE/2, ty*TILE, '+Taş', '#cccccc'));
  } else if(o === O.ORE_NODE){
    if(!player.useEnergy(6)) return;
    world.setObj(tx, ty, O.NONE);
    const r = Math.random();
    if(r < 0.5) invAdd('copper_ore', 2);
    else if(r < 0.85) invAdd('iron_ore', 1);
    else invAdd('gold_ore', 1);
    particles.emit(tx*TILE+TILE/2, ty*TILE+TILE/2, {
      count:15, color:'#ffd860', speed:3, gravity:0.5, life:0.8, size:4
    });
    beep(150, 0.2, 'triangle', 0.06);
    floaters.push(new FloatingText(tx*TILE+TILE/2, ty*TILE, '+Cevher', '#ffd860'));
  }
}
// _YV_SIGNATURE_ = "9f4a7e2b8c1d5f0a" + "3e6b9a2c" + "YeşilVadi2026" + "thumpnailmail-art";
function useScythe(tx, ty){
  const o = world.getObj(tx, ty);
  if(o === O.WEED || o === O.FLOWER){
    world.setObj(tx, ty, O.NONE);
    invAdd('fiber', 1);
    particles.emit(tx*TILE+TILE/2, ty*TILE+TILE/2, {
      count:6, color:'#7ac04a', speed:1.8, gravity:0.3, life:0.5, size:2
    });
    beep(350, 0.05, 'square', 0.03);
  }
}

function useRod(tx, ty){
  const t = world.getTile(tx, ty);
  if(t !== T.WATER && t !== T.DEEP_WATER){ toast('🎣 Suya doğru at!'); return; }
  if(!player.useEnergy(4)){ toast('⚡ Çok yorgunsun!'); return; }
  player.swingT = 0.3;
  player.swingX = tx;
  player.swingY = ty;
  beep(400, 0.15, 'sine', 0.03);
  // Basit balık tutma - direkt yakalama
  setTimeout(()=>{
    const fishList = ['carp','sunfish','catfish','bass','trout','salmon'];
    const fish = fishList[Math.floor(Math.random()*fishList.length)];
    invAdd(fish, 1);
    floaters.push(new FloatingText(tx*TILE+TILE/2, ty*TILE, '+' + ITEMS[fish].name, '#a0c0ff'));
    particles.emit(tx*TILE+TILE/2, ty*TILE+TILE/2, {
      count:10, color:'#a0c0ff', speed:2, gravity:0.3, life:0.8, size:3
    });
    beep(800, 0.15, 'sine', 0.05);
    toast('🎣 ' + ITEMS[fish].name + ' yakaladın!');
  }, 600);
}

function plantSeed(tx, ty, item){
  const info = ITEMS[item.id];
  const t = world.getTile(tx, ty);
  if(t !== T.TILLED && t !== T.WATERED){ toast('❌ Önce çapa ile toprağı sür'); return; }
  if(world.getCrop(tx, ty)){ toast('❌ Burada zaten ekin var'); return; }
  if(world.getObj(tx, ty) !== O.NONE) return;
  if(!player.useEnergy(1)){ toast('⚡ Çok yorgunsun!'); return; }

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
  particles.emit(tx*TILE+TILE/2, ty*TILE+TILE/2, {
    count:4, color:'#7ac04a', speed:1.5, gravity:0.3, life:0.5, size:2
  });
  beep(500, 0.05, 'triangle', 0.03);
}

// ==================== ETKİLEŞİM (E) ====================
function tryInteract(){
  const ptx = Math.floor((player.x + player.w/2) / TILE);
  const pty = Math.floor((player.y + player.h/2) / TILE);

  // NPC yakınında mı?
  for(const npc of npcs){
    const nd = Math.hypot((npc.x + npc.w/2) - (player.x + player.w/2), (npc.y + npc.h/2) - (player.y + player.h/2));
    if(nd < 50){
      const line = npc.getDialog(world);
      showDialog(npc.name, npc.def.portrait, line);
      // Pierre ise mağaza aç
      if(npc.id === 'pierre'){
        setTimeout(()=>openShop(npc), 600);
      }
      return;
    }
  }

  // Objeler
  for(let yy=-1; yy<=1; yy++){
    for(let xx=-1; xx<=1; xx++){
      const o = world.getObj(ptx+xx, pty+yy);
      if(o === O.BED){ sleepPrompt(); return; }
      if(o === O.SHIPPING_BIN){ useBin(); return; }
      if(o === O.MINE_ENTRANCE){ toast('⛏️ Maden (yakında)'); return; }
    }
  }

  // Mahsul toplama
  const c = world.getCrop(ptx, pty);
  if(c){
    const cd = CROPS[c.crop];
    if(cd && c.growth >= cd.days){
      harvest(ptx, pty);
    } else if(c.dead){
      world.setCrop(ptx, pty, null);
      world.setTile(ptx, pty, T.TILLED);
      toast('🥀 Ölü ekin temizlendi');
    } else {
      toast('🌱 Henüz büyümemiş (' + c.growth + '/' + cd.days + ')');
    }
  }
}

function harvest(tx, ty){
  const c = world.getCrop(tx, ty);
  if(!c) return;
  const cd = CROPS[c.crop];
  if(!cd) return;

  const itemId = c.crop;
  let amount = 1;
  // Kalite şansı
  if(Math.random() < 0.15) amount++;

  invAdd(itemId, amount);
  floaters.push(new FloatingText(tx*TILE+TILE/2, ty*TILE, '+' + ITEMS[itemId].name, '#ffd24a'));
  particles.emit(tx*TILE+TILE/2, ty*TILE+TILE/2, {
    count:8, color: ITEMS[itemId].c || '#ffd24a', speed:2, gravity:0.3, life:0.6, size:3
  });
  beep(700, 0.1, 'triangle', 0.05);

  // Regrow kontrolü
  if(cd.regrow > 0 && c.harvests < 3){
    c.growth = cd.days - cd.regrow;
    c.harvests++;
    c.watered = false;
  } else {
    world.setCrop(tx, ty, null);
    world.setTile(tx, ty, T.TILLED);
  }
}

function useBin(){
  let total = 0, count = 0;
  for(let i=0; i<inv.length; i++){
    const s = inv[i];
    if(!s.id) continue;
    if(isSellable(s.id)){
      total += getSellPrice(s.id) * s.count;
      count += s.count;
      s.id = null; s.count = 0;
    }
  }
  if(count === 0){ toast('📦 Satılacak eşya yok'); return; }
  player.money += total;
  updateHUD(); updateHotbar();
  toast('📦 ' + count + ' eşya satıldı: +' + total + 'g');
  beep(800, 0.15, 'triangle', 0.05);
}

// ==================== UYKU ====================
function sleepPrompt(){
  if(confirm('🛏️ Uyumak ister misin? Yarın yeni bir gün başlayacak.')){
    sleep();
  }
}

function sleep(){
  world.nextDay();
  player.x = 5 * TILE + 6;
  player.y = 6 * TILE + 6;
  player.rest();
  updateHUD();
  saveGame();
  toast('🌅 Gün ' + world.day + ' başladı!');
  beep(600, 0.3, 'sine', 0.04);
}

// ==================== MAĞAZA ====================
function openShop(npc){
  currentShopNPC = npc;
  shopOpen = true;
  document.getElementById('shopPanel').classList.add('show');
  document.getElementById('shopTitle').textContent = '🏪 ' + npc.name + ' - Dükkan';
  renderShop();
}

function renderShop(){
  const c = document.getElementById('shopContent');
  c.innerHTML = '';
  const seasonNames = ['spring','summer','fall','winter'];
  const seasonKey = seasonNames[world.season];

  if(shopTab === 'buy'){
    const stockIds = SHOP_STOCK.pierre[seasonKey] || [];
    if(stockIds.length === 0){
      c.innerHTML = '<div style="text-align:center;padding:20px;color:#a08a60;font-size:12px">Bu mevsimde tohum yok. Kışın dinlen!</div>';
      return;
    }
    for(const id of stockIds){
      const info = ITEMS[id];
      if(!info) continue;
      const canAfford = player.money >= info.buy;
      const row = document.createElement('div');
      row.className = 'shopItem' + (canAfford ? '' : ' no');
      row.innerHTML = `
        <div class="ic"></div>
        <div class="info"><b>${info.name}</b><small>${CROPS[info.crop]?.days || '?'} günde büyür · Satış: ${getSellPrice(info.crop)}g</small></div>
        <div class="price">${info.buy}g</div>
      `;
      const ic = document.createElement('canvas');
      ic.width = 44; ic.height = 44;
      drawItemIcon(ic.getContext('2d'), id, 44);
      row.querySelector('.ic').appendChild(ic);
      row.addEventListener('click', ()=>{
        if(player.money < info.buy){ toast('❌ Yetersiz para'); return; }
        player.money -= info.buy;
        invAdd(id, 1);
        beep(600, 0.08, 'sine', 0.04);
        updateHUD(); updateHotbar(); renderShop();
      });
      c.appendChild(row);
    }
  } else {
    // Sat
    let any = false;
    for(let i=0; i<inv.length; i++){
      const s = inv[i];
      if(!s.id) continue;
      if(!isSellable(s.id)) continue;
      any = true;
      const info = ITEMS[s.id];
      const row = document.createElement('div');
      row.className = 'shopItem sell';
      row.innerHTML = `
        <div class="ic"></div>
        <div class="info"><b>${info.name} × ${s.count}</b><small>${info.type}</small></div>
        <div class="price">+${info.sell * s.count}g</div>
      `;
      const ic = document.createElement('canvas');
      ic.width = 44; ic.height = 44;
      drawItemIcon(ic.getContext('2d'), s.id, 44);
      row.querySelector('.ic').appendChild(ic);
      row.addEventListener('click', ()=>{
        player.money += info.sell * s.count;
        s.id = null; s.count = 0;
        beep(800, 0.1, 'triangle', 0.05);
        updateHUD(); updateHotbar(); renderShop();
      });
      c.appendChild(row);
    }
    if(!any){
      c.innerHTML = '<div style="text-align:center;padding:20px;color:#a08a60;font-size:12px">Satılacak eşya yok</div>';
    }
  }
  document.getElementById('shopMoney').textContent = player.money + 'g';
}
// _YV_SIGNATURE_ = "9f4a7e2b8c1d5f0a" + "3e6b9a2c" + "YeşilVadi2026" + "thumpnailmail-art";
// ==================== İKON ÇİZİM ====================
function drawItemIcon(c, id, size){
  c.clearRect(0, 0, size, size);
  const s = size / 16;
  const info = ITEMS[id];
  if(!info) return;

  if(info.type === 'tool'){
    if(id === 'hoe'){
      c.strokeStyle = '#6a4a2a'; c.lineWidth = 2*s;
      c.beginPath(); c.moveTo(5*s, 13*s); c.lineTo(11*s, 5*s); c.stroke();
      c.fillStyle = '#a8a8b8';
      c.fillRect(9*s, 3*s, 5*s, 3*s);
    } else if(id === 'can'){
      c.fillStyle = '#6a8ac0';
      c.fillRect(3*s, 6*s, 8*s, 7*s);
      c.fillStyle = '#4a6a9a';
      c.beginPath();
      c.moveTo(11*s, 6*s); c.lineTo(14*s, 3*s); c.lineTo(14*s, 5*s); c.lineTo(11*s, 8*s);
      c.closePath(); c.fill();
      c.fillStyle = '#8aaae0';
      c.fillRect(4*s, 7*s, 6*s, 2*s);
    } else if(id === 'axe'){
      c.strokeStyle = '#6a4a2a'; c.lineWidth = 2*s;
      c.beginPath(); c.moveTo(5*s, 13*s); c.lineTo(11*s, 5*s); c.stroke();
      c.fillStyle = '#a8a8b8';
      c.beginPath();
      c.moveTo(9*s, 2*s); c.lineTo(14*s, 5*s); c.lineTo(13*s, 8*s); c.lineTo(9*s, 6*s);
      c.closePath(); c.fill();
    } else if(id === 'pick'){
      c.strokeStyle = '#6a4a2a'; c.lineWidth = 2*s;
      c.beginPath(); c.moveTo(5*s, 13*s); c.lineTo(11*s, 6*s); c.stroke();
      c.strokeStyle = '#a8a8b8'; c.lineWidth = 2*s;
      c.beginPath(); c.moveTo(8*s, 3*s); c.lineTo(14*s, 5*s); c.stroke();
    } else if(id === 'scythe'){
      c.strokeStyle = '#6a4a2a'; c.lineWidth = 2*s;
      c.beginPath(); c.moveTo(4*s, 14*s); c.lineTo(9*s, 4*s); c.stroke();
      c.strokeStyle = '#c8c8d8'; c.lineWidth = 2*s;
      c.beginPath(); c.arc(9*s, 4*s, 4*s, Math.PI*0.9, Math.PI*1.9); c.stroke();
    } else if(id === 'rod'){
      c.strokeStyle = '#8a5a2a'; c.lineWidth = 2*s;
      c.beginPath(); c.moveTo(4*s, 14*s); c.lineTo(11*s, 3*s); c.stroke();
      c.strokeStyle = '#ddd'; c.lineWidth = 0.5*s;
      c.beginPath(); c.moveTo(11*s, 3*s); c.lineTo(13*s, 10*s); c.stroke();
    }
  } else if(info.type === 'seed'){
    c.fillStyle = '#8a6a3a';
    c.beginPath(); c.arc(8*s, 9*s, 4*s, 0, Math.PI*2); c.fill();
    c.fillStyle = '#7ac04a';
    c.beginPath(); c.arc(8*s, 8*s, 3*s, 0, Math.PI*2); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.4)';
    c.beginPath(); c.arc(6.5*s, 6.5*s, 1*s, 0, Math.PI*2); c.fill();
    c.fillStyle = '#3a6a1a';
    c.fillRect(7.5*s, 2*s, 1*s, 4*s);
  } else if(info.type === 'crop'){
    c.fillStyle = '#3a8a3a';
    c.fillRect(7*s, 8*s, 2*s, 6*s);
    c.fillStyle = info.c || '#ffd24a';
    c.beginPath(); c.arc(8*s, 7*s, 4*s, 0, Math.PI*2); c.fill();
    c.fillStyle = 'rgba(255,255,255,0.4)';
    c.beginPath(); c.arc(6.5*s, 5.5*s, 1.5*s, 0, Math.PI*2); c.fill();
  } else if(info.type === 'forage'){
    c.fillStyle = info.c || '#ffd24a';
    c.beginPath(); c.arc(8*s, 8*s, 5*s, 0, Math.PI*2); c.fill();
    c.fillStyle = '#3a6a1a';
    c.fillRect(7*s, 2*s, 2*s, 3*s);
  } else if(info.type === 'fish'){
    c.fillStyle = info.c || '#a0c0ff';
    c.beginPath(); c.ellipse(8*s, 8*s, 5*s, 3*s, 0, 0, Math.PI*2); c.fill();
    c.fillStyle = '#000';
    c.beginPath(); c.arc(6*s, 7*s, 0.7*s, 0, Math.PI*2); c.fill();
    c.fillStyle = info.c || '#a0c0ff';
    c.beginPath();
    c.moveTo(12*s, 8*s); c.lineTo(15*s, 5*s); c.lineTo(15*s, 11*s);
    c.closePath(); c.fill();
  } else if(info.type === 'mat'){
    c.fillStyle = info.c || '#888';
    if(id === 'wood'){
      c.fillRect(3*s, 5*s, 10*s, 6*s);
      c.fillStyle = '#8a5a2a';
      c.fillRect(3*s, 5*s, 10*s, 1*s);
    } else if(id === 'stone'){
      c.beginPath();
      c.moveTo(3*s, 11*s); c.lineTo(5*s, 5*s); c.lineTo(11*s, 4*s); c.lineTo(13*s, 10*s);
      c.closePath(); c.fill();
    } else if(id.includes('ore')){
      c.fillStyle = '#666';
      c.beginPath(); c.arc(8*s, 8*s, 5*s, 0, Math.PI*2); c.fill();
      c.fillStyle = info.c;
      c.beginPath(); c.arc(7*s, 7*s, 2*s, 0, Math.PI*2); c.fill();
      c.beginPath(); c.arc(10*s, 10*s, 1.5*s, 0, Math.PI*2); c.fill();
    } else if(id === 'fiber'){
      c.strokeStyle = info.c;
      c.lineWidth = 1.5*s;
      for(let i=0; i<4; i++){
        c.beginPath();
        c.moveTo((4+i*2.5)*s, 12*s);
        c.lineTo((5+i*2.5)*s, 4*s);
        c.stroke();
      }
    } else {
      c.fillRect(4*s, 4*s, 8*s, 8*s);
    }
  }
}

// ==================== HOTBAR ====================
function updateHotbar(){
  const hb = document.getElementById('hotbar');
  if(hb.children.length !== 8){
    hb.innerHTML = '';
    for(let i=0; i<8; i++){
      const s = document.createElement('div');
      s.className = 'slot';
      s.innerHTML = `<span class="key">${i+1}</span><span class="count"></span>`;
      s.addEventListener('click', ()=>{ sel = i; updateHotbar(); });
      hb.appendChild(s);
    }
  }
  for(let i=0; i<8; i++){
    const s = hb.children[i];
    s.classList.toggle('active', i === sel);
    const inv1 = inv[i];
    const cnt = s.querySelector('.count');
    const old = s.querySelector('canvas');
    if(old) old.remove();
    if(inv1.id && inv1.count > 0){
      const ic = document.createElement('canvas');
      ic.width = 64; ic.height = 64;
      drawItemIcon(ic.getContext('2d'), inv1.id, 64);
      s.insertBefore(ic, cnt);
      cnt.textContent = inv1.count > 1 ? inv1.count : '';
    } else {
      cnt.textContent = '';
    }
  }
}

// ==================== ENVANTER ====================
function invAdd(id, n){
  if(!n) n = 1;
  const maxStack = 99;
  for(const s of inv){
    if(s.id === id && s.count < maxStack){
      const a = Math.min(maxStack - s.count, n);
      s.count += a; n -= a;
      if(n <= 0){ updateHotbar(); return true; }
    }
  }
  for(const s of inv){
    if(!s.id || s.count === 0){
      s.id = id;
      s.count = Math.min(maxStack, n);
      n -= s.count;
      if(n <= 0){ updateHotbar(); return true; }
    }
  }
  updateHotbar();
  return false;
}
function invRemove(id, n){
  for(const s of inv){
    if(s.id === id && s.count > 0){
      const t = Math.min(s.count, n);
      s.count -= t; n -= t;
      if(s.count <= 0) s.id = null;
      if(n <= 0){ updateHotbar(); return true; }
    }
  }
  updateHotbar();
  return false;
}

// ==================== HUD ====================
function updateHUD(){
  if(!player || !world) return;
  document.getElementById('moneyTxt').textContent = player.money + 'g';
  document.getElementById('energyFill').style.width = (player.energy / player.maxEnergy * 100) + '%';
  document.getElementById('hpFill').style.width = (player.hp / player.maxHp * 100) + '%';
  const h = Math.floor(world.minute / 60) % 24;
  const m = Math.floor(world.minute % 60);
  document.getElementById('clockTxt').textContent = String(h).padStart(2,'0') + ':' + String(m).padStart(2,'0');
  document.getElementById('dayTxt').textContent = 'Gün ' + world.day;
  document.getElementById('seasonIcon').textContent = SEASONS[world.season].icon;
  const w = Object.values(WEATHER).find(x => x.id === world.weather);
  document.getElementById('weatherStat').textContent = w ? w.icon : '☀️';
  document.getElementById('shopMoney').textContent = player.money + 'g';
}

// ==================== DIALOG ====================
function showDialog(name, portrait, text){
  const box = document.getElementById('dialogBox');
  document.getElementById('dlgPortrait').textContent = portrait;
  document.getElementById('dlgName').textContent = name;
  document.getElementById('dlgText').textContent = text;
  box.classList.add('show');
  clearTimeout(showDialog._t);
  showDialog._t = setTimeout(()=>{
    box.classList.remove('show');
  }, 4000);
}

// ==================== TOAST ====================
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
    if(!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
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
function updateCamera(){
  const tx = player.x + player.w/2 - VW/2;
  const ty = player.y + player.h/2 - VH/2;
  camera.x += (tx - camera.x) * 0.15;
  camera.y += (ty - camera.y) * 0.15;
  const maxX = MAP_W * TILE - VW;
  const maxY = MAP_H * TILE - VH;
  camera.x = Math.max(0, Math.min(maxX, camera.x));
  camera.y = Math.max(0, Math.min(maxY, camera.y));
}

// ==================== UPDATE ====================
function update(dt){
  if(paused) return;
  if(shopOpen) return;

  // Oyuncu
  player.update(dt, world, input);

  // NPC
  for(const n of npcs) n.update(dt, world);

  // Parçacıklar
  particles.update(dt);
  for(let i=floaters.length-1; i>=0; i--){
    floaters[i].update(dt);
    if(floaters[i].life <= 0) floaters.splice(i, 1);
  }

  // Ambient
  world.updateAmbient(dt);

  // Zaman
  const res = world.advanceTime(dt, timeSpeed);
  if(res === 'sleep'){
    sleep();
  }

  // Kamera
  updateCamera();

  // HUD güncelle
  updateHUD();
}

// ==================== RENDER ====================
function render(){
  // Gökyüzü
  const sky = world.getSkyColors();
  const g = ctx.createLinearGradient(0, 0, 0, VH);
  g.addColorStop(0, sky.top);
  g.addColorStop(1, sky.bot);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VW, VH);

  // Güneş/Ay
  drawSunMoon();

  // Uzak dağlar
  drawDistantHills();

  // Tile'lar
  const x0 = Math.max(0, Math.floor(camera.x / TILE) - 1);
  const x1 = Math.min(MAP_W - 1, Math.ceil((camera.x + VW) / TILE) + 1);
  const y0 = Math.max(0, Math.floor(camera.y / TILE) - 1);
  const y1 = Math.min(MAP_H - 1, Math.ceil((camera.y + VH) / TILE) + 1);

  // Duvarlar
  for(let y=y0; y<=y1; y++){
    for(let x=x0; x<=x1; x++){
      if(world.walls[y][x]){
        const sx = Math.floor(x*TILE - camera.x);
        const sy = Math.floor(y*TILE - camera.y);
        ctx.fillStyle = 'rgba(40,25,15,0.75)';
        ctx.fillRect(sx, sy, TILE, TILE);
      }
    }
  }

  // Tile'lar
  const season = SEASONS[world.season];
  for(let y=y0; y<=y1; y++){
    for(let x=x0; x<=x1; x++){
      drawTile(x, y, season);
    }
  }

  // Ekinler
  for(let y=y0; y<=y1; y++){
    for(let x=x0; x<=x1; x++){
      const c = world.crops[y][x];
      if(c) drawCrop(x, y, c);
    }
  }

  // Objeler
  for(let y=y0; y<=y1; y++){
    for(let x=x0; x<=x1; x++){
      const o = world.objects[y][x];
      if(o) drawObject(x, y, o);
    }
  }

  // NPC'ler
  for(const n of npcs){
    const sx = n.x - camera.x;
    const sy = n.y - camera.y;
    if(sx < -60 || sx > VW + 60 || sy < -60 || sy > VH + 60) continue;
    const walkFrame = n.moving ? Math.sin(n.animT) : 0;
    drawHumanoid(ctx, sx, sy, n.w, n.h, {
      facing: n.facing,
      walkFrame,
      skinColor: n.def.skinColor,
      shirtColor: n.def.shirtColor,
      hairColor: n.def.hairColor
    });
    // İsim etiketi
    ctx.font = 'bold 11px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillText(n.name, sx + n.w/2 + 1, sy - 6);
    ctx.fillStyle = '#ffd24a';
    ctx.fillText(n.name, sx + n.w/2, sy - 7);
    ctx.textAlign = 'left';
  }

  // Oyuncu
  const currentItem = inv[sel]?.id;
  drawPlayerSprite(ctx, player, camera, currentItem);

  // Parçacıklar
  particles.draw(ctx, camera);

  // Floating text
  for(const f of floaters) f.draw(ctx, camera);

  // Yağmur / Kar
  drawWeather();

  // Ambient (kelebekler, ateş böcekleri, yapraklar)
  drawAmbient();

  // Işık efekti (gece)
  const dl = world.getDayLight();
  if(dl < 0.9){
    // Basit radial gradient karartma - oyuncu çevresi
    const px = player.x + player.w/2 - camera.x;
    const py = player.y + player.h/2 - camera.y;
    const darkness = (1 - dl) * 0.7;
    const rg = ctx.createRadialGradient(px, py, 60, px, py, 400);
    rg.addColorStop(0, 'rgba(0,0,20,0)');
    rg.addColorStop(1, `rgba(0,0,20,${darkness})`);
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, VW, VH);
  }

  // Şimşek
  if(world.lightningFlash > 0){
    ctx.fillStyle = `rgba(255,255,255,${world.lightningFlash})`;
    ctx.fillRect(0, 0, VW, VH);
  }

  // Tool target highlight
  drawToolTarget();
}



// Görünmez canvas imzası
ctx.globalAlpha = 0.008;
ctx.font = 'bold 60px monospace';
ctx.fillStyle = '#ffffff';
ctx.textAlign = 'center';
ctx.fillText('[SENİN ADIN] · YEŞİL VADİ · 2026', VW/2, VH/2);
ctx.globalAlpha = 1;
ctx.textAlign = 'left';

function drawTile(x, y, season){
  const t = world.tiles[y][x];
  const sx = Math.floor(x*TILE - camera.x);
  const sy = Math.floor(y*TILE - camera.y);
  const h = hash2(x, y, world.seed);

  if(t === T.GRASS){
    ctx.fillStyle = season.grassTint;
    ctx.fillRect(sx, sy, TILE, TILE);
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    for(let i=0; i<3; i++){
      const px = sx + (hash2(x, y, i*10)*TILE)|0;
      const py = sy + (hash2(x, y, i*10+5)*TILE)|0;
      ctx.fillRect(px, py, 2, 2);
    }
    // Çiçekler (ilkbahar)
    if(season.id === 0 && h < 0.08){
      ctx.fillStyle = ['#ff80c0','#ffd24a','#80c0ff'][(h*100|0)%3];
      ctx.fillRect(sx + 14, sy + 20, 3, 3);
      ctx.fillRect(sx + 13, sy + 22, 5, 1);
    }
    // Kar (kış)
    if(season.id === 3){
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillRect(sx + (h*20|0), sy + (h*30|0), 2, 2);
    }
  } else if(t === T.DIRT){
    ctx.fillStyle = '#8B6a3a';
    ctx.fillRect(sx, sy, TILE, TILE);
    ctx.fillStyle = '#6a4a1a';
    for(let i=0; i<3; i++){
      const px = sx + (hash2(x, y, i*10)*TILE)|0;
      const py = sy + (hash2(x, y, i*10+5)*TILE)|0;
      ctx.fillRect(px, py, 2, 2);
    }
  } else if(t === T.TILLED){
    ctx.fillStyle = '#5a3a1a';
    ctx.fillRect(sx, sy, TILE, TILE);
    ctx.fillStyle = '#3a2a10';
    for(let i=0; i<3; i++) ctx.fillRect(sx, sy + 6 + i*8, TILE, 1);
  } else if(t === T.WATERED){
    ctx.fillStyle = '#3a2510';
    ctx.fillRect(sx, sy, TILE, TILE);
    ctx.fillStyle = '#2a1808';
    for(let i=0; i<3; i++) ctx.fillRect(sx, sy + 6 + i*8, TILE, 1);
    ctx.fillStyle = 'rgba(90,154,192,0.2)';
    ctx.fillRect(sx, sy, TILE, TILE);
  } else if(t === T.WATER){
    ctx.fillStyle = '#3a6a9a';
    ctx.fillRect(sx, sy, TILE, TILE);
    const wave = Math.sin((x + y + performance.now()*0.002) * 0.5) * 2;
    ctx.fillStyle = 'rgba(140,190,230,0.6)';
    ctx.fillRect(sx + 3, sy + 8 + wave, TILE - 6, 2);
    ctx.fillRect(sx + 6, sy + 20 + wave, TILE - 12, 2);
  } else if(t === T.DEEP_WATER){
    ctx.fillStyle = '#2a4a7a';
    ctx.fillRect(sx, sy, TILE, TILE);
    const wave = Math.sin((x + y + performance.now()*0.002) * 0.5) * 2;
    ctx.fillStyle = 'rgba(100,150,200,0.5)';
    ctx.fillRect(sx + 3, sy + 10 + wave, TILE - 6, 2);
  } else if(t === T.PATH){
    ctx.fillStyle = '#b09068';
    ctx.fillRect(sx, sy, TILE, TILE);
    ctx.fillStyle = '#9a7858';
    for(let i=0; i<3; i++){
      const px = sx + (hash2(x, y, i*10)*TILE)|0;
      const py = sy + (hash2(x, y, i*10+5)*TILE)|0;
      ctx.fillRect(px, py, 3, 3);
    }
  } else if(t === T.SAND){
    ctx.fillStyle = '#e0c878';
    ctx.fillRect(sx, sy, TILE, TILE);
    ctx.fillStyle = '#c8b060';
    for(let i=0; i<3; i++){
      ctx.fillRect(sx + (hash2(x,y,i*7)*TILE)|0, sy + (hash2(x,y,i*7+3)*TILE)|0, 2, 2);
    }
  } else if(t === T.WOOD){
    ctx.fillStyle = '#a8724a';
    ctx.fillRect(sx, sy, TILE, TILE);
    ctx.fillStyle = '#8a5a3a';
    ctx.fillRect(sx, sy + 10, TILE, 1);
    ctx.fillRect(sx, sy + 22, TILE, 1);
  } else if(t === T.STONE){
    ctx.fillStyle = '#888';
    ctx.fillRect(sx, sy, TILE, TILE);
  }
}

function drawObject(x, y, o){
  const sx = Math.floor(x*TILE - camera.x);
  const sy = Math.floor(y*TILE - camera.y);
  const h = hash2(x, y, world.seed);

  if(o === O.TREE){
    // Gölge
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(sx + TILE/2, sy + TILE - 2, 12, 4, 0, 0, Math.PI*2);
    ctx.fill();
    // Gövde
    ctx.fillStyle = '#5a3a1a';
    ctx.fillRect(sx + 12, sy + 14, 8, 18);
    ctx.fillStyle = '#3a2a10';
    ctx.fillRect(sx + 12, sy + 14, 2, 18);
    // Yapraklar (mevsime göre)
    const season = SEASONS[world.season];
    let leafColors;
    if(season.id === 0) leafColors = ['#2a6a2a','#3a8a3a','#4a9a3a'];
    else if(season.id === 1) leafColors = ['#3a8a3a','#5aaa3a','#6aba3a'];
    else if(season.id === 2) leafColors = ['#8a4a1a','#c85a2a','#e08820'];
    else leafColors = ['#5a8a9a','#7aaaB0','#a0d0e0'];
    ctx.fillStyle = leafColors[0];
    ctx.beginPath(); ctx.arc(sx + 16, sy + 10, 14, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = leafColors[1];
    ctx.beginPath(); ctx.arc(sx + 12, sy + 8, 11, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(sx + 20, sy + 12, 11, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = leafColors[2];
    ctx.beginPath(); ctx.arc(sx + 16, sy + 5, 9, 0, Math.PI*2); ctx.fill();
  } else if(o === O.PINE_TREE){
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(sx + TILE/2, sy + TILE - 2, 10, 4, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#4a2a10';
    ctx.fillRect(sx + 14, sy + 20, 4, 12);
    // Üçgen çam
    const season = SEASONS[world.season];
    const pineColor = season.id === 3 ? '#5a8a7a' : '#2a5a2a';
    const pineHi = season.id === 3 ? '#7aaa9a' : '#4a7a3a';
    for(let i=0; i<3; i++){
      const size = 14 - i*3;
      const yOff = 20 - i*7;
      ctx.fillStyle = i === 2 ? pineHi : pineColor;
      ctx.beginPath();
      ctx.moveTo(sx + 16, sy + yOff - size);
      ctx.lineTo(sx + 16 - size, sy + yOff);
      ctx.lineTo(sx + 16 + size, sy + yOff);
      ctx.closePath();
      ctx.fill();
    }
  } else if(o === O.ROCK){
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(sx + TILE/2, sy + TILE - 3, 12, 4, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#7a7a7a';
    ctx.beginPath();
    ctx.moveTo(sx + 4, sy + TILE - 4);
    ctx.lineTo(sx + 6, sy + 12);
    ctx.lineTo(sx + 14, sy + 6);
    ctx.lineTo(sx + 22, sy + 10);
    ctx.lineTo(sx + 28, sy + TILE - 4);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#9a9a9a';
    ctx.beginPath();
    ctx.moveTo(sx + 8, sy + 14);
    ctx.lineTo(sx + 14, sy + 9);
    ctx.lineTo(sx + 20, sy + 12);
    ctx.lineTo(sx + 12, sy + 16);
    ctx.closePath();
    ctx.fill();
  } else if(o === O.WEED){
    for(let i=0; i<5; i++){
      const a = (i/5) * Math.PI * 2 + h;
      ctx.strokeStyle = '#3a7a2a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(sx + TILE/2, sy + TILE - 6);
      ctx.lineTo(sx + TILE/2 + Math.cos(a)*7, sy + TILE - 14);
      ctx.stroke();
    }
    if(h < 0.3){
      ctx.fillStyle = '#ffd24a';
      ctx.beginPath();
      ctx.arc(sx + TILE/2, sy + TILE - 8, 3, 0, Math.PI*2);
      ctx.fill();
    }
  } else if(o === O.BUSH){
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.beginPath();
    ctx.ellipse(sx + TILE/2, sy + TILE - 3, 12, 4, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#3a7a2a';
    ctx.beginPath(); ctx.arc(sx + 12, sy + 22, 8, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(sx + 20, sy + 22, 8, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#4a9a3a';
    ctx.beginPath(); ctx.arc(sx + 16, sy + 18, 9, 0, Math.PI*2); ctx.fill();
    // Yemiş
    if(h < 0.5){
      ctx.fillStyle = '#e04060';
      ctx.beginPath(); ctx.arc(sx + 13, sy + 18, 2, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(sx + 20, sy + 22, 2, 0, Math.PI*2); ctx.fill();
    }
  } else if(o === O.FLOWER){
    const color = ['#ff80c0','#ffd24a','#c080ff','#ffffff'][(h*100|0)%4];
    for(let i=0; i<4; i++){
      const a = (i/4) * Math.PI * 2;
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(sx + TILE/2 + Math.cos(a)*3, sy + 20 + Math.sin(a)*3, 3, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.fillStyle = '#ffd24a';
    ctx.beginPath();
    ctx.arc(sx + TILE/2, sy + 20, 2, 0, Math.PI*2);
    ctx.fill();
  } else if(o === O.MUSHROOM){
    ctx.fillStyle = '#e8d8c0';
    ctx.fillRect(sx + 14, sy + 22, 4, 7);
    ctx.fillStyle = h < 0.5 ? '#c04040' : '#8a4a2a';
    ctx.beginPath();
    ctx.ellipse(sx + 16, sy + 20, 9, 6, 0, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(sx + 12, sy + 18, 1.5, 0, Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.arc(sx + 20, sy + 17, 1.5, 0, Math.PI*2); ctx.fill();
  } else if(o === O.BED){
    ctx.fillStyle = '#5a3a1a';
    ctx.fillRect(sx + 2, sy + 4, 28, 26);
    ctx.fillStyle = '#e8e0d0';
    ctx.fillRect(sx + 4, sy + 6, 24, 8);
    ctx.fillStyle = '#c44a3a';
    ctx.fillRect(sx + 4, sy + 14, 24, 14);
    ctx.fillStyle = '#8a3020';
    ctx.fillRect(sx + 4, sy + 14, 24, 2);
  } else if(o === O.SHIPPING_BIN){
    ctx.fillStyle = '#5a3a1a';
    ctx.fillRect(sx + 3, sy + 8, 26, 22);
    ctx.fillStyle = '#8a6a3a';
    ctx.fillRect(sx + 3, sy + 8, 26, 6);
    ctx.fillStyle = '#3a2510';
    ctx.fillRect(sx + 8, sy + 6, 16, 4);
    ctx.fillStyle = '#ffd24a';
    ctx.beginPath(); ctx.arc(sx + 16, sy + 18, 3, 0, Math.PI*2); ctx.fill();
  } else if(o === O.HOUSE_BASE){
    ctx.fillStyle = '#8a3a2a';
    ctx.fillRect(sx, sy, TILE, TILE);
    ctx.fillStyle = '#6a2a1a';
    ctx.fillRect(sx + 2, sy + 2, TILE - 4, TILE - 4);
    ctx.fillStyle = '#a04a3a';
    ctx.fillRect(sx + 4, sy + 4, TILE - 8, TILE - 8);
  } else if(o === O.SHOP_BUILDING){
    ctx.fillStyle = '#5a4a3a';
    ctx.fillRect(sx, sy, TILE, TILE);
    ctx.fillStyle = '#8a6a3a';
    ctx.fillRect(sx + 2, sy + 2, TILE - 4, TILE - 4);
    ctx.fillStyle = '#ffd24a';
    ctx.fillRect(sx + 6, sy + 6, TILE - 12, TILE - 12);
    ctx.fillStyle = '#8a3a2a';
    ctx.beginPath();
    ctx.moveTo(sx + 16, sy + 8);
    ctx.lineTo(sx + 6, sy + 16);
    ctx.lineTo(sx + 26, sy + 16);
    ctx.closePath();
    ctx.fill();
  } else if(o === O.TOWN_HOUSE){
    ctx.fillStyle = '#5a5a8a';
    ctx.fillRect(sx, sy, TILE, TILE);
    ctx.fillStyle = '#7a7aaa';
    ctx.fillRect(sx + 2, sy + 2, TILE - 4, TILE - 4);
    ctx.fillStyle = '#c8d8f0';
    ctx.fillRect(sx + 8, sy + 10, 6, 8);
    ctx.fillRect(sx + 18, sy + 10, 6, 8);
    ctx.fillStyle = '#3a3a5a';
    ctx.fillRect(sx + 14, sy + 20, 4, 10);
  } else if(o === O.BARN){
    ctx.fillStyle = '#8a3a2a';
    ctx.fillRect(sx, sy, TILE, TILE);
    ctx.fillStyle = '#6a2a1a';
    ctx.fillRect(sx + 2, sy + 2, TILE - 4, TILE - 4);
    ctx.fillStyle = '#c44a3a';
    ctx.beginPath();
    ctx.moveTo(sx + 16, sy + 4);
    ctx.lineTo(sx + 2, sy + 16);
    ctx.lineTo(sx + 30, sy + 16);
    ctx.closePath();
    ctx.fill();
  } else if(o === O.COOP){
    ctx.fillStyle = '#c8a050';
    ctx.fillRect(sx, sy, TILE, TILE);
    ctx.fillStyle = '#a88030';
    ctx.fillRect(sx + 2, sy + 2, TILE - 4, TILE - 4);
    ctx.fillStyle = '#8a5a1a';
    ctx.beginPath();
    ctx.moveTo(sx + 16, sy + 4);
    ctx.lineTo(sx + 4, sy + 16);
    ctx.lineTo(sx + 28, sy + 16);
    ctx.closePath();
    ctx.fill();
  } else if(o === O.WELL){
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath();
    ctx.ellipse(sx + TILE/2, sy + TILE - 2, 14, 5, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#5a5a6a';
    ctx.beginPath();
    ctx.arc(sx + 16, sy + 20, 12, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#3a3a4a';
    ctx.beginPath();
    ctx.arc(sx + 16, sy + 20, 9, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = '#3a6a9a';
    ctx.beginPath();
    ctx.arc(sx + 16, sy + 20, 7, 0, Math.PI*2);
    ctx.fill();
  } else if(o === O.MINE_ENTRANCE){
    ctx.fillStyle = '#2a1a1a';
    ctx.fillRect(sx, sy, TILE, TILE);
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.ellipse(sx + TILE/2, sy + TILE/2, 12, 14, 0, 0, Math.PI*2);
    ctx.fill();
    ctx.strokeStyle = '#6a4a2a';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = '#5a4a3a';
    ctx.fillRect(sx + 4, sy + 2, 4, TILE - 4);
    ctx.fillRect(sx + TILE - 8, sy + 2, 4, TILE - 4);
  } else if(o === O.FENCE_H){
    ctx.fillStyle = '#8a6a3a';
    ctx.fillRect(sx, sy + 14, TILE, 3);
    ctx.fillRect(sx, sy + 22, TILE, 3);
    ctx.fillRect(sx + 6, sy + 6, 4, TILE - 6);
    ctx.fillStyle = '#5a4a2a';
    ctx.fillRect(sx + 6, sy + 6, 1, TILE - 6);
  } else if(o === O.FENCE_V){
    ctx.fillStyle = '#8a6a3a';
    ctx.fillRect(sx + 14, sy, 3, TILE);
    ctx.fillRect(sx + 14, sy + 6, 3, TILE);
    ctx.fillStyle = '#5a4a2a';
    ctx.fillRect(sx + 14, sy, 1, TILE);
  } else if(o === O.ORE_NODE){
    ctx.fillStyle = '#5a5a5a';
    ctx.beginPath();
    ctx.arc(sx + TILE/2, sy + TILE/2, 12, 0, Math.PI*2);
    ctx.fill();
    const colors = ['#d47a4a','#c89878','#ffd860','#a8f0e8'];
    for(let i=0; i<4; i++){
      ctx.fillStyle = colors[i];
      const a = (i/4)*Math.PI*2 + h;
      ctx.beginPath();
      ctx.arc(sx + 16 + Math.cos(a)*6, sy + 16 + Math.sin(a)*6, 3, 0, Math.PI*2);
      ctx.fill();
    }
  }
}

function drawCrop(x, y, c){
  const sx = Math.floor(x*TILE - camera.x);
  const sy = Math.floor(y*TILE - camera.y);
  const cd = CROPS[c.crop];
  if(!cd) return;
  const stage = c.dead ? 0 : Math.min(1, c.growth / cd.days);
  const stemH = 4 + stage * 18;

  if(c.dead){
    ctx.strokeStyle = '#8a6a3a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sx + 16, sy + 28);
    ctx.lineTo(sx + 16, sy + 12);
    ctx.stroke();
    ctx.fillStyle = '#a08a60';
    ctx.beginPath();
    ctx.ellipse(sx + 12, sy + 14, 4, 3, -0.4, 0, Math.PI*2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(sx + 20, sy + 15, 4, 3, 0.4, 0, Math.PI*2);
    ctx.fill();
    return;
  }

  // Gölge
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(sx + 16, sy + 28, 6, 2, 0, 0, Math.PI*2);
  ctx.fill();

  // Sap
  ctx.strokeStyle = '#2a6a2a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(sx + 16, sy + 28);
  ctx.lineTo(sx + 16, sy + 28 - stemH);
  ctx.stroke();

  // Yapraklar
  if(stage < 1){
    ctx.fillStyle = '#3a8a3a';
    ctx.beginPath();
    ctx.ellipse(sx + 10, sy + 22 - stemH/2, 5, 3, -0.4, 0, Math.PI*2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(sx + 22, sy + 22 - stemH/2, 5, 3, 0.4, 0, Math.PI*2);
    ctx.fill();
    // Küçük büyüme
    if(stage > 0.5){
      ctx.fillStyle = cd.baseColor;
      ctx.globalAlpha = (stage - 0.5) * 2;
      ctx.beginPath();
      ctx.arc(sx + 16, sy + 28 - stemH, 3 * stage, 0, Math.PI*2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  // Olgun ürün
  if(c.growth >= cd.days){
    ctx.fillStyle = cd.baseColor;
    ctx.beginPath();
    ctx.arc(sx + 16, sy + 28 - stemH - 3, 7, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.beginPath();
    ctx.arc(sx + 13, sy + 28 - stemH - 5, 2.5, 0, Math.PI*2);
    ctx.fill();
    // Işıltı efekti
    const t = (performance.now() * 0.003) % 1;
    ctx.fillStyle = `rgba(255,220,120,${0.3 - t*0.3})`;
    ctx.beginPath();
    ctx.arc(sx + 16, sy + 28 - stemH - 3, 10 + t*10, 0, Math.PI*2);
    ctx.fill();
  }
}

function drawSunMoon(){
  const dl = world.getDayLight();
  const t = world.minute / (24*60);
  const angle = (t - 0.25) * Math.PI * 2;
  const r = Math.min(VW, VH) * 0.4;
  const cx = VW/2;
  const cy = VH * 0.8;
  const sx = cx + Math.cos(angle) * r;
  const sy = cy + Math.sin(angle) * r;

  if(dl > 0.3){
    // Güneş
    ctx.fillStyle = `rgba(255,220,100,${dl * 0.3})`;
    ctx.beginPath();
    ctx.arc(sx, sy, 60, 0, Math.PI*2);
    ctx.fill();
    ctx.fillStyle = `rgba(255,240,150,${dl})`;
    ctx.beginPath();
    ctx.arc(sx, sy, 30, 0, Math.PI*2);
    ctx.fill();
  }
  if(dl < 0.5){
    const a = 1 - dl * 2;
    if(a > 0){
      // Ay
      ctx.fillStyle = `rgba(220,230,255,${a})`;
      ctx.beginPath();
      ctx.arc(sx, sy, 25, 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle = `rgba(180,190,220,${a * 0.5})`;
      ctx.beginPath();
      ctx.arc(sx - 6, sy - 4, 5, 0, Math.PI*2);
      ctx.arc(sx + 5, sy + 3, 4, 0, Math.PI*2);
      ctx.fill();
      // Yıldızlar
      for(let i=0; i<40; i++){
        const sxi = hash2(i, 1, 1) * VW;
        const syi = hash2(i, 2, 1) * VH * 0.6;
        const twinkle = 0.5 + Math.sin(performance.now()*0.002 + i) * 0.5;
        ctx.fillStyle = `rgba(255,255,255,${a * twinkle * 0.8})`;
        ctx.fillRect(sxi, syi, 2, 2);
      }
    }
  }
}

function drawDistantHills(){
  const season = SEASONS[world.season];
  const dl = world.getDayLight();
  const hillColors = [
    ['#5a8a4a', '#4a7a3a'],
    ['#7a9a4a', '#6a8a3a'],
    ['#8a7a4a', '#7a6a3a'],
    ['#8a9aa8', '#7a8a98']
  ][season.id];

  for(let layer=0; layer<2; layer++){
    const baseY = VH * 0.55 + layer * 40;
    const color = layer === 0 ? hillColors[0] : hillColors[1];
    const alpha = 0.4 + layer * 0.3;
    ctx.fillStyle = color;
    ctx.globalAlpha = alpha * (0.3 + dl * 0.7);
    ctx.beginPath();
    ctx.moveTo(0, VH);
    const parallax = -camera.x * (0.1 + layer * 0.15);
    for(let x=0; x<=VW; x+=16){
      const wx = x + parallax;
      const y = baseY - Math.sin(wx * 0.008 + layer) * 30 - Math.sin(wx * 0.02) * 15;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(VW, VH);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawWeather(){
  for(const p of world.rainParticles){
    const sx = p.x - camera.x;
    const sy = p.y - camera.y;
    if(sx < -20 || sx > VW + 20 || sy < -20 || sy > VH + 20) continue;
    if(p.snow){
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.beginPath();
      ctx.arc(sx, sy, 2, 0, Math.PI*2);
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

function drawAmbient(){
  const dl = world.getDayLight();
  // Kelebekler
  if(dl > 0.5){
    for(const b of world.butterflies){
      const sx = b.x - camera.x;
      const sy = b.y - camera.y;
      if(sx < -30 || sx > VW + 30 || sy < -30 || sy > VH + 30) continue;
      const wingScale = Math.abs(Math.sin(b.wing)) * 0.8 + 0.4;
      ctx.fillStyle = b.hue;
      ctx.globalAlpha = Math.min(1, b.life);
      // Sol kanat
      ctx.beginPath();
      ctx.ellipse(sx - 4, sy, 4 * wingScale, 3, 0, 0, Math.PI*2);
      ctx.fill();
      // Sağ kanat
      ctx.beginPath();
      ctx.ellipse(sx + 4, sy, 4 * wingScale, 3, 0, 0, Math.PI*2);
      ctx.fill();
      // Gövde
      ctx.fillStyle = '#333';
      ctx.fillRect(sx - 1, sy - 2, 2, 4);
      ctx.globalAlpha = 1;
    }
  }
  // Ateş böcekleri
  if(dl < 0.5){
    const a = 1 - dl * 2;
    for(const f of world.fireflies){
      const sx = f.x - camera.x;
      const sy = f.y - camera.y;
      if(sx < -20 || sx > VW + 20 || sy < -20 || sy > VH + 20) continue;
      const glow = f.bright * a;
      ctx.fillStyle = `rgba(255,255,120,${glow * 0.6})`;
      ctx.beginPath();
      ctx.arc(sx, sy, 6, 0, Math.PI*2);
      ctx.fill();
      ctx.fillStyle = `rgba(255,255,180,${glow})`;
      ctx.beginPath();
      ctx.arc(sx, sy, 2, 0, Math.PI*2);
      ctx.fill();
    }
  }
  // Yapraklar (sonbahar)
  for(const l of world.leaves){
    const sx = l.x - camera.x;
    const sy = l.y - camera.y;
    if(sx < -20 || sx > VW + 20 || sy < -20 || sy > VH + 20) continue;
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

function drawToolTarget(){
  if(paused || shopOpen) return;
  const tx = Math.floor((mouse.x + camera.x) / TILE);
  const ty = Math.floor((mouse.y + camera.y) / TILE);
  const ptx = Math.floor((player.x + player.w/2) / TILE);
  const pty = Math.floor((player.y + player.h/2) / TILE);
  if(Math.abs(tx - ptx) > 3 || Math.abs(ty - pty) > 3) return;
  if(tx < 0 || tx >= MAP_W || ty < 0 || ty >= MAP_H) return;
  const sx = tx * TILE - camera.x;
  const sy = ty * TILE - camera.y;
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 2;
  ctx.setLineDash([4, 4]);
  ctx.strokeRect(sx + 1, sy + 1, TILE - 2, TILE - 2);
  ctx.setLineDash([]);
}

// ==================== SAVE/LOAD ====================
function saveGame(){
  try {
    const data = {
      world: world.serialize(),
      player: player.serialize(),
      inv: inv,
      sel: sel
    };
    localStorage.setItem('yesil_vadi_save', JSON.stringify(data));
  } catch(e){ console.warn(e); }
}
function loadGame(){
  try {
    const raw = localStorage.getItem('yesil_vadi_save');
    if(!raw) return false;
    const d = JSON.parse(raw);
    world = World.deserialize(d.world);
    player = Player.deserialize(d.player);
    for(let i=0; i<8; i++) inv[i] = d.inv[i] || {id:null, count:0};
    sel = d.sel || 0;
    spawnNPCs();
    return true;
  } catch(e){
    console.error(e);
    return false;
  }
}

// ==================== ANA DÖNGÜ ====================
function loop(now){
  requestAnimationFrame(loop);
  const dt = Math.min(0.1, (now - lastT) / 1000);
  lastT = now;
  if(!world || !player) return;
  update(dt);
  render();
}
// ==================== BAŞLAT ====================
const loadingFill = document.getElementById('loadFill');
const loadingTxt = document.getElementById('loadTxt');
let loadProgress = 0;
const loadStages = [
  'Toprak sürülüyor...',
  'Tohumlar ekiliyor...',
  'Hayvanlar uyandırılıyor...',
  'Mevsimler hazırlanıyor...',
  'Yeşil Vadi hazır!'
];
function simulateLoading(){
  loadProgress += 20;
  loadingFill.style.width = loadProgress + '%';
  const stage = Math.min(loadStages.length - 1, Math.floor(loadProgress / 20) - 1);
  loadingTxt.textContent = loadStages[Math.max(0, stage)];
  if(loadProgress < 100){
    setTimeout(simulateLoading, 200 + Math.random() * 200);
  } else {
    init();
  }
}
setTimeout(simulateLoading, 300);
requestAnimationFrame(loop);
// ============ CAYDIRICI KORUMA ============
document.addEventListener('contextmenu', e => {
  if(e.target.tagName === 'CANVAS') e.preventDefault();
});

document.addEventListener('keydown', e => {
  // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U engelle
  if(
    e.key === 'F12' ||
    (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i' || e.key === 'J' || e.key === 'j')) ||
    (e.ctrlKey && (e.key === 'U' || e.key === 'u'))
  ){
    e.preventDefault();
    console.clear();
    console.log('%c⛔ Bu kod telif hakkı ile korunmaktadır.', 'color:#ff4444;font-size:20px;font-weight:bold');
    console.log('%c© 2026 [SENİN ADIN] - Tüm Hakları Saklıdır', 'color:#ffd24a;font-size:14px');
    return false;
  }
});

// Konsol açılırsa uyarı bas
console.log('%c⛔ YEŞİL VADİ', 'color:#ffd24a;font-size:30px;font-weight:bold;text-shadow:2px 2px 0 #000');
console.log('%cBu oyunun kodu telif hakkı ile korunmaktadır.', 'color:#fff;font-size:14px');
console.log('%c© 2026 [SENİN ADIN] — Tüm Hakları Saklıdır', 'color:#888;font-size:12px');
console.log('%cİzinsiz kopyalama yasal işlem gerektirir.', 'color:#ff4444;font-size:12px;font-weight:bold');
