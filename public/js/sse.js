let eventSource = null;
let reconnectTimer = null;
const eventListeners = [];

function initSSE(onEvent) {
  if (eventSource) {
    eventSource.close();
  }

  const dot = document.getElementById('sse-status-dot');
  const text = document.getElementById('sse-status-text');

  try {
    eventSource = new EventSource('/api/events');

    eventSource.onopen = () => {
      if (dot) dot.classList.remove('offline');
      if (text) text.innerText = 'Trực tuyến';
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    };

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (onEvent) onEvent(payload);
        eventListeners.forEach((fn) => fn(payload));
      } catch (err) {
        console.error('Lỗi phân tích SSE message:', err);
      }
    };

    eventSource.onerror = () => {
      if (dot) dot.classList.add('offline');
      if (text) text.innerText = 'Mất kết nối';
      eventSource.close();
      if (!reconnectTimer) {
        reconnectTimer = setTimeout(() => {
          initSSE(onEvent);
        }, 3000);
      }
    };
  } catch (err) {
    console.error('Không thể tạo EventSource:', err);
  }
}

function addSSEListener(callback) {
  eventListeners.push(callback);
}

window.SSE = {
  initSSE,
  addSSEListener
};
