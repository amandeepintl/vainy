import { useState } from "react";
import { useStore, LogEntry } from "../store/useStore";
import { Icon } from "@iconify/react";

export const Logs: React.FC = () => {
  const { logs, clearLogs } = useStore();
  const [filter, setFilter] = useState<"all" | "info" | "warn" | "error">("all");

  const filteredLogs = logs.filter((log: LogEntry) => {
    if (filter === "all") return true;
    return log.level === filter;
  });

  return (
    <div className="flex-1 overflow-y-auto p-6 flex flex-col space-y-4 h-full">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">System Logs</h1>
          <p className="text-xs text-text-secondary">
            View kernel diagnostics, telemetry polls, and daemon trace messages.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Filter tabs */}
          <div className="flex bg-white/5 border border-border p-0.5 rounded-lg text-[10px]">
            {["all", "info", "warn", "error"].map((lvl) => (
              <button
                key={lvl}
                onClick={() => setFilter(lvl as any)}
                className={`px-2.5 py-1 rounded cursor-pointer capitalize font-semibold ${
                  filter === lvl ? "bg-primary text-text-primary" : "text-text-secondary hover:text-text-primary"
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

          <button
            onClick={clearLogs}
            className="p-1.5 bg-white/5 border border-border hover:bg-danger/10 hover:border-danger/30 text-text-secondary hover:text-danger rounded-lg transition-all cursor-pointer"
            title="Clear logs"
          >
            <Icon icon="lucide:trash" className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Terminal View */}
      <div className="flex-1 min-h-0 bg-black/40 border border-border rounded-xl p-4 font-mono text-[11px] overflow-y-auto space-y-1.5 select-text shadow-inner">
        {filteredLogs.length === 0 ? (
          <div className="text-text-muted text-center py-8">
            No diagnostic messages found.
          </div>
        ) : (
          filteredLogs.map((log: LogEntry, idx: number) => {
            const levelColors: Record<"info" | "warn" | "error", string> = {
              info: "text-cyan",
              warn: "text-warning",
              error: "text-danger",
            };
            return (
              <div key={idx} className="flex gap-2 hover:bg-white/[0.02] py-0.5 px-1 rounded transition-colors">
                <span className="text-text-muted">{log.timestamp}</span>
                <span className={`font-bold ${levelColors[log.level]}`}>
                  [{log.level.toUpperCase()}]
                </span>
                <span className="text-violet">[{log.module}]</span>
                <span className="text-text-primary">{log.message}</span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
