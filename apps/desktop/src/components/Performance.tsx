import { useState } from "react";
import { Icon } from "@iconify/react";

export const Performance: React.FC = () => {
  const [governor, setGovernor] = useState("powersave");
  const [turboBoost, setTurboBoost] = useState(true);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Performance Tuning</h1>
        <p className="text-xs text-text-secondary">
          Configure CPU limits, scaling governors, and kernel boosts.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* CPU Governor Selection */}
        <div className="glass-card p-5 rounded-xl space-y-4">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Icon icon="lucide:gauge" className="text-violet w-4.5 h-4.5" />
            Scaling Governor
          </h2>
          <p className="text-xs text-text-secondary">
            Determine how CPU frequencies respond to workload changes.
          </p>

          <div className="flex flex-col gap-2">
            {["performance", "powersave", "schedutil"].map((gov) => (
              <button
                key={gov}
                onClick={() => setGovernor(gov)}
                className={`flex items-center justify-between p-3 rounded-lg border text-xs font-semibold cursor-pointer capitalize transition-all duration-200 ${
                  governor === gov
                    ? "bg-white/5 border-violet text-violet"
                    : "bg-transparent border-border text-text-secondary hover:border-border-hover hover:text-text-primary"
                }`}
              >
                <span>{gov}</span>
                {governor === gov && <Icon icon="lucide:check" className="w-4 h-4" />}
              </button>
            ))}
          </div>
        </div>

        {/* Turbo Boost Toggles */}
        <div className="glass-panel p-5 rounded-xl space-y-4">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Icon icon="lucide:zap" className="text-warning w-4.5 h-4.5" />
            Intel Turbo Boost
          </h2>
          <p className="text-xs text-text-secondary">
            Allow the CPU core to dynamically run faster than the base operating frequency. Turning this off reduces temperatures and power usage.
          </p>

          <div className="flex items-center justify-between p-3 bg-white/[0.02] border border-border rounded-lg">
            <div>
              <span className="text-xs font-semibold block text-text-primary">Enable Turbo Boost</span>
              <span className="text-[10px] text-text-secondary">Direct kernel control (/sys/devices/system/cpu/intel_pstate)</span>
            </div>
            <button
              onClick={() => setTurboBoost(!turboBoost)}
              className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors duration-300 cursor-pointer ${
                turboBoost ? "bg-warning" : "bg-border"
              }`}
            >
              <div
                className={`bg-background w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                  turboBoost ? "translate-x-4" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
