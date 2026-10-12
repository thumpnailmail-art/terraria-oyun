// ==================== SABİTLER ====================
export const TILE = 32;
export const MAP_W = 80;
export const MAP_H = 72;

// ==================== TILE TÜRLERİ ====================
export const T = {
  GRASS: 0, DIRT: 1, TILLED: 2, WATERED: 3,
  WATER: 4, PATH: 5, SAND: 6, STONE: 7,
  WOOD: 8, SNOW: 9, ICE: 10, DEEP_WATER: 11,
  MINE_FLOOR: 12, MINE_WALL: 13, FLOWER_BED: 14
};

// ==================== OBJE TÜRLERİ ====================
export const O = {
  NONE: 0, TREE: 1, PINE_TREE: 2, ROCK: 3, WEED: 4, BUSH: 5,
  FLOWER: 6, MUSHROOM: 7, FORAGE: 8,
  BED: 9, SHIPPING_BIN: 10, HOUSE_BASE: 11,
  SHOP_BUILDING: 12, TOWN_HOUSE: 13, SIGN: 14,
  FENCE_H: 15, FENCE_V: 16, GATE: 17,
  LAMP_POST: 18, WELL: 19, MINE_ENTRANCE: 20,
  BRIDGE: 21, MAILBOX: 22, BARN: 23, COOP: 24,
  STUMP: 25, LOG: 26, ORE_NODE: 27, CRYSTAL: 28,
  STONE_PATH: 29, WOOD_PATH: 30
};

// ==================== MEVSİMLER ====================
export const SEASONS = [
  { id:0, name:'İlkbahar', icon:'🌸', skyTop:'#7ab8e8', skyBot:'#c8e8ff', grassTint:'#6aaa3a' },
  { id:1, name:'Yaz',      icon:'☀️', skyTop:'#4a9ac8', skyBot:'#ffe8a0', grassTint:'#7aba3a' },
  { id:2, name:'Sonbahar', icon:'🍂', skyTop:'#c88a4a', skyBot:'#ffd8a0', grassTint:'#a0803a' },
  { id:3, name:'Kış',      icon:'❄️', skyTop:'#7a9ab0', skyBot:'#d8e8f0', grassTint:'#e8eef0' }
];

// ==================== HAVA DURUMU ====================
export const WEATHER = {
  SUNNY:  { id:0, name:'Güneşli', icon:'☀️' },
  CLOUDY: { id:1, name:'Bulutlu', icon:'☁️' },
  RAINY:  { id:2, name:'Yağmurlu', icon:'🌧️' },
  STORMY: { id:3, name:'Fırtınalı', icon:'⛈️' },
  SNOWY:  { id:4, name:'Karlı', icon:'🌨️' }
};

// ==================== EŞYALAR ====================
// Kısa id'ler: kullandığımız her yerde string id kullanıyoruz
export const ITEMS = {
  // --- Aletler ---
  'hoe':        { name:'Çapa',         type:'tool', tool:'hoe',  desc:'Toprağı sürer' },
  'can':        { name:'Sulama Kabı',  type:'tool', tool:'can',  desc:'Ekinleri sular' },
  'axe':        { name:'Balta',        type:'tool', tool:'axe',  desc:'Ağaçları keser' },
  'pick':       { name:'Kazma',        type:'tool', tool:'pick', desc:'Kayaları kırar' },
  'scythe':     { name:'Orak',         type:'tool', tool:'scythe', desc:'Otları biçer' },
  'rod':        { name:'Olta',         type:'tool', tool:'rod',  desc:'Balık tutar' },

  // --- Tohumlar (İlkbahar) ---
  'seed_parsnip':     { name:'Şalgam Tohumu',     type:'seed', crop:'parsnip',     buy:20,  sell:10 },
  'seed_potato':      { name:'Patates Tohumu',    type:'seed', crop:'potato',      buy:50,  sell:25 },
  'seed_cauliflower': { name:'Karnabahar Tohumu', type:'seed', crop:'cauliflower', buy:80,  sell:40 },
  'seed_strawberry':  { name:'Çilek Tohumu',      type:'seed', crop:'strawberry',  buy:100, sell:50 },

  // --- Tohumlar (Yaz) ---
  'seed_melon':       { name:'Kavun Tohumu',      type:'seed', crop:'melon',       buy:80,  sell:40 },
  'seed_tomato':      { name:'Domates Tohumu',    type:'seed', crop:'tomato',      buy:50,  sell:25 },
  'seed_blueberry':   { name:'Yaban Mersini Tohumu', type:'seed', crop:'blueberry', buy:80, sell:40 },

  // --- Tohumlar (Sonbahar) ---
  'seed_pumpkin':     { name:'Balkabağı Tohumu',  type:'seed', crop:'pumpkin',     buy:100, sell:50 },
  'seed_corn':        { name:'Mısır Tohumu',      type:'seed', crop:'corn',        buy:150, sell:75 },
  'seed_eggplant':    { name:'Patlıcan Tohumu',   type:'seed', crop:'eggplant',    buy:20,  sell:10 },

  // --- Ürünler ---
  'parsnip':     { name:'Şalgam',     type:'crop', sell:35,  c:'#f0e090', season:0 },
  'potato':      { name:'Patates',    type:'crop', sell:80,  c:'#c8a080', season:0 },
  'cauliflower': { name:'Karnabahar', type:'crop', sell:175, c:'#f5f5e0', season:0 },
  'strawberry':  { name:'Çilek',      type:'crop', sell:120, c:'#e04060', season:0 },
  'melon':       { name:'Kavun',      type:'crop', sell:250, c:'#a8d858', season:1 },
  'tomato':      { name:'Domates',    type:'crop', sell:60,  c:'#e04040', season:1 },
  'blueberry':   { name:'Yaban Mersini', type:'crop', sell:50, c:'#5a4a9a', season:1 },
  'pumpkin':     { name:'Balkabağı',  type:'crop', sell:320, c:'#e08820', season:2 },
  'corn':        { name:'Mısır',      type:'crop', sell:50,  c:'#f0d040', season:2 },
  'eggplant':    { name:'Patlıcan',   type:'crop', sell:60,  c:'#6a2a5a', season:2 },

  // --- Toplayıcılık ---
  'daffodil':    { name:'Nergis',     type:'forage', sell:30, c:'#ffe050', season:0 },
  'leek':        { name:'Pırasa',     type:'forage', sell:60, c:'#a0d060', season:0 },
  'dandelion':   { name:'Karahindiba', type:'forage', sell:40, c:'#f0e050', season:0 },
  'spice_berry': { name:'Baharat Meyvesi', type:'forage', sell:80, c:'#d05030', season:1 },
  'grape':       { name:'Üzüm',       type:'forage', sell:80, c:'#8a4a9a', season:1 },
  'hazelnut':    { name:'Fındık',     type:'forage', sell:90, c:'#a07040', season:2 },
  'blackberry':  { name:'Böğürtlen',  type:'forage', sell:20, c:'#2a1a2a', season:2 },
  'mushroom':    { name:'Mantar',     type:'forage', sell:40, c:'#c04040', season:2 },
  'crocus':      { name:'Çiğdem',     type:'forage', sell:60, c:'#a060c0', season:3 },
  'crystal_fruit':{ name:'Kristal Meyve', type:'forage', sell:150, c:'#88e0d0', season:3 },

  // --- Balıklar ---
  'carp':        { name:'Sazan',      type:'fish', sell:30,  c:'#a08a60' },
  'sunfish':     { name:'Güneş Balığı', type:'fish', sell:60, c:'#f0c040' },
  'catfish':     { name:'Yayın Balığı', type:'fish', sell:100, c:'#5a4a3a' },
  'bass':        { name:'Levrek',     type:'fish', sell:80,  c:'#7a8a5a' },
  'salmon':      { name:'Somon',      type:'fish', sell:120, c:'#e07050' },
  'trout':       { name:'Alabalık',   type:'fish', sell:90,  c:'#a0c0a0' },

  // --- Malzemeler ---
  'wood':        { name:'Odun',       type:'mat', sell:5,   c:'#6b3f1a' },
  'stone':       { name:'Taş',        type:'mat', sell:3,   c:'#888888' },
  'fiber':       { name:'Lif',        type:'mat', sell:2,   c:'#7ac04a' },
  'clay':        { name:'Kil',        type:'mat', sell:10,  c:'#a06040' },
  'copper_ore':  { name:'Bakır Cevheri', type:'mat', sell:15, c:'#d47a4a' },
  'iron_ore':    { name:'Demir Cevheri',  type:'mat', sell:30, c:'#c89878' },
  'gold_ore':    { name:'Altın Cevheri',  type:'mat', sell:80, c:'#ffd860' },
  'coal':        { name:'Kömür',       type:'mat', sell:20,  c:'#2a2a2a' },
  'sap':         { name:'Özsu',        type:'mat', sell:3,   c:'#a0c040' },
  'mixed_seeds': { name:'Karışık Tohum', type:'seed', crop:'mixed', buy:0, sell:5 },
  'wild_horseradish': { name:'Yabanturpu', type:'forage', sell:50, c:'#f0e8c0', season:0 }
};

// ==================== EKİN BİLGİSİ ====================
// days: büyüme günü, regrow: kaç günde bir yeniden (0 = tek seferlik)
// stages: görsel aşama sayısı
export const CROPS = {
  parsnip:     { name:'Şalgam',     days:4,  regrow:0, season:0, stages:4, baseColor:'#f0e090' },
  potato:      { name:'Patates',    days:6,  regrow:0, season:0, stages:4, baseColor:'#c8a080' },
  cauliflower: { name:'Karnabahar', days:12, regrow:0, season:0, stages:5, baseColor:'#f5f5e0' },
  strawberry:  { name:'Çilek',      days:8,  regrow:4, season:0, stages:5, baseColor:'#e04060' },
  melon:       { name:'Kavun',      days:12, regrow:0, season:1, stages:5, baseColor:'#a8d858' },
  tomato:      { name:'Domates',    days:11, regrow:4, season:1, stages:5, baseColor:'#e04040' },
  blueberry:   { name:'Yaban Mersini', days:13, regrow:4, season:1, stages:5, baseColor:'#5a4a9a' },
  pumpkin:     { name:'Balkabağı',  days:13, regrow:0, season:2, stages:5, baseColor:'#e08820' },
  corn:        { name:'Mısır',      days:14, regrow:4, season:2, stages:5, baseColor:'#f0d040' },
  eggplant:    { name:'Patlıcan',   days:5,  regrow:5, season:2, stages:4, baseColor:'#6a2a5a' },
  mixed:       { name:'Karışık',    days:7,  regrow:0, season:-1, stages:4, baseColor:'#a0c040' }
};

// ==================== NPC'LER ====================
export const NPCS = {
  pierre: {
    name:'Pierre', role:'Dükkan',
    portrait:'🧑‍🌾', color:'#8a5a3a', hairColor:'#4a2a10',
    skinColor:'#f0c090', shirtColor:'#4a7ac0',
    greeting:[
      'Merhaba! Taze tohumlarım var!',
      'Bugün ne ekip biçiyorsun?',
      'Mahsullerini bana satabilirsin!'
    ],
    dialog:[
      'Bu mevsim için harika tohumlarım var.',
      'Şalgam mı? Güzel seçim!',
      'Karnabahar yetiştirmek sabır ister.'
    ]
  },
  robin: {
    name:'Robin', role:'Marangoz',
    portrait:'👩‍🔧', color:'#5a3a1a', hairColor:'#c85a2a',
    skinColor:'#f0c090', shirtColor:'#a05a3a',
    greeting:['Merhaba komşu!','Evini büyütmek ister misin?','Ağaç kesmek için baltanı kullan!'],
    dialog:['Odunun varsa her şeyi yapabilirim.','Ahşap işçiliği sanattır!']
  },
  marnie: {
    name:'Marnie', role:'Çiftçi',
    portrait:'👩‍🦰', color:'#8a4a4a', hairColor:'#e0a040',
    skinColor:'#f0c090', shirtColor:'#8ac04a',
    greeting:['Merhaba tatlım!','Hayvanlarım harika!','Çiftliğin nasıl gidiyor?'],
    dialog:['İlkbahar en güzel mevsim!','Tavuklarım yumurtladı bugün.']
  },
  willy: {
    name:'Willy', role:'Balıkçı',
    portrait:'🧔', color:'#3a5a7a', hairColor:'#5a4a3a',
    skinColor:'#d8a878', shirtColor:'#4a6a8a',
    greeting:['Denizler bereketli olsun!','Balık tutmayı sever misin?','Oltanı hazırla!'],
    dialog:['Bu gölde yayın balığı var.','Somon mevsimi yakında!']
  },
  lewis: {
    name:'Belediye Başkanı Lewis', role:'Başkan',
    portrait:'👴', color:'#3a3a5a', hairColor:'#a0a0a0',
    skinColor:'#f0c090', shirtColor:'#5a5a8a',
    greeting:['Vadiye hoş geldin!','Belediyemiz seninle gurur duyuyor.','Her şey yolunda mı?'],
    dialog:['Kasabamız küçük ama sıcak.','Yeni çiftçileri severiz.']
  }
};

// ==================== MAĞAZA STOKLARI ====================
export const SHOP_STOCK = {
  pierre: {
    spring: ['seed_parsnip','seed_potato','seed_cauliflower','seed_strawberry'],
    summer: ['seed_melon','seed_tomato','seed_blueberry'],
    fall:   ['seed_pumpkin','seed_corn','seed_eggplant'],
    winter: []
  }
};

// ==================== YARDIMCILAR ====================
export function itemInfo(id){
  return ITEMS[id] || { name:'?', type:'unknown' };
}

export function isTool(id){
  return ITEMS[id]?.type === 'tool';
}
export function isSeed(id){
  return ITEMS[id]?.type === 'seed';
}
export function isCrop(id){
  return ITEMS[id]?.type === 'crop';
}
export function isForage(id){
  return ITEMS[id]?.type === 'forage';
}
export function isFish(id){
  return ITEMS[id]?.type === 'fish';
}
export function isSellable(id){
  const t = ITEMS[id]?.type;
  return t === 'crop' || t === 'forage' || t === 'fish' || t === 'mat';
}
export function getSellPrice(id){
  return ITEMS[id]?.sell || 0;
}
