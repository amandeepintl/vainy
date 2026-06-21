import { Icon } from "@iconify/react";
import { useStore } from "../store/useStore";

export const Thermals: React.FC = () => {
  const { stats, curvePoints, setCurvePoints } = useStore();

  const updatePointSpeed = (index: number, newSpeed: number) => {
    const updated = [...curvePoints];
    updated[index].speed = Math.max(0, Math.min(100, newSpeed));
    setCurvePoints(updated);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Thermals & Fan Curve</h1>
        <p className="text-xs text-text-secondary">
          Monitor laptop thermals and configure custom cooling profiles.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sensor Stats */}
        <div className="lg:col-span-1 glass-card p-4 rounded-xl space-y-4">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Icon icon="lucide:flame" className="text-danger w-4.5 h-4.5" />
            Thermal Zones
          </h2>
          <div className="space-y-3">
            {[
              { label: "Core CPU", temp: stats.cpu_temp, icon: "lucide:cpu", color: "text-cyan" },
              { label: "GPU Die", temp: stats.gpu_temp, icon: "lucide:monitor", color: "text-violet" },
              { label: "NVMe SSD", temp: stats.ssd_temp, icon: "lucide:database", color: "text-success" },
              { label: "Motherboard", temp: stats.motherboard_temp, icon: "lucide:layers", color: "text-text-secondary" },
            ].map((zone) => (
              <div
                key={zone.label}
                className="flex items-center justify-between p-2.5 bg-white/[0.02] border border-border rounded-lg"
              >
                <div className="flex items-center gap-2">
                  <Icon icon={zone.icon} className={`w-4 h-4 ${zone.color}`} />
                  <span className="text-xs font-medium">{zone.label}</span>
                </div>
                <span className="text-xs font-bold font-mono">{zone.temp.toFixed(2)}°C</span>
              </div>
            ))}
          </div>
        </div>

        {/* Fan Curve Editor */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-xl space-y-4">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Icon icon="lucide:sliders-horizontal" className="text-primary w-4.5 h-4.5" />
            Custom Fan Curve Editor
          </h2>
          <p className="text-xs text-text-secondary">
            Drag sliders to configure custom fan speeds based on target CPU temperatures.
          </p>

          <div className="space-y-4">
            {curvePoints.map((pt, i) => (
              <div key={i} className="flex items-center gap-4 bg-white/[0.01] border border-border p-3 rounded-lg">
                <div className="w-16 text-xs text-text-secondary font-mono">
                  Point {i + 1}:
                </div>
                <div className="w-20 text-xs font-semibold">
                  {pt.temp}°C
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={pt.speed}
                  onChange={(e) => updatePointSpeed(i, Number(e.target.value))}
                  className="flex-1 accent-primary bg-border rounded-lg h-1.5 appearance-none cursor-pointer"
                />
                <div className="w-12 text-right text-xs font-mono font-bold text-primary">
                  {pt.speed}%
                  
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
