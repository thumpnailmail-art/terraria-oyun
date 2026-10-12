import { TILE, O, NPCS, CROPS } from './data.js';

// ==================== OYUNCU ====================
export class Player {
  constructor(x, y){
    this.x = x; this.y = y;
    this.w = 20; this.h = 26;
    this.facing = 'down';
    this.animT = 0;
    this.moving = false;
    this.energy = 100; this.maxEnergy = 100;
    this.hp = 100; this.maxHp = 100;
    this.money = 500;
    this.swingT = 0;
    this.swingX = 0;
    this.swingY = 0;
    this.water = 0;      // sulama kabı dolu mu
    this.maxWater = 20;
  }

  update(dt, world, input){
    let dx = 0, dy = 0;
    if(input.left) dx -= 1;
    if(input.right) dx += 1;
    if(input.up) dy -= 1;
    if(input.down) dy += 1;
    this.moving = (dx !== 0 || dy !== 0);

    if(this.moving){
      if(dy < 0) this.facing = 'up';
      else if(dy > 0) this.facing = 'down';
      if(dx < 0) this.facing = 'left';
      else if(dx > 0) this.facing = 'right';
      if(dx !== 0 && dy !== 0){ dx *= 0.707; dy *= 0.707; }
      this.animT += dt * 10;
      const spd = this.energy <= 0 ? 1.2 : 2.4;
      let nx = this.x + dx * spd;
      if(!this.hitSolid(nx, this.y, world)) this.x = nx;
      let ny = this.y + dy * spd;
      if(!this.hitSolid(this.x, ny, world)) this.y = ny;
    } else {
      this.animT = 0;
    }

    if(this.swingT > 0) this.swingT -= dt;

    // Sınırlar
    const W = (world.isMine() ? world.mineTiles[0].length : world.tiles[0].length) * TILE;
    const H = (world.isMine() ? world.mineTiles.length : world.tiles.length) * TILE;
    this.x = Math.max(0, Math.min(W - this.w, this.x));
    this.y = Math.max(0, Math.min(H - this.h, this.y));
  }

  hitSolid(px, py, world){
    const corners = [
      [px, py], [px+this.w, py], [px, py+this.h], [px+this.w, py+this.h]
    ];
    for(const [cx, cy] of corners){
      const tx = Math.floor(cx/TILE), ty = Math.floor(cy/TILE);
      if(world.isSolidTile(tx, ty)) return true;
    }
    return false;
  }

  useEnergy(n){
    if(this.energy < n) return false;
    this.energy -= n;
    if(this.energy < 0) this.energy = 0;
    return true;
  }
  heal(n){ this.hp = Math.min(this.maxHp, this.hp + n); }

  serialize(){
    return { x:this.x, y:this.y, energy:this.energy, hp:this.hp, money:this.money, facing:this.facing, water:this.water };
  }
  static deserialize(d){
    const p = new Player(d.x, d.y);
    p.energy = d.energy; p.hp = d.hp; p.money = d.money;
    p.facing = d.facing || 'down';
    p.water = d.water || 0;
    return p;
  }
}

// ==================== NPC ====================
export class NPC {
  constructor(id){
    this.id = id;
    this.def = NPCS[id];
    this.name = this.def.name;
    this.x = this.def.homeX * TILE;
    this.y = this.def.homeY * TILE;
    this.w = 18; this.h = 26;
    this.facing = 'down';
    this.animT = 0;
    this.moving = false;
    this.targetX = this.x;
    this.targetY = this.y;
    this.waitT = 0;
    this.greeted = false;
    this.scheduleIdx = -1;
  }

  update(dt, world){
    // Program kontrolü
    const h = world.minute;
    let schedule = null;
    for(const s of this.def.schedule){
      if(h >= s.from && h < s.to){ schedule = s; break; }
    }
    if(!schedule) schedule = this.def.schedule[0];

    const schedKey = schedule.label + schedule.from;
    if(schedKey !== this.scheduleIdx){
      this.scheduleIdx = schedKey;
      this.targetX = schedule.x * TILE;
      this.targetY = schedule.y * TILE;
    }

    // Hedefe yürü
    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const d = Math.hypot(dx, dy);
    if(d > 4){
      this.waitT -= dt;
      if(this.waitT <= 0){
        const spd = 1.5;
        const step = Math.min(spd, d);
        const nx = this.x + (dx/d) * step;
        const ny = this.y + (dy/d) * step;
        if(dy < -Math.abs(dx)*0.5) this.facing = 'up';
        else if(dy > Math.abs(dx)*0.5) this.facing = 'down';
        else if(dx < 0) this.facing = 'left';
        else this.facing = 'right';

        if(!this.hitSolid(nx, this.y, world)) this.x = nx;
        else this.waitT = 0.2;
        if(!this.hitSolid(this.x, ny, world)) this.y = ny;
        else this.waitT = 0.2;

        this.animT += dt * 8;
        this.moving = true;
      }
    } else {
      this.moving = false;
      this.animT = 0;
      this.waitT = 0.5 + Math.random();
    }
  }

  hitSolid(px, py, world){
    const corners = [
      [px, py], [px+this.w, py], [px, py+this.h], [px+this.w, py+this.h]
    ];
    for(const [cx, cy] of corners){
      const tx = Math.floor(cx/TILE), ty = Math.floor(cy/TILE);
      if(world.isSolidTile(tx, ty)) return true;
    }
    return false;
  }

  getDialog(){
    const lines = this.greeted ? this.def.dialog : this.def.greeting;
    this.greeted = true;
    return lines[Math.floor(Math.random() * lines.length)];
  }
}

// ==================== HAYVAN ====================
export class Animal {
  constructor(type, x, y){
    this.type = type; // 'chicken' veya 'cow'
    this.x = x; this.y = y;
    this.w = type === 'chicken' ? 16 : 24;
    this.h = type === 'chicken' ? 16 : 22;
    this.facing = 'right';
    this.animT = 0;
    this.moving = false;
    this.targetX = x; this.targetY = y;
    this.waitT = 0;
    this.fed = false;
    this.produceReady = false;
    this.produceTimer = 0;
    this.happy = true;
  }

  update(dt, world){
    // Rastgele dolaş
    this.waitT -= dt;
    if(this.waitT <= 0){
      this.targetX = this.x + (Math.random() - 0.5) * 100;
      this.targetY = this.y + (Math.random() - 0.5) * 100;
      this.waitT = 2 + Math.random() * 3;
    }

    const dx = this.targetX - this.x;
    const dy = this.targetY - this.y;
    const d = Math.hypot(dx, dy);
    if(d > 4){
      const spd = this.type === 'chicken' ? 0.6 : 0.4;
      const nx = this.x + (dx/d) * spd;
      const ny = this.y + (dy/d) * spd;
      if(dx < 0) this.facing = 'left';
      else this.facing = 'right';
      if(!this.hitSolid(nx, this.y, world)) this.x = nx;
      if(!this.hitSolid(this.x, ny, world)) this.y = ny;
      this.animT += dt * 6;
      this.moving = true;
    } else {
      this.moving = false;
      this.animT = 0;
    }

    // Ürün hazır olma
    this.produceTimer += dt;
    if(this.fed && !this.produceReady && this.produceTimer > 30){
      this.produceReady = true;
    }
  }

  hitSolid(px, py, world){
    const corners = [[px, py], [px+this.w, py], [px, py+this.h], [px+this.w, py+this.h]];
    for(const [cx, cy] of corners){
      const tx = Math.floor(cx/TILE), ty = Math.floor(cy/TILE);
      if(world.isSolidTile(tx, ty)) return true;
    }
    return false;
  }

  feed(){
    this.fed = true;
    this.happy = true;
  }

  collect(){
    if(!this.produceReady) return null;
    this.produceReady = false;
    this.fed = false;
    this.produceTimer = 0;
    if(this.type === 'chicken'){
      return Math.random() < 0.15 ? 'large_egg' : 'egg';
    } else {
      return Math.random() < 0.15 ? 'large_milk' : 'milk';
    }
  }

  serialize(){
    return { type:this.type, x:this.x, y:this.y, fed:this.fed, produceReady:this.produceReady, produceTimer:this.produceTimer };
  }
  static deserialize(d){
    const a = new Animal(d.type, d.x, d.y);
    a.fed = d.fed;
    a.produceReady = d.produceReady;
    a.produceTimer = d.produceTimer || 0;
    return a;
  }
}

// ==================== ÇİZİM: İNSAN ====================
export function drawHumanoid(ctx, sx, sy, w, h, opts){
  const facing = opts.facing || 'down';
  const bob = (opts.walkFrame || 0) * 1.2;
  const skin = opts.skinColor || '#f0c090';
  const shirt = opts.shirtColor || '#4a7ac0';
  const pants = opts.pantsColor || '#3a3a5a';
  const hair = opts.hairColor || '#5a2a10';

  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath();
  ctx.ellipse(sx + w/2, sy + h - 1, w/2, 3, 0, 0, Math.PI*2);
  ctx.fill();

  // Bacaklar
  ctx.fillStyle = pants;
  if(facing === 'left' || facing === 'right'){
    ctx.fillRect(sx + 5, sy + h - 10 + bob, 4, 10);
    ctx.fillRect(sx + w - 9, sy + h - 10 - bob, 4, 10);
  } else {
    ctx.fillRect(sx + 3, sy + h - 10 + bob, 5, 10);
    ctx.fillRect(sx + w - 8, sy + h - 10 - bob, 5, 10);
  }

  // Gövde
  ctx.fillStyle = shirt;
  ctx.fillRect(sx + 2, sy + h - 18, w - 4, 10);

  // Kollar
  ctx.fillStyle = shirt;
  if(facing === 'left'){
    ctx.fillRect(sx - 1, sy + h - 17 + bob, 4, 7);
  } else if(facing === 'right'){
    ctx.fillRect(sx + w - 3, sy + h - 17 + bob, 4, 7);
  } else {
    ctx.fillRect(sx - 1, sy + h - 17 + bob, 3, 6);
    ctx.fillRect(sx + w - 2, sy + h - 17 - bob, 3, 6);
  }

  // Eller
  ctx.fillStyle = skin;
  if(facing === 'left') ctx.fillRect(sx - 1, sy + h - 11 + bob, 4, 3);
  else if(facing === 'right') ctx.fillRect(sx + w - 3, sy + h - 11 + bob, 4, 3);
  else {
    ctx.fillRect(sx - 1, sy + h - 11 + bob, 3, 3);
    ctx.fillRect(sx + w - 2, sy + h - 11 - bob, 3, 3);
  }

  // Kafa
  ctx.fillStyle = skin;
  ctx.fillRect(sx + 3, sy + h - 27 + bob, w - 6, 10);

  // Saç
  ctx.fillStyle = hair;
  if(facing === 'up'){
    ctx.fillRect(sx + 2, sy + h - 28 + bob, w - 4, 9);
  } else {
    ctx.fillRect(sx + 2, sy + h - 28 + bob, w - 4, 5);
    ctx.fillRect(sx + 1, sy + h - 26 + bob, 3, 5);
    ctx.fillRect(sx + w - 4, sy + h - 26 + bob, 3, 5);
  }

  // Yüz
  if(facing === 'down'){
    ctx.fillStyle = '#000';
    ctx.fillRect(sx + 6, sy + h - 24 + bob, 2, 3);
    ctx.fillRect(sx + w - 8, sy + h - 24 + bob, 2, 3);
    ctx.fillStyle = '#c08060';
    ctx.fillRect(sx + w/2 - 1, sy + h - 21 + bob, 2, 1);
  } else if(facing === 'left'){
    ctx.fillStyle = '#000';
    ctx.fillRect(sx + 5, sy + h - 24 + bob, 2, 3);
  } else if(facing === 'right'){
    ctx.fillStyle = '#000';
    ctx.fillRect(sx + w - 7, sy + h - 24 + bob, 2, 3);
  }
}

// ==================== ÇİZİM: HAYVAN ====================
export function drawAnimal(ctx, sx, sy, animal){
  const bob = animal.moving ? Math.sin(animal.animT) * 1.5 : 0;
  const face = animal.facing === 'right' ? 1 : -1;

  // Gölge
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(sx + animal.w/2, sy + animal.h - 1, animal.w/2, 3, 0, 0, Math.PI*2);
  ctx.fill();

  if(animal.type === 'chicken'){
    // Bacaklar
    ctx.fillStyle = '#e8a850';
    ctx.fillRect(sx + 4, sy + 10 + bob, 2, 6);
    ctx.fillRect(sx + 10, sy + 10 - bob, 2, 6);
    // Gövde
    ctx.fillStyle = '#f8f0e0';
    ctx.beginPath();
    ctx.ellipse(sx + 8, sy + 8, 8, 6, 0, 0, Math.PI*2);
    ctx.fill();
    // Kanat
    ctx.fillStyle = '#e8d8c0';
    ctx.beginPath();
    ctx.ellipse(sx + 8, sy + 7, 5, 3, 0.3, 0, Math.PI*2);
    ctx.fill();
    // Kafa
    ctx.fillStyle = '#f8f0e0';
    ctx.beginPath();
    ctx.arc(sx + 8 + face * 5, sy + 3, 3, 0, Math.PI*2);
    ctx.fill();
    // Gaga
    ctx.fillStyle = '#ffa030';
    ctx.beginPath();
    ctx.moveTo(sx + 8 + face * 8, sy + 3);
    ctx.lineTo(sx + 8 + face * 11, sy + 4);
    ctx.lineTo(sx + 8 + face * 8, sy + 5);
    ctx.closePath();
    ctx.fill();
    // Göz
    ctx.fillStyle = '#000';
    ctx.fillRect(sx + 8 + face * 5, sy + 2, 1, 1);
    // İbik
    ctx.fillStyle = '#e03030';
    ctx.beginPath();
    ctx.arc(sx + 8 + face * 5, sy - 1, 1.5, 0, Math.PI*2);
    ctx.fill();
  } else {
    // İnek
    // Bacaklar
    ctx.fillStyle = '#3a2a1a';
    ctx.fillRect(sx + 3, sy + 14 + bob, 3, 8);
    ctx.fillRect(sx + 8, sy + 14 + bob, 3, 8);
    ctx.fillRect(sx + 14, sy + 14 + bob, 3, 8);
    ctx.fillRect(sx + 19, sy + 14 + bob, 3, 8);
    // Gövde
    ctx.fillStyle = '#f8f0e0';
    ctx.beginPath();
    ctx.ellipse(sx + 12, sy + 12, 12, 7, 0, 0, Math.PI*2);
    ctx.fill();
    // Lekeler
    ctx.fillStyle = '#3a2a1a';
    ctx.beginPath();
    ctx.arc(sx + 8, sy + 10, 2.5, 0, Math.PI*2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(sx + 17, sy + 13, 2, 0, Math.PI*2);
    ctx.fill();
    // Kafa
    ctx.fillStyle = '#f8f0e0';
    ctx.beginPath();
    ctx.arc(sx + 12 + face * 12, sy + 6, 5, 0, Math.PI*2);
    ctx.fill();
    // Burun
    ctx.fillStyle = '#f0a080';
    ctx.beginPath();
    ctx.arc(sx + 12 + face * 14, sy + 7, 2, 0, Math.PI*2);
    ctx.fill();
    // Göz
    ctx.fillStyle = '#000';
    ctx.fillRect(sx + 12 + face * 11, sy + 4, 1, 2);
    // Boynuz
    ctx.fillStyle = '#e8d8b0';
    ctx.fillRect(sx + 12 + face * 12, sy + 0, 1, 3);
  }
}
