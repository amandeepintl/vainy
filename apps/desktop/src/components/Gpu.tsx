import { useState, useEffect } from "react";
import { Icon } from "@iconify/react";
import { useStore, GpuMode } from "../store/useStore";

export const Gpu: React.FC = () => {
  const { gpuMode, setGpuMode, getGpuMode, configureLaunchersDiscreteGpu } = useStore();
  const [showRebootAlert, setShowRebootAlert] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<"success" | "error" | "info" | null>(null);

  useEffect(() => {
    getGpuMode();
  }, [getGpuMode]);

  const handleModeChange = async (mode: GpuMode) => {
    if (mode === gpuMode) return;
    await setGpuMode(mode);
    setShowRebootAlert(true);
  };

  const handleConfigureLaunchers = async () => {
    setStatusType("info");
    setStatusMessage("Configuring Minecraft launchers...");
    try {
      const res = await configureLaunchersDiscreteGpu();
      setStatusType("success");
      setStatusMessage(res);
    } catch (err: any) {
      setStatusType("error");
      setStatusMessage(err?.toString() || "Failed to configure launchers.");
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">GPU Management</h1>
        <p className="text-xs text-text-secondary">
          Configure hybrid graphics switching and monitor NVIDIA/Intel GPU statuses.
        </p>
      </div>

      {showRebootAlert && (
        <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-lg flex items-center gap-3 text-xs text-amber-200">
          <Icon icon="lucide:alert-triangle" className="w-5 h-5 text-amber-500 shrink-0" />
          <div>
            <span className="font-semibold block">Graphics Mode Changed</span>
            <span>You must reboot the system or restart your login session for the new mode to take effect.</span>
          </div>
          <button 
            onClick={() => setShowRebootAlert(false)}
            className="ml-auto text-text-secondary hover:text-text-primary text-sm font-semibold"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* GPU Mode Switcher */}
        <div className="glass-panel p-5 rounded-xl space-y-4">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Icon icon="lucide:refresh-cw" className="text-cyan w-4.5 h-4.5" />
            Graphics Mode
          </h2>
          <p className="text-xs text-text-secondary">
            Switch between modes. Requires system reboot or login session restart.
          </p>

          <div className="flex flex-col gap-2">
            {[
              { id: "integrated" as GpuMode, label: "Integrated Only", desc: "Turns off Dedicated GPU entirely to save battery" },
              { id: "hybrid" as GpuMode, label: "Hybrid (On-Demand)", desc: "Dynamically offloads heavy apps to NVIDIA GPU" },
              { id: "dedicated" as GpuMode, label: "Dedicated Only", desc: "Forces discrete GPU for maximum performance" },
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => handleModeChange(mode.id)}
                className={`text-left p-3 rounded-lg border text-xs font-semibold cursor-pointer transition-all duration-200 ${
                  gpuMode === mode.id
                    ? "bg-white/5 border-cyan text-cyan"
                    : "bg-transparent border-border text-text-secondary hover:border-border-hover hover:text-text-primary"
                }`}
              >
                <div className="flex justify-between items-center">
                  <span>{mode.label}</span>
                  {gpuMode === mode.id && <Icon icon="lucide:check" className="w-4 h-4" />}
                </div>
                <span className="text-[10px] text-text-secondary font-normal block mt-1">
                  {mode.desc}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Dedicated GPU stats */}
        <div className="glass-card p-5 rounded-xl space-y-4">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Icon icon="lucide:monitor" className="text-violet w-4.5 h-4.5" />
            NVIDIA GeForce RTX 4050
          </h2>
          
          <div className="space-y-3">
            {[
              { label: "Driver Version", val: "550.90.07", icon: "lucide:file-code" },
              { label: "VRAM Used", val: "1.2 GB / 6.0 GB", icon: "lucide:database" },
              { label: "GPU Temp", val: "42°C", icon: "lucide:thermometer" },
              { label: "Power Draw", val: "15.4 W", icon: "lucide:zap" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex items-center justify-between p-2.5 bg-white/[0.02] border border-border rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <Icon icon={stat.icon} className="w-4 h-4 text-text-secondary" />
                  <span className="text-xs text-text-secondary">{stat.label}</span>
                </div>
                <span className="text-xs font-semibold font-mono text-text-primary">
                  {stat.val}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Gaming & Performance Tips */}
        <div className="glass-card p-5 rounded-xl space-y-4 md:col-span-2">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Icon icon="lucide:info" className="text-cyan w-4.5 h-4.5" />
            Gaming on Hybrid Graphics
          </h2>
          <p className="text-xs text-text-secondary leading-relaxed">
            In <strong>Hybrid Mode (On-Demand)</strong>, Minecraft and other OpenGL games run on the integrated GPU by default to save power. If you experience lag using shaders or 3D games:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="bg-white/[0.01] border border-border p-3 rounded-lg flex flex-col justify-between space-y-3">
              <div>
                <span className="font-semibold text-text-primary block mb-1">Option 1: Enable in Launcher Settings</span>
                <p className="text-text-secondary leading-relaxed">
                  In <strong>Prism Launcher</strong>, go to <strong>Settings &gt; Minecraft &gt; Tweaks</strong> and check <strong>"Use discrete GPU"</strong>.
                  Alternatively, for Modrinth Flatpak, set the appropriate discrete GPU offloading overrides.
                </p>
              </div>
              <div>
                <button 
                  onClick={handleConfigureLaunchers}
                  className="bg-cyan/10 hover:bg-cyan/20 text-cyan border border-cyan/30 px-3 py-1.5 rounded text-[11px] font-semibold cursor-pointer transition-colors w-full md:w-auto"
                >
                  Auto-configure Minecraft Launchers
                </button>
              </div>
            </div>
            
            <div className="bg-white/[0.01] border border-border p-3 rounded-lg">
              <span className="font-semibold text-text-primary block mb-1">Option 2: System-wide Dedicated Mode</span>
              <p className="text-text-secondary leading-relaxed">
                Switch Graphics Mode to <strong>Dedicated Only</strong> above. This forces the dedicated GPU for all applications, but will reduce battery life. (Requires system reboot).
              </p>
            </div>
          </div>

          {statusMessage && (
            <div className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
              statusType === "success" 
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-200" 
                : statusType === "error" 
                ? "bg-rose-500/10 border-rose-500/30 text-rose-200"
                : "bg-cyan-500/10 border-cyan-500/30 text-cyan-200"
            }`}>
              <Icon 
                icon={statusType === "success" ? "lucide:check-circle" : statusType === "error" ? "lucide:x-circle" : "lucide:loader"} 
                className={`w-4.5 h-4.5 shrink-0 ${statusType === "info" ? "animate-spin" : ""}`} 
              />
              <span className="whitespace-pre-line">{statusMessage}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
