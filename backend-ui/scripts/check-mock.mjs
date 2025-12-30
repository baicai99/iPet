const enabledValues = new Set(['true', '1', 'on']);
const mockValue = (process.env.VITE_MOCK || '').toLowerCase();

if (enabledValues.has(mockValue)) {
  console.error('[Build Guard] VITE_MOCK is enabled; production build is blocked.');
  process.exit(1);
}
