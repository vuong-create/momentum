import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import Layout from "../components/Layout";
import HomeDashboard from "../features/home/HomeDashboard";
import PlannerPage from "../features/planner/PlannerPage";
import JournalPage from "../features/journal/JournalPage";
import ChinesePage from "../features/chinese/ChinesePage";
import AthleticsPage from "../features/athletics/AthleticsPage";
import CookingPage from "../features/cooking/CookingPage";
import FinancePage from "../features/finance/FinancePage";
import SettingsPage from "../features/settings/SettingsPage";

export default function AppShell() {
  return (
    <Layout>
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
          path="*"
          element={<Navigate to="/" replace />}
        />
      </Routes>
    </Layout>
  );
}
