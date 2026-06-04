//! Vainy Daemon: System hardware control daemon.

use std::fs;
use std::path::Path;
use anyhow::Context;
use tokio::io::AsyncReadExt;
use tokio::net::UnixListener;
use tracing::{error, info};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Initialize error handling (color-eyre hooks)
    color_eyre::install()
        .map_err(|e| anyhow::anyhow!("Failed to install color-eyre: {:?}", e))?;

    // Initialize tracing
    tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::EnvFilter::from_default_env())
        .init();

    info!("Starting Vainy Daemon...");

    // Initialize submodules with anyhow contexts
    vainy_platform::init().context("Failed to initialize platform module")?;
    vainy_system::init().context("Failed to initialize system module")?;
    vainy_battery::init().context("Failed to initialize battery module")?;
    vainy_power::init().context("Failed to initialize power module")?;
    vainy_thermal::init().context("Failed to initialize thermal module")?;
    vainy_gpu::init().context("Failed to initialize GPU module")?;
    vainy_keyboard::init().context("Failed to initialize keyboard module")?;
    vainy_telemetry::init().context("Failed to initialize telemetry module")?;
    vainy_updater::init().context("Failed to initialize updater module")?;

    // Spawn background task to monitor charging state and switch profile
    tokio::spawn(async {
        let mut last_charging: Option<bool> = None;
        loop {
            tokio::time::sleep(tokio::time::Duration::from_secs(3)).await;
            if let Ok(info) = vainy_battery::get_battery_info() {
                // If status is "Charging" or "Full", AC is connected.
                // If "Discharging", it's on battery.
                let is_charging = info.status != "Discharging" && info.status != "Unknown";
                
                if Some(is_charging) != last_charging {
                    let target_profile = if is_charging {
                        "performance"
                    } else {
                        "low-power"
                    };
                    
                    info!(
                        "Power state transition detected: charging={}. Switching to profile '{}'",
                        is_charging, target_profile
                    );
                    
                    if let Err(e) = set_profile_impl(target_profile) {
                        error!("Failed to auto-switch profile: {:?}", e);
                    }
                    last_charging = Some(is_charging);
                }
            }
        }
    });

    // Start Unix Domain Socket listener for secure client interactions
    let socket_path = "/tmp/vainyd.sock";
    if Path::new(socket_path).exists() {
        let _ = fs::remove_file(socket_path);
    }

    let listener = UnixListener::bind(socket_path)
        .context("Failed binding Unix Domain Socket at /tmp/vainyd.sock")?;

    // Change permissions to 0o666 to allow non-root users to write to the socket
    if let Ok(metadata) = fs::metadata(socket_path) {
        let mut permissions = metadata.permissions();
        use std::os::unix::fs::PermissionsExt;
        permissions.set_mode(0o666);
        if let Err(e) = fs::set_permissions(socket_path, permissions) {
            error!("Failed to set socket permissions to 0o666: {:?}", e);
        } else {
            info!("Successfully set socket permissions to 0o666");
        }
    }

    info!("Vainy Daemon running and listening on UDS: {}", socket_path);

    // Accept requests in loop
    loop {
        match listener.accept().await {
            Ok((mut stream, _addr)) => {
                tokio::spawn(async move {
                    let mut buf = [0; 256];
                    match stream.read(&mut buf).await {
                        Ok(n) if n > 0 => {
                            let request = String::from_utf8_lossy(&buf[..n]);
                            if let Err(e) = handle_request(&request).await {
                                error!("Daemon request failed: {:?}", e);
                            }
                        }
                        Ok(_) => {}
                        Err(e) => {
                            error!("Error reading UDS stream: {:?}", e);
                        }
                    }
                });
            }
            Err(e) => {
                error!("Error accepting connection on UDS socket: {:?}", e);
            }
        }
    }
}

fn apply_cpu_tunings(profile: &str) -> anyhow::Result<()> {
    let (governor, epp) = match profile {
        "low-power" => ("powersave", "power"),
        "balanced" => ("powersave", "balance_performance"),
        "performance" => ("performance", "performance"),
        _ => ("powersave", "balance_performance"),
    };

    let cpufreq_dir = "/sys/devices/system/cpu/cpufreq";
    if Path::new(cpufreq_dir).exists() {
        for entry in fs::read_dir(cpufreq_dir)? {
            let entry = entry?;
            let path = entry.path();
            if path.is_dir() {
                let name = entry.file_name();
                let name_str = name.to_string_lossy();
                if name_str.starts_with("policy") {
                    let gov_path = path.join("scaling_governor");
                    let epp_path = path.join("energy_performance_preference");

                    if gov_path.exists() {
                        let _ = fs::write(&gov_path, governor);
                    }
                    if epp_path.exists() {
                        let _ = fs::write(&epp_path, epp);
                    }
                }
            }
        }
        info!("Applied CPU tunings for '{}': governor={}, epp={}", profile, governor, epp);
    }
    Ok(())
}

fn set_profile_impl(profile: &str) -> anyhow::Result<()> {
    if profile == "low-power" || profile == "balanced" || profile == "performance" {
        let path = "/sys/firmware/acpi/platform_profile";
        if Path::new(path).exists() {
            fs::write(path, profile)
                .context("Failed writing to platform_profile sysfs path")?;
            info!("Daemon successfully wrote profile '{}' to sysfs platform_profile", profile);
        }
        
        if let Err(e) = apply_cpu_tunings(profile) {
            error!("Failed to apply CPU tunings: {:?}", e);
        }
        Ok(())
    } else {
        anyhow::bail!("Rejected unauthorized or invalid profile query: {}", profile);
    }
}

fn set_gpu_mode_impl(mode: &str) -> anyhow::Result<()> {
    if mode == "intel" || mode == "on-demand" || mode == "nvidia" {
        info!("Daemon executing prime-select to change GPU mode to: {}", mode);
        let output = std::process::Command::new("prime-select")
            .arg(mode)
            .output()
            .context("Failed to run prime-select in daemon")?;
        
        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            anyhow::bail!("prime-select execution failed: {}", stderr);
        }
        info!("Daemon successfully changed GPU mode to: {}", mode);
        Ok(())
    } else {
        anyhow::bail!("Rejected unauthorized or invalid GPU mode query: {}", mode);
    }
}

async fn handle_request(req: &str) -> anyhow::Result<()> {
    let req = req.trim();
    if let Some(profile) = req.strip_prefix("set_profile ") {
        set_profile_impl(profile)?;
    } else if let Some(gpu_mode) = req.strip_prefix("set_gpu_mode ") {
        set_gpu_mode_impl(gpu_mode)?;
    }
    Ok(())
}
