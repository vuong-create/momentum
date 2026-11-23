import { afterEach, describe, expect, it, vi } from 'vitest';
import { getAvailableBuild } from './updateService';

afterEach(() => vi.unstubAllGlobals());
describe('deployment version checks', () => {
  it('announces only a different valid build, using a fresh request', async () => {
    const fetcher = vi.fn().mockResolvedValue(Response.json({ buildId: 'next' }));
    vi.stubGlobal('fetch', fetcher);
    expect(await getAvailableBuild('current')).toBe('next');
    expect(fetcher).toHaveBeenCalledWith('/version.json', { cache: 'no-store', signal: undefined });
    expect(await getAvailableBuild('next')).toBeNull();
  });
  it('ignores network errors, HTML fallbacks and malformed responses', async () => {
    const fetcher = vi.fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(new Response('<html>fallback</html>', { headers: { 'content-type': 'text/html' } }))
      .mockResolvedValueOnce(Response.json({ buildId: 42 }))
      .mockResolvedValueOnce(Response.json({ buildId: '' }))
      .mockResolvedValueOnce(new Response('error', { status: 503 }));
    vi.stubGlobal('fetch', fetcher);
    for (let i = 0; i < 5; i++) expect(await getAvailableBuild('current')).toBeNull();
  });
});
