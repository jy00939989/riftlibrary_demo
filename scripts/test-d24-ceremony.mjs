#!/usr/bin/env node
// D24 升阶仪式存储层集成测试（无浏览器环境，mock localStorage/DOM）
// 用法：node scripts/test-d24-ceremony.mjs

// ── 环境 mock（必须在动态 import 之前装好）──
const store = new Map();
globalThis.localStorage = {
  getItem: k => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: k => store.delete(k),
  clear: () => store.clear(),
  key: i => [...store.keys()][i] ?? null,
  get length() { return store.size; },
};
globalThis.document = {
  body: { style: {} },
  documentElement: { style: {} },
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener: () => {},
};
globalThis.window = globalThis;
// BGM 用的 Audio 桩：play() 永远 pending（不 reject），事件回调静默吞掉
globalThis.Audio = class {
  constructor(src) { this.src = src; this.volume = 1; this.loop = false; this.currentTime = 0; this.paused = true; }
  play() { return new Promise(() => {}); }
  pause() {}
  addEventListener() {}
  removeEventListener() {}
  setAttribute() {}
};

const { state } = await import('../js/state.js');
const storage = await import('../js/storage.js');
const { getStageThreshold, MAX_STAGE_LEVEL } = await import('../data/atmosphere.js');

let pass = 0, fail = 0;
function assert(cond, msg) {
  if (cond) { console.log(`  ✅ ${msg}`); pass++; }
  else { console.log(`  ❌ ${msg}`); fail++; }
}
function freshLibrary() {
  state.library.atmosphere = 0;
  state.library.stage = 1;
  state.library.focusLevel = 0;
  state.library.borrowLevel = 0;
  state.restorationLevel = 0;
  state.restorationUnlocked = false;
  state.musicRoom = { unlocked: false };
}

console.log('\n=== 1. 新档默认态 ===');
freshLibrary();
assert(state.library.stage === 1, '新档 stage 默认 = 1');
assert(storage.getLibraryStage() === 1, 'getLibraryStage() = 1');
assert(storage.canHoldStageCeremony() === false, '新档不可举行仪式');

console.log('\n=== 2. 新档完整旅程：0→400 氛围 + 双设施 Lv1 → 仪式 → 2 阶 ===');
freshLibrary();
let crossEvents = [];
storage.onStageCross(crossed => crossEvents.push(crossed));

// 2.1 分多次加氛围到 400（阈值 [400/900/2800/5600]）
const r1 = storage.addAtmosphere(200);
const r2 = storage.addAtmosphere(200);
assert(r1.crossed.length === 0 && r2.crossed.length === 0,
  '氛围到 400 不自动触发 crossed（D24：阶段落库，见证/庆典由升阶仪式接管）');
assert(storage.getLibraryStage() === 1, '阈值跨越后阶段仍 = 1（D24：落库不自动升阶）');
assert(storage.canHoldStageCeremony() === false, '缺设施时仪式按钮不可出（canHold=false）');

// 2.2 建缮写室 Lv1 + 借阅区 Lv1
state.library.focusLevel = 1;
state.library.borrowLevel = 1;
assert(storage.canHoldStageCeremony() === true, '设施齐备 + 氛围达标 → canHold=true');

// 2.3 举行仪式
crossEvents = [];
const result = storage.holdStageCeremony();
assert(result && result.prevLevel === 1 && result.newLevel === 2, '仪式返回 1→2');
assert(state.library.stage === 2, 'state.library.stage 落库 = 2');
assert(crossEvents.length === 1 && crossEvents[0][0] === 2, 'onStageCross 触发一次 [2]（庆典/馆长目标奖励链路）');
const saved = JSON.parse(store.get('riftlib_state_v2'));
assert(saved.library.stage === 2, 'localStorage 持久化 stage=2');

console.log('\n=== 3. 卡阶语义：高氛围低阶段，仪式补升 ===');
freshLibrary();
state.library.atmosphere = 950; // 阈值推导本该 3 阶
state.library.focusLevel = 1;
state.library.borrowLevel = 1;
assert(storage.getLibraryStage() === 1, 'stage=1 落库优先 → 仍是 1 阶（卡阶等待）');
assert(storage.canHoldStageCeremony() === true, '950 氛围满足 2 阶阈值 400 + 2 阶设施需求 → 可仪式');
assert(storage.holdStageCeremony().newLevel === 2, '仪式后升到 2 阶');
assert(storage.getLibraryStage() === 2, 'getLibraryStage() 现在 = 2');
// 2→3 需 900 氛围（已满足）+ 缮写室≥2/借阅区≥3/修复室已解锁（未满足）
assert(storage.canHoldStageCeremony() === false, '2→3 设施不齐（缮写室<2 / 借阅区<3 / 无修复室）→ 不可仪式');
state.library.focusLevel = 2;
state.library.borrowLevel = 3;
assert(storage.canHoldStageCeremony() === false, '仍缺修复室解锁 → 不可仪式');
state.restorationUnlocked = true;
assert(storage.canHoldStageCeremony() === true, '修复室解锁后 2→3 齐备 → 可仪式');

console.log('\n=== 4. 老档链路：stage 字段缺失回退 + 旧 crossed 庆典保留 ===');
freshLibrary();
delete state.library.stage;
let oldCross = [];
storage.onStageCross(crossed => oldCross.push(crossed));
state.library.atmosphere = 300;
storage.addAtmosphere(150); // 450 ≥ 400，无 stage 字段 → 回退推导升到 2 阶
assert(oldCross.length === 1 && oldCross[0][0] === 2, '老档（无 stage 字段）氛围跨阈仍触发 crossed=[2]（旧庆典链路保留）');
assert(storage.getLibraryStage() === 2, '老档回退推导 = 2 阶');
// 老档缺 stage 字段时氛围永远卡在「推导阶」，达不到「氛围≥下一阶阈值」，仪式只能等 migrateV5 定阶后走卡阶语义
state.library.atmosphere = 3000;
assert(storage.getLibraryStage() === 4, '氛围 3000 回退推导 = 4 阶');
assert(storage.canHoldStageCeremony() === false, '无 stage 字段时无法仪式 4→5（需 migrateV5 定阶后走卡阶）');

// 模拟 migrateV5 已定阶的老档（stage=3 落库 + 高氛围 = 卡阶等待）
freshLibrary();
state.library.stage = 3;
state.library.atmosphere = 3000;
state.library.focusLevel = 3;
state.library.borrowLevel = 4;
state.restorationUnlocked = true;
state.restorationLevel = 2;
state.musicRoom = { unlocked: true };
assert(storage.getLibraryStage() === 3, '已定阶老档按字段解析 = 3 阶（卡阶等待）');
assert(storage.canHoldStageCeremony() === true, '3→4 氛围 3000≥2800 + 设施全齐 → 可仪式');
assert(storage.holdStageCeremony().newLevel === 4, '仪式后落库 stage=4（不再回退）');
assert(storage.getLibraryStage() === 4, 'getLibraryStage() = 4');

console.log('\n=== 5. 边界 ===');
freshLibrary();
state.library.atmosphere = getStageThreshold(2) - 1; // 399
state.library.focusLevel = 7; state.library.borrowLevel = 7;
assert(storage.canHoldStageCeremony() === false, '氛围差 1 点（399/400）→ 不可仪式');
state.library.atmosphere = 999999;
state.library.stage = MAX_STAGE_LEVEL;
assert(storage.canHoldStageCeremony() === false, '满级 5 阶 → 不可仪式');
state.library.stage = 4;
assert(storage.getStageUpSnapshot().musicRoomUnlocked === false, '快照 musicRoomUnlocked=false（默认未解锁）');
state.musicRoom = { unlocked: true };
assert(storage.getStageUpSnapshot().musicRoomUnlocked === true, '快照 musicRoomUnlocked=true');

console.log('\n=== 结果 ===');
console.log(`通过：${pass} 项`);
console.log(`失败：${fail} 项`);
process.exit(fail > 0 ? 1 : 0);
