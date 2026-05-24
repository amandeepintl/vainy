//! Vainy: power module.

use std::fs;
use std::io::Write;
use std::os::unix::net::UnixStream;
use std::path::Path;
use anyhow::{Context, Result};

pub fn init() -> Result<()> {
    tracing::info!("Initializing power module");
    Ok(())
}

pub fn get_power_profile() -> Result<String> {
    let path = Path::new("/sys/firmware/acpi/platform_profile");
    if path.exists() {
        let content = fs::read_to_string(path)?;
        let raw = content.trim();
        let mapped = match raw {
            "low-power" => "Quiet",
            "balanced" => "Balanced",
            "performance" => "Performance",
            "balanced-performance" => "Balanced",
            "custom" => "Custom",
            _ => "Balanced",
        };
        Ok(mapped.to_string())
    } else {
        Ok("Balanced".to_string())
    }
}

pub fn set_power_profile(profile: &str) -> Result<()> {
    let acpi_profile = match profile {
        "Quiet" => "low-power",
        "Balanced" => "balanced",
        "Performance" => "performance",
        _ => "balanced",
    };

    let socket_path = "/tmp/vainyd.sock";

    // 1. Try sending the write request to the background root daemon via UDS
    if Path::new(socket_path).exists() {
        match UnixStream::connect(socket_path) {
            Ok(mut stream) => {
                let msg = format!("set_profile {}\n", acpi_profile);
                if let Err(e) = stream.write_all(msg.as_bytes()) {
                    tracing::warn!("Failed writing to daemon socket: {:?}", e);
                } else {
                    tracing::info!("Sent power profile change request to daemon: {}", acpi_profile);
                    return Ok(());
                }
            }
            Err(e) => {
                tracing::warn!("Failed connecting to daemon socket: {:?}", e);
            }
        }
    }

    // 2. Fallback: Write directly (succeeds if client runs with root privileges)
    let path = Path::new("/sys/firmware/acpi/platform_profile");
    if path.exists() {
        fs::write(path, acpi_profile)
            .context("Failed writing to sysfs platform_profile. (Ensure Vainy daemon is running)")?;
        tracing::info!("Wrote profile directly to sysfs: {}", acpi_profile);
        Ok(())
    } else {
        anyhow::bail!("Platform profile ACPI driver not found on this system.")
    }
}
