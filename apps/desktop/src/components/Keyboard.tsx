import { useState } from "react";
import { Icon } from "@iconify/react";
import { useStore } from "../store/useStore";

export const Keyboard: React.FC = () => {
  const [supported, setSupported] = useState(true);
  const {
    keyboardBrightness: brightness,
    setKeyboardBrightness: setBrightness,
    keyboardRgbMode: rgbMode,
    setKeyboardRgbMode: setRgbMode,
    keyboardTimeout: timeout,
    setKeyboardTimeout: setTimeout,
  } = useStore();

  if (!supported) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-4 text-center">
        <div className="p-4 bg-white/5 border border-border rounded-full text-text-muted">
          <Icon icon="lucide:keyboard" className="w-12 h-12" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Keyboard RGB Unsupported</h1>
          <p className="text-xs text-text-secondary max-w-sm mt-1">
            We couldn't detect a Lenovo RGB-enabled keyboard on this system device. Some models only support white backlight via Fn+Space.
          </p>
        </div>
        <button
          onClick={() => setSupported(true)}
          className="text-xs text-cyan border border-cyan/20 px-3 py-1.5 rounded-lg bg-cyan/10 hover:bg-cyan/20 transition-all cursor-pointer"
        >
          Force Enable (Simulation Mode)
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Keyboard Backlight</h1>
          <p className="text-xs text-text-secondary">
            Configure RGB styles, brightness, and power-saving timeouts.
          </p>
        </div>
        <button
          onClick={() => setSupported(false)}
          className="text-[10px] text-text-muted hover:text-text-secondary underline cursor-pointer"
        >
          Simulate Unsupported Device
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Brightness & Timeout */}
        <div className="glass-card p-5 rounded-xl space-y-5">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Icon icon="lucide:sun" className="text-warning w-4.5 h-4.5" />
            Brightness & Power Save
          </h2>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span>Backlight Brightness</span>
              <span className="font-mono text-cyan">{brightness}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="25"
              value={brightness}
              onChange={(e) => setBrightness(Number(e.target.value))}
              className="w-full accent-cyan bg-border rounded-lg h-1.5 appearance-none cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span>Turn off backlight after inactivity</span>
              <span className="font-mono text-cyan">{timeout}s</span>
            </div>
            <input
              type="range"
              min="10"
              max="300"
              step="10"
              value={timeout}
              onChange={(e) => setTimeout(Number(e.target.value))}
              className="w-full accent-cyan bg-border rounded-lg h-1.5 appearance-none cursor-pointer"
            />
          </div>
        </div>

        {/* RGB Mode Selector */}
        <div className="glass-panel p-5 rounded-xl space-y-4">
          <h2 className="text-sm font-semibold flex items-center gap-2">
            <Icon icon="lucide:palette" className="text-violet w-4.5 h-4.5" />
            RGB Lighting Profiles
          </h2>
          
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: "static", label: "Static", icon: "lucide:circle" },
              { id: "breath", label: "Breathing", icon: "lucide:heart" },
              { id: "wave", label: "Color Wave", icon: "lucide:activity" },
              { id: "off", label: "Turn Off", icon: "lucide:eye-off" },
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => setRgbMode(mode.id)}
                className={`flex items-center gap-3 p-3 rounded-lg border text-xs font-semibold cursor-pointer transition-all duration-200 ${
                  rgbMode === mode.id
                    ? "bg-white/5 border-violet text-violet"
                    : "bg-transparent border-border text-text-secondary hover:border-border-hover hover:text-text-primary"
                }`}
              >
                <Icon icon={mode.icon} className="w-4 h-4" />
                <span>{mode.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
