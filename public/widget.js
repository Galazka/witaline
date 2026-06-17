// WitaLine Chat Widget v1.0
// Usage: <script src="https://your-domain.com/widget.js" data-business-id="xxx" data-position="bottom-right"></script>
(function() {
  'use strict';

  var scriptEl = document.currentScript || document.querySelector('script[data-business-id]');
  if (!scriptEl) return;

  var businessId = scriptEl.getAttribute('data-business-id');
  var position = scriptEl.getAttribute('data-position') || 'bottom-right';
  var theme = scriptEl.getAttribute('data-theme') || 'light';
  var welcomeMessage = scriptEl.getAttribute('data-welcome') || '';

  if (!businessId) {
    console.warn('[WitaLine] Missing data-business-id attribute');
    return;
  }

  var baseUrl = scriptEl.src.replace(/\/widget\.js.*$/, '');
  var widgetUrl = baseUrl + '/widget?business=' + businessId + (welcomeMessage ? '&welcome=' + encodeURIComponent(welcomeMessage) : '');

  // ── Styles ──────────────────────────────────────────────────────
  var styles = document.createElement('style');
  styles.textContent = '\
    #witaline-bubble { \
      position: fixed; \
      z-index: 999999; \
      width: 60px; \
      height: 60px; \
      border-radius: 50%; \
      background: linear-gradient(135deg, #3CBF4A, #2EA03A); \
      box-shadow: 0 4px 20px rgba(60, 191, 74, 0.4); \
      cursor: pointer; \
      display: flex; \
      align-items: center; \
      justify-content: center; \
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); \
      animation: witaline-bounce-in 0.5s cubic-bezier(0.16, 1, 0.3, 1); \
    } \
    #witaline-bubble:hover { \
      transform: scale(1.1); \
      box-shadow: 0 6px 28px rgba(60, 191, 74, 0.5); \
    } \
    #witaline-bubble svg { \
      width: 28px; \
      height: 28px; \
      color: white; \
      transition: transform 0.3s; \
    } \
    #witaline-bubble.open svg { \
      transform: rotate(90deg); \
    } \
    #witaline-bubble .witaline-badge { \
      position: absolute; \
      top: -2px; \
      right: -2px; \
      width: 16px; \
      height: 16px; \
      background: #22c55e; \
      border-radius: 50%; \
      border: 2px solid white; \
      animation: witaline-pulse 2s infinite; \
    } \
    #witaline-frame-container { \
      position: fixed; \
      z-index: 999998; \
      width: 380px; \
      height: 580px; \
      max-height: calc(100vh - 100px); \
      max-width: calc(100vw - 32px); \
      border-radius: 16px; \
      overflow: hidden; \
      box-shadow: 0 12px 48px rgba(0, 0, 0, 0.15); \
      border: 1px solid rgba(0, 0, 0, 0.08); \
      opacity: 0; \
      transform: translateY(20px) scale(0.95); \
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); \
      pointer-events: none; \
    } \
    #witaline-frame-container.visible { \
      opacity: 1; \
      transform: translateY(0) scale(1); \
      pointer-events: all; \
    } \
    #witaline-frame-container iframe { \
      width: 100%; \
      height: 100%; \
      border: none; \
    } \
    @keyframes witaline-bounce-in { \
      0% { transform: scale(0); opacity: 0; } \
      50% { transform: scale(1.15); } \
      100% { transform: scale(1); opacity: 1; } \
    } \
    @keyframes witaline-pulse { \
      0%, 100% { transform: scale(1); opacity: 1; } \
      50% { transform: scale(1.2); opacity: 0.7; } \
    } \
  ';
  document.head.appendChild(styles);

  // ── Position ────────────────────────────────────────────────────
  var posStyles = {
    'bottom-right': 'bottom: 24px; right: 24px;',
    'bottom-left': 'bottom: 24px; left: 24px;',
    'top-right': 'top: 24px; right: 24px;',
    'top-left': 'top: 24px; left: 24px;',
  };

  var framePosStyles = {
    'bottom-right': 'bottom: 96px; right: 24px;',
    'bottom-left': 'bottom: 96px; left: 24px;',
    'top-right': 'top: 96px; right: 24px;',
    'top-left': 'top: 96px; left: 24px;',
  };

  // ── Create bubble ──────────────────────────────────────────────
  var bubble = document.createElement('div');
  bubble.id = 'witaline-bubble';
  bubble.style.cssText = posStyles[position] || posStyles['bottom-right'];
  bubble.innerHTML = '\
    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"> \
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /> \
    </svg> \
    <div class="witaline-badge"></div>';

  // ── Create iframe container ────────────────────────────────────
  var container = document.createElement('div');
  container.id = 'witaline-frame-container';
  container.style.cssText = framePosStyles[position] || framePosStyles['bottom-right'];

  var iframe = document.createElement('iframe');
  iframe.src = widgetUrl;
  iframe.allow = 'microphone; autoplay';
  iframe.loading = 'lazy';
  container.appendChild(iframe);

  // ── Toggle logic ──────────────────────────────────────────────
  var isOpen = false;

  function toggleWidget() {
    isOpen = !isOpen;
    container.classList.toggle('visible', isOpen);
    bubble.classList.toggle('open', isOpen);
    var badge = bubble.querySelector('.witaline-badge');
    if (badge) badge.style.display = isOpen ? 'none' : 'block';
  }

  bubble.addEventListener('click', toggleWidget);

  // Close on ESC
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && isOpen) toggleWidget();
  });

  // Close on click outside
  document.addEventListener('click', function(e) {
    if (isOpen && !container.contains(e.target) && !bubble.contains(e.target)) {
      toggleWidget();
    }
  });

  // ── Inject ────────────────────────────────────────────────────
  document.body.appendChild(container);
  document.body.appendChild(bubble);

  // ── Expose API ────────────────────────────────────────────────
  window.WitaLine = {
    open: function() { if (!isOpen) toggleWidget(); },
    close: function() { if (isOpen) toggleWidget(); },
    toggle: toggleWidget,
    isOpen: function() { return isOpen; },
  };

})();
