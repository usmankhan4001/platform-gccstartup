export function useAbort() { const controller = new AbortController(); return { signal: controller.signal, abort: () => controller.abort() } }

export function createAbortController() { return new AbortController() }
