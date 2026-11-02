import { useEffect } from "react";

import AppShell from "./app/AppShell";
import AppErrorBoundary from "./app/AppErrorBoundary";
import { cleanupExpiredAthleticsPlannerActivities } from "./features/athletics/services/athleticsMaintenanceService";

function App() {
  useEffect(() => { void cleanupExpiredAthleticsPlannerActivities(); }, []);

  return (
    <AppErrorBoundary>
      <AppShell />
    </AppErrorBoundary>
  );
}

export default App;
