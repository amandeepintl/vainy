#![allow(clippy::collapsible_if)]
//! Vainy: system module.

use std::fs;
use std::mem;
use anyhow::{Context, Result};
use serde::Serialize;

#[derive(Debug, Serialize, Clone)]
pub struct SystemStats {
    pub ram_used_gb: f32,
    pub ram_total_gb: f32,
    pub disk_used_gb: f32,
    pub disk_total_gb: f32,
    pub cpu_freq_mhz: f32,
}

pub fn init() -> Result<()> {
    tracing::info!("Initializing system module");
    Ok(())
}

fn parse_mem_line(line: &str) -> Result<f32> {
    let parts: Vec<&str> = line.split_whitespace().collect();
    if parts.len() >= 2 {
        parts[1].parse::<f32>().context("Failed to parse memory value")
    } else {
        anyhow::bail!("Invalid meminfo line format")
    }
}

pub fn get_ram_info() -> Result<(f32, f32)> {
    let content = fs::read_to_string("/proc/meminfo")
        .context("Failed to read /proc/meminfo")?;
    let mut total_kb = 0.0;
    let mut avail_kb = 0.0;

    for line in content.lines() {
        if line.starts_with("MemTotal:") {
            total_kb = parse_mem_line(line)?;
        } else if line.starts_with("MemAvailable:") {
            avail_kb = parse_mem_line(line)?;
        }
    }

    if total_kb == 0.0 {
        anyhow::bail!("MemTotal missing from /proc/meminfo");
    }

    // Fallback if MemAvailable is missing on older kernels
    if avail_kb == 0.0 {
        let mut free_kb = 0.0;
        let mut buffers_kb = 0.0;
        let mut cached_kb = 0.0;
        for line in content.lines() {
            if line.starts_with("MemFree:") {
                free_kb = parse_mem_line(line).unwrap_or(0.0);
            } else if line.starts_with("Buffers:") {
                buffers_kb = parse_mem_line(line).unwrap_or(0.0);
            } else if line.starts_with("Cached:") {
                cached_kb = parse_mem_line(line).unwrap_or(0.0);
            }
        }
        avail_kb = free_kb + buffers_kb + cached_kb;
    }

    let total_gb = total_kb / (1024.0 * 1024.0);
    let available_gb = avail_kb / (1024.0 * 1024.0);
    let used_gb = total_gb - available_gb;

    Ok((used_gb, total_gb))
}

pub fn get_disk_info() -> Result<(f32, f32)> {
    unsafe {
        let mut stats: libc::statvfs = mem::zeroed();
        let path = std::ffi::CString::new("/")?;
        if libc::statvfs(path.as_ptr(), &mut stats) == 0 {
            // total space = block count * fragment size
            let total = stats.f_blocks as f64 * stats.f_frsize as f64;
            // free space = free block count available to unprivileged users * fragment size
            let free = stats.f_bavail as f64 * stats.f_frsize as f64;
            let used = total - free;

            let bytes_in_gb = 1024.0 * 1024.0 * 1024.0;
            Ok(((used / bytes_in_gb) as f32, (total / bytes_in_gb) as f32))
        } else {
            anyhow::bail!("statvfs failed on / root partition");
        }
    }
}

pub fn get_cpu_freq_mhz() -> f32 {
    let mut sum_freq = 0.0;
    let mut count = 0;

    // Glob over active core directories in sysfs
    if let Ok(entries) = fs::read_dir("/sys/devices/system/cpu") {
        for entry in entries.flatten() {
            let name = entry.file_name().to_string_lossy().into_owned();
            if name.starts_with("cpu") && name[3..].chars().all(|c| c.is_ascii_digit()) {
                let freq_path = entry.path().join("cpufreq/scaling_cur_freq");
                if freq_path.exists() {
                    if let Ok(content) = fs::read_to_string(freq_path) {
                        if let Ok(freq_khz) = content.trim().parse::<f32>() {
                            sum_freq += freq_khz / 1000.0; // convert to MHz
                            count += 1;
                        }
                    }
                }
            }
        }
    }

    if count > 0 {
        sum_freq / count as f32
    } else {
        // Fallback: parse /proc/cpuinfo
        if let Ok(content) = fs::read_to_string("/proc/cpuinfo") {
            let mut sum = 0.0;
            let mut c = 0;
            for line in content.lines() {
                if line.starts_with("cpu MHz") {
                    if let Some(val_str) = line.split(':').nth(1) {
                        if let Ok(val) = val_str.trim().parse::<f32>() {
                            sum += val;
                            c += 1;
                        }
                    }
                }
            }
            if c > 0 {
                return sum / c as f32;
            }
        }
        3400.0 // Default fallback
    }
}

pub fn get_system_stats() -> Result<SystemStats> {
    let (ram_used, ram_total) = get_ram_info().unwrap_or((0.0, 16.0));
    let (disk_used, disk_total) = get_disk_info().unwrap_or((0.0, 512.0));
    let cpu_freq = get_cpu_freq_mhz();

    Ok(SystemStats {
        ram_used_gb: ram_used,
        ram_total_gb: ram_total,
        disk_used_gb: disk_used,
        disk_total_gb: disk_total,
        cpu_freq_mhz: cpu_freq,
    })
}
