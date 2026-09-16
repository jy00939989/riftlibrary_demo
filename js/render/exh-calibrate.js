// 展览厅热点校准工具 —— 仅本地开发使用（renderHallStage 里 localhost 才动态加载，生产零影响）
// 用法：展览厅底图上
//   Alt+点击  → 以点击处为该房间热点新中心，保持原 w/h/arch，生成 EXHIBITION_SPOTS 行并复制
//   Alt+拖拽  → 以拖出的框为该房间热点新 x/y/w/h，生成 EXHIBITION_SPOTS 行并复制
// 结果弹右下角浮层并写剪贴板，直接粘回 js/render/exhibition.js 的 EXHIBITION_SPOTS 表。

const OVERLAY_ID = 'exh-calib-overlay';

function isLocalDev() {
  try {
    return typeof location !== 'undefined' &&
      (location.hostname === 'localhost' || location.hostname === '127.0.0.1');
  } catch (e) { return false; }
}

function pct(stage, clientX, clientY) {
  const r = stage.getBoundingClientRect();
  return {
    x: +((clientX - r.left) / r.width * 100).toFixed(1),
    y: +((clientY - r.top) / r.height * 100).toFixed(1)
  };
}

function roomAt(stage, cx, cy) {
  const el = document.elementFromPoint(cx, cy);
  const spot = el && el.closest ? el.closest('.exh-spot') : null;
  return spot ? spot.dataset.room : null;
}

function formatLine(roomId, def) {
  const pad = (n) => String(n).padEnd(5);
  return `${roomId}: { x: ${pad(def.x)} y: ${pad(def.y)} w: ${pad(def.w)} h: ${pad(def.h)} arch: ${def.arch ? 'true ' : 'false'} },`;
}

function showResult(text) {
  let box = document.getElementById(OVERLAY_ID);
  if (!box) {
    box = document.createElement('div');
    box.id = OVERLAY_ID;
    box.style.cssText = 'position:fixed;right:12px;bottom:12px;z-index:999;background:#1a1410;color:#f5e6c8;font:12px/1.5 monospace;padding:10px 12px;border-radius:8px;border:1px solid #c9a227;max-width:90vw;white-space:pre;';
    document.body.appendChild(box);
  }
  box.textContent = `已复制 ✅\n${text}\n(Alt+点击=挪中心 / Alt+拖拽=画框)`;
  clearTimeout(box._timer);
  box._timer = setTimeout(() => box.remove(), 8000);
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).catch(() => {});
  }
}

export function attach(stage) {
  if (!isLocalDev() || !stage || stage.dataset.calibAttached) return;
  stage.dataset.calibAttached = '1';

  let dragStart = null;
  let rubber = null;

  function currentDefs() {
    // 从 DOM 现有热点反读定义，保证与渲染一致
    const defs = {};
    stage.querySelectorAll('.exh-spot').forEach(spot => {
      const roomId = spot.dataset.room;
      if (!roomId) return;
      defs[roomId] = {
        x: parseFloat(spot.style.left),
        y: parseFloat(spot.style.top),
        w: parseFloat(spot.style.width),
        h: parseFloat(spot.style.height),
        arch: spot.classList.contains('arch')
      };
    });
    return defs;
  }

  stage.addEventListener('mousedown', (e) => {
    if (!e.altKey) return;
    e.preventDefault();
    e.stopPropagation();
    dragStart = pct(stage, e.clientX, e.clientY);
    rubber = document.createElement('div');
    rubber.style.cssText = 'position:absolute;border:2px dashed #c9a227;background:rgba(201,162,39,0.15);z-index:50;pointer-events:none;';
    stage.appendChild(rubber);
  });

  stage.addEventListener('mousemove', (e) => {
    if (!dragStart || !rubber) return;
    const cur = pct(stage, e.clientX, e.clientY);
    const left = Math.min(dragStart.x, cur.x);
    const top = Math.min(dragStart.y, cur.y);
    const w = Math.abs(cur.x - dragStart.x);
    const h = Math.abs(cur.y - dragStart.y);
    rubber.style.left = left + '%';
    rubber.style.top = top + '%';
    rubber.style.width = w + '%';
    rubber.style.height = h + '%';
  });

  stage.addEventListener('mouseup', (e) => {
    if (!e.altKey) return;
    e.preventDefault();
    e.stopPropagation();
    const start = dragStart;
    dragStart = null;
    if (rubber) { rubber.remove(); rubber = null; }
    if (!start) return;

    const end = pct(stage, e.clientX, e.clientY);
    const moved = Math.abs(end.x - start.x) > 1 || Math.abs(end.y - start.y) > 1;
    const defs = currentDefs();

    if (!moved) {
      // Alt+点击：点击处成为该房间热点新中心（保持 w/h/arch）
      const roomId = roomAt(stage, e.clientX, e.clientY);
      if (!roomId || !defs[roomId]) {
        showResult(`点击处中心: cx=${end.x}, cy=${end.y}\n(未点在热点上，未生成房间行)`);
        return;
      }
      const def = defs[roomId];
      def.x = +(end.x - def.w / 2).toFixed(1);
      def.y = +(end.y - def.h / 2).toFixed(1);
      showResult(formatLine(roomId, def));
      return;
    }

    // Alt+拖拽：拖框成为该房间热点新几何
    const cx = (start.x + end.x) / 2;
    const cy = (start.y + end.y) / 2;
    const roomId = roomAt(stage, e.clientX, e.clientY)
      || roomAt(stage, stage.getBoundingClientRect().left + cx / 100 * stage.getBoundingClientRect().width,
                stage.getBoundingClientRect().top + cy / 100 * stage.getBoundingClientRect().height);
    const def = {
      x: +Math.min(start.x, end.x).toFixed(1),
      y: +Math.min(start.y, end.y).toFixed(1),
      w: +Math.abs(end.x - start.x).toFixed(1),
      h: +Math.abs(end.y - start.y).toFixed(1),
      arch: roomId && defs[roomId] ? defs[roomId].arch : true
    };
    showResult(roomId
      ? formatLine(roomId, def)
      : `${formatLine('roomId', def)}\n(未能识别房间，请自行替换 roomId 与 arch)`);
  });

  // 阻止校准操作触发热点本身的点击（打开房间/修复面板）
  stage.addEventListener('click', (e) => {
    if (e.altKey) { e.stopPropagation(); e.preventDefault(); }
  }, true);
}
