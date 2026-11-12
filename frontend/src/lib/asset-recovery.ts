// A page left open during deployment may still request a removed hashed chunk.
// One reload fetches the current entrypoint; a per-tab guard prevents loops.
const retryWindow = 60_000;
export function isAssetLoadError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Loading (?:CSS )?chunk .* failed|Unable to preload CSS/i.test(
    message,
  );
}
export function reloadStaleAsset() {
  try {
    const key = "finai:asset-reload";
    const last = Number(sessionStorage.getItem(key));
    if (last && Date.now() - last < retryWindow) return false;
    sessionStorage.setItem(key, String(Date.now()));
    location.reload();
    return true;
  } catch {
    // If session storage is blocked, leave recovery to the visible reload button.
    return false;
  }
}
export function installAssetRecovery() {
  const recover = (event: Event) => {
    const error = (event as Event & { payload?: unknown }).payload;
    if (isAssetLoadError(error) && reloadStaleAsset()) event.preventDefault();
  };
  window.addEventListener("vite:preloadError", recover);
  return () => window.removeEventListener("vite:preloadError", recover);
}
