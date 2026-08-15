import AppShell from "./app/AppShell";
import AppErrorBoundary from "./app/AppErrorBoundary";

function App() {
  return (
    <AppErrorBoundary>
      <AppShell />
    </AppErrorBoundary>
  );
}

export default App;
