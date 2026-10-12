import { TILE, MAP_W, MAP_H, T, O, SEASONS, WEATHER, ITEMS, CROPS } from './data.js';

// ==================== NOISE ====================
export function hash2(x, y, s){
  let h = (x|0)*374761393 + (y|0)*668265263 + (s|0)*2246822519;
  h = Math.imul(h ^ (h>>>13), 1274126177);
  return ((h ^ (h>>>16))>>>0) / 4294967295;
}
export function smooth1(x, s){
  const i = Math.floor(x), f = x-i;
  const a = hash2(i,0,s), b = hash2(i+1,0,s);
  const u = f*f*(3-2*f);
  return a*(1-u) + b*u;
}
export function fbm1(x, s, o){
  o = o||4; let sum=0, amp=1, f=1, tot=0;
  for(let i=0;i<o;i++){ sum += smooth1(x*f, s+i*137)*amp; tot+=amp; amp*=0.5; f*=2; }
  return sum/tot;
}
export function vn2(x, y, s){
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x-xi, yf = y-yi;
  const u = xf*xf*(3-2*xf), v = yf*yf*(3-2*yf);
  const a = hash2(xi,yi,s), b = hash2(xi+1,yi,s);
  const c = hash2(xi,yi+1,s), d = hash2(xi+1,yi+1,s);
  return (a*(1-u)+b*u)*(1-v) + (c*(1-u)+d*u)*v;
}
export function fbm2(x, y, s, o){
  o = o||3; let sum=0, amp=1, f=1, tot=0;
  for(let i=0;i<o;i++){ sum += vn2(x*f, y*f, s+i*271)*amp; tot+=amp; amp*=0.5; f*=2; }
  return sum/tot;
}

// ==================== DÜNYA SINIFI ====================
export class World {
  constructor(seed){
    this.seed = seed || Math.floor(Math.random() * 99999);
    this.tiles = [];
    this.objects = [];
    this.crops = [];
    this.walls = [];
    this.season = 0;
    this.day = 1;
    this.minute = 6 * 60;
    this.weather = WEATHER.SUNNY.id;
    this.weatherEnd = 6 * 60 + 60 * 8;
    this.rainParticles = [];
    this.lightningT = 0;
    this.lightningX = 0;
    this.butterflies = [];
    this.fireflies = [];
    this.leaves = [];
    this.generate();
    this.initAmbient();
  }

  // ---------- DÜNYA OLUŞTUR ----------
  generate(){
    for(let y=0; y<MAP_H; y++){
      this.tiles[y] = new Uint8Array(MAP_W);
      this.objects[y] = new Uint8Array(MAP_W);
      this.walls[y] = new Uint8Array(MAP_W);
      this.crops[y] = new Array(MAP_W).fill(null);
      for(let x=0; x<MAP_W; x++){
        this.tiles[y][x] = T.GRASS;
      }
    }

    // === Gölet (sağ orta) ===
    const pondCX = 62, pondCY = 32, pondRX = 8, pondRY = 6;
    for(let y=0; y<MAP_H; y++){
      for(let x=0; x<MAP_W; x++){
        const dx = (x - pondCX) / pondRX;
        const dy = (y - pondCY) / pondRY;
        const d = dx*dx + dy*dy;
        if(d < 1){
          if(d < 0.5) this.tiles[y][x] = T.DEEP_WATER;
          else this.tiles[y][x] = T.WATER;
        }
      }
    }

    // === Küçük dere (üstten alta) ===
    let rx = 42;
    for(let y=2; y<MAP_H-4; y++){
      rx += (hash2(y, 1, this.seed) - 0.5) * 1.4;
      rx = Math.max(35, Math.min(55, rx));
      for(let w=-1; w<=1; w++){
        const xx = Math.round(rx + w);
        if(xx < 0 || xx >= MAP_W) continue;
        if(this.tiles[y][xx] === T.WATER || this.tiles[y][xx] === T.DEEP_WATER) continue;
        this.tiles[y][xx] = w === 0 ? T.DEEP_WATER : T.WATER;
      }
    }

    // === Yol (yatay + dikey) ===
    for(let x=8; x<MAP_W-4; x++) this.tiles[42][x] = T.PATH;
    for(let y=8; y<MAP_H-4; y++) this.tiles[y][10] = T.PATH;

    // === Kumlu plaj (gölet çevresi) ===
    for(let y=0; y<MAP_H; y++){
      for(let x=0; x<MAP_W; x++){
        const dx = (x - pondCX) / (pondRX + 2);
        const dy = (y - pondCY) / (pondRY + 2);
        if(dx*dx + dy*dy < 1 && this.tiles[y][x] === T.GRASS){
          this.tiles[y][x] = T.SAND;
        }
      }
    }

    // === Ev (sol üst) ===
    this.buildHouse(3, 4, 7, 6, O.HOUSE_BASE, O.BED, O.SHIPPING_BIN);
    // === Dükkan binası ===
    this.buildHouse(44, 46, 7, 6, O.SHOP_BUILDING, null, null);
    // === Belediye binası ===
    this.buildHouse(20, 50, 8, 6, O.TOWN_HOUSE, null, null);
    // === Ahır ===
    this.buildHouse(56, 8, 8, 7, O.BARN, null, null);
    // === Kümes ===
    this.buildHouse(56, 18, 5, 5, O.COOP, null, null);

    // === Çitler (tarım alanı çevresi) ===
    for(let x=16; x<=36; x++){
      this.objects[14][x] = O.FENCE_H;
      this.objects[40][x] = O.FENCE_H;
    }
    for(let y=14; y<=40; y++){
      this.objects[y][16] = O.FENCE_V;
      this.objects[y][36] = O.FENCE_V;
    }
    this.objects[14][16] = O.FENCE_H;
    this.objects[14][36] = O.FENCE_H;
    this.objects[40][16] = O.FENCE_H;
    this.objects[40][36] = O.FENCE_H;

    // === Çeşme (yol kenarı) ===
    this.objects[44][20] = O.WELL;

    // === Maden girişi ===
    this.objects[6][70] = O.MINE_ENTRANCE;

    // === Ağaçlar ===
    const treeZones = [
      { x0:12, y0:16, x1:MAP_W-4, y1:38, density:0.06 },
      { x0:2,  y0:20, x1:8,       y1:MAP_H-4, density:0.10 },
      { x0:MAP_W-6, y0:4, x1:MAP_W-2, y1:MAP_H-4, density:0.12 }
    ];
    for(const z of treeZones){
      for(let y=z.y0; y<z.y1; y++){
        for(let x=z.x0; x<z.x1; x++){
          if(hash2(x, y, this.seed) < z.density){
            this.placeTree(x, y);
          }
        }
      }
    }

    // === Kayalar ===
    for(let i=0; i<80; i++){
      const x = 2 + Math.floor(hash2(i, 1, this.seed) * (MAP_W - 4));
      const y = 2 + Math.floor(hash2(i, 2, this.seed) * (MAP_H - 4));
      if(this.objects[y][x] !== O.NONE) continue;
      if(this.tiles[y][x] === T.WATER || this.tiles[y][x] === T.DEEP_WATER) continue;
      if(this.tiles[y][x] === T.PATH) continue;
      if(x >= 16 && x <= 36 && y >= 14 && y <= 40) continue;
      this.objects[y][x] = O.ROCK;
    }

    // === Otlar ve çiçekler ===
    for(let i=0; i<200; i++){
      const x = 2 + Math.floor(hash2(i, 10, this.seed) * (MAP_W - 4));
      const y = 2 + Math.floor(hash2(i, 20, this.seed) * (MAP_H - 4));
      if(this.objects[y][x] !== O.NONE) continue;
      if(this.tiles[y][x] !== T.GRASS) continue;
      const r = hash2(i, 30, this.seed);
      if(r < 0.55) this.objects[y][x] = O.WEED;
      else if(r < 0.8) this.objects[y][x] = O.FLOWER;
      else if(r < 0.92) this.objects[y][x] = O.BUSH;
      else this.objects[y][x] = O.MUSHROOM;
    }

    // === Maden cevherleri (yer altı, sadece görsel işaret) ===
    for(let i=0; i<40; i++){
      const x = 3 + Math.floor(hash2(i, 50, this.seed) * (MAP_W - 6));
      const y = 3 + Math.floor(hash2(i, 60, this.seed) * (MAP_H - 6));
      if(this.objects[y][x] === O.NONE && this.tiles[y][x] === T.GRASS && (x<12 || x>MAP_W-12 || y<12 || y>MAP_H-12)){
        this.objects[y][x] = O.ORE_NODE;
      }
    }

    // === Dekoratif yollar ===
    for(let x=3; x<8; x++) this.tiles[10][x] = T.PATH;
    for(let y=4; y<12; y++) this.tiles[y][7] = T.PATH;
  }

  buildHouse(hx, hy, hw, hh, wallType, bedTile, binTile){
    for(let y=hy; y<hy+hh; y++){
      for(let x=hx; x<hx+hw; x++){
        if(y === hy || y === hy+hh-1 || x === hx || x === hx+hw-1){
          this.objects[y][x] = wallType;
        } else {
          this.tiles[y][x] = T.WOOD;
          this.walls[y][x] = 1;
        }
      }
    }
    // Kapı
    const doorX = hx + Math.floor(hw/2);
    this.objects[hy+hh-1][doorX] = O.NONE;
    this.tiles[hy+hh-1][doorX] = T.WOOD;
    // Yatak
    if(bedTile){
      this.objects[hy+1][hx+1] = bedTile;
    }
    // Gönderi kutusu
    if(binTile){
      this.objects[hy+hh][hx] = binTile;
    }
  }

  placeTree(x, y){
    if(this.objects[y][x] !== O.NONE) return;
    if(this.tiles[y][x] !== T.GRASS) return;
    // Eğer altı boşsa ağaç olamaz
    if(y > 0 && this.objects[y-1][x] !== O.NONE) return;
    // Çevresinde boşluk var mı
    let free = true;
    for(let dy=-1; dy<=1; dy++){
      for(let dx=-1; dx<=1; dx++){
        if(dx===0 && dy===0) continue;
        if(this.objects[y+dy]?.[x+dx] === O.TREE || this.objects[y+dy]?.[x+dx] === O.PINE_TREE){
          free = false;
        }
      }
    }
    if(!free) return;
    const r = hash2(x, y, this.seed + 100);
    this.objects[y][x] = r < 0.7 ? O.TREE : O.PINE_TREE;
  }

  // ---------- AMBIENT ----------
  initAmbient(){
    this.butterflies = [];
    this.fireflies = [];
    for(let i=0; i<18; i++){
      this.butterflies.push(this.makeButterfly());
    }
    for(let i=0; i<30; i++){
      this.fireflies.push(this.makeFirefly());
    }
  }
  makeButterfly(){
    return {
      x: Math.random() * MAP_W * TILE,
      y: Math.random() * 40 * TILE + 8 * TILE,
      vx: (Math.random()-0.5)*0.6,
      vy: (Math.random()-0.5)*0.3,
      phase: Math.random() * Math.PI * 2,
      wing: Math.random() * Math.PI * 2,
      hue: Math.random() < 0.5 ? '#ffd24a' : (Math.random() < 0.5 ? '#ff80c0' : '#80d0ff'),
      life: 4 + Math.random() * 6
    };
  }
  makeFirefly(){
    return {
      x: Math.random() * MAP_W * TILE,
      y: Math.random() * MAP_H * TILE,
      vx: (Math.random()-0.5)*0.15,
      vy: (Math.random()-0.5)*0.15,
      phase: Math.random() * Math.PI * 2,
      bright: Math.random(),
      hue: Math.random() < 0.7 ? '#ffff80' : '#80ff80'
    };
  }

  // ---------- TILE GET/SET ----------
  getTile(tx, ty){
    if(tx<0 || tx>=MAP_W || ty<0 || ty>=MAP_H) return T.STONE;
    return this.tiles[ty][tx];
  }
  setTile(tx, ty, v){
    if(tx<0 || tx>=MAP_W || ty<0 || ty>=MAP_H) return;
    this.tiles[ty][tx] = v;
  }
  getObj(tx, ty){
    if(tx<0 || tx>=MAP_W || ty<0 || ty>=MAP_H) return O.NONE;
    return this.objects[ty][tx];
  }
  setObj(tx, ty, v){
    if(tx<0 || tx>=MAP_W || ty<0 || ty>=MAP_H) return;
    this.objects[ty][tx] = v;
  }
  getCrop(tx, ty){
    if(tx<0 || tx>=MAP_W || ty<0 || ty>=MAP_H) return null;
    return this.crops[ty][tx];
  }
  setCrop(tx, ty, v){
    if(tx<0 || tx>=MAP_W || ty<0 || ty>=MAP_H) return;
    this.crops[ty][tx] = v;
  }

  // ---------- ÇARPIŞMA ----------
  isSolidTile(tx, ty){
    if(tx<0 || tx>=MAP_W || ty<0 || ty>=MAP_H) return true;
    const o = this.objects[ty][tx];
    if(o === O.TREE || o === O.PINE_TREE || o === O.ROCK ||
       o === O.HOUSE_BASE || o === O.SHOP_BUILDING ||
       o === O.TOWN_HOUSE || o === O.BARN || o === O.COOP ||
       o === O.WELL || o === O.MINE_ENTRANCE ||
       o === O.FENCE_H || o === O.FENCE_V ||
       o === O.LAMP_POST) return true;
    const t = this.tiles[ty][tx];
    if(t === T.WATER || t === T.DEEP_WATER) return true;
    return false;
  }

  // ---------- ZAMAN İLERLE ----------
  advanceTime(dt, speed){
    this.minute += dt * speed;
    // Hava durumu sonu
    if(this.minute > this.weatherEnd){
      this.rollWeather();
    }
    if(this.minute >= 26*60){ // 02:00 sonraki gün
      return 'sleep';
    }
    return null;
  }

  rollWeather(){
    const season = this.season;
    let options;
    if(season === 3) options = [
      WEATHER.SUNNY, WEATHER.SNOWY, WEATHER.SNOWY, WEATHER.CLOUDY
    ];
    else if(season === 2) options = [
      WEATHER.SUNNY, WEATHER.CLOUDY, WEATHER.RAINY, WEATHER.RAINY, WEATHER.STORMY
    ];
    else options = [
      WEATHER.SUNNY, WEATHER.SUNNY, WEATHER.CLOUDY, WEATHER.RAINY, WEATHER.STORMY
    ];
    const w = options[Math.floor(Math.random() * options.length)];
    this.weather = w.id;
    this.weatherEnd = this.minute + (60 * 4 + Math.random() * 60 * 6);
  }

  // ---------- GECE Mİ ----------
  isNight(){
    const h = this.minute / 60;
    return h < 6 || h >= 19;
  }
  getDayLight(){
    const h = this.minute / 60;
    // 5-7 şafak, 7-18 tam ışık, 18-20 alacakaranlık, 20-5 gece
    if(h < 5) return 0.15;
    if(h < 7) return 0.15 + (h-5)/2 * 0.85;
    if(h < 18) return 1;
    if(h < 20) return 1 - (h-18)/2 * 0.85;
    return 0.15;
  }
  getSkyColors(){
    const season = SEASONS[this.season];
    const dl = this.getDayLight();
    // Gece karart
    const lerp = (a, b, t) => {
      const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
      const ar = (pa>>16)&255, ag = (pa>>8)&255, ab = pa&255;
      const br = (pb>>16)&255, bg = (pb>>8)&255, bb = pb&255;
      const r = Math.round(ar + (br-ar)*t);
      const g = Math.round(ag + (bg-ag)*t);
      const bl = Math.round(ab + (bb-ab)*t);
      return `rgb(${r},${g},${bl})`;
    };
    const nightTop = '#0a0a20', nightBot = '#1a1a3a';
    const dayTop = season.skyTop, dayBot = season.skyBot;
    return {
      top: lerp(nightTop, dayTop, dl),
      bot: lerp(nightBot, dayBot, dl)
    };
  }

  // ---------- GÜN GEÇİR ----------
  nextDay(){
    this.day++;
    this.minute = 6 * 60;
    // Mevsim geçişi (her 28 gün)
    if((this.day - 1) % 28 === 0 && this.day > 1){
      this.season = (this.season + 1) % 4;
    }
    // Ekinleri büyüt
    for(let y=0; y<MAP_H; y++){
      for(let x=0; x<MAP_W; x++){
        const c = this.crops[y][x];
        if(!c) continue;
        if(c.watered && !c.dead){
          // Mevsim uyumu
          const cropData = CROPS[c.crop];
          if(cropData && cropData.season >= 0 && cropData.season !== this.season){
            c.dead = true;
          } else {
            c.growth++;
          }
        }
        c.watered = false;
        if(this.tiles[y][x] === T.WATERED) this.tiles[y][x] = T.TILLED;
      }
    }
    // Hava durumu yeniden
    this.rollWeather();
    this.weatherEnd = this.minute + 60 * 8;
    // Ambient yenile
    this.initAmbient();
  }

  // ---------- AMBIENT GÜNCELLE ----------
  updateAmbient(dt){
    const dl = this.getDayLight();
    // Kelebekler sadece gündüz
    for(const b of this.butterflies){
      b.phase += dt * 3;
      b.x += Math.cos(b.phase) * 0.4 + b.vx;
      b.y += Math.sin(b.phase * 0.7) * 0.3 + b.vy;
      b.wing += dt * 12;
      b.life -= dt;
      if(b.life <= 0 || b.x < 0 || b.x > MAP_W*TILE || b.y < 0 || b.y > MAP_H*TILE){
        Object.assign(b, this.makeButterfly());
      }
    }
    // Ateş böcekleri sadece gece
    for(const f of this.fireflies){
      f.phase += dt * 0.8;
      f.x += Math.cos(f.phase) * 0.15 + f.vx;
      f.y += Math.sin(f.phase * 1.3) * 0.1 + f.vy;
      f.bright = 0.4 + Math.sin(f.phase * 4) * 0.4;
    }

    // Yağmur damlaları
    if(this.weather === WEATHER.RAINY.id || this.weather === WEATHER.STORMY.id){
      const count = this.weather === WEATHER.STORMY.id ? 8 : 4;
      for(let i=0; i<count; i++){
        this.rainParticles.push({
          x: Math.random() * MAP_W * TILE,
          y: -20,
          vy: 15 + Math.random() * 10,
          vx: -2 - Math.random() * 3,
          life: 2
        });
      }
      // Şimşek
      if(this.weather === WEATHER.STORMY.id){
        this.lightningT -= dt;
        if(this.lightningT <= 0){
          this.lightningT = 2 + Math.random() * 5;
          this.lightningX = Math.random() * MAP_W * TILE;
          this.lightningFlash = 0.4;
        }
      }
    } else if(this.weather === WEATHER.SNOWY.id){
      const count = 3;
      for(let i=0; i<count; i++){
        this.rainParticles.push({
          x: Math.random() * MAP_W * TILE,
          y: -10,
          vy: 2 + Math.random() * 2,
          vx: (Math.random()-0.5) * 1.5,
          life: 3,
          snow: true
        });
      }
    }

    // Damlaları güncelle
    for(let i=this.rainParticles.length-1; i>=0; i--){
      const p = this.rainParticles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= dt;
      if(p.life <= 0 || p.y > MAP_H * TILE){
        this.rainParticles.splice(i, 1);
      }
    }

    // Şimşek flash
    if(this.lightningFlash > 0){
      this.lightningFlash -= dt * 3;
      if(this.lightningFlash < 0) this.lightningFlash = 0;
    }

    // Yaprak dökülmesi (sonbahar)
    if(this.season === 2){
      if(Math.random() < 0.3){
        this.leaves.push({
          x: Math.random() * MAP_W * TILE,
          y: Math.random() * 30 * TILE,
          vx: (Math.random()-0.5)*1,
          vy: 0.5 + Math.random()*0.5,
          phase: Math.random()*Math.PI*2,
          hue: ['#c85a2a','#e08820','#a05a2a','#d0a040'][Math.floor(Math.random()*4)],
          life: 6
        });
      }
    }
    for(let i=this.leaves.length-1; i>=0; i--){
      const l = this.leaves[i];
      l.phase += dt * 2;
      l.x += l.vx + Math.sin(l.phase) * 0.5;
      l.y += l.vy;
      l.life -= dt;
      if(l.life <= 0) this.leaves.splice(i, 1);
    }
  }

  // ---------- KAYDET/YÜKLE ----------
  serialize(){
    return {
      seed: this.seed,
      season: this.season,
      day: this.day,
      minute: this.minute,
      weather: this.weather,
      weatherEnd: this.weatherEnd,
      tiles: this.tiles.map(r => Array.from(r)),
      objects: this.objects.map(r => Array.from(r)),
      walls: this.walls.map(r => Array.from(r)),
      crops: this.crops.map(r => r.map(c => c ? { ...c } : null))
    };
  }
  static deserialize(d){
    const w = Object.create(World.prototype);
    w.seed = d.seed;
    w.season = d.season;
    w.day = d.day;
    w.minute = d.minute;
    w.weather = d.weather;
    w.weatherEnd = d.weatherEnd;
    w.tiles = d.tiles.map(r => new Uint8Array(r));
    w.objects = d.objects.map(r => new Uint8Array(r));
    w.walls = d.walls.map(r => new Uint8Array(r));
    w.crops = d.crops.map(r => r.map(c => c ? { ...c } : null));
    w.rainParticles = [];
    w.lightningT = 0;
    w.lightningX = 0;
    w.lightningFlash = 0;
    w.leaves = [];
    w.initAmbient();
    return w;
  }
}
