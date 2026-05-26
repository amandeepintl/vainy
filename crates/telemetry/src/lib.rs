#![allow(clippy::collapsible_if, clippy::needless_borrows_for_generic_args)]
//! Vainy: telemetry module.

use std::fs;
use std::sync::Mutex;
use std::process::Command;
use anyhow::{Context, Result};
use serde::Serialize;

#[derive(Debug, Serialize, Clone)]
pub struct HardwareStats {
    pub cpu_usage: f32,
    pub cpu_temp: f32,
    pub gpu_usage: f32,
    pub gpu_temp: f32,
    pub ram_usage: f32,
    pub ram_total: f32,
    pub disk_usage: f32,
    pub disk_total: f32,
    pub battery_charge: u8,
    pub battery_status: String,
    pub battery_power_draw: f32,
    pub fan_speed: u32,
    pub power_profile: String,
    pub ssd_temp: f32,
    pub motherboard_temp: f32,
}

#[derive(Debug, Clone, Copy, Default)]
struct CpuTimes {
    active: u64,
    idle: u64,
}

static LAST_CPU_TIMES: Mutex<Option<CpuTimes>> = Mutex::new(None);

pub fn init() -> Result<()> {
    tracing::info!("Initializing telemetry module");
    // Run an initial reading to warm up CPU usage deltas
    let _ = read_cpu_times();
    Ok(())
}

fn read_cpu_times() -> Result<CpuTimes> {
    let content = fs::read_to_string("/proc/stat")
        .context("Failed reading /proc/stat")?;
    let first_line = content.lines().next().context("Empty /proc/stat file")?;
    let parts: Vec<&str> = first_line.split_whitespace().collect();
    if parts.len() < 5 {
        anyhow::bail!("Invalid cpu format in /proc/stat");
    }

    let user: u64 = parts[1].parse().unwrap_or(0);
    let nice: u64 = parts[2].parse().unwrap_or(0);
    let system: u64 = parts[3].parse().unwrap_or(0);
    let idle: u64 = parts[4].parse().unwrap_or(0);
    let iowait: u64 = parts[5].parse().unwrap_or(0);
    let irq: u64 = parts[6].parse().unwrap_or(0);
    let softirq: u64 = parts[7].parse().unwrap_or(0);
    let steal: u64 = parts[8].parse().unwrap_or(0);

    let active = user + nice + system + irq + softirq + steal;
    let idle_total = idle + iowait;

    Ok(CpuTimes { active, idle: idle_total })
}

pub fn get_cpu_usage() -> Result<f32> {
    let current = read_cpu_times()?;
    let mut guard = LAST_CPU_TIMES.lock().unwrap();

    let usage = if let Some(previous) = *guard {
        let active_diff = current.active.saturating_sub(previous.active);
        let idle_diff = current.idle.saturating_sub(previous.idle);
        let total_diff = active_diff + idle_diff;

        if total_diff > 0 {
            (active_diff as f32 / total_diff as f32) * 100.0
        } else {
            0.0
        }
    } else {
        0.0
    };

    *guard = Some(current);
    Ok(usage)
}

fn get_gpu_stats() -> (f32, f32) {
    // Invoke nvidia-smi safely, handling missing paths or driver mismatch
    if let Ok(output) = Command::new("nvidia-smi")
        .args(&["--query-gpu=utilization.gpu,temperature.gpu", "--format=csv,noheader,nounits"])
        .output()
    {
        if output.status.success() {
            let stdout = String::from_utf8_lossy(&output.stdout);
            let parts: Vec<&str> = stdout.trim().split(',').collect();
            if parts.len() >= 2 {
                let usage = parts[0].trim().parse::<f32>().unwrap_or(0.0);
                let temp = parts[1].trim().parse::<f32>().unwrap_or(0.0);
                return (usage, temp);
            }
        }
    }
    (0.0, 0.0)
}

pub fn get_hardware_stats() -> Result<HardwareStats> {
    let cpu_usage = get_cpu_usage().unwrap_or(0.0);
    let (gpu_usage, gpu_temp) = get_gpu_stats();

    let battery = vainy_battery::get_battery_info().unwrap_or_else(|_| {
        vainy_battery::BatteryInfo {
            charge_percent: 100,
            status: "Full".to_string(),
            cycle_count: 0,
            health_percent: 100.0,
            power_draw_watts: 0.0,
        }
    });

    let system = vainy_system::get_system_stats().unwrap_or(
        vainy_system::SystemStats {
            ram_used_gb: 0.0,
            ram_total_gb: 16.0,
            disk_used_gb: 0.0,
            disk_total_gb: 512.0,
            cpu_freq_mhz: 3400.0,
        }
    );

    let thermal = vainy_thermal::get_thermal_stats().unwrap_or(
        vainy_thermal::ThermalStats {
            cpu_temp: 45.0,
            ssd_temp: 37.0,
            motherboard_temp: 39.0,
            fan_speed_rpm: 0,
        }
    );

    let power_profile = vainy_power::get_power_profile().unwrap_or_else(|_| "Balanced".to_string());

    Ok(HardwareStats {
        cpu_usage,
        cpu_temp: thermal.cpu_temp,
        gpu_usage,
        gpu_temp,
        ram_usage: system.ram_used_gb,
        ram_total: system.ram_total_gb,
        disk_usage: system.disk_used_gb,
        disk_total: system.disk_total_gb,
        battery_charge: battery.charge_percent,
        battery_status: battery.status,
        battery_power_draw: battery.power_draw_watts,
        fan_speed: thermal.fan_speed_rpm,
        power_profile,
        ssd_temp: thermal.ssd_temp,
        motherboard_temp: thermal.motherboard_temp,
    })
}
