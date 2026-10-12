'use strict';
(function(){

// ==================== SABİTLER ====================
const W_W=800, W_H=240, TS=16, SURF=80;
const GRAV=0.42, JUMP=-8.8, SPD=2.8, P_W=12, P_H=22;
const MAX_LIQ=8;
const DAY_LEN=240;

// Tile IDs
const AIR=0,DIRT=1,GRASS=2,STONE=3,COAL=4,COPPER=5,IRON=6,SILVER=7,GOLD=8,
  DIAMOND=9,WOOD=10,LEAVES=11,PLANK=12,TORCH=13,BENCH=14,FURNACE=15,ANVIL=16,
  CHEST=17,WATER=18,LAVA=19,SAND=20,CACTUS=21,SNOW=22,ICE=23,JUNGLE=24,
  MUD=25,DUNGEON=26,PLATFORM=27,DOOR=28,TABLE=29,CHAIR=30,DEMONITE=31,
  HELLSTONE=32,EBONSTONE=33,EBONGRASS=34,GLASS=35,LAMP=36,BOOKSHELF=37,
  CAMPFIRE=38,SUMMONER=39;

// Item IDs
const I_COPPER_PICK=100,I_IRON_PICK=101,I_GOLD_PICK=102,
  I_COPPER_AXE=103,I_IRON_AXE=104,I_HAMMER=105,
  I_WOOD_SWORD=106,I_IRON_SWORD=107,I_GOLD_SWORD=108,
  I_BOW=109,I_ARROW=110,I_WOOD_BOW=111,
  I_IRON_HELM=200,I_IRON_CHEST=201,I_IRON_LEGS=202,
  I_GOLD_HELM=203,I_GOLD_CHEST=204,I_GOLD_LEGS=205,
  I_HP_POTION=300,I_MP_POTION=301,I_GEL=400,I_IRON_BAR=401,
  I_GOLD_BAR=402,I_DEMONITE_BAR=403,I_EYE_SUMMON=404,I_IRON_ORE_ITEM=405,
  I_COPPER_BAR=406,I_SILVER_BAR=407,I_SILVER_ORE_ITEM=408,I_LENS=409;

// ==================== TILE INFO ====================
const TI={
  [DIRT]:{n:'Toprak',c:'#8B4513',hard:0.5},
  [GRASS]:{n:'Çim',c:'#7a4b2a',top:'#5cba3a',hard:0.5},
  [STONE]:{n:'Taş',c:'#6d6d6d',hard:1.2},
  [COAL]:{n:'Kömür',c:'#3a3a3a',hard:1.4,ore:'#0a0a0a'},
  [COPPER]:{n:'Bakır',c:'#8a5a3a',hard:1.3,ore:'#d47a4a'},
  [IRON]:{n:'Demir',c:'#9a7250',hard:1.6,ore:'#c89878'},
  [SILVER]:{n:'Gümüş',c:'#a0a8b0',hard:1.8,ore:'#e8e8f0'},
  [GOLD]:{n:'Altın',c:'#c9a227',hard:2.0,ore:'#ffe080'},
  [DIAMOND]:{n:'Elmas',c:'#4dd0c4',hard:2.8,ore:'#a8f0e8'},
  [WOOD]:{n:'Odun',c:'#6b3f1a',hard:0.9},
  [LEAVES]:{n:'Yaprak',c:'#2f7a2f',hard:0.3},
  [PLANK]:{n:'Tahta',c:'#a86b3a',hard:0.7},
  [TORCH]:{n:'Meşale',c:'#ffcc44',hard:0.1,light:1},
  [BENCH]:{n:'Tezgah',c:'#8B6f3a',hard:0.6,station:'bench'},
  [FURNACE]:{n:'Fırın',c:'#5a5a5a',hard:1.5,station:'furnace',light:0.7},
  [ANVIL]:{n:'Örs',c:'#4a4a5a',hard:1.8,station:'anvil'},
  [CHEST]:{n:'Sandık',c:'#8B5a2b',hard:0.8,interact:'chest'},
  [WATER]:{n:'Su',c:'#2a5a9a',hard:0,liquid:true},
  [LAVA]:{n:'Lav',c:'#e04a1a',hard:0,liquid:true,light:0.9,damage:3},
  [SAND]:{n:'Kum',c:'#e0c878',hard:0.4},
  [CACTUS]:{n:'Kaktüs',c:'#3a8a3a',hard:0.6,damage:1},
  [SNOW]:{n:'Kar',c:'#e8eef0',hard:0.3},
  [ICE]:{n:'Buz',c:'#a0d8e8',hard:0.8},
  [JUNGLE]:{n:'Vahşi Çim',c:'#3a6a2a',hard:0.6},
  [MUD]:{n:'Çamur',c:'#5a3a2a',hard:0.5},
  [DUNGEON]:{n:'Zindan Taşı',c:'#3a3a5a',hard:2.5},
  [PLATFORM]:{n:'Platform',c:'#8a6a3a',hard:0.5,platform:true},
  [DOOR]:{n:'Kapı',c:'#7a4a1a',hard:0.6},
  [TABLE]:{n:'Masa',c:'#8a6a3a',hard:0.6,station:'table'},
  [CHAIR]:{n:'Sandalye',c:'#7a5a3a',hard:0.5},
  [DEMONITE]:{n:'Demonite',c:'#3a2a5a',hard:2.4,ore:'#7a4ad4'},
  [HELLSTONE]:{n:'Cehennem Taşı',c:'#5a1a1a',hard:3.0,ore:'#ff5a1a',light:0.3},
  [EBONSTONE]:{n:'Kara Taş',c:'#2a1a2a',hard:1.5},
  [EBONGRASS]:{n:'Kara Çim',c:'#1a0a1a',top:'#5a2a5a',hard:0.6},
  [GLASS]:{n:'Cam',c:'rgba(200,230,255,0.35)',hard:0.4},
  [LAMP]:{n:'Lamba',c:'#ffdd66',hard:0.4,light:1.5},
  [BOOKSHELF]:{n:'Kitaplık',c:'#7a5a3a',hard:0.8,station:'bench'},
  [CAMPFIRE]:{n:'Kamp Ateşi',c:'#ff6622',hard:0.5,light:1.2},
  [SUMMONER]:{n:'Sunak',c:'#3a1a3a',hard:2.0,interact:'summon'}
};

// ==================== ITEM INFO ====================
const II={
  [I_COPPER_PICK]:{n:'Bakır Kazma',c:'#8a5a3a',type:'pick',power:1},
  [I_IRON_PICK]:{n:'Demir Kazma',c:'#9a7250',type:'pick',power:2},
  [I_GOLD_PICK]:{n:'Altın Kazma',c:'#c9a227',type:'pick',power:3},
  [I_COPPER_AXE]:{n:'Bakır Balta',c:'#8a5a3a',type:'axe',power:1},
  [I_IRON_AXE]:{n:'Demir Balta',c:'#9a7250',type:'axe',power:2},
  [I_HAMMER]:{n:'Çekiç',c:'#888',type:'hammer',power:1},
  [I_WOOD_SWORD]:{n:'Tahta Kılıç',c:'#8a6a3a',type:'sword',dmg:5},
  [I_IRON_SWORD]:{n:'Demir Kılıç',c:'#c8a888',type:'sword',dmg:10},
  [I_GOLD_SWORD]:{n:'Altın Kılıç',c:'#ffe080',type:'sword',dmg:15},
  [I_BOW]:{n:'Yay',c:'#8a6a3a',type:'bow',dmg:8},
  [I_WOOD_BOW]:{n:'Tahta Yay',c:'#a87a4a',type:'bow',dmg:6},
  [I_ARROW]:{n:'Ok',c:'#aaa',type:'ammo'},
  [I_IRON_HELM]:{n:'Demir Kask',c:'#a8a8b8',type:'armor',slot:'helm',def:3},
  [I_IRON_CHEST]:{n:'Demir Göğüslük',c:'#a8a8b8',type:'armor',slot:'chest',def:4},
  [I_IRON_LEGS]:{n:'Demir Pantolon',c:'#a8a8b8',type:'armor',slot:'legs',def:3},
  [I_GOLD_HELM]:{n:'Altın Kask',c:'#e8c050',type:'armor',slot:'helm',def:5},
  [I_GOLD_CHEST]:{n:'Altın Göğüslük',c:'#e8c050',type:'armor',slot:'chest',def:6},
  [I_GOLD_LEGS]:{n:'Altın Pantolon',c:'#e8c050',type:'armor',slot:'legs',def:5},
  [I_HP_POTION]:{n:'Can İksiri',c:'#ff4466',type:'use',heal:20,stack:30},
  [I_MP_POTION]:{n:'Mana İksiri',c:'#4488ff',type:'use',mana:25,stack:30},
  [I_GEL]:{n:'Jel',c:'#7bd97b',type:'mat'},
  [I_IRON_BAR]:{n:'Demir Külçe',c:'#c8a888',type:'mat'},
  [I_GOLD_BAR]:{n:'Altın Külçe',c:'#ffe080',type:'mat'},
  [I_COPPER_BAR]:{n:'Bakır Külçe',c:'#d47a4a',type:'mat'},
  [I_SILVER_BAR]:{n:'Gümüş Külçe',c:'#e8e8f0',type:'mat'},
  [I_DEMONITE_BAR]:{n:'Demonite Külçe',c:'#7a4ad4',type:'mat'},
  [I_IRON_ORE_ITEM]:{n:'Demir Cevheri',c:'#9a7250',type:'mat'},
  [I_SILVER_ORE_ITEM]:{n:'Gümüş Cevheri',c:'#a0a8b0',type:'mat'},
  [I_LENS]:{n:'Mercek',c:'#88ddff',type:'mat'},
  [I_EYE_SUMMON]:{n:'Şüpheli Göz',c:'#cc4444',type:'summon',stack:20}
};

function itemInfo(id){
  if(id>=1 && id<100 && TI[id]) return {n:TI[id].n,c:TI[id].c,type:'block'};
  return II[id]||{n:'?',c:'#888'};
}

// ==================== CANVAS ====================
const cvs=document.getElementById('game'), ctx=cvs.getContext('2d');
let VW=0, VH=0;
function resize(){
  VW=cvs.width=innerWidth;
  VH=cvs.height=innerHeight;
  ctx.imageSmoothingEnabled=false;
}
resize();
addEventListener('resize', resize);

// ==================== NOISE ====================
const SEED=Math.floor(Math.random()*99999);
function h2(x,y,s){
  let h=(x|0)*374761393+(y|0)*668265263+(s|0)*2246822519;
  h=Math.imul(h^(h>>>13),1274126177);
  return ((h^(h>>>16))>>>0)/4294967295;
}
function sm1(x,s){
  const i=Math.floor(x),f=x-i;
  const a=h2(i,0,s),b=h2(i+1,0,s);
  const u=f*f*(3-2*f);
  return a*(1-u)+b*u;
}
function fbm1(x,s,o){
  o=o||4;let sum=0,a=1,f=1,t=0;
  for(let i=0;i<o;i++){sum+=sm1(x*f,s+i*137)*a;t+=a;a*=0.5;f*=2}
  return sum/t;
}
function vn2(x,y,s){
  const xi=Math.floor(x),yi=Math.floor(y);
  const xf=x-xi,yf=y-yi;
  const u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);
  const a=h2(xi,yi,s),b=h2(xi+1,yi,s),c=h2(xi,yi+1,s),d=h2(xi+1,yi+1,s);
  return (a*(1-u)+b*u)*(1-v)+(c*(1-u)+d*u)*v;
}
function fbm2(x,y,s,o){
  o=o||3;let sum=0,a=1,f=1,t=0;
  for(let i=0;i<o;i++){sum+=vn2(x*f,y*f,s+i*271)*a;t+=a;a*=0.5;f*=2}
  return sum/t;
}

// ==================== DÜNYA ====================
let world=[],liquid=[],bgWalls=[];
const BIOMES={FOREST:0,DESERT:1,SNOW:2,JUNGLE:3,CORRUPT:4};
let biomeMap=new Uint8Array(W_W);

function wGet(x,y){
  if(x<0||x>=W_W||y<0||y>=W_H) return STONE;
  return world[y][x];
}
function wSet(x,y,t){
  if(x<0||x>=W_W||y<0||y>=W_H) return;
  world[y][x]=t;
}
function liqGet(x,y){
  if(x<0||x>=W_W||y<0||y>=W_H) return 0;
  return liquid[y][x];
}
function liqSet(x,y,v){
  if(x<0||x>=W_W||y<0||y>=W_H) return;
  liquid[y][x]=v;
}
function isSolid(t){
  return t!==AIR && t!==WATER && t!==LAVA && TI[t] && !TI[t].liquid && !TI[t].platform && t!==DOOR;
}
function isPlatform(t){return TI[t]&&TI[t].platform}
function isLiquidT(t){return t===WATER||t===LAVA}
function isOre(t){return TI[t]&&TI[t].ore}
function isTree(t){return t===WOOD||t===LEAVES}
function isLight(t){return TI[t]&&TI[t].light}

function genWorld(){
  world=[];liquid=[];bgWalls=[];
  for(let y=0;y<W_H;y++){
    world[y]=new Uint8Array(W_W);
    liquid[y]=new Uint8Array(W_W);
    bgWalls[y]=new Uint8Array(W_W);
  }
  const heights=new Int16Array(W_W);
  for(let x=0;x<W_W;x++){
    const bn=fbm1(x*0.005,SEED+999,3);
    const bn2=fbm1(x*0.003,SEED+555,2);
    if(bn2>0.75) biomeMap[x]=BIOMES.CORRUPT;
    else if(bn>0.7) biomeMap[x]=BIOMES.JUNGLE;
    else if(bn>0.55) biomeMap[x]=BIOMES.SNOW;
    else if(bn<0.35) biomeMap[x]=BIOMES.DESERT;
    else biomeMap[x]=BIOMES.FOREST;
  }
  for(let x=0;x<W_W;x++){
    const h=Math.floor(SURF+(fbm1(x*0.02,SEED)-0.5)*40);
    heights[x]=Math.max(25,Math.min(W_H-40,h));
  }
  for(let x=0;x<W_W;x++){
    const h=heights[x],b=biomeMap[x];
    for(let y=h;y<W_H;y++){
      const depth=y-h;
      let topTile=GRASS, stoneTile=STONE;
      if(b===BIOMES.DESERT){topTile=SAND;}
      else if(b===BIOMES.SNOW){topTile=SNOW;}
      else if(b===BIOMES.JUNGLE){topTile=JUNGLE;}
      else if(b===BIOMES.CORRUPT){topTile=EBONGRASS;stoneTile=EBONSTONE;}
      let tile=stoneTile;
      if(depth<1) tile=topTile;
      else if(depth<4){
        tile=b===BIOMES.DESERT?SAND:(b===BIOMES.SNOW?SNOW:(b===BIOMES.JUNGLE?MUD:DIRT));
      }
      if(depth>4){
        const cave=fbm2(x*0.07,y*0.07,SEED+500);
        const thr=0.60+Math.min(0.10,depth*0.001);
        if(cave>thr) tile=AIR;
      }
      if((tile===STONE||tile===EBONSTONE||tile===SAND) && depth>4){
        const oh=h2(x,y,SEED+7777);
        const df=Math.min(1,depth/100);
        if(oh<0.012) tile=COAL;
        else if(oh<0.028*(1+df)) tile=COPPER;
        else if(oh<0.038*(1+df)) tile=IRON;
        else if(oh<0.044*(1+df*2)) tile=SILVER;
        else if(oh<0.048*(1+df*2)) tile=GOLD;
        else if(oh<0.050+df*0.008 && depth>80) tile=DIAMOND;
        else if(oh<0.052+df*0.01 && depth>60 && b===BIOMES.CORRUPT) tile=DEMONITE;
      }
      if(depth>150 && tile===STONE && h2(x,y,SEED+333)<0.05) tile=HELLSTONE;
      world[y][x]=tile;
      if(depth>3 && tile===AIR && h2(x,y,SEED+444)<0.4) bgWalls[y][x]=1;
    }
  }
  for(let x=5;x<W_W-5;x++){
    const b=biomeMap[x];
    if(h2(x,42,SEED)<0.10){
      const h=heights[x];
      if(world[h][x]===GRASS||world[h][x]===SNOW||world[h][x]===JUNGLE||world[h][x]===EBONGRASS){
        placeTree(x,h-1,b);x+=3;
      } else if(b===BIOMES.DESERT && h2(x,77,SEED)<0.4 && world[h][x]===SAND){
        placeCactus(x,h-1);x+=2;
      }
    }
  }
  for(let x=10;x<W_W-10;x++){
    if(h2(x,100,SEED)<0.03){
      const h=heights[x];
      const pw=3+Math.floor(h2(x,101,SEED)*4);
      for(let dx=0;dx<pw;dx++){
        const xx=x+dx;
        if(xx<W_W){
          for(let k=h-1;k>=Math.max(0,h-5);k--){
            if(world[k][xx]===AIR) liqSet(xx,k,MAX_LIQ);
            else break;
          }
        }
      }
    }
  }
  return heights;
}

function placeTree(x,baseY,b){
  const trunkH=4+Math.floor(h2(x,1,SEED)*4);
  for(let i=0;i<trunkH;i++){if(baseY-i>=0)world[baseY-i][x]=WOOD}
  const topY=baseY-trunkH;
  const leafTile=b===BIOMES.SNOW?ICE:(b===BIOMES.CORRUPT?EBONSTONE:LEAVES);
  for(let dy=-2;dy<=1;dy++){
    for(let dx=-2;dx<=2;dx++){
      if(dx===0&&dy<=0&&dy>=-1) continue;
      const lx=x+dx,ly=topY+dy;
      if(lx>=0&&lx<W_W&&ly>=0&&ly<W_H){
        if(world[ly][lx]===AIR){
          if(Math.abs(dx)+Math.abs(dy)<=3||h2(lx,ly,SEED)<0.7) world[ly][lx]=leafTile;
        }
      }
    }
  }
}

function placeCactus(x,baseY){
  const h=3+Math.floor(h2(x,1,SEED)*3);
  for(let i=0;i<h;i++){
    if(baseY-i>=0&&world[baseY-i][x]===AIR) world[baseY-i][x]=CACTUS;
  }
}

// ==================== OYUNCU ====================
const P={
  x:0,y:0,vx:0,vy:0,w:P_W,h:P_H,onGround:false,facing:1,
  hp:100,maxHp:100,mp:50,maxMp:50,
  invuln:0,animT:0,mineX:-1,mineY:-1,mineP:0,
  breath:100,inWater:false,
  def:0,swing:0,mana_regen:0
};
const INV=Array(10).fill(null).map(()=>({id:0,count:0}));
const ARMOR={helm:null,chest:null,legs:null};
let sel=0;

function invAdd(id,n){
  if(!n) n=1;
  const stackLimit=(id>=1&&id<100)?999:(II[id]&&II[id].stack)||999;
  for(const s of INV){
    if(s.id===id&&s.count>0&&s.count<stackLimit){
      const a=Math.min(stackLimit-s.count,n);
      s.count+=a;n-=a;
      if(n<=0){updateHotbar();return true}
    }
  }
  for(const s of INV){
    if(s.count===0||s.id===0){
      s.id=id;
      s.count=Math.min(stackLimit,n);
      n-=s.count;
      if(n<=0){updateHotbar();return true}
    }
  }
  updateHotbar();
  return n<=0;
}
function invCount(id){let n=0;for(const s of INV) if(s.id===id) n+=s.count;return n}
function invRemove(id,n){
  for(const s of INV){
    if(s.id===id&&s.count>0){
      const t=Math.min(s.count,n);
      s.count-=t;n-=t;
      if(s.count<=0)s.id=0;
      if(n<=0){updateHotbar();return true}
    }
  }
  updateHotbar();
  return n<=0;
}
function armorDef(){
  let d=0;
  if(ARMOR.helm) d+=II[ARMOR.helm].def||0;
  if(ARMOR.chest) d+=II[ARMOR.chest].def||0;
  if(ARMOR.legs) d+=II[ARMOR.legs].def||0;
  return d;
}

// ==================== ENTITIES ====================
let enemies=[],projs=[],drops=[],particles=[];
const camera={x:0,y:0,shake:0};
let worldTime=30;
let boss=null,bossActive=false;

const ENEMY_DEF={
  slime:{w:14,h:10,hp:20,dmg:8,spd:0.7,color:'#7bd97b',jump:-5},
  zombie:{w:12,h:22,hp:35,dmg:12,spd:1.3,color:'#5a8a5a',jump:-7},
  demon_eye:{w:16,h:16,hp:30,dmg:14,spd:1.6,color:'#cc4444',fly:true},
  skeleton:{w:12,h:22,hp:50,dmg:16,spd:1.4,color:'#e0e0d0',jump:-7},
  bat:{w:14,h:10,hp:15,dmg:6,spd:2.2,color:'#6a3a5a',fly:true},
  eye_boss:{w:70,h:70,hp:600,dmg:20,spd:1.4,color:'#cc2222',fly:true,boss:true}
};
function spawnEnemy(type,x,y){
  const d=ENEMY_DEF[type];
  const e={
    type,x,y,w:d.w,h:d.h,vx:0,vy:0,
    hp:d.hp,maxHp:d.hp,onGround:false,facing:-1,
    jumpTimer:0,animT:0,aiT:0,phase:1,hurtT:0,fly:!!d.fly
  };
  if(d.boss){boss=e;bossActive=true;document.getElementById('bossName').textContent='EYE OF CTHULHU'}
  enemies.push(e);
}
function spawnProjectile(owner,x,y,vx,vy,dmg,type){
  projs.push({owner,x,y,vx,vy,dmg,type,life:3,animT:0});
}
function addDrop(x,y,id,n){
  if(!n) n=1;
  drops.push({x,y,vx:(Math.random()-0.5)*2,vy:-2-Math.random()*2,id,count:n,life:60*60,bobT:Math.random()*6});
}
function addParticle(x,y,vx,vy,color,life,size){
  particles.push({x,y,vx,vy,color,life,maxLife:life,size:size||2,grav:0.15});
}

// ==================== INPUT ====================
const keys={};
let touchMoveX=0;
const mouse={x:0,y:0,wx:0,wy:0,left:false,right:false,leftPressed:false,rightPressed:false};

addEventListener('keydown',e=>{
  keys[e.key.toLowerCase()]=true;
  const k=e.key.toLowerCase();
  if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(k)) e.preventDefault();
  if(e.key>='1'&&e.key<='9'){sel=parseInt(e.key)-1;updateHotbar()}
  if(e.key==='0'){sel=9;updateHotbar()}
  if(k==='c') toggleCraftPanel();
});
addEventListener('keyup',e=>{keys[e.key.toLowerCase()]=false});
addEventListener('blur',()=>{for(const k in keys) keys[k]=false});
addEventListener('wheel',e=>{
  if(craftOpen||chestOpen) return;
  e.preventDefault();
  sel=(sel+(e.deltaY>0?1:-1)+10)%10;
  updateHotbar();
},{passive:false});

function upMouse(cx,cy){
  const r=cvs.getBoundingClientRect();
  mouse.x=cx-r.left;
  mouse.y=cy-r.top;
  mouse.wx=Math.floor((mouse.x+camera.x)/TS);
  mouse.wy=Math.floor((mouse.y+camera.y)/TS);
}
cvs.addEventListener('mousemove',e=>upMouse(e.clientX,e.clientY));
cvs.addEventListener('mousedown',e=>{
  upMouse(e.clientX,e.clientY);
  if(e.button===0){mouse.left=true;mouse.leftPressed=true}
  if(e.button===2){mouse.right=true;mouse.rightPressed=true}
});
cvs.addEventListener('mouseup',e=>{
  if(e.button===0) mouse.left=false;
  if(e.button===2) mouse.right=false;
});
cvs.addEventListener('contextmenu',e=>e.preventDefault());
cvs.addEventListener('touchstart',e=>{
  e.preventDefault();
  const t=e.touches[0];upMouse(t.clientX,t.clientY);
  mouse.left=true;mouse.leftPressed=true;
},{passive:false});
cvs.addEventListener('touchmove',e=>{
  e.preventDefault();
  const t=e.touches[0];upMouse(t.clientX,t.clientY);
},{passive:false});
cvs.addEventListener('touchend',e=>{e.preventDefault();mouse.left=false},{passive:false});

function setupTouch(){
  const bind=(id,on,off)=>{
    const el=document.getElementById(id);
    ['touchstart','mousedown'].forEach(ev=>el.addEventListener(ev,e=>{e.preventDefault();on()}));
    if(off)['touchend','touchcancel','mouseup','mouseleave'].forEach(ev=>el.addEventListener(ev,e=>{e.preventDefault();off()}));
  };
  bind('btnLeft',()=>touchMoveX=-1,()=>touchMoveX=0);
  bind('btnRight',()=>touchMoveX=1,()=>touchMoveX=0);
  bind('btnJump',()=>{keys[' ']=true;setTimeout(()=>keys[' ']=false,120)});
  bind('btnUse',()=>{mouse.left=true;mouse.leftPressed=true;setTimeout(()=>mouse.left=false,80)});
}
setupTouch();

// ==================== ÇARPIŞMA ====================
function collide(e){
  e._hitWall=false;
  if(e.vx!==0){
    const nx=e.x+e.vx,dir=e.vx>0?1:-1;
    const edge=dir>0?nx+e.w:nx;
    const tx=Math.floor(edge/TS);
    const ty1=Math.floor(e.y/TS),ty2=Math.floor((e.y+e.h-1)/TS);
    let hit=false;
    for(let ty=ty1;ty<=ty2;ty++){if(isSolid(wGet(tx,ty))){hit=true;break}}
    if(hit){e.x=dir>0?tx*TS-e.w:(tx+1)*TS;e.vx=0;e._hitWall=true}
    else e.x=nx;
  }
  e.onGround=false;
  if(e.vy!==0){
    const ny=e.y+e.vy,dir=e.vy>0?1:-1;
    const edge=dir>0?ny+e.h:ny;
    const ty=Math.floor(edge/TS);
    const tx1=Math.floor(e.x/TS),tx2=Math.floor((e.x+e.w-1)/TS);
    let hit=false;
    for(let tx=tx1;tx<=tx2;tx++){
      const t=wGet(tx,ty);
      if(isSolid(t) || (dir>0 && isPlatform(t) && e.vy>0 && (e.y+e.h)<=ty*TS+2)){
        hit=true;break;
      }
    }
    if(hit){
      if(dir>0){e.y=ty*TS-e.h;e.onGround=true}
      else e.y=(ty+1)*TS;
      e.vy=0;
    } else e.y=ny;
  }
}

function rectHit(ax,ay,aw,ah,bx,by,bw,bh){
  return ax<bx+bw&&ax+aw>bx&&ay<by+bh&&ay+ah>by;
}

// ==================== SES ====================
let audioCtx=null;
function beep(freq,dur,type,vol){
  type=type||'square';vol=vol||0.03;
  try{
    if(!audioCtx) audioCtx=new (window.AudioContext||window.webkitAudioContext)();
    const o=audioCtx.createOscillator(),g=audioCtx.createGain();
    o.type=type;o.frequency.value=freq;g.gain.value=vol;
    o.connect(g);g.connect(audioCtx.destination);o.start();
    g.gain.exponentialRampToValueAtTime(0.001,audioCtx.currentTime+dur);
    o.stop(audioCtx.currentTime+dur);
  }catch(e){}
}

// ==================== IŞIK ====================
function getDayLight(){
  const t=worldTime%DAY_LEN;
  if(t<10) return t/10;
  if(t<110) return 1;
  if(t<130) return 1-(t-110)/20;
  if(t<230) return 0;
  return (t-230)/10;
}

// ==================== UI ====================
function updateHotbar(){
  const hb=document.getElementById('hotbar');
  if(hb.children.length!==10){
    hb.innerHTML='';
    for(let i=0;i<10;i++){
      const s=document.createElement('div');
      s.className='slot';
      s.innerHTML='<span class="key">'+(i===9?'0':(i+1))+'</span><span class="count"></span>';
      s.dataset.i=i;
      s.addEventListener('click',()=>{sel=i;updateHotbar()});
      s.addEventListener('mouseenter',e=>showItemTip(e,i));
      s.addEventListener('mouseleave',()=>{document.getElementById('tooltip').style.display='none'});
      hb.appendChild(s);
    }
  }
  for(let i=0;i<10;i++){
    const s=hb.children[i];
    s.classList.toggle('active',i===sel);
    const inv=INV[i];
    const cnt=s.querySelector('.count');
    const oldIcon=s.querySelector('canvas');
    if(oldIcon) oldIcon.remove();
    if(inv.id>0&&inv.count>0){
      const ic=document.createElement('canvas');
      ic.width=32;ic.height=32;
      drawItemIcon(ic.getContext('2d'),inv.id,32);
      s.insertBefore(ic,cnt);
      cnt.textContent=inv.count>1?inv.count:'';
    } else cnt.textContent='';
  }
}
function showItemTip(e,i){
  const inv=INV[i];
  if(!inv.id) return;
  const info=itemInfo(inv.id);
  const tip=document.getElementById('tooltip');
  let desc='';
  if(info.type==='block') desc='Blok • Yerleştirilebilir';
  else if(info.type==='pick') desc='Kazma • Güç: '+info.power;
  else if(info.type==='axe') desc='Balta • Güç: '+info.power;
  else if(info.type==='sword') desc='Kılıç • Hasar: '+info.dmg;
  else if(info.type==='bow') desc='Yay • Hasar: '+info.dmg;
  else if(info.type==='armor') desc='Zırh • Savunma: '+info.def;
  else if(info.type==='use') desc=info.heal?('Can +'+info.heal):('Mana +'+info.mana);
  else if(info.type==='mat') desc='Malzeme';
  else if(info.type==='summon') desc='BOSS ÇAĞIR (Sağ tık)';
  tip.innerHTML='<div class="name">'+info.n+'</div><div class="desc">'+desc+'</div>';
  const r=e.currentTarget.getBoundingClientRect();
  tip.style.left=Math.max(10,r.left)+'px';
  tip.style.top=Math.max(10,r.top-60)+'px';
  tip.style.display='block';
}

let toastT;
function showToast(msg){
  const t=document.getElementById('toast');
  t.textContent=msg;
  t.style.opacity='1';
  clearTimeout(toastT);
  toastT=setTimeout(()=>t.style.opacity='0',1800);
}
function updateStatsUI(){
  document.getElementById('hpFill').style.width=(P.hp/P.maxHp*100)+'%';
  document.getElementById('hpTxt').textContent=Math.ceil(P.hp)+'/'+P.maxHp;
  document.getElementById('mpFill').style.width=(P.mp/P.maxMp*100)+'%';
  document.getElementById('mpTxt').textContent=Math.ceil(P.mp)+'/'+P.maxMp;
}
function updateBossUI(){
  const b=document.getElementById('bossBar');
  if(bossActive&&boss&&boss.hp>0){
    b.style.display='block';
    document.getElementById('bossFill').style.width=(boss.hp/boss.maxHp*100)+'%';
  } else b.style.display='none';
}

// ==================== İTEM İKON ÇİZİMİ ====================
function drawItemIcon(c,id,size){
  c.clearRect(0,0,size,size);
  const info=itemInfo(id);
  const s=size/16;
  if(id>=1&&id<100&&TI[id]){
    const t=TI[id];
    c.fillStyle=t.c;
    c.fillRect(2*s,2*s,12*s,12*s);
    if(t.top){c.fillStyle=t.top;c.fillRect(2*s,2*s,12*s,3*s)}
    if(t.ore){
      c.fillStyle=t.ore;
      for(let i=0;i<4;i++){
        const px=3*s+((i*3)%8)*s,py=4*s+((i*5)%6)*s;
        c.fillRect(px,py,2*s,2*s);
      }
    }
    if(id===TORCH){
      c.fillStyle='#6b3f1a';c.fillRect(7*s,6*s,2*s,8*s);
      c.fillStyle='#ffee55';c.beginPath();c.arc(8*s,4*s,2.5*s,0,Math.PI*2);c.fill();
    }
    if(id===WATER){c.fillStyle='rgba(42,90,154,0.8)';c.fillRect(2*s,2*s,12*s,12*s)}
    if(id===LAVA){
      c.fillStyle='#e04a1a';c.fillRect(2*s,2*s,12*s,12*s);
      c.fillStyle='#ffaa22';c.beginPath();c.arc(8*s,8*s,3*s,0,Math.PI*2);c.fill();
    }
    if(id===GLASS){c.fillStyle='rgba(200,230,255,0.4)';c.fillRect(2*s,2*s,12*s,12*s);c.strokeStyle='#88a';c.lineWidth=1;c.strokeRect(2*s,2*s,12*s,12*s)}
  } else {
    if(id===I_COPPER_PICK||id===I_IRON_PICK||id===I_GOLD_PICK){
      const col=id===I_COPPER_PICK?'#8a5a3a':id===I_IRON_PICK?'#c8a888':'#ffe080';
      c.strokeStyle='#6a4a2a';c.lineWidth=2*s;
      c.beginPath();c.moveTo(4*s,12*s);c.lineTo(11*s,5*s);c.stroke();
      c.strokeStyle=col;c.lineWidth=2*s;
      c.beginPath();c.moveTo(9*s,3*s);c.lineTo(13*s,7*s);c.stroke();
    } else if(id===I_COPPER_AXE||id===I_IRON_AXE){
      const col=id===I_COPPER_AXE?'#8a5a3a':'#c8a888';
      c.strokeStyle='#6a4a2a';c.lineWidth=2*s;
      c.beginPath();c.moveTo(4*s,12*s);c.lineTo(11*s,5*s);c.stroke();
      c.fillStyle=col;c.fillRect(10*s,3*s,5*s,4*s);
    } else if(id===I_WOOD_SWORD||id===I_IRON_SWORD||id===I_GOLD_SWORD){
      const col=id===I_WOOD_SWORD?'#a87a4a':id===I_IRON_SWORD?'#d8c8b8':'#ffe080';
      c.fillStyle='#6a4a2a';c.fillRect(7*s,11*s,2*s,3*s);
      c.fillStyle=col;c.fillRect(6*s,10*s,4*s,1*s);
      c.beginPath();c.moveTo(8*s,10*s);c.lineTo(8*s,2*s);c.lineTo(9*s,1*s);c.lineTo(9*s,10*s);c.closePath();c.fill();
    } else if(id===I_BOW||id===I_WOOD_BOW){
      c.strokeStyle='#8a6a3a';c.lineWidth=1.5*s;
      c.beginPath();c.arc(8*s,8*s,5*s,Math.PI*0.7,Math.PI*1.3);c.stroke();
      c.strokeStyle='#ddd';c.lineWidth=1*s;
      c.beginPath();c.moveTo(5*s,4*s);c.lineTo(5*s,12*s);c.stroke();
    } else if(id===I_ARROW){
      c.strokeStyle='#8a6a3a';c.lineWidth=1.5*s;
      c.beginPath();c.moveTo(3*s,13*s);c.lineTo(11*s,5*s);c.stroke();
      c.fillStyle='#ccc';c.beginPath();
      c.moveTo(13*s,3*s);c.lineTo(10*s,4*s);c.lineTo(12*s,6*s);c.closePath();c.fill();
    } else if(id===I_HAMMER){
      c.strokeStyle='#6a4a2a';c.lineWidth=2*s;
      c.beginPath();c.moveTo(4*s,12*s);c.lineTo(11*s,5*s);c.stroke();
      c.fillStyle='#888';c.fillRect(9*s,2*s,5*s,4*s);
    } else if(id===I_IRON_HELM||id===I_GOLD_HELM){
      const col=id===I_IRON_HELM?'#a8a8b8':'#e8c050';
      c.fillStyle=col;c.beginPath();c.arc(8*s,8*s,5*s,Math.PI,0);c.fill();
      c.fillRect(3*s,8*s,10*s,3*s);
      c.fillStyle='#333';c.fillRect(5*s,6*s,2*s,2*s);c.fillRect(9*s,6*s,2*s,2*s);
    } else if(id===I_IRON_CHEST||id===I_GOLD_CHEST){
      const col=id===I_IRON_CHEST?'#a8a8b8':'#e8c050';
      c.fillStyle=col;c.fillRect(3*s,4*s,10*s,9*s);
      c.fillStyle='rgba(0,0,0,0.2)';c.fillRect(3*s,8*s,10*s,1*s);
    } else if(id===I_IRON_LEGS||id===I_GOLD_LEGS){
      const col=id===I_IRON_LEGS?'#a8a8b8':'#e8c050';
      c.fillStyle=col;c.fillRect(4*s,3*s,8*s,3*s);
      c.fillRect(4*s,6*s,3*s,8*s);c.fillRect(9*s,6*s,3*s,8*s);
    } else if(id===I_HP_POTION||id===I_MP_POTION){
      const col=id===I_HP_POTION?'#ff4466':'#4488ff';
      c.fillStyle='#ddd';c.beginPath();c.arc(8*s,4*s,2*s,0,Math.PI*2);c.fill();
      c.fillStyle=col;c.beginPath();c.arc(8*s,8*s,4*s,0,Math.PI*2);c.fill();
      c.fillStyle='rgba(255,255,255,0.4)';c.beginPath();c.arc(6*s,7*s,1.5*s,0,Math.PI*2);c.fill();
    } else if(id===I_EYE_SUMMON){
      c.fillStyle='#ddd';c.beginPath();c.arc(8*s,8*s,5*s,0,Math.PI*2);c.fill();
      c.fillStyle='#cc2222';c.beginPath();c.arc(8*s,8*s,3*s,0,Math.PI*2);c.fill();
      c.fillStyle='#000';c.beginPath();c.arc(8*s,8*s,1.5*s,0,Math.PI*2);c.fill();
    } else if(id===I_GEL||id===I_IRON_BAR||id===I_GOLD_BAR||id===I_COPPER_BAR||id===I_SILVER_BAR||id===I_DEMONITE_BAR){
      c.fillStyle=info.c;c.beginPath();c.arc(8*s,8*s,4*s,0,Math.PI*2);c.fill();
      c.fillStyle='rgba(255,255,255,0.35)';c.beginPath();c.arc(6*s,6*s,1.5*s,0,Math.PI*2);c.fill();
    } else if(id===I_LENS){
      c.fillStyle='rgba(136,221,255,0.8)';c.beginPath();c.arc(8*s,8*s,5*s,0,Math.PI*2);c.fill();
      c.strokeStyle='#448';c.lineWidth=1*s;c.beginPath();c.arc(8*s,8*s,5*s,0,Math.PI*2);c.stroke();
    } else if(id===I_IRON_ORE_ITEM||id===I_SILVER_ORE_ITEM){
      c.fillStyle=info.c;c.beginPath();c.arc(8*s,8*s,4.5*s,0,Math.PI*2);c.fill();
      c.fillStyle='rgba(0,0,0,0.3)';
      for(let i=0;i<3;i++) c.fillRect((4+i*3)*s,5*s,2*s,2*s);
    } else {
      c.fillStyle=info.c;c.fillRect(4*s,4*s,8*s,8*s);
    }
  }
}

// ==================== CRAFTING ====================
const RECIPES=[
  {out:[I_WOOD_SWORD,1],cost:[[WOOD,3]],name:'Tahta Kılıç',station:null},
  {out:[I_WOOD_BOW,1],cost:[[WOOD,5]],name:'Tahta Yay',station:null},
  {out:[I_ARROW,5],cost:[[WOOD,1],[STONE,1]],name:'5x Ok',station:null},
  {out:[TORCH,3],cost:[[WOOD,1],[COAL,1]],name:'3x Meşale',station:null},
  {out:[BENCH,1],cost:[[WOOD,10]],name:'Çalışma Tezgahı',station:null},
  {out:[CAMPFIRE,1],cost:[[WOOD,10],[STONE,5]],name:'Kamp Ateşi',station:null},
  {out:[PLANK,4],cost:[[WOOD,1]],name:'4x Tahta',station:'bench'},
  {out:[DOOR,1],cost:[[PLANK,6]],name:'Kapı',station:'bench'},
  {out:[CHAIR,1],cost:[[PLANK,4]],name:'Sandalye',station:'bench'},
  {out:[TABLE,1],cost:[[PLANK,8]],name:'Masa',station:'bench'},
  {out:[PLATFORM,2],cost:[[PLANK,1]],name:'2x Platform',station:'bench'},
  {out:[CHEST,1],cost:[[PLANK,8],[I_IRON_BAR,2]],name:'Sandık',station:'bench'},
  {out:[FURNACE,1],cost:[[STONE,20],[WOOD,4],[TORCH,3]],name:'Fırın',station:'bench'},
  {out:[BOOKSHELF,1],cost:[[PLANK,20],[WOOD,10]],name:'Kitaplık',station:'bench'},
  {out:[I_COPPER_AXE,1],cost:[[I_COPPER_BAR,9],[WOOD,3]],name:'Bakır Balta',station:'bench'},
  {out:[I_IRON_AXE,1],cost:[[I_IRON_BAR,9],[WOOD,3]],name:'Demir Balta',station:'bench'},
  {out:[I_IRON_SWORD,1],cost:[[I_IRON_BAR,8],[WOOD,2]],name:'Demir Kılıç',station:'bench'},
  {out:[I_BOW,1],cost:[[WOOD,10],[I_IRON_BAR,3]],name:'Yay',station:'bench'},
  {out:[I_COPPER_BAR,1],cost:[[COPPER,3]],name:'Bakır Külçe',station:'furnace'},
  {out:[I_IRON_BAR,1],cost:[[IRON,3]],name:'Demir Külçe',station:'furnace'},
  {out:[I_SILVER_BAR,1],cost:[[SILVER,3]],name:'Gümüş Külçe',station:'furnace'},
  {out:[I_GOLD_BAR,1],cost:[[GOLD,4]],name:'Altın Külçe',station:'furnace'},
  {out:[I_DEMONITE_BAR,1],cost:[[DEMONITE,3]],name:'Demonite Külçe',station:'furnace'},
  {out:[GLASS,2],cost:[[SAND,2]],name:'2x Cam',station:'furnace'},
  {out:[I_HP_POTION,1],cost:[[I_GEL,3],[LEAVES,5]],name:'Can İksiri',station:'furnace'},
  {out:[I_MP_POTION,1],cost:[[I_GEL,3],[ICE,3]],name:'Mana İksiri',station:'furnace'},
  {out:[I_COPPER_PICK,1],cost:[[I_COPPER_BAR,12],[WOOD,3]],name:'Bakır Kazma',station:'anvil'},
  {out:[I_IRON_PICK,1],cost:[[I_IRON_BAR,12],[WOOD,3]],name:'Demir Kazma',station:'anvil'},
  {out:[I_GOLD_PICK,1],cost:[[I_GOLD_BAR,12],[WOOD,3]],name:'Altın Kazma',station:'anvil'},
  {out:[I_IRON_HELM,1],cost:[[I_IRON_BAR,15]],name:'Demir Kask',station:'anvil'},
  {out:[I_IRON_CHEST,1],cost:[[I_IRON_BAR,25]],name:'Demir Göğüslük',station:'anvil'},
  {out:[I_IRON_LEGS,1],cost:[[I_IRON_BAR,20]],name:'Demir Pantolon',station:'anvil'},
  {out:[I_GOLD_HELM,1],cost:[[I_GOLD_BAR,15]],name:'Altın Kask',station:'anvil'},
  {out:[I_GOLD_CHEST,1],cost:[[I_GOLD_BAR,25]],name:'Altın Göğüslük',station:'anvil'},
  {out:[I_GOLD_LEGS,1],cost:[[I_GOLD_BAR,20]],name:'Altın Pantolon',station:'anvil'},
  {out:[I_EYE_SUMMON,1],cost:[[I_LENS,6]],name:'Şüpheli Göz (BOSS)',station:'anvil'}
];

let craftOpen=false,chestOpen=false,openChest=null;
const chests={};

function nearStation(){
  const cx=Math.floor((P.x+P.w/2)/TS);
  const cy=Math.floor((P.y+P.h/2)/TS);
  const s=new Set();
  for(let dx=-5;dx<=5;dx++)for(let dy=-5;dy<=5;dy++){
    const t=wGet(cx+dx,cy+dy);
    if(TI[t]&&TI[t].station) s.add(TI[t].station);
  }
  return s;
}
function buildCraftUI(){
  const list=document.getElementById('recipeList');
  list.innerHTML='';
  const stations=nearStation();
  let shown=0;
  for(const r of RECIPES){
    if(r.station && !stations.has(r.station)) continue;
    shown++;
    const row=document.createElement('div');
    row.className='recipe';
    const outInfo=itemInfo(r.out[0]);
    const costStr=r.cost.map(([tid,n])=>n+'x '+itemInfo(tid).n).join(' + ');
    const can=canCraft(r);
    if(!can) row.classList.add('no');
    row.innerHTML='<div class="icon"></div><div class="give"><b>'+r.out[1]+'x '+outInfo.n+'</b><br><small>'+costStr+'</small></div>';
    const ic=document.createElement('canvas');
    ic.width=32;ic.height=32;
    drawItemIcon(ic.getContext('2d'),r.out[0],32);
    row.querySelector('.icon').appendChild(ic);
    row.addEventListener('click',()=>{
      if(canCraft(r)){doCraft(r);buildCraftUI();showToast('✓ Üretildi: '+r.name)}
      else showToast('✗ Yetersiz malzeme!');
    });
    list.appendChild(row);
  }
  if(shown===0){
    list.innerHTML='<div style="color:#aaa;font-size:12px;padding:10px">Yakında çalışma tezgahı/fırın/örs yok.</div>';
  }
}
function canCraft(r){
  for(const [id,n] of r.cost) if(invCount(id)<n) return false;
  return true;
}
function doCraft(r){
  for(const [id,n] of r.cost) invRemove(id,n);
  invAdd(r.out[0],r.out[1]);
  beep(600,0.08,'triangle',0.04);
}
function toggleCraftPanel(){
  craftOpen=!craftOpen;
  document.getElementById('craftPanel').style.display=craftOpen?'block':'none';
  if(craftOpen) buildCraftUI();
}
document.getElementById('craftBtn').addEventListener('click',toggleCraftPanel);
document.getElementById('closeCraft').addEventListener('click',()=>{
  craftOpen=false;
  document.getElementById('craftPanel').style.display='none';
});
document.getElementById('closeChest').addEventListener('click',closeChestUI);

function chestKey(x,y){return x+','+y}
function openChestUI(cx,cy){
  chestOpen=true;
  const k=chestKey(cx,cy);
  if(!chests[k]) chests[k]={cx,cy,items:Array(27).fill(null).map(()=>({id:0,count:0}))};
  openChest=chests[k];
  document.getElementById('chestPanel').style.display='block';
  renderChestUI();
}
function closeChestUI(){
  chestOpen=false;
  openChest=null;
  document.getElementById('chestPanel').style.display='none';
}
function renderChestUI(){
  if(!openChest) return;
  const cg=document.getElementById('chestGrid');
  const ig=document.getElementById('invGrid');
  cg.innerHTML='';ig.innerHTML='';
  for(let i=0;i<27;i++){
    const s=document.createElement('div');
    s.className='slot';
    s.style.width='42px';s.style.height='42px';
    const it=openChest.items[i];
    if(it&&it.id){
      const ic=document.createElement('canvas');
      ic.width=32;ic.height=32;
      drawItemIcon(ic.getContext('2d'),it.id,32);
      s.appendChild(ic);
      const c=document.createElement('span');
      c.className='count';
      c.textContent=it.count>1?it.count:'';
      s.appendChild(c);
    }
    s.addEventListener('click',()=>{
      if(it&&it.id){
        if(invAdd(it.id,it.count)){it.id=0;it.count=0;renderChestUI()}
      }
    });
    cg.appendChild(s);
  }
  for(let i=0;i<10;i++){
    const s=document.createElement('div');
    s.className='slot';
    s.style.width='42px';s.style.height='42px';
    const it=INV[i];
    if(it&&it.id){
      const ic=document.createElement('canvas');
      ic.width=32;ic.height=32;
      drawItemIcon(ic.getContext('2d'),it.id,32);
      s.appendChild(ic);
      const c=document.createElement('span');
      c.className='count';
      c.textContent=it.count>1?it.count:'';
      s.appendChild(c);
    }
    s.addEventListener('click',()=>{
      if(it&&it.id){
        for(let j=0;j<27;j++){
          if(!openChest.items[j].id){openChest.items[j]={id:it.id,count:it.count};it.id=0;it.count=0;break}
          else if(openChest.items[j].id===it.id){openChest.items[j].count+=it.count;it.id=0;it.count=0;break}
        }
        renderChestUI();updateHotbar();
      }
    });
    ig.appendChild(s);
  }
}

// ==================== SAVE/LOAD ====================
function saveGame(){
  try{
    const d={
      w:world.map(r=>Array.from(r)),
      l:liquid.map(r=>Array.from(r)),
      bw:bgWalls.map(r=>Array.from(r)),
      bm:Array.from(biomeMap),
      px:P.x,py:P.y,hp:P.hp,mp:P.mp,
      inv:INV,armor:ARMOR,chests,time:worldTime
    };
    localStorage.setItem('terraria_v1',JSON.stringify(d));
    showToast('💾 Kaydedildi!');
  }catch(e){showToast('❌ Hata: '+e.message)}
}
function loadGame(){
  try{
    const raw=localStorage.getItem('terraria_v1');
    if(!raw) return false;
    const d=JSON.parse(raw);
    world=d.w.map(r=>new Uint8Array(r));
    liquid=d.l.map(r=>new Uint8Array(r));
    bgWalls=d.bw.map(r=>new Uint8Array(r));
    biomeMap=new Uint8Array(d.bm);
    P.x=d.px;P.y=d.py;P.hp=d.hp;P.mp=d.mp;
    for(let i=0;i<10;i++) INV[i]=d.inv[i];
    ARMOR.helm=d.armor.helm;ARMOR.chest=d.armor.chest;ARMOR.legs=d.armor.legs;
    Object.assign(chests,d.chests||{});
    worldTime=d.time||30;
    updateHotbar();updateStatsUI();
    return true;
  }catch(e){console.error(e);return false}
}
document.getElementById('saveBtn').addEventListener('click',saveGame);

// ==================== UPDATE ====================
let spawnTimer=0;
function update(dt){
  worldTime+=dt;
  const moveL=keys['arrowleft']||keys['a']||touchMoveX<0;
  const moveR=keys['arrowright']||keys['d']||touchMoveX>0;
  const jumpK=keys['arrowup']||keys['w']||keys[' '];

  if(moveL){P.vx-=0.7;P.facing=-1}
  if(moveR){P.vx+=0.7;P.facing=1}
  if(!moveL&&!moveR) P.vx*=0.72;
  if(Math.abs(P.vx)>SPD) P.vx=SPD*Math.sign(P.vx);
  if(Math.abs(P.vx)<0.06) P.vx=0;
  if(jumpK&&P.onGround){P.vy=JUMP;P.onGround=false;beep(300,0.08,'square',0.03)}

  P.vy+=GRAV;
  if(P.vy>15) P.vy=15;
  collide(P);

  if(P.x<0){P.x=0;P.vx=0}
  if(P.x>W_W*TS-P.w){P.x=W_W*TS-P.w;P.vx=0}
  if(P.y>W_H*TS){
    P.hp-=1;
    P.x=100*TS;P.y=30*TS;P.vy=0;
    updateStatsUI();
  }
  P.animT+=Math.abs(P.vx)*dt;
  if(P.invuln>0) P.invuln-=dt;
  if(P.swing>0) P.swing-=dt;

  // Mana regen
  P.mana_regen+=dt;
  if(P.mana_regen>0.5){
    P.mana_regen=0;
    if(P.mp<P.maxMp){P.mp=Math.min(P.maxMp,P.mp+1);updateStatsUI()}
  }

  // Su/lav içinde mi
  const ptx=Math.floor((P.x+P.w/2)/TS);
  const pty=Math.floor((P.y+P.h/2)/TS);
  const pt=wGet(ptx,pty);
  P.inWater=(pt===WATER);
  if(pt===LAVA){
    if(P.invuln<=0){
      P.hp-=3;P.invuln=0.5;
      updateStatsUI();
    }
  }
  // Nefes
  if(P.inWater){
    P.breath-=dt*20;
    if(P.breath<0){P.breath=0;P.hp-=dt*5;updateStatsUI()}
  } else {
    P.breath=Math.min(100,P.breath+dt*30);
  }

  // Kamera
  const tX=P.x+P.w/2-VW/2;
  const tY=P.y+P.h/2-VH/2;
  camera.x+=(tX-camera.x)*0.14;
  camera.y+=(tY-camera.y)*0.14;
  if(camera.y<-60) camera.y=-60;
  if(camera.y>W_H*TS-VH) camera.y=W_H*TS-VH;
  if(camera.x<0) camera.x=0;
  if(camera.x>W_W*TS-VW) camera.x=W_W*TS-VW;
  if(camera.shake>0) camera.shake-=dt*3;

  mouse.wx=Math.floor((mouse.x+camera.x)/TS);
  mouse.wy=Math.floor((mouse.y+camera.y)/TS);

  // Mining / attacking
  handleMouse(dt);

  // Enemies
  updateEnemies(dt);

  // Projectiles
  updateProjectiles(dt);

  // Drops
  updateDrops(dt);

  // Particles
  updateParticles(dt);

  // Spawn enemies
  const dl=getDayLight();
  spawnTimer+=dt;
  if(dl<0.3 && spawnTimer>2.5 && enemies.length<25 && !bossActive){
    spawnTimer=0;
    const side=Math.random()<0.5?-1:1;
    const spx=P.x+side*(VW/2+80);
    if(spx>20 && spx<W_W*TS-20){
      for(let ty=0;ty<W_H;ty++){
        if(isSolid(wGet(Math.floor(spx/TS),ty))){
          const r=Math.random();
          let type='slime';
          if(r<0.35) type='slime';
          else if(r<0.7) type='zombie';
          else if(r<0.85) type='demon_eye';
          else type='bat';
          if(P.y/TS>110 && Math.random()<0.3) type='skeleton';
          spawnEnemy(type,spx,ty*TS-40);
          break;
        }
      }
    }
  }

  // Death
  if(P.hp<=0){
    P.hp=P.maxHp;P.mp=P.maxMp;
    P.x=100*TS;P.y=30*TS;
    P.vx=0;P.vy=0;
    enemies.length=0;
    boss=null;bossActive=false;
    showToast('💀 Öldün! Yeniden doğdun.');
    updateStatsUI();updateBossUI();
  }
  updateStatsUI();
  updateBossUI();
}

function handleMouse(dt){
  if(mouse.left){
    // Sword swing on enemy
    const item=INV[sel];
    const itemInfo2=item&&item.id?II[item.id]:null;
    const isWeapon=itemInfo2 && (itemInfo2.type==='sword'||itemInfo2.type==='bow');
    if(isWeapon){
      P.swing=0.2;
      const cx=P.x+P.w/2,cy=P.y+P.h/2;
      const tx=mouse.wx*TS+TS/2,ty=mouse.wy*TS+TS/2;
      if(itemInfo2.type==='sword' && mouse.leftPressed){
        for(const e of enemies){
          const ex=e.x+e.w/2,ey=e.y+e.h/2;
          if(Math.hypot(ex-cx,ey-cy)<TS*3.5 && Math.hypot(ex-tx,ey-ty)<TS*3.5){
            e.hp-=itemInfo2.dmg;e.hurtT=0.2;
            addParticle(ex,ey,(Math.random()-0.5)*3,-Math.random()*2,'#ff6666',0.5,2);
            if(e.hp<=0) killEnemy(e);
          }
        }
      }
      if(itemInfo2.type==='bow'){
        if(mouse.leftPressed && invCount(I_ARROW)>0){
          invRemove(I_ARROW,1);
          const dx=tx-cx,dy=ty-cy;
          const d=Math.hypot(dx,dy)||1;
          spawnProjectile('player',cx,cy,dx/d*8,dy/d*8,itemInfo2.dmg,'arrow');
          beep(700,0.06,'triangle',0.03);
        }
      }
      mouse.leftPressed=false;
      return;
    }
    // Mining
    if(mouse.wx>=0 && mouse.wx<W_W && mouse.wy>=0 && mouse.wy<W_H){
      const t=wGet(mouse.wx,mouse.wy);
      if(t!==AIR){
        const cx=P.x+P.w/2,cy=P.y+P.h/2;
        const tx=mouse.wx*TS+TS/2,ty=mouse.wy*TS+TS/2;
        const dist=Math.hypot(cx-tx,cy-ty);
        if(dist<TS*6){
          if(P.mineX!==mouse.wx||P.mineY!==mouse.wy){
            P.mineX=mouse.wx;P.mineY=mouse.wy;P.mineP=0;
          }
          const hardness=(TI[t]&&TI[t].hard)||1;
          P.mineP+=dt/hardness;
          if(P.mineP>=0.55){
            breakTile(mouse.wx,mouse.wy,t);
            P.mineP=0;
          }
        }
      } else P.mineP=0;
    }
  } else P.mineP=0;

  // Place
  if(mouse.right && mouse.rightPressed){
    mouse.rightPressed=false;
    if(mouse.wx>=0 && mouse.wx<W_W && mouse.wy>=0 && mouse.wy<W_H){
      // Check interaction first
      const t=wGet(mouse.wx,mouse.wy);
      if(TI[t]&&TI[t].interact==='chest'){
        openChestUI(mouse.wx,mouse.wy);
        return;
      }
      if(TI[t]&&TI[t].interact==='summon'){
        // Spawn boss
        if(!bossActive){
          spawnEnemy('eye_boss',P.x,P.y-150);
          showToast('👁️ Cthulhu\'nun Gözü uyandı!');
          beep(80,1.0,'sawtooth',0.1);
        }
        return;
      }
      // Place block
      const item=INV[sel];
      if(item&&item.id>0&&item.id<100){
        if(wGet(mouse.wx,mouse.wy)===AIR){
          const cx=P.x+P.w/2,cy=P.y+P.h/2;
          const tx=mouse.wx*TS+TS/2,ty=mouse.wy*TS+TS/2;
          const dist=Math.hypot(cx-tx,cy-ty);
          if(dist<TS*6){
            const willSolid=isSolid(item.id);
            const px=mouse.wx*TS,py=mouse.wy*TS;
            if(!(willSolid && rectHit(px,py,TS,TS,P.x,P.y,P.w,P.h))){
              wSet(mouse.wx,mouse.wy,item.id);
              item.count--;
              if(item.count<=0) item.id=0;
              updateHotbar();
              beep(500,0.05,'triangle',0.02);
            }
          }
        }
      } else if(item&&item.id>=100){
        // Use consumable
        const info=II[item.id];
        if(info&&info.type==='use'){
          if(info.heal){
            P.hp=Math.min(P.maxHp,P.hp+info.heal);
            showToast('❤️ +'+info.heal+' Can');
          } else if(info.mana){
            P.mp=Math.min(P.maxMp,P.mp+info.mana);
            showToast('✨ +'+info.mana+' Mana');
          }
          invRemove(item.id,1);
          updateStatsUI();
          beep(880,0.15,'sine',0.05);
        } else if(info&&info.type==='armor'){
          const slot=info.slot;
          if(ARMOR[slot]) invAdd(ARMOR[slot],1);
          ARMOR[slot]=item.id;
          invRemove(item.id,1);
          showToast('🛡️ Kuşandın: '+info.n);
          beep(500,0.1,'triangle',0.05);
        }
      }
    }
  }
}

function breakTile(x,y,t){
  const info=TI[t];
  const col=info?info.c:'#888';
  for(let i=0;i<8;i++){
    addParticle(x*TS+TS/2,y*TS+TS/2,
      (Math.random()-0.5)*3.5,(Math.random()-0.5)*3.5-1.2,
      col,0.5+Math.random()*0.3,2);
  }
  // Drops
  if(t===GRASS||t===JUNGLE||t===EBONGRASS) addDrop(x*TS+TS/2,y*TS+TS/2,DIRT,1);
  else if(t===COAL) addDrop(x*TS+TS/2,y*TS+TS/2,COAL,1);
  else if(t===COPPER) addDrop(x*TS+TS/2,y*TS+TS/2,COPPER,1);
  else if(t===IRON) addDrop(x*TS+TS/2,y*TS+TS/2,IRON,1);
  else if(t===SILVER) addDrop(x*TS+TS/2,y*TS+TS/2,SILVER,1);
  else if(t===GOLD) addDrop(x*TS+TS/2,y*TS+TS/2,GOLD,1);
  else if(t===DIAMOND) addDrop(x*TS+TS/2,y*TS+TS/2,DIAMOND,1);
  else if(t===DEMONITE) addDrop(x*TS+TS/2,y*TS+TS/2,DEMONITE,1);
  else if(t===HELLSTONE) addDrop(x*TS+TS/2,y*TS+TS/2,HELLSTONE,1);
  else if(t===LEAVES) {/* no drop */}
  else if(t===CHEST){
    // Drop chest contents
    const k=chestKey(x,y);
    if(chests[k]){
      for(const it of chests[k].items){
        if(it.id) addDrop(x*TS+TS/2,y*TS+TS/2,it.id,it.count);
      }
      delete chests[k];
    }
    addDrop(x*TS+TS/2,y*TS+TS/2,CHEST,1);
  }
  else if(t!==AIR) addDrop(x*TS+TS/2,y*TS+TS/2,t,1);
  wSet(x,y,AIR);
  beep(200+Math.random()*80,0.08,'square',0.04);
  // Grass below turns to dirt
  if(wGet(x,y-1)===GRASS) wSet(x,y-1,DIRT);
}

function killEnemy(e){
  const idx=enemies.indexOf(e);
  if(idx<0) return;
  if(e.type==='eye_boss'){
    bossActive=false;boss=null;
    // Big drops
    for(let i=0;i<15;i++) addDrop(e.x+e.w/2,e.y+e.h/2,I_DEMONITE_BAR,1);
    for(let i=0;i<30;i++) addDrop(e.x+e.w/2,e.y+e.h/2,I_GEL,1);
    showToast('👑 BOSS ÖLDÜ!');
    beep(1200,1.2,'sine',0.1);
  } else {
    if(e.type==='slime') addDrop(e.x+e.w/2,e.y+e.h/2,I_GEL,1+Math.floor(Math.random()*2));
    else if(e.type==='zombie') addDrop(e.x+e.w/2,e.y+e.h/2,I_IRON_ORE_ITEM,1);
    else if(e.type==='demon_eye') addDrop(e.x+e.w/2,e.y+e.h/2,I_LENS,1);
    else if(e.type==='skeleton') addDrop(e.x+e.w/2,e.y+e.h/2,I_SILVER_ORE_ITEM,1);
  }
  for(let i=0;i<10;i++){
    addParticle(e.x+e.w/2,e.y+e.h/2,(Math.random()-0.5)*5,(Math.random()-0.5)*5,'#ff6666',0.6,3);
  }
  enemies.splice(idx,1);
  beep(400,0.1,'square',0.05);
}

function updateEnemies(dt){
  const dl=getDayLight();
  for(let i=enemies.length-1;i>=0;i--){
    const e=enemies[i];
    const d=ENEMY_DEF[e.type];
    if(e.hurtT>0) e.hurtT-=dt;

    const dx=(P.x+P.w/2)-(e.x+e.w/2);
    const dy=(P.y+P.h/2)-(e.y+e.h/2);
    const dist=Math.hypot(dx,dy);

    if(e.fly){
      // Flying AI
      if(dist<500){
        const nx=dx/(dist||1),ny=dy/(dist||1);
        e.vx+=nx*d.spd*0.1;
        e.vy+=ny*d.spd*0.1;
        e.vx*=0.94;e.vy*=0.94;
        e.facing=dx<0?-1:1;
      } else {
        e.vx*=0.95;e.vy*=0.95;
      }
      e.x+=e.vx;e.y+=e.vy;
      // Bounce off solid
      if(isSolid(wGet(Math.floor(e.x/TS),Math.floor((e.y+e.h/2)/TS)))){
        e.vx*=-1;e.x+=e.vx*2;
      }
      if(isSolid(wGet(Math.floor((e.x+e.w/2)/TS),Math.floor(e.y/TS)))){
        e.vy*=-1;e.y+=e.vy*2;
      }
    } else {
      // Walking AI
      if(dist<500){
        if(dx<0){e.vx=-d.spd;e.facing=-1}
        else {e.vx=d.spd;e.facing=1}
      } else e.vx*=0.9;
      e.vy+=GRAV;
      if(e.vy>12) e.vy=12;
      e.jumpTimer-=dt;
      if(e.onGround&&(e._hitWall||(dist<150&&e.jumpTimer<=0&&Math.random()<0.05))){
        e.vy=d.jump;e.jumpTimer=0.6;
      }
      collide(e);
    }

    // Damage player
    if(P.invuln<=0 && rectHit(P.x,P.y,P.w,P.h,e.x,e.y,e.w,e.h)){
      const dmg=Math.max(1,d.dmg-armorDef());
      P.hp-=dmg;
      P.invuln=1.0;
      P.vx=Math.sign(P.x-e.x)*5;
      P.vy=-5;
      beep(150,0.2,'sawtooth',0.07);
      updateStatsUI();
    }
    // Zombies burn in day
    if(dl>0.85 && (e.type==='zombie'||e.type==='skeleton')){
      e.hp-=dt*4;
      if(Math.random()<0.4) addParticle(e.x+e.w/2,e.y,(Math.random()-0.5)*2,-1-Math.random(),'#ff8800',0.4,2);
      if(e.hp<=0){killEnemy(e);continue}
    }
    if(dl>0.95 && !d.boss){killEnemy(e);continue}
    if(Math.abs(e.x-P.x)>VW*3){killEnemy(e);continue}
    if(e.y>W_H*TS){killEnemy(e);continue}
  }
}

function updateProjectiles(dt){
  for(let i=projs.length-1;i>=0;i--){
    const p=projs[i];
    p.x+=p.vx;p.y+=p.vy;
    p.vy+=0.15;
    p.life-=dt;
    p.animT+=dt;
    // Hit solid
    if(isSolid(wGet(Math.floor(p.x/TS),Math.floor(p.y/TS)))){
      projs.splice(i,1);continue;
    }
    if(p.owner==='player'){
      for(const e of enemies){
        if(rectHit(p.x-3,p.y-3,6,6,e.x,e.y,e.w,e.h)){
          e.hp-=p.dmg;e.hurtT=0.2;
          addParticle(p.x,p.y,0,0,'#ff6666',0.4,3);
          if(e.hp<=0) killEnemy(e);
          projs.splice(i,1);break;
        }
      }
    }
    if(p.life<=0) projs.splice(i,1);
  }
}

function updateDrops(dt){
  for(let i=drops.length-1;i>=0;i--){
    const d=drops[i];
    d.vy+=0.35;
    if(d.vy>10) d.vy=10;
    // Simple collision
    const nx=d.x+d.vx;
    if(!isSolid(wGet(Math.floor(nx/TS),Math.floor(d.y/TS)))) d.x=nx;
    else d.vx*=-0.4;
    const ny=d.y+d.vy;
    const tx=Math.floor(d.x/TS);
    const ty=Math.floor(ny/TS);
    if(isSolid(wGet(tx,ty))){
      d.vy=0;d.y=ty*TS-4;
    } else d.y=ny;
    d.vx*=0.92;
    d.life-=dt;
    d.bobT+=dt*3;
    // Pickup
    if(Math.hypot(d.x-(P.x+P.w/2),d.y-(P.y+P.h/2))<TS*1.5 && d.life>0){
      if(invAdd(d.id,d.count)){
        drops.splice(i,1);
        beep(1000,0.04,'sine',0.02);
        continue;
      }
    }
    if(d.life<=0) drops.splice(i,1);
  }
}

function updateParticles(dt){
  for(let i=particles.length-1;i>=0;i--){
    const p=particles[i];
    p.x+=p.vx;p.y+=p.vy;
    p.vy+=p.grav;
    p.vx*=0.98;
    p.life-=dt;
    if(p.life<=0) particles.splice(i,1);
  }
}

// ==================== RENDER ====================
function lerpC(a,b,t){return [a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t]}
function rgb(c){return 'rgb('+(c[0]|0)+','+(c[1]|0)+','+(c[2]|0)+')'}

let starField=null;
function getStars(){
  if(!starField){
    starField=[];
    for(let i=0;i<160;i++){
      starField.push({x:h2(i,1,1),y:h2(i,2,1),s:h2(i,3,1)*2+0.5,b:h2(i,4,1)});
    }
  }
  return starField;
}

function drawBackground(){
  const dl=getDayLight();
  const top=lerpC([8,15,40],[70,140,220],dl);
  const bot=lerpC([20,30,55],[200,225,240],dl);
  const g=ctx.createLinearGradient(0,0,0,VH);
  g.addColorStop(0,rgb(top));
  g.addColorStop(1,rgb(bot));
  ctx.fillStyle=g;
  ctx.fillRect(0,0,VW,VH);
  if(dl<0.6){
    const alpha=(1-dl*1.66)*0.9;
    if(alpha>0){
      const stars=getStars();
      for(const s of stars){
        let sx=s.x*VW-camera.x*0.05;
        let sy=s.y*VH*0.8-camera.y*0.05;
        sx=((sx%VW)+VW)%VW;
        if(sy>-5 && sy<VH){
          ctx.fillStyle='rgba(255,255,255,'+(alpha*(0.5+s.b*0.5))+')';
          ctx.fillRect(sx,sy,s.s,s.s);
        }
      }
    }
  }
  const t=(worldTime%DAY_LEN)/DAY_LEN;
  const angle=t*Math.PI*2-Math.PI/2;
  const r=Math.min(VW,VH)*0.42;
  const cx=VW/2,cy=VH*0.65;
  const sx=cx+Math.cos(angle)*r;
  const sy=cy+Math.sin(angle)*r;
  if(sy<VH+60){
    const isDay=dl>0.5;
    ctx.fillStyle=isDay?'rgba(255,220,100,0.25)':'rgba(200,220,255,0.2)';
    ctx.beginPath();ctx.arc(sx,sy,isDay?45:35,0,Math.PI*2);ctx.fill();
    ctx.fillStyle=isDay?'#ffdd55':'#e8eeff';
    ctx.beginPath();ctx.arc(sx,sy,isDay?24:20,0,Math.PI*2);ctx.fill();
    if(!isDay){
      ctx.fillStyle='rgba(180,190,210,0.5)';
      ctx.beginPath();
      ctx.arc(sx-6,sy-4,5,0,Math.PI*2);
      ctx.arc(sx+5,sy+3,4,0,Math.PI*2);
      ctx.arc(sx+2,sy-8,3,0,Math.PI*2);
      ctx.fill();
    }
  }
  // Parallax hills
  ctx.fillStyle=rgb(lerpC([20,35,65],[90,140,90],dl*0.75));
  ctx.beginPath();
  ctx.moveTo(0,VH);
  const ho=-camera.x*0.25;
  const by=VH*0.75;
  for(let x=0;x<=VW;x+=8){
    const wx=x+ho;
    const y=by-(Math.sin(wx*0.008)*40+Math.sin(wx*0.02)*18);
    ctx.lineTo(x,y);
  }
  ctx.lineTo(VW,VH);ctx.closePath();ctx.fill();
  ctx.fillStyle=rgb(lerpC([15,28,55],[70,120,70],dl*0.85));
  ctx.beginPath();
  ctx.moveTo(0,VH);
  const ho2=-camera.x*0.45;
  const by2=VH*0.85;
  for(let x=0;x<=VW;x+=8){
    const wx=x+ho2;
    const y=by2-(Math.sin(wx*0.012+5)*28+Math.sin(wx*0.03+1)*14);
    ctx.lineTo(x,y);
  }
  ctx.lineTo(VW,VH);ctx.closePath();ctx.fill();
}

function drawWorld(){
  const x0=Math.max(0,Math.floor(camera.x/TS)-1);
  const x1=Math.min(W_W-1,Math.ceil((camera.x+VW)/TS)+1);
  const y0=Math.max(0,Math.floor(camera.y/TS)-1);
  const y1=Math.min(W_H-1,Math.ceil((camera.y+VH)/TS)+1);

  // Background walls
  for(let y=y0;y<=y1;y++){
    for(let x=x0;x<=x1;x++){
      if(bgWalls[y][x] && world[y][x]===AIR){
        const sx=Math.floor(x*TS-camera.x);
        const sy=Math.floor(y*TS-camera.y);
        ctx.fillStyle='rgba(40,25,15,0.55)';
        ctx.fillRect(sx,sy,TS,TS);
      }
    }
  }

  for(let y=y0;y<=y1;y++){
    for(let x=x0;x<=x1;x++){
      const t=world[y][x];
      if(t===AIR) continue;
      const sx=Math.floor(x*TS-camera.x);
      const sy=Math.floor(y*TS-camera.y);
      const info=TI[t];
      if(!info) continue;

      if(t===TORCH){
        ctx.fillStyle='#6b3f1a';
        ctx.fillRect(sx+6,sy+5,4,11);
        const fl=0.85+Math.random()*0.3;
        ctx.fillStyle='rgba(255,150,0,0.5)';
        ctx.beginPath();ctx.arc(sx+8,sy+5,7*fl,0,Math.PI*2);ctx.fill();
        ctx.fillStyle='#ffaa22';
        ctx.beginPath();ctx.arc(sx+8,sy+5,4*fl,0,Math.PI*2);ctx.fill();
        ctx.fillStyle='#ffee55';
        ctx.beginPath();ctx.arc(sx+8,sy+4,2*fl,0,Math.PI*2);ctx.fill();
        continue;
      }
      if(t===WATER||t===LAVA){
        ctx.fillStyle=t===WATER?'rgba(42,90,154,0.7)':'rgba(224,74,26,0.85)';
        ctx.fillRect(sx,sy,TS,TS);
        continue;
      }

      ctx.fillStyle=info.c;
      ctx.fillRect(sx,sy,TS,TS);

      if(t===GRASS||t===JUNGLE||t===EBONGRASS||t===SNOW){
        if(info.top){
          ctx.fillStyle=info.top;
          ctx.fillRect(sx,sy,TS,4);
        }
        ctx.fillStyle='rgba(0,0,0,0.15)';
        for(let i=0;i<3;i++){
          const px=sx+(h2(x,y,i)*12)|0;
          ctx.fillRect(px,sy+4,2,3);
        }
      } else if(t===LEAVES||t===ICE){
        ctx.fillStyle='rgba(0,0,0,0.18)';
        for(let i=0;i<5;i++){
          const px=sx+(h2(x,y,i)*TS)|0;
          const py=sy+(h2(x,y,i+10)*TS)|0;
          ctx.fillRect(px,py,3,3);
        }
      } else if(t===WOOD){
        ctx.fillStyle='rgba(0,0,0,0.2)';
        ctx.fillRect(sx+4,sy,1,TS);
        ctx.fillRect(sx+10,sy,1,TS);
      } else if(info.ore){
        ctx.fillStyle=info.ore;
        for(let i=0;i<4;i++){
          const px=sx+2+(h2(x,y,i)*11)|0;
          const py=sy+2+(h2(x,y,i+5)*11)|0;
          ctx.fillRect(px,py,3,3);
        }
      } else if(t===STONE||t===DIRT||t===SAND||t===MUD||t===EBONSTONE){
        ctx.fillStyle='rgba(0,0,0,0.08)';
        for(let i=0;i<4;i++){
          const px=sx+(h2(x,y,i)*14)|0;
          const py=sy+(h2(x,y,i+7)*14)|0;
          ctx.fillRect(px,py,2,2);
        }
      } else if(t===PLANK||t===BOOKSHELF){
        ctx.fillStyle='rgba(0,0,0,0.2)';
        ctx.fillRect(sx,sy+7,TS,1);
        ctx.fillRect(sx+7,sy,1,8);
        ctx.fillRect(sx+3,sy+8,1,8);
      } else if(t===BENCH||t===TABLE){
        ctx.fillStyle='#5a3a1a';
        ctx.fillRect(sx+1,sy+9,TS-2,2);
        ctx.fillRect(sx+2,sy+11,2,5);
        ctx.fillRect(sx+TS-4,sy+11,2,5);
        ctx.fillStyle='#a87a3a';
        ctx.fillRect(sx,sy+7,TS,3);
      } else if(t===FURNACE){
        ctx.fillStyle='#333';
        ctx.fillRect(sx+3,sy+6,TS-6,TS-8);
        ctx.fillStyle='#ff6622';
        ctx.fillRect(sx+5,sy+9,TS-10,4);
      } else if(t===CHEST){
        ctx.fillStyle='#6a3a1a';
        ctx.fillRect(sx+1,sy+4,TS-2,TS-6);
        ctx.fillStyle='#c9a227';
        ctx.fillRect(sx+6,sy+8,4,3);
        ctx.fillStyle='#3a1a0a';
        ctx.fillRect(sx+1,sy+4,TS-2,1);
      } else if(t===CACTUS){
        ctx.fillStyle='#3a8a3a';
        ctx.fillRect(sx+4,sy,8,TS);
        ctx.fillStyle='rgba(0,0,0,0.15)';
        ctx.fillRect(sx+6,sy+2,1,TS-4);
      } else if(t===CAMPFIRE){
        ctx.fillStyle='#5a3a1a';
        ctx.fillRect(sx+2,sy+10,TS-4,4);
        ctx.fillStyle='#ff6622';
        ctx.beginPath();ctx.arc(sx+8,sy+6,5,0,Math.PI*2);ctx.fill();
        ctx.fillStyle='#ffdd44';
        ctx.beginPath();ctx.arc(sx+8,sy+6,3,0,Math.PI*2);ctx.fill();
      }
    }
  }

  // Mining crack
  if(P.mineP>0 && P.mineX>=0){
    const sx=P.mineX*TS-camera.x;
    const sy=P.mineY*TS-camera.y;
    const p=Math.min(1,P.mineP/0.55);
    ctx.strokeStyle='rgba(0,0,0,'+(p*0.9)+')';
    ctx.lineWidth=1.5;
    ctx.beginPath();
    const cx=sx+TS/2,cy=sy+TS/2;
    ctx.moveTo(cx-6*p,cy-6*p);ctx.lineTo(cx+6*p,cy+6*p);
    ctx.moveTo(cx+6*p,cy-6*p);ctx.lineTo(cx-6*p,cy+6*p);
    ctx.moveTo(cx,cy-7*p);ctx.lineTo(cx-3*p,cy);
    ctx.stroke();
    ctx.fillStyle='rgba(0,0,0,0.7)';
    ctx.fillRect(sx,sy-8,TS,4);
    ctx.fillStyle='#00d4ff';
    ctx.fillRect(sx+1,sy-7,(TS-2)*p,2);
  }
  // Tile highlight
  if(mouse.wx>=0 && mouse.wx<W_W && mouse.wy>=0 && mouse.wy<W_H){
    const cx=P.x+P.w/2,cy=P.y+P.h/2;
    const tx=mouse.wx*TS+TS/2,ty=mouse.wy*TS+TS/2;
    if(Math.hypot(cx-tx,cy-ty)<TS*6){
      ctx.strokeStyle='rgba(255,255,255,0.6)';
      ctx.lineWidth=1;
      ctx.strokeRect(mouse.wx*TS-camera.x+0.5,mouse.wy*TS-camera.y+0.5,TS-1,TS-1);
    }
  }
}

function drawPlayer(){
  if(P.invuln>0 && Math.floor(P.invuln*22)%2===0) return;
  const sx=Math.floor(P.x-camera.x);
  const sy=Math.floor(P.y-camera.y);
  const walk=Math.abs(P.vx)>0.2?Math.sin(P.animT*3.5):0;
  ctx.fillStyle='rgba(0,0,0,0.35)';
  ctx.beginPath();ctx.ellipse(sx+P.w/2,sy+P.h+1,P.w/2,2.5,0,0,Math.PI*2);ctx.fill();
  ctx.fillStyle='#1a3a7a';
  ctx.fillRect(sx+1,sy+P.h-6+walk*2,4,6);
  ctx.fillRect(sx+P.w-5,sy+P.h-6-walk*2,4,6);
  ctx.fillStyle='#2266cc';
  ctx.fillRect(sx,sy+5,P.w,P.h-11);
  ctx.fillStyle='#0d1a33';
  ctx.fillRect(sx,sy+P.h-7,P.w,2);
  ctx.fillStyle='#f0c090';
  ctx.fillRect(sx,sy-2,P.w,8);
  ctx.fillStyle='#4a2208';
  ctx.fillRect(sx-1,sy-3,P.w+2,3);
  ctx.fillRect(sx+(P.facing>0?P.w-2:0),sy,2,4);
  ctx.fillStyle='#000';
  const ex=P.facing>0?sx+6:sx+3;
  ctx.fillRect(ex,sy+1,2,3);
  ctx.fillRect(ex+4,sy+1,2,3);
  // Arm holding item
  ctx.fillStyle='#f0c090';
  const ax=P.facing>0?sx+P.w-3:sx-1;
  ctx.fillRect(ax,sy+7,4,8);
  // Draw current item
  const item=INV[sel];
  if(item&&item.id){
    const ic=document.createElement('canvas');
    ic.width=16;ic.height=16;
    drawItemIcon(ic.getContext('2d'),item.id,16);
    const swing=P.swing>0?Math.sin((1-P.swing/0.2)*Math.PI)*0.8:0;
    ctx.save();
    ctx.translate(ax+2,sy+10);
    ctx.rotate(P.facing*swing);
    ctx.drawImage(ic,P.facing>0?2:-18,-8);
    ctx.restore();
  }
}

function drawEnemies(){
  for(const e of enemies){
    const sx=Math.floor(e.x-camera.x);
    const sy=Math.floor(e.y-camera.y);
    if(sx<-100||sx>VW+100||sy<-100||sy>VH+100) continue;
    ctx.fillStyle='rgba(0,0,0,0.3)';
    ctx.beginPath();ctx.ellipse(sx+e.w/2,sy+e.h+1,e.w/2,2.5,0,0,Math.PI*2);ctx.fill();

    if(e.hurtT>0){
      ctx.globalAlpha=0.7;
    }

    if(e.type==='slime'){
      const squash=e.onGround?1:0.82;
      const grad=ctx.createRadialGradient(sx+e.w/2,sy+e.h-3,1,sx+e.w/2,sy+e.h/2,e.w/2);
      grad.addColorStop(0,'#9df09d');grad.addColorStop(1,'#4a9a4a');
      ctx.fillStyle=grad;
      ctx.beginPath();
      ctx.ellipse(sx+e.w/2,sy+e.h-e.h*squash/2,e.w/2,e.h*squash/2,0,0,Math.PI*2);
      ctx.fill();
      ctx.fillStyle='#000';
      ctx.fillRect(sx+3,sy+3,2,2);
      ctx.fillRect(sx+e.w-5,sy+3,2,2);
      ctx.fillStyle='#fff';
      ctx.fillRect(sx+3,sy+1,3,2);
    } else if(e.type==='zombie'||e.type==='skeleton'){
      const walk=Math.abs(e.vx)>0.1?Math.sin(performance.now()*0.008):0;
      ctx.fillStyle=e.type==='zombie'?'#1a3a1a':'#3a3a5a';
      ctx.fillRect(sx+1,sy+e.h-6+walk*2,4,6);
      ctx.fillRect(sx+e.w-5,sy+e.h-6-walk*2,4,6);
      ctx.fillStyle=e.type==='zombie'?'#3a6a3a':'#d0d0c8';
      ctx.fillRect(sx,sy+5,e.w,e.h-11);
      ctx.fillStyle=e.type==='zombie'?'#8fc08f':'#f0f0e8';
      ctx.fillRect(sx+(e.facing>0?e.w:-3),sy+7,3,9);
      ctx.fillStyle=e.type==='zombie'?'#8fc08f':'#f0f0e8';
      ctx.fillRect(sx,sy-3,e.w,8);
      ctx.fillStyle=e.type==='zombie'?'#f00':'#333';
      const ex=e.facing>0?sx+6:sx+3;
      ctx.fillRect(ex,sy,2,2);
      ctx.fillRect(ex+4,sy,2,2);
    } else if(e.type==='demon_eye'||e.type==='eye_boss'){
      const isBoss=e.type==='eye_boss';
      const r=isBoss?35:8;
      const grad=ctx.createRadialGradient(sx+e.w/2,sy+e.h/2-r/4,1,sx+e.w/2,sy+e.h/2,r);
      grad.addColorStop(0,isBoss?'#ff8888':'#ee6666');
      grad.addColorStop(1,isBoss?'#660000':'#660000');
      ctx.fillStyle=grad;
      ctx.beginPath();ctx.arc(sx+e.w/2,sy+e.h/2,r,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#fff';
      ctx.beginPath();ctx.arc(sx+e.w/2,sy+e.h/2-r/4,r/2.2,0,Math.PI*2);ctx.fill();
      ctx.fillStyle='#000';
      const px=sx+e.w/2+Math.sign(P.x-e.x)*r/4;
      ctx.beginPath();ctx.arc(px,sy+e.h/2-r/4,r/4,0,Math.PI*2);ctx.fill();
      // Tentacles for boss
      if(isBoss){
        ctx.strokeStyle='#660000';ctx.lineWidth=3;
        for(let i=0;i<6;i++){
          const a=(i/6)*Math.PI*2+performance.now()*0.001;
          ctx.beginPath();
          ctx.moveTo(sx+e.w/2,sy+e.h/2+r/2);
          ctx.quadraticCurveTo(
            sx+e.w/2+Math.cos(a)*30,sy+e.h/2+r/2+Math.sin(a)*20,
            sx+e.w/2+Math.cos(a)*50,sy+e.h/2+r/2+Math.sin(a)*40
          );
          ctx.stroke();
        }
      }
    } else if(e.type==='bat'){
      const wing=Math.sin(performance.now()*0.02)*4;
      ctx.fillStyle='#6a3a5a';
      ctx.beginPath();
      ctx.moveTo(sx+e.w/2,sy+e.h/2);
      ctx.lineTo(sx-3,sy+e.h/2+wing);
      ctx.lineTo(sx+3,sy+e.h/2);
      ctx.lineTo(sx+e.w-3,sy+e.h/2);
      ctx.lineTo(sx+e.w+3,sy+e.h/2+wing);
      ctx.lineTo(sx+e.w/2,sy+e.h/2);
      ctx.closePath();ctx.fill();
      ctx.fillStyle='#2a1a3a';
      ctx.beginPath();ctx.arc(sx+e.w/2,sy+e.h/2,4,0,Math.PI*2);ctx.fill();
    }
    ctx.globalAlpha=1;

    if(e.hp<e.maxHp){
      const bw=e.w;
      ctx.fillStyle='rgba(0,0,0,0.7)';
      ctx.fillRect(sx,sy-6,bw,3);
      ctx.fillStyle='#e33';
      ctx.fillRect(sx,sy-6,bw*(e.hp/e.maxHp),3);
    }
  }
}

function drawProjectiles(){
  for(const p of projs){
    const sx=p.x-camera.x,sy=p.y-camera.y;
    const ang=Math.atan2(p.vy,p.vx);
    ctx.save();
    ctx.translate(sx,sy);
    ctx.rotate(ang);
    ctx.strokeStyle='#8a6a3a';ctx.lineWidth=2;
    ctx.beginPath();ctx.moveTo(-8,0);ctx.lineTo(4,0);ctx.stroke();
    ctx.fillStyle='#ccc';
    ctx.beginPath();ctx.moveTo(8,0);ctx.lineTo(4,-3);ctx.lineTo(4,3);ctx.closePath();ctx.fill();
    ctx.restore();
  }
}

function drawDrops(){
  for(const d of drops){
    const sx=Math.floor(d.x-camera.x);
    const sy=Math.floor(d.y-camera.y + Math.sin(d.bobT)*2);
    const ic=document.createElement('canvas');
    ic.width=16;ic.height=16;
    drawItemIcon(ic.getContext('2d'),d.id,16);
    const a=Math.min(1,d.life/2);
    ctx.globalAlpha=a;
    ctx.drawImage(ic,sx-8,sy-8,16,16);
    ctx.globalAlpha=1;
  }
}

function drawParticles(){
  for(const p of particles){
    const a=p.life/p.maxLife;
    ctx.globalAlpha=a;
    ctx.fillStyle=p.color;
    ctx.fillRect(p.x-camera.x|0,p.y-camera.y|0,p.size,p.size);
  }
  ctx.globalAlpha=1;
}

function drawLighting(){
  const dl=getDayLight();
  if(dl<0.92){
    const darkness=(1-dl)*0.75;
    ctx.fillStyle='rgba(5,10,30,'+darkness+')';
    ctx.fillRect(0,0,VW,VH);
  }
  ctx.save();
  ctx.globalCompositeOperation='lighter';
  const x0=Math.max(0,Math.floor(camera.x/TS)-6);
  const x1=Math.min(W_W-1,Math.ceil((camera.x+VW)/TS)+6);
  const y0=Math.max(0,Math.floor(camera.y/TS)-6);
  const y1=Math.min(W_H-1,Math.ceil((camera.y+VH)/TS)+6);
  for(let y=y0;y<=y1;y++){
    for(let x=x0;x<=x1;x++){
      const t=world[y][x];
      if(isLight(t)){
        const sx=x*TS+TS/2-camera.x;
        const sy=y*TS+TS/2-camera.y;
        const fl=0.9+Math.random()*0.2;
        const r=100*fl*(TI[t].light||1);
        const g=ctx.createRadialGradient(sx,sy,0,sx,sy,r);
        if(t===TORCH||t===CAMPFIRE){
          g.addColorStop(0,'rgba(255,200,100,0.6)');
          g.addColorStop(0.5,'rgba(255,140,40,0.25)');
          g.addColorStop(1,'rgba(255,80,0,0)');
        } else if(t===FURNACE||t===LAVA||t===HELLSTONE){
          g.addColorStop(0,'rgba(255,120,40,0.6)');
          g.addColorStop(0.5,'rgba(255,60,10,0.25)');
          g.addColorStop(1,'rgba(255,30,0,0)');
        } else {
          g.addColorStop(0,'rgba(255,240,180,0.5)');
          g.addColorStop(0.5,'rgba(255,220,120,0.2)');
          g.addColorStop(1,'rgba(255,200,80,0)');
        }
        ctx.fillStyle=g;
        ctx.fillRect(sx-r,sy-r,r*2,r*2);
      }
    }
  }
  // Player glow
  const psx=P.x+P.w/2-camera.x;
  const psy=P.y+P.h/2-camera.y;
  const pg=ctx.createRadialGradient(psx,psy,0,psx,psy,80);
  pg.addColorStop(0,'rgba(180,210,255,0.15)');
  pg.addColorStop(1,'rgba(180,210,255,0)');
  ctx.fillStyle=pg;
  ctx.fillRect(psx-80,psy-80,160,160);
  ctx.restore();
}

function render(){
  drawBackground();
  drawWorld();
  drawDrops();
  drawEnemies();
  drawProjectiles();
  drawPlayer();
  drawParticles();
  drawLighting();

  // Vignette
  const vg=ctx.createRadialGradient(VW/2,VH/2,Math.min(VW,VH)*0.35,VW/2,VH/2,Math.max(VW,VH)*0.75);
  vg.addColorStop(0,'rgba(0,0,0,0)');
  vg.addColorStop(1,'rgba(0,0,0,0.5)');
  ctx.fillStyle=vg;
  ctx.fillRect(0,0,VW,VH);

  // Crosshair
  if(mouse.x>0&&mouse.y>0){
    ctx.strokeStyle='rgba(255,255,255,0.7)';
    ctx.lineWidth=1;
    ctx.beginPath();
    ctx.moveTo(mouse.x-7,mouse.y);ctx.lineTo(mouse.x-3,mouse.y);
    ctx.moveTo(mouse.x+3,mouse.y);ctx.lineTo(mouse.x+7,mouse.y);
    ctx.moveTo(mouse.x,mouse.y-7);ctx.lineTo(mouse.x,mouse.y-3);
    ctx.moveTo(mouse.x,mouse.y+3);ctx.lineTo(mouse.x,mouse.y+7);
    ctx.stroke();
  }

  // Info
  const t=worldTime%DAY_LEN;
  const hour=Math.floor((t/DAY_LEN)*24+6)%24;
  const min=Math.floor(((t/DAY_LEN)*24*60)%60);
  const timeStr=String(hour).padStart(2,'0')+':'+String(min).padStart(2,'0');
  const isNight=getDayLight()<0.4;
  const biomeNames=['🌳 Orman','🏜️ Çöl','❄️ Kar','🌴 Vahşi','💀 Yozlaşma'];
  const ptx=Math.floor((P.x+P.w/2)/TS);
  const b=biomeMap[Math.max(0,Math.min(W_W-1,ptx))];
  document.getElementById('info').innerHTML=
    (isNight?'🌙':'☀️')+' '+timeStr+
    '<br>'+biomeNames[b]+
    '<br>📍 '+Math.floor(P.x/TS)+','+Math.floor(P.y/TS)+
    '<br>👾 '+enemies.length+
    '<br>🛡️ '+armorDef()+
    '<br>💧 '+Math.ceil(P.breath)+'%';
}

// ==================== INIT ====================
function init(){
  if(!loadGame()){
    genWorld();
    for(let y=0;y<W_H;y++){
      if(isSolid(wGet(50,y))){
        P.x=50*TS;
        P.y=(y-3)*TS;
        break;
      }
    }
  }
  camera.x=P.x-VW/2;
  camera.y=P.y-VH/2;
  updateHotbar();
  updateStatsUI();
  // Starting items
  if(invCount(I_COPPER_PICK)===0){
    invAdd(I_COPPER_PICK,1);
    invAdd(I_WOOD_SWORD,1);
    invAdd(I_COPPER_AXE,1);
    invAdd(I_HP_POTION,5);
    invAdd(TORCH,30);
    invAdd(PLANK,50);
    invAdd(BENCH,1);
  }
}

let lastT=performance.now();
function loop(now){
  let dt=(now-lastT)/1000;
  lastT=now;
  if(dt>0.1) dt=0.1;
  update(dt);
  render();
  requestAnimationFrame(loop);
}

init();
requestAnimationFrame(loop);

})();
