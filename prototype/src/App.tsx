import { useEffect } from "react";
import { AppShell } from "./components/layout/AppShell";
import { ToastProvider } from "./components/ui/Toast";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { AssetsPage } from "./pages/AssetsPage";
import { CreateAdsPage } from "./pages/CreateAdsPage";
import { DashboardPage } from "./pages/DashboardPage";
import { GovernancePage } from "./pages/GovernancePage";
import { ManageAdsPage } from "./pages/ManageAdsPage";
import { TestingPage } from "./pages/TestingPage";
import { useLocation, useNavigate } from "./router";
import { PrototypeStateProvider } from "./state/PrototypeState";

function ScrollManager() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}

const knownPaths = new Set([
  "/overview",
  "/assets",
  "/create",
  "/manage",
  "/analytics",
  "/testing",
  "/governance",
]);

function RouteContent() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!knownPaths.has(pathname)) {
      navigate("/overview", { replace: true });
    }
  }, [navigate, pathname]);

  switch (pathname) {
    case "/assets":
      return <AssetsPage />;
    case "/create":
      return <CreateAdsPage />;
    case "/manage":
      return <ManageAdsPage />;
    case "/analytics":
      return <AnalyticsPage />;
    case "/testing":
      return <TestingPage />;
    case "/governance":
      return <GovernancePage />;
    case "/overview":
    default:
      return <DashboardPage />;
  }
}

export function App() {
  return (
    <PrototypeStateProvider>
      <ToastProvider>
        <ScrollManager />
        <AppShell>
          <RouteContent />
        </AppShell>
      </ToastProvider>
    </PrototypeStateProvider>
  );
}
