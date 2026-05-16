//! Vainy: battery module.

use std::fs;
use std::path::Path;
use anyhow::{Context, Result};
use serde::Serialize;

#[derive(Debug, Serialize, Clone)]
pub struct BatteryInfo {
    pub charge_percent: u8,
    pub status: String,
    pub cycle_count: u32,
    pub health_percent: f32,
    pub power_draw_watts: f32,
}

pub fn init() -> Result<()> {
    tracing::info!("Initializing battery module");
    Ok(())
}

fn read_sys_file(path: &Path) -> Result<String> {
    let content = fs::read_to_string(path)?;
    Ok(content.trim().to_string())
}

fn read_sys_u32(path: &Path) -> Result<u32> {
    let s = read_sys_file(path)?;
    s.parse::<u32>().context("Failed to parse u32")
}

fn read_sys_f32(path: &Path) -> Result<f32> {
    let s = read_sys_file(path)?;
    s.parse::<f32>().context("Failed to parse f32")
}

pub fn get_battery_info() -> Result<BatteryInfo> {
    let bat_dir = if Path::new("/sys/class/power_supply/BAT0").exists() {
        Path::new("/sys/class/power_supply/BAT0")
    } else if Path::new("/sys/class/power_supply/BAT1").exists() {
        Path::new("/sys/class/power_supply/BAT1")
    } else {
        // Return fallback battery data for desktop or VM
        return Ok(BatteryInfo {
            charge_percent: 100,
            status: "Full".to_string(),
            cycle_count: 0,
            health_percent: 100.0,
            power_draw_watts: 0.0,
        });
    };

    let charge_percent = read_sys_u32(&bat_dir.join("capacity")).unwrap_or(100) as u8;
    let status = read_sys_file(&bat_dir.join("status")).unwrap_or_else(|_| "Unknown".to_string());
    let cycle_count = read_sys_u32(&bat_dir.join("cycle_count")).unwrap_or(0);

    // Retrieve full capacities to calculate battery health
    let energy_full = read_sys_f32(&bat_dir.join("energy_full"))
        .or_else(|_| read_sys_f32(&bat_dir.join("charge_full")))
        .unwrap_or(100.0);
    let energy_design = read_sys_f32(&bat_dir.join("energy_full_design"))
        .or_else(|_| read_sys_f32(&bat_dir.join("charge_full_design")))
        .unwrap_or(100.0);

    let health_percent = if energy_design > 0.0 {
        ((energy_full / energy_design) * 100.0).min(100.0)
    } else {
        100.0
    };

    // Calculate current power draw
    let power_now_uw = read_sys_f32(&bat_dir.join("power_now"))
        .or_else(|_| -> Result<f32> {
            let current = read_sys_f32(&bat_dir.join("current_now"))?;
            let voltage = read_sys_f32(&bat_dir.join("voltage_now"))?;
            // power = current * voltage / 1,000,000
            Ok((current * voltage) / 1_000_000.0)
        })
        .unwrap_or(0.0);

    let power_draw_watts = power_now_uw / 1_000_000.0;
    
    // Signed power draw for Vantage UI compatibility
    let signed_power_draw = if status == "Discharging" {
        -power_draw_watts
    } else {
        power_draw_watts
    };

    Ok(BatteryInfo {
        charge_percent,
        status,
        cycle_count,
        health_percent,
        power_draw_watts: signed_power_draw,
    })
}
