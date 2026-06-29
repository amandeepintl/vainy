//! Vainy Desktop Tauri entrypoint.

use tracing::{info, warn};

#[tauri::command]
fn get_hardware_stats() -> Result<vainy_telemetry::HardwareStats, String> {
    vainy_telemetry::get_hardware_stats().map_err(|e| e.to_string())
}

#[tauri::command]
fn set_power_profile(profile: String) -> Result<(), String> {
    info!("Requesting power profile shift to: {}", profile);
    match profile.as_str() {
        "Quiet" | "Balanced" | "Performance" | "Custom" => {
            vainy_power::set_power_profile(&profile).map_err(|e| e.to_string())?;
            info!("Successfully switched to profile: {}", profile);
            Ok(())
        }
        _ => {
            warn!("Invalid power profile requested: {}", profile);
            Err("Invalid power profile".to_string())
        }
    }
}

#[tauri::command]
fn set_keyboard_backlight(brightness: Option<u32>, mode: Option<String>) -> Result<(), String> {
    info!("Requesting keyboard backlight update: brightness={:?}, mode={:?}", brightness, mode);
    let sysfs_path = "/sys/class/leds/platform::kbd_backlight/brightness";
    if std::path::Path::new(sysfs_path).exists() {
        if let Some(bright) = brightness {
            let val = if bright == 0 { 0 } else if bright < 50 { 1 } else { 2 };
            std::fs::write(sysfs_path, val.to_string()).map_err(|e| e.to_string())?;
            info!("Successfully wrote {} to {}", val, sysfs_path);
            return Ok(());
        }
    }
    
    warn!("No direct sysfs keyboard backlight node found. Backlight controls on this device are managed directly via Fn+Spacebar.");
    Ok(())
}

#[tauri::command]
fn set_fan_curve(points: serde_json::Value) -> Result<(), String> {
    info!("Requesting custom fan curve update: {:?}", points);
    let home = std::env::var("HOME").unwrap_or_else(|_| "/home/aman".to_string());
    let config_dir = std::path::Path::new(&home).join(".config").join("vainy");
    std::fs::create_dir_all(&config_dir).map_err(|e| e.to_string())?;
    let config_path = config_dir.join("fan_curve.json");
    std::fs::write(&config_path, serde_json::to_string(&points).unwrap())
        .map_err(|e| e.to_string())?;
    Ok(())
}

#[tauri::command]
fn get_gpu_mode() -> Result<String, String> {
    vainy_gpu::get_gpu_mode().map_err(|e| e.to_string())
}

#[tauri::command]
fn set_gpu_mode(mode: String) -> Result<(), String> {
    info!("Requesting GPU mode shift to: {}", mode);
    vainy_gpu::set_gpu_mode(&mode).map_err(|e| e.to_string())
}

#[tauri::command]
fn configure_launchers_discrete_gpu() -> Result<String, String> {
    let mut messages: Vec<String> = Vec::new();
    
    // 1. Configure Prism Launcher
    let home = std::env::var("HOME").unwrap_or_else(|_| "/home/aman".to_string());
    let paths = vec![
        format!("{}/.var/app/org.prismlauncher.PrismLauncher/data/PrismLauncher/prismlauncher.cfg", home),
        format!("{}/.local/share/PrismLauncher/prismlauncher.cfg", home),
    ];
    
    let mut prism_updated = false;
    for path_str in paths {
        let path = std::path::Path::new(&path_str);
        if path.exists() {
            if let Ok(content) = std::fs::read_to_string(path) {
                let mut lines: Vec<String> = content.lines().map(|s| s.to_string()).collect();
                let mut has_key = false;
                let mut general_idx = None;
                
                for (i, line) in lines.iter().enumerate() {
                    if line.trim() == "[General]" {
                        general_idx = Some(i);
                    }
                    if line.starts_with("UseDiscreteGpu=") {
                        has_key = true;
                        lines[i] = "UseDiscreteGpu=true".to_string();
                        break;
                    }
                }
                
                if !has_key {
                    if let Some(idx) = general_idx {
                        lines.insert(idx + 1, "UseDiscreteGpu=true".to_string());
                    } else {
                        lines.insert(0, "[General]".to_string());
                        lines.insert(1, "UseDiscreteGpu=true".to_string());
                    }
                }
                
                if std::fs::write(path, lines.join("\n")).is_ok() {
                    prism_updated = true;
                }
            }
        }
    }
    if prism_updated {
        messages.push("Prism Launcher: Set 'UseDiscreteGpu=true'.".to_string());
    }
    
    // 2. Configure Modrinth App Flatpak
    use std::process::Command;
    let check_status = Command::new("flatpak")
        .args(&["info", "com.modrinth.ModrinthApp"])
        .output();
        
    if let Ok(output) = check_status {
        if output.status.success() {
            let res = Command::new("flatpak")
                .args(&[
                    "override",
                    "--user",
                    "com.modrinth.ModrinthApp",
                    "--env=__NV_PRIME_RENDER_OFFLOAD=1",
                    "--env=__GLX_VENDOR_LIBRARY_NAME=nvidia"
                ])
                .output();
            if let Ok(out) = res {
                if out.status.success() {
                    messages.push("Modrinth App: Set discrete GPU environment variables via Flatpak override.".to_string());
                } else {
                    let err = String::from_utf8_lossy(&out.stderr);
                    messages.push(format!("Modrinth App: Flatpak override failed: {}", err));
                }
            }
        }
    }
    
    if messages.is_empty() {
        Err("No launcher config files or flatpaks found. Make sure Prism Launcher or Modrinth App is installed.".to_string())
    } else {
        Ok(messages.join("\n"))
    }
}

fn main() {
    // Setup logging
    tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::EnvFilter::from_default_env())
        .init();

    info!("Starting Vainy desktop backend...");

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            get_hardware_stats,
            set_power_profile,
            set_keyboard_backlight,
            set_fan_curve,
            get_gpu_mode,
            set_gpu_mode,
            configure_launchers_discrete_gpu
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(test)]
mod tests {
    #[test]
    fn test_prism_config_modification() {
        let temp_dir = std::env::temp_dir();
        let test_path = temp_dir.join("test_prismlauncher.cfg");
        
        // Scenario 1: File doesn't have UseDiscreteGpu or [General]
        let initial_content = "SomeOtherSetting=false\n[UI]\nSomeUiSetting=true";
        std::fs::write(&test_path, initial_content).unwrap();
        
        let content = std::fs::read_to_string(&test_path).unwrap();
        let mut lines: Vec<String> = content.lines().map(|s| s.to_string()).collect();
        let mut has_key = false;
        let mut general_idx = None;
        
        for (i, line) in lines.iter().enumerate() {
            if line.trim() == "[General]" {
                general_idx = Some(i);
            }
            if line.starts_with("UseDiscreteGpu=") {
                has_key = true;
                lines[i] = "UseDiscreteGpu=true".to_string();
                break;
            }
        }
        
        if !has_key {
            if let Some(idx) = general_idx {
                lines.insert(idx + 1, "UseDiscreteGpu=true".to_string());
            } else {
                lines.insert(0, "[General]".to_string());
                lines.insert(1, "UseDiscreteGpu=true".to_string());
            }
        }
        std::fs::write(&test_path, lines.join("\n")).unwrap();
        
        let result = std::fs::read_to_string(&test_path).unwrap();
        assert!(result.contains("[General]"));
        assert!(result.contains("UseDiscreteGpu=true"));
        
        // Scenario 2: File has [General] but not UseDiscreteGpu
        let initial_content2 = "[General]\nSomeOtherSetting=false\n[UI]\nSomeUiSetting=true";
        std::fs::write(&test_path, initial_content2).unwrap();
        
        let content = std::fs::read_to_string(&test_path).unwrap();
        let mut lines: Vec<String> = content.lines().map(|s| s.to_string()).collect();
        let mut has_key = false;
        let mut general_idx = None;
        
        for (i, line) in lines.iter().enumerate() {
            if line.trim() == "[General]" {
                general_idx = Some(i);
            }
            if line.starts_with("UseDiscreteGpu=") {
                has_key = true;
                lines[i] = "UseDiscreteGpu=true".to_string();
                break;
            }
        }
        
        if !has_key {
            if let Some(idx) = general_idx {
                lines.insert(idx + 1, "UseDiscreteGpu=true".to_string());
            } else {
                lines.insert(0, "[General]".to_string());
                lines.insert(1, "UseDiscreteGpu=true".to_string());
            }
        }
        std::fs::write(&test_path, lines.join("\n")).unwrap();
        
        let result2 = std::fs::read_to_string(&test_path).unwrap();
        let lines2: Vec<&str> = result2.lines().collect();
        assert_eq!(lines2[0], "[General]");
        assert_eq!(lines2[1], "UseDiscreteGpu=true");
        
        // Scenario 3: File already has UseDiscreteGpu=false
        let initial_content3 = "[General]\nUseDiscreteGpu=false\n[UI]\nSomeUiSetting=true";
        std::fs::write(&test_path, initial_content3).unwrap();
        
        let content = std::fs::read_to_string(&test_path).unwrap();
        let mut lines: Vec<String> = content.lines().map(|s| s.to_string()).collect();
        let mut has_key = false;
        let mut general_idx = None;
        
        for (i, line) in lines.iter().enumerate() {
            if line.trim() == "[General]" {
                general_idx = Some(i);
            }
            if line.starts_with("UseDiscreteGpu=") {
                has_key = true;
                lines[i] = "UseDiscreteGpu=true".to_string();
                break;
            }
        }
        
        if !has_key {
            if let Some(idx) = general_idx {
                lines.insert(idx + 1, "UseDiscreteGpu=true".to_string());
            } else {
                lines.insert(0, "[General]".to_string());
                lines.insert(1, "UseDiscreteGpu=true".to_string());
            }
        }
        std::fs::write(&test_path, lines.join("\n")).unwrap();
        
        let result3 = std::fs::read_to_string(&test_path).unwrap();
        assert!(result3.contains("UseDiscreteGpu=true"));
        assert!(!result3.contains("UseDiscreteGpu=false"));
        
        // Clean up
        let _ = std::fs::remove_file(test_path);
    }
}
