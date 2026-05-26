(function () {
  if (window.__inlineFallbackBooted) return;
  window.__inlineFallbackBooted = true;

  function findHandlerTarget(start, attrName) {
    let element = start;

    while (element && element !== document) {
      if (element.nodeType === 1 && element.hasAttribute && element.hasAttribute(attrName)) {
        return element;
      }
      element = element.parentElement;
    }

    return null;
  }

  function invokeHandler(element, attrName, event) {
    const code = element.getAttribute(attrName);
    if (!code) return;

    try {
      const result = new Function('event', code).call(element, event);
      if (result === false) {
        event.preventDefault();
        event.stopPropagation();
      }
    } catch (error) {
      console.error(`Inline handler fallback failed for ${attrName}:`, error);
    }
  }

  function bindAttributeFallbacks() {
    const delegatedEvents = [
      ['click', 'onclick'],
      ['change', 'onchange'],
      ['input', 'oninput'],
      ['keyup', 'onkeyup']
    ];

    delegatedEvents.forEach(([eventName, attrName]) => {
      document.addEventListener(eventName, (event) => {
        const target = findHandlerTarget(event.target, attrName);
        if (!target) return;
        invokeHandler(target, attrName, event);
      }, true);
    });

    document.addEventListener('submit', (event) => {
      const form = findHandlerTarget(event.target, 'onsubmit');
      if (!form) return;
      invokeHandler(form, 'onsubmit', event);
    }, true);
  }

  function executeInlineScripts() {
    const inlineScripts = Array.from(document.querySelectorAll('script:not([src])'));

    inlineScripts.forEach((script) => {
      const code = script.textContent.trim();
      if (!code) return;

      try {
        window.eval(code);
      } catch (error) {
        console.error('Inline script fallback failed:', error);
      }
    });
  }

  function initFallback() {
    if (window.__pageInlineScriptExecuted) return;

    bindAttributeFallbacks();
    executeInlineScripts();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFallback, { once: true });
  } else {
    initFallback();
  }
})();
