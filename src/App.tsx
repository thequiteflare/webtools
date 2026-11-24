import { useState, useEffect } from "react";
import { Header } from "./components/layout/Header";
import { Sidebar } from "./components/layout/Sidebar";
import { Dashboard } from "./components/dashboard/Dashboard";
import { ToolViewer } from "./components/layout/ToolViewer";
import { CommandMenu } from "./components/layout/CommandMenu";
import { useTheme } from "./hooks/useTheme";
import { usePWAInstall } from "./hooks/usePWAInstall";
import { TOOLS } from "./config/tools";
import { APP_VERSION } from "./config/version";
import type { ToolCategory } from "./types/tool";

export function App() {
  const { theme, toggleTheme } = useTheme();
  const { isInstallable, promptInstall } = usePWAInstall();
  const [selectedCategory, setSelectedCategory] = useState<
    ToolCategory | "all"
  >("all");
  const [selectedToolId, setSelectedToolId] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      const rawHash = window.location.hash.replace("#", "");
      const hash = rawHash.split("?")[0];
      return hash && TOOLS.some((t) => t.id === hash) ? hash : null;
    }
    return null;
  });
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Sync with browser URL hash
  useEffect(() => {
    const handleHashChange = () => {
      const rawHash = window.location.hash.replace("#", "");
      const hash = rawHash.split("?")[0];
      if (hash && TOOLS.some((t) => t.id === hash)) {
        setSelectedToolId(hash);
      } else {
        setSelectedToolId(null);
      }
    };

    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  const handleSelectTool = (id: string | null) => {
    setSelectedToolId(id);
    if (id) {
      window.location.hash = id;
    } else {
      history.pushState(null, "", window.location.pathname);
    }
  };

  // Keyboard shortcut for Command Menu (Ctrl+K / Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const activeTool = selectedToolId
    ? TOOLS.find((t) => t.id === selectedToolId)
    : null;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-150">
      {/* Header */}
      <Header
        onOpenCommand={() => setIsCommandOpen(true)}
        onSelectTool={handleSelectTool}
        theme={theme}
        onToggleTheme={toggleTheme}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
        isInstallable={isInstallable}
        onInstall={promptInstall}
      />

      {/* Main Body */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto px-4 sm:px-6">
        {/* Sidebar Navigation */}
        <Sidebar
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          selectedToolId={selectedToolId}
          onSelectTool={handleSelectTool}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Content Area */}
        <main className="flex-1 min-w-0 py-6 sm:px-6 md:px-8">
          {activeTool ? (
            <ToolViewer
              tool={activeTool}
              onBack={() => handleSelectTool(null)}
              onSelectCategory={setSelectedCategory}
            />
          ) : (
            <Dashboard
              selectedCategory={selectedCategory}
              onSelectCategory={setSelectedCategory}
              onSelectTool={handleSelectTool}
              isInstallable={isInstallable}
              onInstall={promptInstall}
            />
          )}
        </main>
      </div>

      {/* Global Command Palette */}
      <CommandMenu
        isOpen={isCommandOpen}
        onClose={() => setIsCommandOpen(false)}
        onSelectTool={handleSelectTool}
      />

      {/* Footer */}
      <footer className="border-t border-border/80 bg-card/40 py-6 text-center text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>Webtools v{APP_VERSION} — Free & Open Source</p>
          <p className="flex items-center gap-1 font-mono text-[11px]">
            Zero servers • Zero tracking • Zero analytics
          </p>
        </div>
      </footer>
    </div>
  );
}

export default App;
