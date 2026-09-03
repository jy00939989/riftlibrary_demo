// Loading screen helpers
export function hideLoadingScreen() {
  const el = document.getElementById('loading-screen');
  if (!el) return;
  const bar = document.getElementById('loading-bar');
  if (bar) bar.style.width = '100%';
  const text = document.getElementById('loading-text');
  if (text) text.textContent = '馆门已开，欢迎回来。';
  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transition = 'opacity 0.4s';
    setTimeout(() => el.remove(), 400);
  }, 300);
}

export function updateLoadingScreen(pct, text) {
  const loadingBar = document.getElementById('loading-bar');
  const loadingText = document.getElementById('loading-text');
  if (loadingBar) loadingBar.style.width = pct + '%';
  if (loadingText && text) loadingText.textContent = text;
}
