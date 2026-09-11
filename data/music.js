// 唱片库配置 —— 单一真源
// tier: always（常驻）/ ruined / cozy / stellar（氛围档位）/ any（独立唱片，购买即得）
// price: 0 = 到达档位后自然解锁；>0 = 需智慧之光购买
// requiresBook: 誊抄完成指定书籍后才开放购买

export const MUSIC_ROOM_UNLOCK_PRICE = 500;

export const TRACK_DEFS = [
  { id: 'theme',    name: '图书馆主题曲',   emoji: '🎵', tier: 'always',  price: 0,   file: 'audio/music/theme.mp3' },
  { id: 'ruin_a',   name: '荒废图书馆',     emoji: '🕯️', tier: 'ruined',  price: 0,   file: 'audio/music/ruined-library.mp3' },
  { id: 'ruin_b',   name: '荒废·长夜变奏',  emoji: '🌙', tier: 'ruined',  price: 200, file: 'audio/music/ruined-library-variation.mp3' },
  { id: 'cozy_a',   name: '城镇漫步',       emoji: '🏘️', tier: 'cozy',    price: 0,   file: 'audio/music/town-stroll.mp3' },
  { id: 'cozy_b',   name: '城镇·午后变奏',  emoji: '☀️', tier: 'cozy',    price: 200, file: 'audio/music/town-stroll-variation.mp3' },
  { id: 'star_a',   name: '星辰图书馆',     emoji: '🌟', tier: 'stellar', price: 0,   file: 'audio/music/starlight-library.mp3' },
  { id: 'star_b',   name: '星辰·圣堂咏叹',  emoji: '✨', tier: 'stellar', price: 200, file: 'audio/music/starlight-library-variation.mp3' },
  { id: 'winter',   name: '维瓦尔第·冬·意象曲', emoji: '🎻', tier: 'any', price: 500, file: 'audio/music/winter-reverie.mp3' },
  { id: 'spring',   name: '维瓦尔第·春·意象曲', emoji: '🌸', tier: 'any', price: 500, file: 'audio/music/spring-reverie.mp3' },
  { id: 'rhapsody', name: '蓝色狂想曲',     emoji: '🎷', tier: 'any',     price: 600, file: 'audio/music/rhapsody-jazz.mp3' },
  { id: 'lakespring', name: '湖边早春',     emoji: '🌅', tier: 'any',     price: 400, file: 'audio/music/lakeside-spring.mp3' },
  { id: 'arthur',   name: '湖边临终的亚瑟王', emoji: '🛶', tier: 'any',    price: 800, file: 'audio/music/arthur-lakeside.mp3', requiresBook: 'book_031' }
];
