import { TILE, ITEMS, NPCS } from './data.js';

// ==================== OYUNCU ====================
export class Player {
  constructor(x, y){
    this.x = x; this.y = y;
    this.w = 20; this.h = 26;
    this.vx = 0; this.vy = 0;
    this.facing = 'down';
    this.animT = 0;
    this.moving = false;
    this.energy = 100; this.maxEnergy = 100;
    this.hp = 100; this.maxHp = 100;
    this.money = 500;
    this.swingT = 0;
    this.swingX = 0;
    this.swingY = 0;
    this.walkFrame = 0;
    this.tired = false;
    this.sleeping = false;
  }

  update(dt, world, input){
    // Hareket
    let dx = 0, dy = 0;
    if(input.left)  dx -= 1;
    if(input.right) dx += 1;
    if(input.up)    dy -= 1;
    if(input.down)  dy += 1;
    this.moving = (dx !== 0 || dy !== 0);

    if(this.moving){
      if(dy < 0) this.facing = 'up';
      else if(dy > 0) this.facing = 'down';
      if(dx < 0) this.facing = 'left';
      else if(dx > 0) this.facing = 'right';
      if(dx !== 0 && dy !== 0){ dx *= 0.707; dy *= 0.707; }
      this.animT += dt * 10;
      const spd = this.energy <= 0 ? 1.2 : 2.4;
      // Yatay
      let nx = this.x + dx * spd;
      if(!this.hitSolid(nx, this.y, world)) this.x = nx;
      // Dikey
      let ny = this.y + dy * spd;
      if(!this.hitSolid(this.x, ny, world)) this.y = ny;
    } else {
      this.animT = 0;
    }

    // Enerji tükenme efekti
    if(this.energy <= 0){
      this.tired = true;
      this.energy = 0;
    }

    // Alet sallanması
    if(this.swingT > 0) this.swingT -= dt;

    // Sınırlar
    const W = world.tiles[0].length * TILE;
    const H = world.tiles.length * TILE;
    this.x = Math.max(0, Math.min(W - this.w, this.x));
    this.y = Math.max(0, Math.min(H - this.h, this.y));
  }

  hitSolid(px, py, world){
    const corners = [
      [px, py], [px+this.w, py], [px, py+this.h], [px+this.w, py+this.h]
    ];
    for(const [cx, cy] of corners){
      const tx = Math.floor(cx / TILE), ty = Math.floor(cy / TILE);
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

  rest(){
    // Yatakta uyuyunca enerji dolar
    this.energy = this.maxEnergy;
    this.tired = false;
  }

  serialize(){
    return {
      x: this.x, y: this.y,
      energy: this.energy, hp: this.hp,
      money: this.money, facing: this.facing
    };
  }
  static deserialize(d){
    const p = new Player(d.x, d.y);
    p.energy = d.energy;
    p.hp = d.hp;
    p.money = d.money;
    p.facing = d.facing || 'down';
    return p;
  }
}

// ==================== NPC ====================
export class NPC {
  constructor(id, x, y){
    this.id = id;
    this.def = NPCS[id];
    this.name = this.def.name;
    this.x = x; this.y = y;
    this.w = 18; this.h = 26;
    this.vx = 0; this.vy = 0;
    this.facing = 'down';
    this.animT = 0;
    this.moving = false;
    this.state = 'idle'; // idle, walk
    this.stateT = 0;
    this.targetX = x; this.targetY = y;
    this.homeX = x; this.homeY = y;
    this.greeted = false;
  }

  update(dt, world){
    this.stateT -= dt;
    if(this.state === 'idle' && this.stateT <= 0){
      // Rastgele bir yere yürü
      this.state = 'walk';
      this.stateT = 1.5 + Math.random() * 3;
      const angle = Math.random() * Math.PI * 2;
      const dist = 1 + Math.random() * 3;
      this.targetX = this.homeX + Math.cos(angle) * dist * TILE;
      this.targetY = this.homeY + Math.sin(angle) * dist * TILE;
    } else if(this.state === 'walk' && this.stateT <= 0){
      this.state = 'idle';
      this.stateT = 1 + Math.random() * 3;
    }

    if(this.state === 'walk'){
      const dx = this.targetX - this.x;
      const dy = this.targetY - this.y;
      const d = Math.hypot(dx, dy);
      if(d > 3){
        const spd = 0.7;
        let nx = this.x + (dx/d) * spd;
        let ny = this.y + (dy/d) * spd;
        if(dy < -Math.abs(dx)) this.facing = 'up';
        else if(dy > Math.abs(dx)) this.facing = 'down';
        else if(dx < 0) this.facing = 'left';
        else this.facing = 'right';
        // Basit çarpışma
        const c = this.hitSolid(nx, this.y, world);
        if(!c) this.x = nx;
        const c2 = this.hitSolid(this.x, ny, world);
        if(!c2) this.y = ny;
        this.animT += dt * 8;
        this.moving = true;
      } else {
        this.state = 'idle';
        this.stateT = 1 + Math.random() * 3;
        this.moving = false;
      }
    } else {
      this.moving = false;
      this.animT = 0;
    }
  }

  hitSolid(px, py, world){
    const corners = [
      [px, py], [px+this.w, py], [px, py+this.h], [px+this.w, py+this.h]
    ];
    for(const [cx, cy] of corners){
      const tx = Math.floor(cx / TILE), ty = Math.floor(cy / TILE);
      if(world.isSolidTile(tx, ty)) return true;
    }
    return false;
  }

  getDialog(world){
    const lines = this.greeted ? this.def.dialog : this.def.greeting;
    let line = lines[Math.floor(Math.random() * lines.length)];
    // Mevsim bazlı ek
    const seasonNames = ['ilkbahar','yaz','sonbahar','kış'];
    if(Math.random() < 0.3){
      line += ' ' + seasonNames[world.season].charAt(0).toUpperCase() + seasonNames[world.season].slice(1) + ' mevsimi harika!';
    }
    this.greeted = true;
    return line;
  }
}

// ==================== PARÇACIK SİSTEMİ ====================
export class ParticleSystem {
  constructor(){
    this.particles = [];
  }
  emit(x, y, opts){
    const n = opts.count || 5;
    for(let i=0; i<n; i++){
      const angle = opts.angle !== undefined ? opts.angle + (Math.random()-0.5) * (opts.spread || 1) : Math.random() * Math.PI * 2;
      const speed = (opts.speed || 2) * (0.5 + Math.random() * 0.8);
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed + (opts.gravity || 0) * 0.5,
        color: opts.color || '#fff',
        size: opts.size || 3,
        life: opts.life || 0.6,
        maxLife: opts.life || 0.6,
        gravity: opts.gravity || 0.15,
        fade: opts.fade !== false,
        shrink: opts.shrink !== false
      });
    }
  }
  update(dt){
    for(let i=this.particles.length-1; i>=0; i--){
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= 0.97;
      p.vy *= 0.97;
      p.life -= dt;
      if(p.life <= 0) this.particles.splice(i, 1);
    }
  }
  draw(ctx, camera){
    for(const p of this.particles){
      const a = p.fade ? (p.life / p.maxLife) : 1;
      const s = p.shrink ? p.size * (p.life / p.maxLife) : p.size;
      ctx.globalAlpha = a;
      ctx.fillStyle = p.color;
      ctx.fillRect(
        Math.floor(p.x - camera.x - s/2),
        Math.floor(p.y - camera.y - s/2),
        Math.max(1, Math.ceil(s)), Math.max(1, Math.ceil(s))
      );
    }
    ctx.globalAlpha = 1;
  }
}

// ==================== KONUŞMA BALONU ====================
export class FloatingText {
  constructor(x, y, text, color){
    this.x = x; this.y = y;
    this.text = text;
    this.color = color || '#fff';
    this.life = 1.4;
    this.maxLife = 1.4;
    this.vy = -0.8;
  }
  update(dt){
    this.y += this.vy;
    this.vy *= 0.94;
    this.life -= dt;
  }
  draw(ctx, camera){
    const a = Math.min(1, this.life / this.maxLife * 2);
    ctx.globalAlpha = a;
    ctx.font = 'bold 14px monospace';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#000';
    ctx.fillText(this.text, this.x - camera.x + 1, this.y - camera.y + 1);
    ctx.fillStyle = this.color;
    ctx.fillText(this.text, this.x - camera.x, this.y - camera.y);
    ctx.globalAlpha = 1;
    ctx.textAlign = 'left';
  }
}

// ==================== SPRITE ÇİZİM ====================
export function drawHumanoid(ctx, sx, sy, w, h, opts){
  const facing = opts.facing || 'down';
  const walkFrame = opts.walkFrame || 0;
  const bob = walkFrame * 1.2;
  const skin = opts.skinColor || '#f0c090';
  const shirt = opts.shirtColor || '#4a7ac0';
  const pants = opts.pantsColor || '#3a3a5a';
  const hair = opts.hairColor || '#5a2a10';

  // Gölge
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath();
  ctx.ellipse(sx + w/2, sy + h - 1, w/2, 3, 0, 0, Math.PI*2);
  ctx.fill();

  // Bacaklar
  ctx.fillStyle = pants;
  const legOff = 3;
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
  ctx.fillRect(sx + 3, sy + h - 27, w - 6, 10);

  // Saç
  ctx.fillStyle = hair;
  if(facing === 'up'){
    ctx.fillRect(sx + 2, sy + h - 28, w - 4, 9);
  } else {
    ctx.fillRect(sx + 2, sy + h - 28, w - 4, 5);
    ctx.fillRect(sx + 1, sy + h - 26, 3, 5);
    ctx.fillRect(sx + w - 4, sy + h - 26, 3, 5);
  }

  // Yüz
  if(facing === 'down'){
    ctx.fillStyle = '#000';
    ctx.fillRect(sx + 6, sy + h - 24, 2, 3);
    ctx.fillRect(sx + w - 8, sy + h - 24, 2, 3);
    ctx.fillStyle = '#c08060';
    ctx.fillRect(sx + w/2 - 1, sy + h - 21, 2, 1);
  } else if(facing === 'left'){
    ctx.fillStyle = '#000';
    ctx.fillRect(sx + 5, sy + h - 24, 2, 3);
  } else if(facing === 'right'){
    ctx.fillStyle = '#000';
    ctx.fillRect(sx + w - 7, sy + h - 24, 2, 3);
  }
}

export function drawPlayerSprite(ctx, player, camera, currentItem){
  const sx = Math.floor(player.x - camera.x);
  const sy = Math.floor(player.y - camera.y);
  const walkFrame = player.moving ? Math.sin(player.animT) : 0;
  const bob = walkFrame * 1.2;

  const opts = {
    facing: player.facing,
    walkFrame,
    skinColor: '#f0c090',
    shirtColor: '#4a7ac0',
    pantsColor: '#3a3a5a',
    hairColor: '#5a2a10'
  };

  // Gölge
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(sx + player.w/2, sy + player.h - 1, player.w/2, 3, 0, 0, Math.PI*2);
  ctx.fill();

  // Bacaklar
  ctx.fillStyle = opts.pantsColor;
  ctx.fillRect(sx + 3, sy + player.h - 10 + bob, 5, 10);
  ctx.fillRect(sx + player.w - 8, sy + player.h - 10 - bob, 5, 10);

  // Gövde
  ctx.fillStyle = opts.shirtColor;
  ctx.fillRect(sx + 2, sy + player.h - 18, player.w - 4, 10);

  // Kollar
  ctx.fillStyle = opts.shirtColor;
  if(player.facing === 'left'){
    ctx.fillRect(sx - 1, sy + player.h - 17 + bob, 4, 7);
  } else if(player.facing === 'right'){
    ctx.fillRect(sx + player.w - 3, sy + player.h - 17 + bob, 4, 7);
  } else {
    ctx.fillRect(sx - 1, sy + player.h - 17 + bob, 3, 6);
    ctx.fillRect(sx + player.w - 2, sy + player.h - 17 - bob, 3, 6);
  }

  // Kafa
  ctx.fillStyle = opts.skinColor;
  ctx.fillRect(sx + 3, sy + player.h - 27 + bob, player.w - 6, 10);

  // Saç
  ctx.fillStyle = opts.hairColor;
  if(player.facing === 'up'){
    ctx.fillRect(sx + 2, sy + player.h - 28 + bob, player.w - 4, 9);
  } else {
    ctx.fillRect(sx + 2, sy + player.h - 28 + bob, player.w - 4, 5);
    ctx.fillRect(sx + 1, sy + player.h - 26 + bob, 3, 5);
    ctx.fillRect(sx + player.w - 4, sy + player.h - 26 + bob, 3, 5);
  }

  // Yüz
  if(player.facing === 'down'){
    ctx.fillStyle = '#000';
    ctx.fillRect(sx + 6, sy + player.h - 24 + bob, 2, 3);
    ctx.fillRect(sx + player.w - 8, sy + player.h - 24 + bob, 2, 3);
  } else if(player.facing === 'left'){
    ctx.fillStyle = '#000';
    ctx.fillRect(sx + 5, sy + player.h - 24 + bob, 2, 3);
  } else if(player.facing === 'right'){
    ctx.fillStyle = '#000';
    ctx.fillRect(sx + player.w - 7, sy + player.h - 24 + bob, 2, 3);
  }

  // Elde alet
  if(currentItem && ITEMS[currentItem] && ITEMS[currentItem].type === 'tool'){
    const toolX = player.facing === 'left' ? sx - 4 : (player.facing === 'right' ? sx + player.w : sx + player.w - 2);
    const toolY = sy + player.h - 12 + bob;
    drawToolInHand(ctx, toolX, toolY, currentItem, player.facing);
  }

  // Alet sallanırken efekt
  if(player.swingT > 0 && currentItem){
    const prog = 1 - player.swingT / 0.25;
    const ttx = player.swingX * TILE - camera.x + TILE/2;
    const tty = player.swingY * TILE - camera.y + TILE/2;
    ctx.save();
    ctx.translate(ttx, tty);
    ctx.rotate(Math.sin(prog * Math.PI) * 0.9);
    drawToolBig(ctx, currentItem);
    ctx.restore();
  }
}

function drawToolInHand(ctx, x, y, toolId, facing){
  ctx.save();
  ctx.translate(x, y);
  if(facing === 'left') ctx.scale(-1, 1);
  const t = toolId;
  if(t === 'hoe'){
    ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, 8); ctx.lineTo(6, -2); ctx.stroke();
    ctx.fillStyle = '#a8a8b8';
    ctx.fillRect(5, -4, 6, 4);
  } else if(t === 'can'){
    ctx.fillStyle = '#6a8ac0';
    ctx.fillRect(-3, 0, 8, 8);
    ctx.fillStyle = '#4a6a9a';
    ctx.beginPath();
    ctx.moveTo(5, 1); ctx.lineTo(9, -2); ctx.lineTo(9, 1); ctx.lineTo(5, 4);
    ctx.closePath(); ctx.fill();
  } else if(t === 'axe'){
    ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, 8); ctx.lineTo(6, -2); ctx.stroke();
    ctx.fillStyle = '#a8a8b8';
    ctx.beginPath();
    ctx.moveTo(5, -4); ctx.lineTo(11, -1); ctx.lineTo(10, 3); ctx.lineTo(5, 1);
    ctx.closePath(); ctx.fill();
  } else if(t === 'pick'){
    ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, 8); ctx.lineTo(6, 0); ctx.stroke();
    ctx.strokeStyle = '#a8a8b8'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(3, -3); ctx.lineTo(10, -1); ctx.stroke();
  } else if(t === 'scythe'){
    ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, 10); ctx.lineTo(4, -2); ctx.stroke();
    ctx.strokeStyle = '#c8c8d8'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(5, -2, 4, Math.PI*0.9, Math.PI*1.9); ctx.stroke();
  } else if(t === 'rod'){
    ctx.strokeStyle = '#8a5a2a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, 10); ctx.lineTo(8, -4); ctx.stroke();
    ctx.strokeStyle = '#ddd'; ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(8, -4); ctx.lineTo(11, 4); ctx.stroke();
  }
  ctx.restore();
}

function drawToolBig(ctx, toolId){
  const t = toolId;
  if(t === 'hoe'){
    ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-8, 12); ctx.lineTo(6, -6); ctx.stroke();
    ctx.fillStyle = '#a8a8b8';
    ctx.fillRect(4, -10, 12, 8);
  } else if(t === 'can'){
    ctx.fillStyle = '#6a8ac0';
    ctx.fillRect(-8, 0, 12, 12);
    ctx.fillStyle = '#4a6a9a';
    ctx.beginPath();
    ctx.moveTo(4, 2); ctx.lineTo(12, -4); ctx.lineTo(12, 4); ctx.lineTo(4, 8);
    ctx.closePath(); ctx.fill();
  } else if(t === 'axe'){
    ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-8, 12); ctx.lineTo(6, -6); ctx.stroke();
    ctx.fillStyle = '#a8a8b8';
    ctx.beginPath();
    ctx.moveTo(4, -10); ctx.lineTo(14, -4); ctx.lineTo(12, 4); ctx.lineTo(4, 0);
    ctx.closePath(); ctx.fill();
  } else if(t === 'pick'){
    ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-8, 12); ctx.lineTo(6, -2); ctx.stroke();
    ctx.strokeStyle = '#a8a8b8'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(12, -2); ctx.stroke();
  } else if(t === 'scythe'){
    ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-10, 14); ctx.lineTo(2, -6); ctx.stroke();
    ctx.strokeStyle = '#c8c8d8'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(4, -6, 8, Math.PI*0.85, Math.PI*1.95); ctx.stroke();
  } else if(t === 'rod'){
    ctx.strokeStyle = '#8a5a2a'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-10, 14); ctx.lineTo(8, -10); ctx.stroke();
  } else {
    // Tohum ya da başka bir şey
    ctx.fillStyle = '#8a6a3a';
    ctx.beginPath(); ctx.arc(0, 0, 6, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = ITEMS[toolId]?.c || '#a0c040';
    ctx.beginPath(); ctx.arc(0, -1, 4, 0, Math.PI*2); ctx.fill();
  }
}
