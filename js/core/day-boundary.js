// @pure — testable in Node without DOM
// 日界单一真源（A1 重构，2026-09-11）：全项目「新的一天」判定与事件只在此模块。
// 触发点两处（app.js）：① 初始化链 initState 之后；② 60s tick（tickVisitors 同周期）。
// 订阅者模式与 onStageCross 同惯例；存量系统各自模块内 onNewDay 自注册。
//
// 语义契约：
// - 同日多次检测 → null，不触发（防双触发，失败信号 A）
// - 离线多天 → 下次检测只触发一次，prevDay=最后活跃日，不补发（冻结语义 A8，失败信号 C）
// - 订阅者抛错互相隔离，不影响其他订阅者与本函数返回

const listeners = new Set();

/** 本地日历日 key（toDateString 格式），全项目统一 */
export function getTodayKey(now = Date.now()) {
  return new Date(now).toDateString();
}

/** 日历昨日 key（setDate(-1)，非固定 -24h——夏令时安全，国内无时差） */
export function getPrevDayKey(now = Date.now()) {
  const d = new Date(now);
  d.setDate(d.getDate() - 1);
  return d.toDateString();
}

/** 订阅日界事件，返回退订函数 */
export function onNewDay(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/**
 * 检测日界跨越；跨越则落库 lastSeenDay 并通知订阅者。
 * @param {object} stateCtx 含 lastSeenDay 字段的状态上下文
 * @param {number} [now] 毫秒时间戳（可注入，测试用）
 * @returns {null | {prevDay: string|null, today: string}}
 */
export function checkDayRollover(stateCtx, now = Date.now()) {
  const today = getTodayKey(now);
  if (stateCtx.lastSeenDay === today) return null;
  const prevDay = stateCtx.lastSeenDay || null;
  stateCtx.lastSeenDay = today;
  const payload = { prevDay, today };
  listeners.forEach(cb => {
    try {
      cb(payload);
    } catch (e) {
      console.warn('[day-boundary] subscriber error', e);
    }
  });
  return payload;
}
