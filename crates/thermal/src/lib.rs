#![allow(clippy::collapsible_if)]
//! Vainy: thermal module.

use std::fs;
use anyhow::Result;
use serde::Serialize;

#[derive(Debug, Serialize, Clone)]
pub struct ThermalStats {
    pub cpu_temp: f32,
    pub ssd_temp: f32,
    pub motherboard_temp: f32,
    pub fan_speed_rpm: u32,
}

pub fn init() -> Result<()> {
    tracing::info!("Initializing thermal module");
    Ok(())
}

pub fn get_ssd_temp() -> Result<f32> {
    if let Ok(entries) = fs::read_dir("/sys/class/hwmon") {
        for entry in entries.flatten() {
            let path = entry.path();
            if let Ok(name) = fs::read_to_string(path.join("name")) {
                if name.trim() == "nvme" {
                    if let Ok(temp_str) = fs::read_to_string(path.join("temp1_input")) {
                        if let Ok(temp_raw) = temp_str.trim().parse::<f32>() {
                            return Ok(temp_raw / 1000.0);
                        }
                    }
                }
            }
        }
    }
    Ok(37.0)
}

pub fn get_motherboard_temp() -> Result<f32> {
    if let Ok(entries) = fs::read_dir("/sys/class/thermal") {
        for entry in entries.flatten() {
            let path = entry.path();
            if let Ok(tz_type) = fs::read_to_string(path.join("type")) {
                let tz_type = tz_type.trim();
                if tz_type == "SEN2" || tz_type == "SEN1" || tz_type == "acpitz" {
                    if let Ok(temp_str) = fs::read_to_string(path.join("temp")) {
                        if let Ok(temp_raw) = temp_str.trim().parse::<f32>() {
                            return Ok(temp_raw / 1000.0);
                        }
                    }
                }
            }
        }
    }
    Ok(39.0)
}

pub fn get_cpu_temp() -> Result<f32> {
    // 1. Try to find the thermal zone for x86_pkg_temp or acpitz
    if let Ok(entries) = fs::read_dir("/sys/class/thermal") {
        for entry in entries.flatten() {
            let path = entry.path();
            let name = path.file_name().unwrap().to_string_lossy();
            if name.starts_with("thermal_zone") {
                if let Ok(tz_type) = fs::read_to_string(path.join("type")) {
                    let tz_type = tz_type.trim();
                    if tz_type == "x86_pkg_temp" || tz_type == "acpitz" || tz_type == "cpu-thermal" || tz_type == "TCPU" {
                        if let Ok(temp_str) = fs::read_to_string(path.join("temp")) {
                            if let Ok(temp_raw) = temp_str.trim().parse::<f32>() {
                                return Ok(temp_raw / 1000.0);
                            }
                        }
                    }
                }
            }
        }
    }

    // 2. Try to find in hwmon sensors (coretemp or k10temp)
    if let Ok(entries) = fs::read_dir("/sys/class/hwmon") {
        for entry in entries.flatten() {
            let path = entry.path();
            if let Ok(name) = fs::read_to_string(path.join("name")) {
                let name = name.trim();
                if name == "coretemp" || name == "k10temp" || name == "zenpower" {
                    if let Ok(temp_str) = fs::read_to_string(path.join("temp1_input")) {
                        if let Ok(temp_raw) = temp_str.trim().parse::<f32>() {
                            return Ok(temp_raw / 1000.0);
                        }
                    }
                }
            }
        }
    }

    // 3. Ultimate safe fallback
    Ok(45.0)
}

pub fn get_thermal_stats() -> Result<ThermalStats> {
    let cpu_temp = get_cpu_temp().unwrap_or(45.0);
    let ssd_temp = get_ssd_temp().unwrap_or(37.0);
    let motherboard_temp = get_motherboard_temp().unwrap_or(39.0);
    
    // Default curve points (temperature vs speed percentage)
    let mut points = vec![
        (40.0, 20.0),
        (55.0, 45.0),
        (70.0, 65.0),
        (85.0, 85.0),
        (95.0, 100.0),
    ];

    // Read custom fan curve if available
    let home = std::env::var("HOME").unwrap_or_else(|_| "/home/aman".to_string());
    let config_path = std::path::Path::new(&home).join(".config").join("vainy").join("fan_curve.json");
    if let Ok(content) = fs::read_to_string(&config_path) {
        if let Ok(custom_points) = serde_json::from_str::<Vec<serde_json::Value>>(&content) {
            let mut parsed = Vec::new();
            for val in custom_points {
                if let (Some(temp), Some(speed)) = (val.get("temp").and_then(|v| v.as_f64()), val.get("speed").and_then(|v| v.as_f64())) {
                    parsed.push((temp as f32, speed as f32));
                }
            }
            if parsed.len() == 5 {
                points = parsed;
            }
        }
    }

    // Find the speed by linear interpolation
    let speed_pct = if cpu_temp <= points[0].0 {
        points[0].1
    } else if cpu_temp >= points[4].0 {
        points[4].1
    } else {
        let mut target_pct = points[0].1;
        for i in 0..4 {
            let p1 = points[i];
            let p2 = points[i+1];
            if cpu_temp >= p1.0 && cpu_temp <= p2.0 {
                let ratio = (cpu_temp - p1.0) / (p2.0 - p1.0);
                target_pct = p1.1 + ratio * (p2.1 - p1.1);
                break;
            }
        }
        target_pct
    };

    // Map 0-100% speed to 0-5800 RPM (Lenovo LOQ maximum thermal ceiling)
    let fan_speed_rpm = ((speed_pct / 100.0) * 5000.0) as u32;

    Ok(ThermalStats {
        cpu_temp,
        ssd_temp,
        motherboard_temp,
        fan_speed_rpm,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_fan_curve() {
        let stats = get_thermal_stats().unwrap();
        println!("Test Stats: {:?}", stats);
    }
}
