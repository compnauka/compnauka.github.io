window.ComponentRegistry = window.ComponentRegistry || {};
window.ComponentRegistry['drag-target'] = function mount(container, config = {}) {
  container.innerHTML = '<div class="stage-box"><div class="stage-icon">🧩</div><h2>Це завдання ще готується</h2><p>Обери інше завдання.</p></div>';
};
