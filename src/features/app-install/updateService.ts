/** Deployment checks never read or send personal records. */
export async function getAvailableBuild(currentBuild: string, signal?: AbortSignal): Promise<string | null> {
  try {
    const response = await fetch('/version.json', { cache: 'no-store', signal });
    if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) return null;
    const version: unknown = await response.json();
    if (!version || typeof version !== 'object' || !('buildId' in version)) return null;
    const next = version.buildId;
    return typeof next === 'string' && next.length > 0 && next !== currentBuild ? next : null;
  } catch {
    // Offline, older deployments, and transient hosting errors are not app errors.
    return null;
  }
}
