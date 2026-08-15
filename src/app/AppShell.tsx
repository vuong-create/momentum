import { lazy, Suspense } from "react";
import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Layout from "../components/Layout";
import HomeDashboard from "../features/home/HomeDashboard";

const PlannerPage = lazy(() => import("../features/planner/PlannerPage"));
const JournalPage = lazy(() => import("../features/journal/JournalPage"));
const ChinesePage = lazy(() => import("../features/chinese/ChinesePage"));
const AthleticsPage = lazy(() => import("../features/athletics/AthleticsPage"));
const CookingPage = lazy(() => import("../features/cooking/CookingPage"));
const FinancePage = lazy(() => import("../features/finance/FinancePage"));
const SettingsPage = lazy(() => import("../features/settings/SettingsPage"));
const FocusPage = lazy(() => import("../features/focus/FocusPage"));

function RouteLoadingState() {
  return (
    <div className="route-loading" role="status" aria-live="polite">
      <span aria-hidden="true" />
      <small>Opening your space…</small>
    </div>
  );
}

export default function AppShell() {
  return (
    <Layout>
      <Suspense fallback={<RouteLoadingState />}>
        <Routes>
        <Route
          path="/"
          element={<HomeDashboard />}
        />

        <Route
          path="/planner"
          element={<PlannerPage />}
        />

        <Route
          path="/chinese"
          element={<ChinesePage />}
        />

        <Route
          path="/athletics"
          element={<AthleticsPage />}
        />

        <Route
          path="/cooking"
          element={<CookingPage />}
        />

        <Route
          path="/finance"
          element={<FinancePage />}
        />

        <Route
          path="/journal"
          element={<JournalPage />}
        />

        <Route
          path="/settings"
          element={<SettingsPage />}
        />

        <Route
          path="/focus/:activityId"
          element={<FocusPage />}
        />

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />
        </Routes>
      </Suspense>
    </Layout>
  );
}
