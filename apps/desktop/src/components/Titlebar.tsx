import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";

export const Titlebar: React.FC = () => {
  const [appWindow, setAppWindow] = useState<any>(null);

  useEffect(() => {
    // Dynamic import to prevent crash when running in browser
    import("@tauri-apps/api/window")
      .then(({ getCurrentWindow }) => {
        setAppWindow(getCurrentWindow());
      })
      .catch(() => {
        // Safe fail-safe for browser development
      });
  }, []);

  const handleMinimize = async () => {
    if (appWindow) {
      await appWindow.minimize();
    } else {
      console.log("Minimize window (browser mock)");
    }
  };


  const handleClose = async () => {
    if (appWindow) {
      await appWindow.close();
    } else {
      console.log("Close window (browser mock)");
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && appWindow) {
      const target = e.target as HTMLElement;
      if (!target.closest("button") && !target.closest("a") && !target.closest("input")) {
        appWindow.startDragging();
      }
    }
  };

  return (
    <div
      data-tauri-drag-region
      onMouseDown={handleMouseDown}
      className="h-10 w-full flex items-center justify-between px-4 border-b border-border bg-glass backdrop-blur-xl select-none text-text-secondary sticky top-0 z-50 rounded-t-[24px] cursor-default"
    >
      {/* App Logo & Title */}
      <div data-tauri-drag-region className="flex items-center gap-2">
        <img
          src="/assets/branding/logo.png"
          alt="Vainy Logo"
          className="h-4 w-4 object-contain"
          onError={(e) => {
            // Fallback if logo not found (e.g. path mapping)
            (e.target as HTMLImageElement).style.display = "none";
          }}
        />
        <span data-tauri-drag-region className="text-xs font-semibold text-text-primary tracking-wider font-sans">
          VAINY
        </span>
        <span className="text-[10px] bg-primary/20 text-cyan px-1.5 py-0.5 rounded border border-cyan/20 scale-90 font-mono">
          v0.1.0-alpha
        </span>
      </div>

      {/* Center Device Name Display */}
      <div data-tauri-drag-region className="hidden md:block text-xs font-semibold text-text-secondary tracking-wide font-sans">
        Lenovo LOQ 15IAX9E
      </div>

      {/* Window Controls */}
      <div className="flex items-center gap-1">
        {/* Minimize */}
        <button
          onClick={handleMinimize}
          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-white/5 text-text-secondary hover:text-text-primary transition-all duration-200"
          title="Minimize"
        >
          <Icon icon="lucide:minus" className="w-4 h-4" />
        </button>

        {/* Close */}
        <button
          onClick={handleClose}
          className="w-7 h-7 flex items-center justify-center rounded-md hover:bg-danger/20 text-text-secondary hover:text-danger transition-all duration-200"
          title="Close"
        >
          <Icon icon="lucide:x" className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
