import { TILE, MAP_W, MAP_H, MINE_W, MINE_H, MINE_LEVELS, T, O, SEASONS, WEATHER, CROPS } from './data.js';

export function hash2(x, y, s){
  let h = (x|0)*374761393 + (y|0)*668265263 + (s|0)*2246822519;
  h = Math.imul(h ^ (h>>>13), 1274126177);
  return ((h ^ (h>>>16))>>>0) / 4294967295;
}

export class World {
  constructor(seed){
    this.seed = seed || Math.floor(Math.random() * 99999);
    this.season = 0;
    this.day = 1;
    this.minute = 6 * 60;
    this.weather = WEATHER.SUNNY;
    this.weatherEnd = 8 * 60;
    // Overworld
    this.tiles = [];
    this.objects = [];
    this.crops = [];
    this.walls = [];
    // Mine
    this.mineLevel = 0; // 0 = yer üstü, 1-N = maden katları
    this.mineTiles = [];
    this.mineObjects = [];
    this.mineCache = {}; // level -> {tiles, objects}
    // Ambient
    this.rain = [];
    this.leaves = [];
    this.butterflies = [];
    this.fireflies = [];
    this.lightningFlash = 0;
    this.lightningT = 5;
    this.generate();
    this.initAmbient();
  }

  // ==================== OVERWORLD ====================
  generate(){
    for(let y=0; y<MAP_H; y++){
      this.tiles[y] = new Uint8Array(MAP_W);
      this.objects[y] = new Uint8Array(MAP_W);
      this.walls[y] = new Uint8Array(MAP_W);
      this.crops[y] = new Array(MAP_W).fill(null);
      for(let x=0; x<MAP_W; x++) this.tiles[y][x] = T.GRASS;
    }

    // Gölet
    for(let y=0; y<MAP_H; y++){
      for(let x=0; x<MAP_W; x++){
        const dx = (x - 10) / 7;
        const dy = (y - 37) / 6;
        if(dx*dx + dy*dy < 1) this.tiles[y][x] = T.WATER;
      }
    }

    // Kum (gölet çevresi)
    for(let y=0; y<MAP_H; y++){
      for(let x=0; x<MAP_W; x++){
        const dx = (x - 10) / 9;
        const dy = (y - 37) / 8;
        if(dx*dx + dy*dy < 1 && this.tiles[y][x] === T.GRASS) this.tiles[y][x] = T.SAND;
      }
    }

    // Yollar
    for(let x=12; x<52; x++) this.tiles[24][x] = T.PATH;
    for(let y=6; y<45; y++) this.tiles[y][30] = T.PATH;
    for(let y=6; y<10; y++) this.tiles[y][50] = T.PATH;
    for(let x=30; x<52; x++) this.tiles[8][x] = T.PATH;

    // Binalar
    this.buildHouse(3, 3, 8, 6, O.HOUSE, true);
    this.buildHouse(48, 3, 8, 6, O.SHOP, false);
    this.buildHouse(52, 18, 6, 5, O.BARN, false);
    this.buildHouse(56, 18, 4, 4, O.COOP, false);
    this.buildHouse(34, 4, 5, 4, O.HOUSE, false);
    this.buildHouse(20, 42, 8, 5, O.HOUSE, false);
    this.buildHouse(42, 42, 6, 5, O.HOUSE, false);

    // Yatak ve gönderi kutusu
    this.objects[5][5] = O.BED;
    this.objects[9][4] = O.BIN;
    // Mutfak
    this.objects[5][8] = O.KITCHEN;
    // Kuyu
    this.objects[24][28] = O.WELL;
    // Maden girişi
    this.objects[24][46] = O.MINE_ENTRANCE;

    // Çit (tarım alanı)
    for(let x=22; x<=40; x++){
      this.objects[28][x] = O.FENCE;
      this.objects[42][x] = O.FENCE;
    }
    for(let y=28; y<=42; y++){
      this.objects[y][22] = O.FENCE;
      this.objects[y][40] = O.FENCE;
    }
    this.objects[35][22] = O.NONE; // kapı

    // Tarım alanı zemini
    for(let y=30; y<41; y++){
      for(let x=24; x<39; x++){
        if(this.objects[y][x] === O.NONE){
          this.tiles[y][x] = T.DIRT;
        }
      }
    }

    // Ağaçlar
    for(let i=0; i<140; i++){
      const x = 2 + Math.floor(hash2(i, 1, this.seed) * (MAP_W - 4));
      const y = 2 + Math.floor(hash2(i, 2, this.seed) * (MAP_H - 4));
      if(this.tiles[y][x] !== T.GRASS || this.objects[y][x] !== O.NONE) continue;
      if(x < 13 && y < 10) continue;
      if(x > 46 && y < 10) continue;
      if(x >= 20 && x <= 41 && y >= 28 && y <= 43) continue;
      if(x >= 33 && x <= 40 && y >= 3 && y <= 9) continue;
      if(this.tiles[y][x] === T.PATH) continue;
      this.objects[y][x] = hash2(i, 3, this.seed) < 0.65 ? O.TREE : O.PINE;
    }

    // Kayalar
    for(let i=0; i<60; i++){
      const x = 2 + Math.floor(hash2(i, 10, this.seed) * (MAP_W - 4));
      const y = 2 + Math.floor(hash2(i, 20, this.seed) * (MAP_H - 4));
      if(this.objects[y][x] !== O.NONE) continue;
      if(this.tiles[y][x] !== T.GRASS && this.tiles[y][x] !== T.SAND) continue;
      if(x >= 20 && x <= 41 && y >= 28 && y <= 43) continue;
      this.objects[y][x] = O.ROCK;
    }

    // Otlar / çiçekler / yabani ürün
    for(let i=0; i<200; i++){
      const x = 2 + Math.floor(hash2(i, 30, this.seed) * (MAP_W - 4));
      const y = 2 + Math.floor(hash2(i, 40, this.seed) * (MAP_H - 4));
      if(this.objects[y][x] !== O.NONE) continue;
      if(this.tiles[y][x] !== T.GRASS) continue;
      if(x >= 20 && x <= 41 && y >= 28 && y <= 43) continue;
      const r = hash2(i, 50, this.seed);
      if(r < 0.6) this.objects[y][x] = O.WEED;
      else if(r < 0.9) this.objects[y][x] = O.FLOWER;
    }

    // Cevher düğümleri (yer üstü, nadir)
    for(let i=0; i<10; i++){
      const x = 2 + Math.floor(hash2(i, 70, this.seed) * (MAP_W - 4));
      const y = 2 + Math.floor(hash2(i, 80, this.seed) * (MAP_H - 4));
      if(this.objects[y][x] !== O.NONE) continue;
      if(this.tiles[y][x] !== T.GRASS) continue;
      if(x >= 20 && x <= 41 && y >= 28 && y <= 43) continue;
      this.objects[y][x] = O.ORE_NODE;
    }
  }

  buildHouse(hx, hy, hw, hh, type, withBed){
    for(let y=hy; y<hy+hh; y++){
      for(let x=hx; x<hx+hw; x++){
        if(y === hy || y === hy+hh-1 || x === hx || x === hx+hw-1){
          this.objects[y][x] = type;
        } else {
          this.tiles[y][x] = T.WOOD;
          this.walls[y][x] = 1;
        }
      }
    }
    const doorX = hx + Math.floor(hw/2);
    this.objects[hy+hh-1][doorX] = O.NONE;
    this.tiles[hy+hh-1][doorX] = T.WOOD;
  }

  // ==================== MINE ====================
  generateMine(level){
    if(this.mineCache[level]) return this.mineCache[level];
    const tiles = [];
    const objects = [];
    for(let y=0; y<MINE_H; y++){
      tiles[y] = new Uint8Array(MINE_W);
      objects[y] = new Uint8Array(MINE_W);
      for(let x=0; x<MINE_W; x++){
        // Duvar kenarları
        if(x === 0 || x === MINE_W-1 || y === 0 || y === MINE_H-1){
          tiles[y][x] = T.MINE_WALL;
        } else {
          // Rastgele cevher ve boşluk
          const r = hash2(x + level*100, y, this.seed + level*7);
          if(r < 0.35) tiles[y][x] = T.MINE_WALL;
          else tiles[y][x] = T.MINE_FLOOR;
        }
      }
    }
    // Giriş (yukarı çıkış)
    const upX = Math.floor(MINE_W/2);
    for(let y=0; y<3; y++) for(let x=upX-2; x<=upX+2; x++) tiles[y][x] = T.MINE_FLOOR;
    tiles[1][upX] = T.LADDER;

    // Aşağı iniş
    const downX = upX + (hash2(level, 1, this.seed) > 0.5 ? 6 : -6);
    const downXClamped = Math.max(3, Math.min(MINE_W-4, downX));
    for(let y=MINE_H-3; y<MINE_H; y++) for(let x=downXClamped-2; x<=downXClamped+2; x++) tiles[y][x] = T.MINE_FLOOR;
    if(level < MINE_LEVELS){
      tiles[MINE_H-2][downXClamped] = T.LADDER;
    } else {
      // Son kat: çıkış yok, sadece ganimet
      tiles[MINE_H-2][downXClamped] = T.MINE_FLOOR;
    }

    // Cevher düğümleri
    const oreDensity = 0.04 + level * 0.003;
    for(let i=0; i<60; i++){
      const x = 2 + Math.floor(hash2(i, level, this.seed) * (MINE_W - 4));
      const y = 2 + Math.floor(hash2(i, level+50, this.seed) * (MINE_H - 4));
      if(tiles[y][x] !== T.MINE_WALL) continue;
      const r = hash2(i, level+100, this.seed);
      if(r < oreDensity) objects[y][x] = O.ORE_NODE;
    }

    // Çıkış (yer üstüne dönüş - level 0'a)
    const exitX = Math.floor(MINE_W/2);
    tiles[0][exitX] = T.MINE_EXIT;

    this.mineCache[level] = { tiles, objects };
    return this.mineCache[level];
  }

  enterMine(){
    this.mineLevel = 1;
    const m = this.generateMine(1);
    this.mineTiles = m.tiles;
    this.mineObjects = m.objects;
  }

  changeMineLevel(level){
    if(level < 0) level = 0;
    if(level > MINE_LEVELS) level = MINE_LEVELS;
    if(level === 0){
      this.mineLevel = 0;
      return;
    }
    this.mineLevel = level;
    const m = this.generateMine(level);
    this.mineTiles = m.tiles;
    this.mineObjects = m.objects;
  }

  // ==================== AMBIENT ====================
  initAmbient(){
    this.rain = [];
    this.leaves = [];
    this.butterflies = [];
    this.fireflies = [];
    for(let i=0; i<15; i++){
      this.butterflies.push({
        x: Math.random() * MAP_W * TILE,
        y: (10 + Math.random() * 30) * TILE,
        vx: (Math.random()-0.5)*0.5,
        vy: (Math.random()-0.5)*0.3,
        phase: Math.random()*Math.PI*2,
        hue: ['#ffd24a','#ff80c0','#80d0ff'][Math.floor(Math.random()*3)],
        life: 8
      });
    }
    for(let i=0; i<25; i++){
      this.fireflies.push({
        x: Math.random() * MAP_W * TILE,
        y: Math.random() * MAP_H * TILE,
        vx: (Math.random()-0.5)*0.2,
        vy: (Math.random()-0.5)*0.2,
        phase: Math.random()*Math.PI*2,
        bright: Math.random()
      });
    }
  }

  updateAmbient(dt){
    const isNight = this.isNight();
    // Kelebekler
    for(const b of this.butterflies){
      b.phase += dt * 3;
      b.x += Math.cos(b.phase) * 0.4 + b.vx;
      b.y += Math.sin(b.phase * 0.7) * 0.3 + b.vy;
      b.life -= dt;
      if(b.life <= 0) Object.assign(b, {
        x: Math.random() * MAP_W * TILE,
        y: (10 + Math.random() * 30) * TILE,
        life: 8
      });
    }
    // Ateş böcekleri
    for(const f of this.fireflies){
      f.phase += dt * 0.8;
      f.x += Math.cos(f.phase) * 0.15 + f.vx;
      f.y += Math.sin(f.phase * 1.3) * 0.1 + f.vy;
      f.bright = 0.4 + Math.sin(f.phase * 4) * 0.4;
    }

    // Yağmur / kar
    if(this.mineLevel > 0) return; // madende hava yok
    if(this.weather === WEATHER.RAINY || this.weather === WEATHER.STORMY){
      const n = this.weather === WEATHER.STORMY ? 6 : 3;
      for(let i=0; i<n; i++){
        this.rain.push({
          x: Math.random() * MAP_W * TILE,
          y: -20,
          vy: 15 + Math.random() * 10,
          vx: -2 - Math.random() * 2,
          life: 2
        });
      }
      if(this.weather === WEATHER.STORMY){
        this.lightningT -= dt;
        if(this.lightningT <= 0){
          this.lightningT = 3 + Math.random() * 5;
          this.lightningFlash = 0.4;
        }
      }
    } else if(this.weather === WEATHER.SNOWY){
      for(let i=0; i<2; i++){
        this.rain.push({
          x: Math.random() * MAP_W * TILE,
          y: -10,
          vy: 2 + Math.random() * 2,
          vx: (Math.random()-0.5) * 1.5,
          life: 3, snow: true
        });
      }
    }
    for(let i=this.rain.length-1; i>=0; i--){
      const p = this.rain[i];
      p.x += p.vx; p.y += p.vy; p.life -= dt;
      if(p.life <= 0 || p.y > MAP_H * TILE) this.rain.splice(i, 1);
    }
    if(this.lightningFlash > 0){
      this.lightningFlash -= dt * 3;
      if(this.lightningFlash < 0) this.lightningFlash = 0;
    }
    // Yaprak (sonbahar)
    if(this.season === 2 && Math.random() < 0.3){
      this.leaves.push({
        x: Math.random() * MAP_W * TILE,
        y: Math.random() * 30 * TILE,
        vx: (Math.random()-0.5)*1,
        vy: 0.5 + Math.random()*0.5,
        phase: Math.random()*Math.PI*2,
        hue: ['#c85a2a','#e08820','#a05a2a'][Math.floor(Math.random()*3)],
        life: 6
      });
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

  // ==================== GETTERS ====================
  isMine(){ return this.mineLevel > 0; }

  getTile(tx, ty){
    if(this.isMine()){
      if(tx<0 || tx>=MINE_W || ty<0 || ty>=MINE_H) return T.MINE_WALL;
      return this.mineTiles[ty][tx];
    }
    if(tx<0 || tx>=MAP_W || ty<0 || ty>=MAP_H) return T.STONE;
    return this.tiles[ty][tx];
  }
  setTile(tx, ty, v){
    if(this.isMine()){
      if(tx<0 || tx>=MINE_W || ty<0 || ty>=MINE_H) return;
      this.mineTiles[ty][tx] = v;
      return;
    }
    if(tx<0 || tx>=MAP_W || ty<0 || ty>=MAP_H) return;
    this.tiles[ty][tx] = v;
  }
  getObj(tx, ty){
    if(this.isMine()){
      if(tx<0 || tx>=MINE_W || ty<0 || ty>=MINE_H) return O.NONE;
      return this.mineObjects[ty][tx];
    }
    if(tx<0 || tx>=MAP_W || ty<0 || ty>=MAP_H) return O.NONE;
    return this.objects[ty][tx];
  }
  setObj(tx, ty, v){
    if(this.isMine()){
      if(tx<0 || tx>=MINE_W || ty<0 || ty>=MINE_H) return;
      this.mineObjects[ty][tx] = v;
      return;
    }
    if(tx<0 || tx>=MAP_W || ty<0 || ty>=MAP_H) return;
    this.objects[ty][tx] = v;
  }
  getCrop(tx, ty){
    if(this.isMine()) return null;
    if(tx<0 || tx>=MAP_W || ty<0 || ty>=MAP_H) return null;
    return this.crops[ty][tx];
  }
  setCrop(tx, ty, v){
    if(this.isMine()) return;
    if(tx<0 || tx>=MAP_W || ty<0 || ty>=MAP_H) return;
    this.crops[ty][tx] = v;
  }
  getWalls(tx, ty){
    if(this.isMine()) return 0;
    if(tx<0 || tx>=MAP_W || ty<0 || ty>=MAP_H) return 0;
    return this.walls[ty][tx];
  }

  // ==================== ÇARPIŞMA ====================
  isSolidTile(tx, ty){
    const o = this.getObj(tx, ty);
    if(o === O.TREE || o === O.PINE || o === O.ROCK ||
       o === O.HOUSE || o === O.SHOP || o === O.BARN || o === O.COOP ||
       o === O.FENCE || o === O.WELL || o === O.MINE_ENTRANCE ||
       o === O.BIN || o === O.KITCHEN) return true;
    const t = this.getTile(tx, ty);
    if(t === T.WATER) return true;
    if(t === T.MINE_WALL) return true;
    return false;
  }

  // ==================== ZAMAN ====================
  advanceTime(dt, speed){
    this.minute += dt * speed;
    if(this.minute >= this.weatherEnd) this.rollWeather();
    if(this.minute >= 26 * 60) return 'sleep';
    return null;
  }

  rollWeather(){
    let opts;
    if(this.season === 3) opts = [WEATHER.SUNNY, WEATHER.SNOWY, WEATHER.SNOWY, WEATHER.CLOUDY];
    else if(this.season === 2) opts = [WEATHER.SUNNY, WEATHER.CLOUDY, WEATHER.RAINY, WEATHER.RAINY, WEATHER.STORMY];
    else opts = [WEATHER.SUNNY, WEATHER.SUNNY, WEATHER.CLOUDY, WEATHER.RAINY, WEATHER.STORMY];
    this.weather = opts[Math.floor(Math.random() * opts.length)];
    this.weatherEnd = this.minute + 60 * (4 + Math.random() * 6);
  }

  isNight(){
    const h = this.minute / 60;
    return h < 6 || h >= 19;
  }

  getDayLight(){
    const h = this.minute / 60;
    if(h < 5) return 0.15;
    if(h < 7) return 0.15 + (h-5)/2 * 0.85;
    if(h < 18) return 1;
    if(h < 20) return 1 - (h-18)/2 * 0.85;
    return 0.15;
  }

  getSkyColors(){
    const s = SEASONS[this.season];
    const dl = this.getDayLight();
    const lerp = (a,b,t)=>{
      const pa = parseInt(a.slice(1),16), pb = parseInt(b.slice(1),16);
      const ar = (pa>>16)&255, ag = (pa>>8)&255, ab = pa&255;
      const br = (pb>>16)&255, bg = (pb>>8)&255, bb = pb&255;
      const r = Math.round(ar + (br-ar)*t);
      const g = Math.round(ag + (bg-ag)*t);
      const bl = Math.round(ab + (bb-ab)*t);
      return `rgb(${r},${g},${bl})`;
    };
    return {
      top: lerp('#0a0a20', s.skyTop, dl),
      bot: lerp('#1a1a3a', s.skyBot, dl)
    };
  }

  nextDay(){
    this.day++;
    this.minute = 6 * 60;
    if((this.day - 1) % 28 === 0 && this.day > 1){
      this.season = (this.season + 1) % 4;
    }
    // Ekinler büyür
    for(let y=0; y<MAP_H; y++){
      for(let x=0; x<MAP_W; x++){
        const c = this.crops[y][x];
        if(!c) continue;
        if(c.watered && !c.dead){
          const cd = CROPS[c.crop];
          if(cd && cd.season !== undefined && cd.season !== this.season){
            c.dead = true;
          } else {
            c.growth++;
          }
        }
        c.watered = false;
        if(this.tiles[y][x] === T.WATERED) this.tiles[y][x] = T.TILLED;
      }
    }
    this.rollWeather();
    this.weatherEnd = this.minute + 60 * 8;
    this.initAmbient();
  }

  serialize(){
    return {
      seed: this.seed, season: this.season, day: this.day, minute: this.minute,
      weather: this.weather, weatherEnd: this.weatherEnd,
      tiles: this.tiles.map(r=>Array.from(r)),
      objects: this.objects.map(r=>Array.from(r)),
      walls: this.walls.map(r=>Array.from(r)),
      crops: this.crops.map(r=>r.map(c=>c?{...c}:null))
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
    w.tiles = d.tiles.map(r=>new Uint8Array(r));
    w.objects = d.objects.map(r=>new Uint8Array(r));
    w.walls = d.walls.map(r=>new Uint8Array(r));
    w.crops = d.crops.map(r=>r.map(c=>c?{...c}:null));
    w.mineLevel = 0;
    w.mineTiles = [];
    w.mineObjects = [];
    w.mineCache = {};
    w.rain = []; w.leaves = []; w.lightningFlash = 0; w.lightningT = 5;
    w.initAmbient();
    return w;
  }
}
