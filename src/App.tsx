import { AppShell } from "@/components/AppShell";
import { ConnectionPanel } from "@/components/ConnectionPanel";
import { ApiWorkspace } from "@/components/ApiWorkspace";

export function App() {
  return (
    <AppShell>
      <ConnectionPanel />
      <ApiWorkspace />
    </AppShell>
  );
}
