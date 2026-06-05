import "@testing-library/jest-dom/vitest";

if (!globalThis.chrome) {
  Object.defineProperty(globalThis, "chrome", {
    configurable: true,
    value: {
      action: { onClicked: { addListener: vi.fn() } },
      downloads: { download: vi.fn() },
      permissions: {
        contains: vi.fn(),
        request: vi.fn(),
        remove: vi.fn()
      },
      runtime: {
        getURL: (path: string) => `chrome-extension://test${path}`,
        onMessage: { addListener: vi.fn() },
        sendMessage: vi.fn()
      },
      scripting: { executeScript: vi.fn() },
      sidePanel: {
        open: vi.fn(),
        setOptions: vi.fn()
      },
      storage: {
        local: {
          get: vi.fn(),
          set: vi.fn(),
          remove: vi.fn(),
          clear: vi.fn()
        }
      },
      tabs: {
        create: vi.fn(),
        query: vi.fn()
      }
    }
  });
}

