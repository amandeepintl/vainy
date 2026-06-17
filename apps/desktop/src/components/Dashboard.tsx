import { useEffect, useState } from "react";
import { useStore, PowerProfile } from "../store/useStore";
import { Icon } from "@iconify/react";
import { motion } from "motion/react";

// Helper component for SVG Sparkline Chart
const Sparkline: React.FC<{ data: number[]; max: number; color: string; label: string }> = ({
  data,
  max,
  color,
  label,
}) => {
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * 120;
    const y = 40 - (val / max) * 35; // 40px height
    return `${x},${y}`;
  });

  const pathD = points.length > 0 ? `M ${points.join(" L ")}` : "";
  const areaD = points.length > 0 ? `${pathD} L 120,40 L 0,40 Z` : "";

  return (
    <div className="flex flex-col items-end">
      <svg className="w-24 h-10 overflow-visible" viewBox="0 0 120 40">
        <defs>
          <linearGradient id={`grad-${label}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.4" />
            <stop offset="100%" stopColor={color} stopOpacity="0.0" />
          </linearGradient>
        </defs>
        {/* Area under the line */}
        {points.length > 0 && (
          <path d={areaD} fill={`url(#grad-${label})`} />
        )}
        {/* Line */}
        {points.length > 0 && (
          <path
            d={pathD}
            fill="none"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
      </svg>
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const { stats, setStats, powerProfile, setPowerProfile, setPowerProfileSilent } = useStore();
  
  // Historical data for charts
  const [cpuHistory, setCpuHistory] = useState<number[]>(Array(15).fill(0));
  const [gpuHistory, setGpuHistory] = useState<number[]>(Array(15).fill(0));
  const [tempHistory, setTempHistory] = useState<number[]>(Array(15).fill(0));

  // Simulation loop for real-time updates
  useEffect(() => {
    // Attempt to invoke Tauri command first
    let intervalId: any;
    
    const updateStats = async () => {
      try {
        const { invoke } = await import("@tauri-apps/api/core");
        const res: any = await invoke("get_hardware_stats");
        setStats(res);
        if (res.power_profile && res.power_profile !== powerProfile) {
          setPowerProfileSilent(res.power_profile);
        }
        
        setCpuHistory((prev: number[]) => [...prev.slice(1), res.cpu_usage]);
        setGpuHistory((prev: number[]) => [...prev.slice(1), res.gpu_usage]);
        setTempHistory((prev: number[]) => [...prev.slice(1), res.cpu_temp]);
      } catch (e) {
        // Fallback mock stats generator
        const mockCpu = Math.min(100, Math.max(0, stats.cpu_usage + (Math.random() - 0.5) * 8));
        const mockGpu = Math.min(100, Math.max(0, stats.gpu_usage + (Math.random() - 0.5) * 6));
        const mockTemp = Math.min(100, Math.max(30, stats.cpu_temp + (Math.random() - 0.5) * 2));
        const mockFan = mockTemp > 60 ? 2500 : mockTemp > 45 ? 1800 : 0;
        
        setStats({
          cpu_usage: parseFloat(mockCpu.toFixed(1)),
          cpu_temp: parseFloat(mockTemp.toFixed(1)),
          gpu_usage: parseFloat(mockGpu.toFixed(1)),
          gpu_temp: parseFloat((mockTemp - 3).toFixed(1)),
          ram_usage: 7.2,
          ram_total: 16,
          disk_usage: 128.4,
          disk_total: 512,
          battery_charge: 88,
          battery_status: "Discharging",
          battery_power_draw: -14.8,
          fan_speed: mockFan,
          power_profile: powerProfile,
          ssd_temp: 37.5,
          motherboard_temp: 39.2,
        });

        setCpuHistory((prev: number[]) => [...prev.slice(1), mockCpu]);
        setGpuHistory((prev: number[]) => [...prev.slice(1), mockGpu]);
        setTempHistory((prev: number[]) => [...prev.slice(1), mockTemp]);
      }
    };

    updateStats();
    intervalId = setInterval(updateStats, 2000);

    return () => clearInterval(intervalId);
  }, [powerProfile, setStats, setPowerProfileSilent]);

  const handleProfileChange = (profile: PowerProfile) => {
    setPowerProfile(profile);
  };

  const profiles: { id: PowerProfile; label: string; icon: string; color: string; desc: string }[] = [
    {
      id: "Quiet",
      label: "Quiet",
      icon: "lucide:leaf",
      color: "var(--success)",
      desc: "Low power draw, silent fans",
    },
    {
      id: "Balanced",
      label: "Balanced",
      icon: "lucide:scale",
      color: "var(--cyan)",
      desc: "Dynamic power balancing",
    },
    {
      id: "Performance",
      label: "Performance",
      icon: "lucide:flame",
      color: "var(--violet)",
      desc: "Max cooling, unlocked limits",
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
      {/* Welcome Banner */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold tracking-tight">System Status</h1>
          <p className="text-[10px] text-text-secondary">
            Realtime monitoring of your Lenovo LOQ laptop
          </p>
        </div>
        <div className="text-right">
          <div className="text-[10px] font-mono text-text-secondary">
            Last update: {new Date().toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Grid of Main Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* CPU Card */}
        <div className="glass-card p-3 rounded-xl flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <Icon icon="lucide:cpu" className="w-4 h-4 text-cyan" />
              <div>
                <span className="text-[10px] font-medium text-text-secondary block">CPU Usage</span>
                <span className="text-lg font-bold font-mono text-text-primary">
                  {stats.cpu_usage.toFixed(2)}%
                </span>
              </div>
            </div>
            <Sparkline data={cpuHistory} max={100} color="var(--cyan)" label="cpu" />
          </div>
          <div className="mt-2.5 pt-2 border-t border-border flex justify-between text-[10px] text-text-secondary">
            <span>Temp: <strong className="text-text-primary font-mono">{stats.cpu_temp}°C</strong></span>
            <span>Freq: <strong className="text-text-primary font-mono">3.4 GHz</strong></span>
          </div>
        </div>

        {/* GPU Card */}
        <div className="glass-card p-3 rounded-xl flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <Icon icon="lucide:monitor" className="w-4 h-4 text-violet" />
              <div>
                <span className="text-[10px] font-medium text-text-secondary block">GPU Usage</span>
                <span className="text-lg font-bold font-mono text-text-primary">
                  {stats.gpu_usage.toFixed(2)}%
                </span>
              </div>
            </div>
            <Sparkline data={gpuHistory} max={100} color="var(--violet)" label="gpu" />
          </div>
          <div className="mt-2.5 pt-2 border-t border-border flex justify-between text-[10px] text-text-secondary">
            <span>Temp: <strong className="text-text-primary font-mono">{stats.gpu_temp}°C</strong></span>
            <span>VRAM: <strong className="text-text-primary font-mono">2.4 / 6.0 GB</strong></span>
          </div>
        </div>

        {/* Thermal Card */}
        <div className="glass-card p-3 rounded-xl flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-2">
              <Icon icon="lucide:thermometer" className="w-4 h-4 text-danger" />
              <div>
                <span className="text-[10px] font-medium text-text-secondary block">Thermal Core</span>
                <span className="text-lg font-bold font-mono text-text-primary">
                  {stats.cpu_temp}°C
                </span>
              </div>
            </div>
            <Sparkline data={tempHistory} max={100} color="var(--danger)" label="temp" />
          </div>
          <div className="mt-2.5 pt-2 border-t border-border flex justify-between text-[10px] text-text-secondary">
            <span>Fan Speed: <strong className="text-text-primary font-mono">{stats.fan_speed} RPM</strong></span>
            <span>Status: <strong className="text-success">Optimal</strong></span>
          </div>
        </div>
      </div>

      {/* Power Profiles Toggles */}
      <div className="glass-panel p-4 rounded-xl">
        <h2 className="text-xs font-semibold mb-2 flex items-center gap-2">
          <Icon icon="lucide:zap" className="w-3.5 h-3.5 text-warning" />
          Active Power Profile
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {profiles.map((profile) => {
            const isSelected = powerProfile === profile.id;
            return (
              <button
                key={profile.id}
                onClick={() => handleProfileChange(profile.id)}
                className={`relative overflow-hidden group p-3 rounded-lg border text-left transition-all duration-300 cursor-pointer ${
                  isSelected
                    ? "bg-white/5 border-primary"
                    : "bg-transparent border-border hover:border-border-hover hover:bg-white/[0.02]"
                }`}
              >
                {/* Visual Accent Pill */}
                {isSelected && (
                  <motion.div
                    layoutId="activeProfileGlow"
                    className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent pointer-events-none"
                  />
                )}

                <div className="flex items-center gap-2.5 relative z-10">
                  <div
                    className="p-1.5 rounded-lg border"
                    style={{
                      borderColor: isSelected ? profile.color : "var(--border)",
                      color: isSelected ? profile.color : "var(--text-secondary)",
                    }}
                  >
                    <Icon icon={profile.icon} className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-text-primary block leading-none mb-1">
                      {profile.label}
                    </span>
                    <span className="text-[9px] text-text-secondary block leading-none">
                      {profile.desc}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Battery and System Overview mini-grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Battery Details */}
        <div className="glass-card p-3 rounded-xl space-y-2">
          <h3 className="text-[9px] font-bold uppercase tracking-wider text-text-muted">
            Battery Health
          </h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Icon
                icon={
                  stats.battery_charge > 80
                    ? "lucide:battery-full"
                    : stats.battery_charge > 40
                    ? "lucide:battery-medium"
                    : "lucide:battery-low"
                }
                className="w-7 h-7 text-success"
              />
              <div>
                <span className="text-lg font-bold font-mono leading-none block">{stats.battery_charge}%</span>
                <span className="text-[9px] text-text-secondary block">
                  {stats.battery_status}
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold font-mono block leading-none">
                {stats.battery_power_draw.toFixed(1)} W
              </span>
              <span className="text-[9px] text-text-secondary">Power Draw</span>
            </div>
          </div>
          <div className="w-full bg-border h-1 rounded-full overflow-hidden">
            <div
              className="bg-success h-full transition-all duration-500"
              style={{ width: `${stats.battery_charge}%` }}
            />
          </div>
        </div>

        {/* Storage / RAM Detail */}
        <div className="glass-card p-3 rounded-xl space-y-2">
          <h3 className="text-[9px] font-bold uppercase tracking-wider text-text-muted">
            Resource Pools
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[9px] text-text-secondary block font-semibold">Memory (RAM)</span>
              <span className="text-xs font-bold font-mono">
                {stats.ram_usage.toFixed(2)} / {stats.ram_total.toFixed(2)} GB
              </span>
              <div className="w-full bg-border h-1 rounded-full overflow-hidden mt-1">
                <div
                  className="bg-cyan h-full"
                  style={{ width: `${(stats.ram_usage / stats.ram_total) * 100}%` }}
                />
              </div>
            </div>

            <div>
              <span className="text-[9px] text-text-secondary block font-semibold">Storage (SSD)</span>
              <span className="text-xs font-bold font-mono">
                {stats.disk_usage.toFixed(2)} / {stats.disk_total.toFixed(2)} GB
              </span>
              <div className="w-full bg-border h-1 rounded-full overflow-hidden mt-1">
                <div
                  className="bg-violet h-full"
                  style={{ width: `${(stats.disk_usage / stats.disk_total) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
