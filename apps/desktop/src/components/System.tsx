
import { Icon } from "@iconify/react";

export const System: React.FC = () => {
  const specs = [
    { category: "Device Profile", items: [
      { name: "Model", val: "Lenovo LOQ 15IAX9E", icon: "lucide:laptop" },
      { name: "BIOS Version", val: "NCCN19WW", icon: "lucide:binary" },
      { name: "EC Version", val: "NCCE19WW", icon: "lucide:cpu" },
      { name: "Motherboard", val: "Lenovo LNVNB161216", icon: "lucide:layers" },
    ]},
    { category: "Operating System", items: [
      { name: "Kernel Version", val: "Linux 6.8.0-35-generic", icon: "lucide:tux" },
      { name: "OS Release", val: "Zorin OS 18.1 Core", icon: "lucide:info" },
      { name: "Display Server", val: "Wayland (Mutter)", icon: "lucide:monitor" },
    ]},
    { category: "Hardware Specs", items: [
      { name: "Processor (CPU)", val: "12th Gen Intel® Core™ i7-12650HX (10 Cores, 20 Threads)", icon: "lucide:cpu" },
      { name: "Discrete Graphics", val: "NVIDIA GeForce RTX 4050 Laptop GPU (6GB VRAM)", icon: "lucide:monitor" },
      { name: "Integrated Graphics", val: "Intel UHD Graphics", icon: "lucide:sparkles" },
      { name: "Installed RAM", val: "16.0 GB DDR5 @ 4800 MHz", icon: "lucide:database" },
      { name: "Storage Drives", val: "512 GB NVMe SSD", icon: "lucide:hard-drive" },
    ]},
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">System Specifications</h1>
        <p className="text-xs text-text-secondary">
          Detailed telemetry and hardware configurations for this machine.
        </p>
      </div>

      <div className="space-y-6">
        {specs.map((group) => (
          <div key={group.category} className="glass-panel p-5 rounded-xl space-y-3">
            <h2 className="text-xs font-bold uppercase tracking-wider text-text-muted">
              {group.category}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {group.items.map((spec) => (
                <div
                  key={spec.name}
                  className="flex items-center gap-3 p-3 bg-white/[0.01] border border-border rounded-lg"
                >
                  <div className="p-2 rounded bg-white/5 text-cyan">
                    <Icon icon={spec.icon} className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] text-text-secondary block">{spec.name}</span>
                    <span className="text-xs font-semibold text-text-primary">{spec.val}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
