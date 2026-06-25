import { useState } from "react";
import { Icon } from "@iconify/react";

export const Settings: React.FC = () => {
  const [pollingRate, setPollingRate] = useState(2);
  const [startup, setStartup] = useState(true);
  const [backgroundRefresh, setBackgroundRefresh] = useState(true);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Application Settings</h1>
        <p className="text-xs text-text-secondary">
          Configure daemon communication rates and GUI behaviors.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Monitoring Controls */}
        <div className="glass-card p-5 rounded-xl space-y-5">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Icon icon="lucide:activity" className="text-cyan w-4.5 h-4.5" />
            Telemetry Monitoring
          </h2>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span>Sensor Polling Rate</span>
              <span className="font-mono text-cyan">{pollingRate}s</span>
            </div>
            <input
              type="range"
              min="1"
              max="10"
              value={pollingRate}
              onChange={(e) => setPollingRate(Number(e.target.value))}
              className="w-full accent-cyan bg-border rounded-lg h-1.5 appearance-none cursor-pointer"
            />
            <span className="text-[10px] text-text-secondary block leading-relaxed">
              Lower polling rate updates stats faster but increases CPU utilization slightly.
            </span>
          </div>
        </div>

        {/* System Integration */}
        <div className="glass-panel p-5 rounded-xl space-y-4">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Icon icon="lucide:cog" className="text-violet w-4.5 h-4.5" />
            Daemon Integration
          </h2>

          {/* Autostart */}
          <div className="flex items-center justify-between p-3 bg-white/[0.01] border border-border rounded-lg">
            <div>
              <span className="text-xs font-semibold block text-text-primary">Launch at Startup</span>
              <span className="text-[10px] text-text-secondary">Launches GUI minimised to system tray</span>
            </div>
            <button
              onClick={() => setStartup(!startup)}
              className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors duration-300 cursor-pointer ${
                startup ? "bg-violet" : "bg-border"
              }`}
            >
              <div
                className={`bg-background w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                  startup ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Background Refresh */}
          <div className="flex items-center justify-between p-3 bg-white/[0.01] border border-border rounded-lg">
            <div>
              <span className="text-xs font-semibold block text-text-primary">Background telemetry collection</span>
              <span className="text-[10px] text-text-secondary">Updates metrics while window is closed</span>
            </div>
            <button
              onClick={() => setBackgroundRefresh(!backgroundRefresh)}
              className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors duration-300 cursor-pointer ${
                backgroundRefresh ? "bg-violet" : "bg-border"
              }`}
            >
              <div
                className={`bg-background w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                  backgroundRefresh ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
