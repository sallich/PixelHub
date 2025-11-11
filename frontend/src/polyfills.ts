declare global {
  // eslint-disable-next-line no-var
  var global: typeof globalThis;
}

if (typeof globalThis.global === 'undefined') {
  globalThis.global = globalThis;
}

export {};

