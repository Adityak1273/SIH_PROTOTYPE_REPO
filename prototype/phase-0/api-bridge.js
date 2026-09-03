(() => {
  const endpoint = window.COGNITIVE_AI_ENDPOINT;
  if (!endpoint || !window.fetch) return;
  const originalFetch = window.fetch.bind(window);
  window.fetch = (input, init) => {
    const url = typeof input === 'string' ? input : input?.url;
    if (url === '/api/chat') return originalFetch(endpoint, init);
    return originalFetch(input, init);
  };
})();
