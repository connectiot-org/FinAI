import { useEffect } from "react";
import { Link, useRouteError } from "react-router-dom";
import { isAssetLoadError, reloadStaleAsset } from "../lib/asset-recovery";
export function RouteError() {
  const error = useRouteError();
  const assetFailure = isAssetLoadError(error);
  useEffect(() => {
    if (assetFailure) reloadStaleAsset();
  }, [assetFailure]);
  return (
    <section className="empty" role="alert">
      <h1>Unable to open this page</h1>
      <p>
        {assetFailure
          ? "An update or a connection problem prevented this page from loading. Reload to try again. Your saved data has not been cleared."
          : "This page could not be displayed. Reload to try again."}
      </p>
      <button className="primary" onClick={() => location.reload()}>
        Reload page
      </button>
      <Link to="/">Return to homepage</Link>
    </section>
  );
}
