// Global toast notification
export function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  const bgClass = type === 'error' ? 'bg-red-800' : 'bg-ink/80';
  toast.className = `fixed bottom-8 left-1/2 -translate-x-1/2 px-4 py-2 ${bgClass} text-white rounded-full text-sm z-[200] animate-fade-in-up`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s';
    setTimeout(() => toast.remove(), 300);
  }, 2000);
}
