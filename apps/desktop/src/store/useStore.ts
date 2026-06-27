import { create } from "zustand";
import { persist } from "zustand/middleware";

export type Page =
  | "dashboard"
  | "battery"
  | "performance"
  | "thermals"
  | "gpu"
  | "keyboard"
  | "system"
  | "settings"
  | "logs";

export type PowerProfile = "Quiet" | "Balanced" | "Performance" | "Custom";

export interface HardwareStats {
  cpu_usage: number;
  cpu_temp: number;
  gpu_usage: number;
  gpu_temp: number;
  ram_usage: number;
  ram_total: number;
  disk_usage: number;
  disk_total: number;
  battery_charge: number;
  battery_status: string;
  battery_power_draw: number;
  fan_speed: number;
  power_profile: PowerProfile;
  ssd_temp: number;
  motherboard_temp: number;
}

export interface LogEntry {
  timestamp: string;
  level: "info" | "warn" | "error";
  message: string;
  module: string;
}

export type GpuMode = "integrated" | "hybrid" | "dedicated";

interface AppState {
  activePage: Page;
  setActivePage: (page: Page) => void;
  powerProfile: PowerProfile;
  setPowerProfile: (profile: PowerProfile) => Promise<void> | void;
  setPowerProfileSilent: (profile: PowerProfile) => void;
  gpuMode: GpuMode;
  getGpuMode: () => Promise<void>;
  setGpuMode: (mode: GpuMode) => Promise<void>;
  configureLaunchersDiscreteGpu: () => Promise<string>;
  stats: HardwareStats;
  setStats: (stats: HardwareStats) => void;
  logs: LogEntry[];
  addLog: (level: "info" | "warn" | "error", message: string, module: string) => void;
  clearLogs: () => void;
  keyboardBrightness: number;
  setKeyboardBrightness: (brightness: number) => Promise<void> | void;
  keyboardRgbMode: string;
  setKeyboardRgbMode: (mode: string) => Promise<void> | void;
  keyboardTimeout: number;
  setKeyboardTimeout: (timeout: number) => void;
  curvePoints: FanCurvePoint[];
  setCurvePoints: (points: FanCurvePoint[]) => Promise<void> | void;
}

export interface FanCurvePoint {
  temp: number;
  speed: number;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
  activePage: "dashboard",
  setActivePage: (page) => set({ activePage: page }),
  powerProfile: "Balanced",
  setPowerProfile: async (profile) => {
    set((state) => {
      const newLog: LogEntry = {
        timestamp: new Date().toLocaleTimeString(),
        level: "info",
        message: `Power profile switch requested: ${profile}`,
        module: "power",
      };
      return {
        powerProfile: profile,
        logs: [newLog, ...state.logs].slice(0, 500),
      };
    });

    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("set_power_profile", { profile });
    } catch (e) {
      // Gracefully fallback for browser/mock environments
      console.warn("Tauri platform profile invoke unsupported: ", e);
    }
  },
  setPowerProfileSilent: (profile) => set({ powerProfile: profile }),
  gpuMode: "hybrid",
  getGpuMode: async () => {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const mode: any = await invoke("get_gpu_mode");
      set({ gpuMode: mode });
    } catch (e) {
      console.warn("Tauri get_gpu_mode invoke unsupported: ", e);
    }
  },
  setGpuMode: async (mode) => {
    set((state) => {
      const newLog: LogEntry = {
        timestamp: new Date().toLocaleTimeString(),
        level: "info",
        message: `GPU Graphics Mode switch requested: ${mode}`,
        module: "gpu",
      };
      return {
        gpuMode: mode,
        logs: [newLog, ...state.logs].slice(0, 500),
      };
    });

    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("set_gpu_mode", { mode });
    } catch (e) {
      console.warn("Tauri set_gpu_mode invoke unsupported: ", e);
    }
  },
  configureLaunchersDiscreteGpu: async () => {
    try {
      const { invoke } = await import("@tauri-apps/api/core");
      const result: string = await invoke("configure_launchers_discrete_gpu");
      set((state) => {
        const newLog: LogEntry = {
          timestamp: new Date().toLocaleTimeString(),
          level: "info",
          message: `Auto-configured launchers: ${result}`,
          module: "system",
        };
        return {
          logs: [newLog, ...state.logs].slice(0, 500),
        };
      });
      return result;
    } catch (e: any) {
      set((state) => {
        const newLog: LogEntry = {
          timestamp: new Date().toLocaleTimeString(),
          level: "error",
          message: `Failed to auto-configure launchers: ${e}`,
          module: "system",
        };
        return {
          logs: [newLog, ...state.logs].slice(0, 500),
        };
      });
      throw e;
    }
  },
  stats: {
    cpu_usage: 0,
    cpu_temp: 0,
    gpu_usage: 0,
    gpu_temp: 0,
    ram_usage: 0,
    ram_total: 16,
    disk_usage: 0,
    disk_total: 512,
    battery_charge: 100,
    battery_status: "Full",
    battery_power_draw: 0,
    fan_speed: 0,
    power_profile: "Balanced",
    ssd_temp: 37,
    motherboard_temp: 39,
  },
  setStats: (stats) => set({ stats }),
  logs: [
    {
      timestamp: new Date().toLocaleTimeString(),
      level: "info",
      message: "Vainy Frontend initialized.",
      module: "system",
    },
  ],
  addLog: (level, message, module) =>
    set((state) => ({
      logs: [
        {
          timestamp: new Date().toLocaleTimeString(),
          level,
          message,
          module,
        },
        ...state.logs,
      ].slice(0, 500),
    })),
  clearLogs: () => set({ logs: [] }),
  keyboardBrightness: 100,
  setKeyboardBrightness: async (brightness) => {
    set((state) => {
      const newLog: LogEntry = {
        timestamp: new Date().toLocaleTimeString(),
        level: "info",
        message: `Keyboard brightness set to ${brightness}%`,
        module: "keyboard",
      };
      return {
        keyboardBrightness: brightness,
        // Sync RGB mode toggle state: if brightness is 0, mode is off
        keyboardRgbMode: brightness === 0 ? "off" : state.keyboardRgbMode === "off" ? "static" : state.keyboardRgbMode,
        logs: [newLog, ...state.logs].slice(0, 500),
      };
    });

    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("set_keyboard_backlight", { brightness, mode: null });
    } catch (e) {
      console.warn("Tauri keyboard backlight invoke unsupported: ", e);
    }
  },
  keyboardRgbMode: "breath",
  setKeyboardRgbMode: async (mode) => {
    set((state) => {
      const newLog: LogEntry = {
        timestamp: new Date().toLocaleTimeString(),
        level: "info",
        message: `Keyboard RGB profile set to: ${mode}`,
        module: "keyboard",
      };
      return {
        keyboardRgbMode: mode,
        // Sync brightness: if mode is off, set brightness to 0, otherwise restore to 100 if it was 0
        keyboardBrightness: mode === "off" ? 0 : state.keyboardBrightness === 0 ? 100 : state.keyboardBrightness,
        logs: [newLog, ...state.logs].slice(0, 500),
      };
    });

    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("set_keyboard_backlight", { brightness: null, mode });
    } catch (e) {
      console.warn("Tauri keyboard backlight invoke unsupported: ", e);
    }
  },
  keyboardTimeout: 60,
  setKeyboardTimeout: (timeout) => set({ keyboardTimeout: timeout }),
  curvePoints: [
    { temp: 40, speed: 20 },
    { temp: 55, speed: 45 },
    { temp: 70, speed: 65 },
    { temp: 85, speed: 85 },
    { temp: 95, speed: 100 },
  ],
  setCurvePoints: async (points) => {
    set((state) => {
      const newLog: LogEntry = {
        timestamp: new Date().toLocaleTimeString(),
        level: "info",
        message: "Custom thermal fan curve points updated",
        module: "thermal",
      };
      return {
        curvePoints: points,
        logs: [newLog, ...state.logs].slice(0, 500),
      };
    });

    try {
      const { invoke } = await import("@tauri-apps/api/core");
      await invoke("set_fan_curve", { points });
    } catch (e) {
      console.warn("Tauri set_fan_curve invoke unsupported: ", e);
    }
  },
    }),
    {
      name: "vainy-app-store",
      partialize: (state) => ({
        powerProfile: state.powerProfile,
        keyboardBrightness: state.keyboardBrightness,
        keyboardRgbMode: state.keyboardRgbMode,
        keyboardTimeout: state.keyboardTimeout,
        curvePoints: state.curvePoints,
        gpuMode: state.gpuMode,
      }),
    }
  )
);
