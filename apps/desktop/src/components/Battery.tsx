import { useState } from "react";
import { Icon } from "@iconify/react";

export const Battery: React.FC = () => {
  const [conservationMode, setConservationMode] = useState(false);
  const [threshold, setThreshold] = useState(80);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Battery Health</h1>
        <p className="text-xs text-text-secondary">
          Monitor life, charging levels, and configure threshold limits.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Core Stats */}
        <div className="glass-card p-5 rounded-xl space-y-4">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Icon icon="lucide:activity" className="text-success w-4.5 h-4.5" />
            Health Metrics
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/[0.02] border border-border p-3 rounded-lg">
              <span className="text-[10px] text-text-secondary block">Battery Health</span>
              <span className="text-lg font-bold font-mono text-success">96%</span>
            </div>
            <div className="bg-white/[0.02] border border-border p-3 rounded-lg">
              <span className="text-[10px] text-text-secondary block">Wear Level</span>
              <span className="text-lg font-bold font-mono text-warning">4.0%</span>
            </div>
            <div className="bg-white/[0.02] border border-border p-3 rounded-lg">
              <span className="text-[10px] text-text-secondary block">Cycle Count</span>
              <span className="text-lg font-bold font-mono text-text-primary">42 cycles</span>
            </div>
            <div className="bg-white/[0.02] border border-border p-3 rounded-lg">
              <span className="text-[10px] text-text-secondary block">Temperature</span>
              <span className="text-lg font-bold font-mono text-text-primary">28.5°C</span>
            </div>
          </div>
        </div>

        {/* Charge Optimization / Conservation */}
        <div className="glass-panel p-5 rounded-xl space-y-4">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Icon icon="lucide:shield-check" className="text-cyan w-4.5 h-4.5" />
            Lenovo Conservation Mode
          </h2>
          <p className="text-xs text-text-secondary leading-relaxed">
            Conservation Mode limits charging to 60-80% to prolong battery lifespan, especially when plugged in continuously.
          </p>
          <div className="flex items-center justify-between p-3 bg-white/[0.02] border border-border rounded-lg">
            <div>
              <span className="text-xs font-semibold block text-text-primary">Enable Conservation</span>
              <span className="text-[10px] text-text-secondary">Limits charge to 80% maximum</span>
            </div>
            <button
              onClick={() => setConservationMode(!conservationMode)}
              className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors duration-300 cursor-pointer ${
                conservationMode ? "bg-cyan" : "bg-border"
              }`}
            >
              <div
                className={`bg-background w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                  conservationMode ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-medium">
              <span>Charge Limit Threshold</span>
              <span className="font-mono text-cyan">{threshold}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="100"
              step="5"
              value={threshold}
              onChange={(e) => setThreshold(Number(e.target.value))}
              className="w-full accent-cyan bg-border rounded-lg h-1.5 appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
