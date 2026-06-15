
import { useStore, Page } from "../store/useStore";
import { Icon } from "@iconify/react";
import { motion } from "motion/react";

interface MenuItem {
  id: Page;
  label: string;
  icon: string;
}

export const Sidebar: React.FC = () => {
  const { activePage, setActivePage } = useStore();

  const menuItems: MenuItem[] = [
    { id: "dashboard", label: "Dashboard", icon: "lucide:layout-dashboard" },
    { id: "battery", label: "Battery", icon: "lucide:battery-charging" },
    { id: "performance", label: "Performance", icon: "lucide:gauge" },
    { id: "thermals", label: "Thermals", icon: "lucide:thermometer" },
    { id: "gpu", label: "GPU", icon: "lucide:cpu" },
    { id: "keyboard", label: "Keyboard", icon: "lucide:keyboard" },
    { id: "system", label: "System", icon: "lucide:info" },
    { id: "settings", label: "Settings", icon: "lucide:settings" },
    { id: "logs", label: "Logs", icon: "lucide:terminal" },
  ];

  return (
    <div className="w-56 h-full border-r border-border bg-glass backdrop-blur-xl flex flex-col justify-between p-3 select-none">
      {/* Menu List */}
      <div className="flex flex-col gap-1.5">
        {menuItems.map((item) => {
          const isActive = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActivePage(item.id)}
              className={`relative group w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all duration-300 cursor-pointer ${
                isActive
                  ? "text-text-primary"
                  : "text-text-secondary hover:text-text-primary hover:bg-white/5"
              }`}
            >
              {/* Active Indicator Pillar */}
              {isActive && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute left-0 top-2 bottom-2 w-1 bg-cyan rounded-r-full"
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}

              {/* Icon */}
              <div className="relative z-10">
                <Icon
                  icon={item.icon}
                  className={`w-4 h-4 transition-transform duration-300 group-hover:scale-110 ${
                    isActive ? "text-cyan" : "text-text-secondary"
                  }`}
                />
              </div>

              {/* Label */}
              <span className="relative z-10">{item.label}</span>

              {/* Hover effect light glow */}
              <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-cyan/5 to-violet/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
            </button>
          );
        })}
      </div>

      {/* Footer / Profile Status */}
      <div className="bg-card border border-border p-3 rounded-xl flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-[10px] text-text-secondary font-mono">Daemon Online</span>
        </div>
        <div className="text-[9px] text-text-muted truncate">
          Zorin OS 18.1 Core
        </div>
      </div>
    </div>
  );
};
