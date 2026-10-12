// ==================== SABİTLER ====================
export const TILE = 32;
export const MAP_W = 60, MAP_H = 50;
export const MINE_W = 30, MINE_H = 24;
export const MINE_LEVELS = 20;

export const T = {
  GRASS: 0, DIRT: 1, TILLED: 2, WATERED: 3, WATER: 4, PATH: 5, SAND: 6, WOOD: 7,
  STONE: 8, MINE_FLOOR: 9, MINE_WALL: 10, LADDER: 11, MINE_EXIT: 12
};

export const O = {
  NONE: 0, TREE: 1, PINE: 2, ROCK: 3, WEED: 4, FLOWER: 5,
  BED: 6, BIN: 7, HOUSE: 8, SHOP: 9, FENCE: 10, ORE_NODE: 11,
  MINE_ENTRANCE: 12, COOP: 13, BARN: 14, WELL: 15, KITCHEN: 16,
  SIGN: 17, LAMP: 18, CHICKEN: 19, COW: 20, HAY: 21
};

export const SEASONS = [
  { id:0, name:'İlkbahar', icon:'🌸', skyTop:'#7ab8e8', skyBot:'#c8e8ff', grass:'#6aaa3a' },
  { id:1, name:'Yaz',      icon:'☀️', skyTop:'#4a9ac8', skyBot:'#ffe8a0', grass:'#7aba3a' },
  { id:2, name:'Sonbahar', icon:'🍂', skyTop:'#c88a4a', skyBot:'#ffd8a0', grass:'#a0803a' },
  { id:3, name:'Kış',      icon:'❄️', skyTop:'#7a9ab0', skyBot:'#d8e8f0', grass:'#e8eef0' }
];

export const WEATHER = {
  SUNNY:0, CLOUDY:1, RAINY:2, STORMY:3, SNOWY:4
};

// ==================== EŞYALAR ====================
// type: tool, seed, crop, forage, fish, mat, animal, food, upgrade
export const ITEMS = {
  // ---- Aletler ----
  'hoe':       { name:'Çapa',       type:'tool', tool:'hoe',  tier:0 },
  'hoe_iron':  { name:'Demir Çapa', type:'tool', tool:'hoe',  tier:1 },
  'hoe_gold':  { name:'Altın Çapa', type:'tool', tool:'hoe',  tier:2 },
  'can':       { name:'Sulama Kabı', type:'tool', tool:'can', tier:0, cap:20 },
  'can_iron':  { name:'Demir Sulama', type:'tool', tool:'can', tier:1, cap:30 },
  'can_gold':  { name:'Altın Sulama', type:'tool', tool:'can', tier:2, cap:50 },
  'axe':       { name:'Balta',      type:'tool', tool:'axe',  tier:0 },
  'axe_iron':  { name:'Demir Balta',type:'tool', tool:'axe',  tier:1 },
  'axe_gold':  { name:'Altın Balta',type:'tool', tool:'axe',  tier:2 },
  'pick':      { name:'Kazma',      type:'tool', tool:'pick', tier:0 },
  'pick_iron': { name:'Demir Kazma',type:'tool', tool:'pick', tier:1 },
  'pick_gold': { name:'Altın Kazma',type:'tool', tool:'pick', tier:2 },
  'scythe':    { name:'Orak',       type:'tool', tool:'scythe', tier:0 },
  'rod':       { name:'Olta',       type:'tool', tool:'rod',  tier:0 },

  // ---- Tohumlar ----
  'seed_parsnip':     { name:'Şalgam Tohumu',     type:'seed', crop:'parsnip',     buy:20,  season:0 },
  'seed_potato':      { name:'Patates Tohumu',    type:'seed', crop:'potato',      buy:50,  season:0 },
  'seed_cauliflower': { name:'Karnabahar Tohumu', type:'seed', crop:'cauliflower', buy:80,  season:0 },
  'seed_strawberry':  { name:'Çilek Tohumu',      type:'seed', crop:'strawberry',  buy:100, season:0 },
  'seed_melon':       { name:'Kavun Tohumu',      type:'seed', crop:'melon',       buy:80,  season:1 },
  'seed_tomato':      { name:'Domates Tohumu',    type:'seed', crop:'tomato',      buy:50,  season:1 },
  'seed_blueberry':   { name:'Yaban Mersini Tohumu', type:'seed', crop:'blueberry', buy:80,  season:1 },
  'seed_pumpkin':     { name:'Balkabağı Tohumu',  type:'seed', crop:'pumpkin',     buy:100, season:2 },
  'seed_corn':        { name:'Mısır Tohumu',      type:'seed', crop:'corn',        buy:150, season:2 },
  'seed_eggplant':    { name:'Patlıcan Tohumu',   type:'seed', crop:'eggplant',    buy:20,  season:2 },

  // ---- Ürünler ----
  'parsnip':     { name:'Şalgam',     type:'crop', sell:35,  c:'#f0e090', season:0, energy:25 },
  'potato':      { name:'Patates',    type:'crop', sell:80,  c:'#c8a080', season:0, energy:25 },
  'cauliflower': { name:'Karnabahar', type:'crop', sell:175, c:'#f5f5e0', season:0, energy:75 },
  'strawberry':  { name:'Çilek',      type:'crop', sell:120, c:'#e04060', season:0, energy:50 },
  'melon':       { name:'Kavun',      type:'crop', sell:250, c:'#a8d858', season:1, energy:113 },
  'tomato':      { name:'Domates',    type:'crop', sell:60,  c:'#e04040', season:1, energy:20 },
  'blueberry':   { name:'Yaban Mersini', type:'crop', sell:50, c:'#5a4a9a', season:1, energy:25 },
  'pumpkin':     { name:'Balkabağı',  type:'crop', sell:320, c:'#e08820', season:2, energy:0 },
  'corn':        { name:'Mısır',      type:'crop', sell:50,  c:'#f0d040', season:2, energy:25 },
  'eggplant':    { name:'Patlıcan',   type:'crop', sell:60,  c:'#6a2a5a', season:2, energy:20 },

  // ---- Toplayıcılık ----
  'daffodil':    { name:'Nergis',     type:'forage', sell:30, c:'#ffe050', season:0, energy:13 },
  'leek':        { name:'Pırasa',     type:'forage', sell:60, c:'#a0d060', season:0, energy:40 },
  'spice_berry': { name:'Baharat Meyvesi', type:'forage', sell:80, c:'#d05030', season:1, energy:25 },
  'grape':       { name:'Üzüm',       type:'forage', sell:80, c:'#8a4a9a', season:1, energy:38 },
  'hazelnut':    { name:'Fındık',     type:'forage', sell:90, c:'#a07040', season:2, energy:30 },
  'mushroom':    { name:'Mantar',     type:'forage', sell:40, c:'#c04040', season:2, energy:38 },
  'crocus':      { name:'Çiğdem',     type:'forage', sell:60, c:'#a060c0', season:3, energy:0 },
  'crystal_fruit':{ name:'Kristal Meyve', type:'forage', sell:150, c:'#88e0d0', season:3, energy:125 },

  // ---- Balıklar ----
  'carp':        { name:'Sazan',      type:'fish', sell:30, c:'#a08a60', energy:13 },
  'sunfish':     { name:'Güneş Balığı', type:'fish', sell:60, c:'#f0c040', energy:13 },
  'catfish':     { name:'Yayın Balığı', type:'fish', sell:100, c:'#5a4a3a', energy:50 },
  'bass':        { name:'Levrek',     type:'fish', sell:80, c:'#7a8a5a', energy:50 },
  'trout':       { name:'Alabalık',   type:'fish', sell:90, c:'#a0c0a0', energy:38 },
  'salmon':      { name:'Somon',      type:'fish', sell:120, c:'#e07050', energy:63 },

  // ---- Hayvan Ürünleri ----
  'egg':         { name:'Yumurta',      type:'animal', sell:50,  c:'#f0e8c8', energy:25, edible:true },
  'large_egg':   { name:'Büyük Yumurta',type:'animal', sell:95,  c:'#ffe8a8', energy:38, edible:true },
  'milk':        { name:'Süt',          type:'animal', sell:125, c:'#f8f8f0', energy:38, edible:true },
  'large_milk':  { name:'Büyük Süt',    type:'animal', sell:190, c:'#fff8e8', energy:50, edible:true },

  // ---- Malzemeler ----
  'wood':        { name:'Odun',       type:'mat', sell:5,  c:'#6b3f1a' },
  'stone':       { name:'Taş',        type:'mat', sell:3,  c:'#888888' },
  'fiber':       { name:'Lif',        type:'mat', sell:2,  c:'#7ac04a' },
  'clay':        { name:'Kil',        type:'mat', sell:10, c:'#a06040' },
  'copper_ore':  { name:'Bakır Cevheri', type:'mat', sell:15, c:'#d47a4a' },
  'iron_ore':    { name:'Demir Cevheri',  type:'mat', sell:30, c:'#c89878' },
  'gold_ore':    { name:'Altın Cevheri',  type:'mat', sell:80, c:'#ffd860' },
  'coal':        { name:'Kömür',       type:'mat', sell:20, c:'#2a2a2a' },
  'copper_bar':  { name:'Bakır Külçe', type:'mat', sell:60, c:'#d47a4a' },
  'iron_bar':    { name:'Demir Külçe', type:'mat', sell:120, c:'#c89878' },
  'gold_bar':    { name:'Altın Külçe', type:'mat', sell:250, c:'#ffd860' },
  'hay':         { name:'Saman',       type:'mat', sell:5,  c:'#e8c878' },

  // ---- Yemekler ----
  'bread':       { name:'Ekmek',       type:'food', sell:60,  c:'#d4a870', energy:50, hp:15 },
  'fried_egg':   { name:'Sahanda Yumurta', type:'food', sell:70, c:'#ffd24a', energy:50, hp:20 },
  'salad':       { name:'Salata',      type:'food', sell:110, c:'#5aaa3a', energy:113, hp:25 },
  'cake':        { name:'Kek',         type:'food', sell:200, c:'#ffb0d0', energy:150, hp:50 },
  'cheese':      { name:'Peynir',      type:'food', sell:160, c:'#ffe088', energy:100, hp:30 },
  'pizza':       { name:'Pizza',       type:'food', sell:300, c:'#e8a850', energy:200, hp:75 }
};

// ==================== EKİN VERİLERİ ====================
export const CROPS = {
  parsnip:     { name:'Şalgam',     days:4,  regrow:0, c:'#f0e090' },
  potato:      { name:'Patates',    days:6,  regrow:0, c:'#c8a080' },
  cauliflower: { name:'Karnabahar', days:12, regrow:0, c:'#f5f5e0' },
  strawberry:  { name:'Çilek',      days:8,  regrow:4, c:'#e04060' },
  melon:       { name:'Kavun',      days:12, regrow:0, c:'#a8d858' },
  tomato:      { name:'Domates',    days:11, regrow:4, c:'#e04040' },
  blueberry:   { name:'Yaban Mersini', days:13, regrow:4, c:'#5a4a9a' },
  pumpkin:     { name:'Balkabağı',  days:13, regrow:0, c:'#e08820' },
  corn:        { name:'Mısır',      days:14, regrow:4, c:'#f0d040' },
  eggplant:    { name:'Patlıcan',   days:5,  regrow:5, c:'#6a2a5a' }
};

// ==================== YEMEK TARİFLERİ ====================
export const RECIPES = [
  { id:'bread',      name:'Ekmek',           ing:{'wheat':1}, energy:50, hp:15 },
  { id:'fried_egg',  name:'Sahanda Yumurta', ing:{'egg':1},   energy:50, hp:20 },
  { id:'salad',      name:'Salata',          ing:{'leek':1,'tomato':1}, energy:113, hp:25 },
  { id:'cheese',     name:'Peynir',          ing:{'milk':1},  energy:100, hp:30 },
  { id:'cake',       name:'Kek',             ing:{'egg':1,'milk':1,'wheat':1}, energy:150, hp:50 },
  { id:'pizza',      name:'Pizza',           ing:{'tomato':1,'cheese':1,'wheat':1}, energy:200, hp:75 }
];
// Basit tutmak için wheat'i buğday ekme olarak 'seed_wheat' yerine doğrudan mağazadan alınabilir yapalım

// ==================== NPC'LER ====================
export const NPCS = {
  pierre: {
    name:'Pierre', role:'Dükkan', portrait:'🧑‍🌾',
    skinColor:'#f0c090', shirtColor:'#4a7ac0', pantsColor:'#3a3a5a', hairColor:'#4a2a10',
    homeX:50, homeY:3, schedule:[
      { from:6*60, to:20*60, x:52, y:6, label:'Dükkan' },
      { from:20*60, to:26*60, x:52, y:4, label:'Ev' }
    ],
    greeting:['Merhaba! Taze tohumlarım var!','Bugün ne ekip biçiyorsun?','Mahsullerini bana satabilirsin!'],
    dialog:['Bu mevsim için harika tohumlarım var.','Karnabahar yetiştirmek sabır ister.','Alet yükseltmeleri için bana bak!']
  },
  robin: {
    name:'Robin', role:'Marangoz', portrait:'👩‍🔧',
    skinColor:'#f0c090', shirtColor:'#a05a3a', pantsColor:'#5a3a1a', hairColor:'#c85a2a',
    homeX:4, homeY:4, schedule:[
      { from:6*60, to:20*60, x:8, y:8, label:'Ev' },
      { from:20*60, to:26*60, x:5, y:5, label:'Yatak' }
    ],
    greeting:['Merhaba komşu!','Evini büyütmek ister misin?','Ağaç kesmek için baltanı kullan!'],
    dialog:['Odunun varsa her şeyi yapabilirim.','Ahşap işçiliği sanattır!']
  },
  marnie: {
    name:'Marnie', role:'Çiftçi', portrait:'👩‍🦰',
    skinColor:'#f0c090', shirtColor:'#8ac04a', pantsColor:'#5a3a1a', hairColor:'#e0a040',
    homeX:53, homeY:20, schedule:[
      { from:6*60, to:20*60, x:56, y:20, label:'Ahır' },
      { from:20*60, to:26*60, x:54, y:22, label:'Ev' }
    ],
    greeting:['Merhaba tatlım!','Hayvanlarım harika!','Çiftliğin nasıl gidiyor?'],
    dialog:['İlkbahar en güzel mevsim!','Tavuklarım yumurtladı bugün.','Hayvan almak için bana bak!']
  },
  willy: {
    name:'Willy', role:'Balıkçı', portrait:'🧔',
    skinColor:'#d8a878', shirtColor:'#4a6a8a', pantsColor:'#3a3a5a', hairColor:'#5a4a3a',
    homeX:44, homeY:44, schedule:[
      { from:6*60, to:20*60, x:8, y:38, label:'Gölet' },
      { from:20*60, to:26*60, x:45, y:45, label:'Ev' }
    ],
    greeting:['Denizler bereketli olsun!','Balık tutmayı sever misin?','Oltanı hazırla!'],
    dialog:['Bu gölde yayın balığı var.','Somon mevsimi yakında!','Oltanı suya doğru at!']
  },
  lewis: {
    name:'Lewis', role:'Başkan', portrait:'👴',
    skinColor:'#f0c090', shirtColor:'#5a5a8a', pantsColor:'#3a3a5a', hairColor:'#a0a0a0',
    homeX:24, homeY:44, schedule:[
      { from:6*60, to:20*60, x:26, y:42, label:'Belediye' },
      { from:20*60, to:26*60, x:25, y:45, label:'Ev' }
    ],
    greeting:['Vadiye hoş geldin!','Belediyemiz seninle gurur duyuyor.','Her şey yolunda mı?'],
    dialog:['Kasabamız küçük ama sıcak.','Yeni çiftçileri severiz.']
  },
  clint: {
    name:'Clint', role:'Demirci', portrait:'🧙‍♂️',
    skinColor:'#d8a878', shirtColor:'#8a3a2a', pantsColor:'#3a2a1a', hairColor:'#2a1a0a',
    homeX:36, homeY:6, schedule:[
      { from:6*60, to:20*60, x:37, y:6, label:'Demirci' },
      { from:20*60, to:26*60, x:36, y:7, label:'Ev' }
    ],
    greeting:['Selam çiftçi!','Aletlerini yükseltmek ister misin?','Cevherlerini bana getir!'],
    dialog:['Demir en sağlam metaldir.','Altın aletler hızlı çalışır.']
  }
};

// ==================== MAĞAZA STOKLARI ====================
export const SHOP = {
  pierre: {
    spring: ['seed_parsnip','seed_potato','seed_cauliflower','seed_strawberry'],
    summer: ['seed_melon','seed_tomato','seed_blueberry'],
    fall:   ['seed_pumpkin','seed_corn','seed_eggplant'],
    winter: []
  },
  marnie: {
    sell: ['hay','chicken','cow'] // özel: hayvanlar
  },
  clint: {
    upgrades: {
      'hoe': { 'hoe_iron':{ cost:2000, ore:{ 'copper_bar':5 } }, 'hoe_gold':{ cost:5000, ore:{ 'iron_bar':5 } } },
      'can': { 'can_iron':{ cost:2000, ore:{ 'copper_bar':5 } }, 'can_gold':{ cost:5000, ore:{ 'iron_bar':5 } } },
      'axe': { 'axe_iron':{ cost:2000, ore:{ 'copper_bar':5 } }, 'axe_gold':{ cost:5000, ore:{ 'iron_bar':5 } } },
      'pick':{ 'pick_iron':{ cost:2000, ore:{ 'copper_bar':5 } }, 'pick_gold':{ cost:5000, ore:{ 'iron_bar':5 } } }
    }
  }
};

// ==================== FİYATLAR ====================
export const PRICES = {
  chicken: 800,
  cow: 1500,
  hay: 50
};

// ==================== YARDIMCILAR ====================
export function itemInfo(id) {
  return ITEMS[id] || { name:'?', type:'unknown' };
}
export function getSeasonSeed(season) {
  const map = {
    0: ['seed_parsnip','seed_potato','seed_cauliflower','seed_strawberry'],
    1: ['seed_melon','seed_tomato','seed_blueberry'],
    2: ['seed_pumpkin','seed_corn','seed_eggplant'],
    3: []
  };
  return map[season] || [];
}
