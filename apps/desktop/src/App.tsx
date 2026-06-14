
import { useEffect } from "react";
import { useStore } from "./store/useStore";
import { Titlebar } from "./components/Titlebar";
import { Sidebar } from "./components/Sidebar";
import { Dashboard } from "./components/Dashboard";
import { Battery } from "./components/Battery";
import { Performance } from "./components/Performance";
import { Thermals } from "./components/Thermals";
import { Gpu } from "./components/Gpu";
import { Keyboard } from "./components/Keyboard";
import { System } from "./components/System";
import { Settings } from "./components/Settings";
import { Logs } from "./components/Logs";
import { AnimatePresence, motion } from "motion/react";

export default function App() {
  const { activePage, curvePoints } = useStore();

  useEffect(() => {
    // Send the hydrated curvePoints to backend on launch
    const syncCurve = async () => {
      try {
        const { invoke } = await import("@tauri-apps/api/core");
        await invoke("set_fan_curve", { points: curvePoints });
      } catch (e) {
        console.warn("Tauri initial curve sync failed:", e);
      }
    };
    syncCurve();
  }, []);

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
        return <Dashboard key="dashboard" />;
      case "battery":
        return <Battery key="battery" />;
      case "performance":
        return <Performance key="performance" />;
      case "thermals":
        return <Thermals key="thermals" />;
      case "gpu":
        return <Gpu key="gpu" />;
      case "keyboard":
        return <Keyboard key="keyboard" />;
      case "system":
        return <System key="system" />;
      case "settings":
        return <Settings key="settings" />;
      case "logs":
        return <Logs key="logs" />;
      default:
        return <Dashboard key="dashboard" />;
    }
  };

  return (
    <div className="w-screen h-screen flex flex-col bg-transparent overflow-hidden p-2">
      {/* Outer Glow Wrapper matching macOS Apple design */}
      <div className="flex-1 w-full h-full flex flex-col rounded-[24px] border border-border bg-background overflow-hidden shadow-2xl relative">
        {/* Custom Header Titlebar */}
        <Titlebar />

        {/* Workspace Layout */}
        <div className="flex-1 flex min-h-0 overflow-hidden relative">
          <Sidebar />

          {/* Core Page Content area with Animating Transitions */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative bg-white/[0.005]">
            <AnimatePresence mode="wait">
              <motion.div
                key={activePage}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className="flex-1 flex flex-col min-h-0 overflow-hidden"
              >
                {renderPage()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
