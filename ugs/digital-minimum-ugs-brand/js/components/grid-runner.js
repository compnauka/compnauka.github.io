window.ComponentRegistry = window.ComponentRegistry || {};

/*
  Compatibility adapter for the product-level `grid-runner` mechanic.
  The mature implementation lives in `routeRunner`; keeping this alias
  preserves the original component contract from PRODUCT_SPEC.md.
*/
window.ComponentRegistry['grid-runner'] = function mountGridRunner(container, config = {}, ctx = {}) {
  if (typeof window.ComponentRegistry.routeRunner !== 'function') {
    throw new Error('routeRunner must be loaded before grid-runner');
  }
  return window.ComponentRegistry.routeRunner(container, config, ctx);
};
