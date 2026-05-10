// 商店页面渲染（占位 —— 阶段五实现）
export function renderShopPage() {
  const container = document.getElementById('page-shop');
  if (!container) return;
  container.innerHTML = `
    <div class="parchment-bg rounded-2xl p-6 magic-glow">
      <h2 class="font-display text-xl font-bold mb-4">🛒 装饰商店</h2>
      <div class="text-center py-8 text-ink-light">
        <div class="text-5xl mb-3">🏗️</div>
        <p>完整商店系统正在建设中…</p>
        <p class="text-sm mt-1">预计包含书架扩容、借阅区升级等功能</p>
      </div>
    </div>
  `;
}
