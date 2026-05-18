//! Vainy: gpu module.

use std::process::Command;
use std::os::unix::net::UnixStream;
use std::path::Path;
use std::io::Write;

pub fn init() -> anyhow::Result<()> {
    tracing::info!("Initializing gpu module");
    Ok(())
}

pub fn get_gpu_mode() -> anyhow::Result<String> {
    let output = Command::new("prime-select")
        .arg("query")
        .output()?;
    if !output.status.success() {
        anyhow::bail!("prime-select query failed");
    }
    let stdout = String::from_utf8(output.stdout)?;
    let mode = stdout.trim();
    let mapped = match mode {
        "intel" => "integrated",
        "on-demand" => "hybrid",
        "nvidia" => "dedicated",
        _ => "hybrid",
    };
    Ok(mapped.to_string())
}

pub fn set_gpu_mode(mode: &str) -> anyhow::Result<()> {
    let prime_mode = match mode {
        "integrated" => "intel",
        "hybrid" => "on-demand",
        "dedicated" => "nvidia",
        _ => anyhow::bail!("Invalid GPU mode requested: {}", mode),
    };

    let socket_path = "/tmp/vainyd.sock";
    if Path::new(socket_path).exists() {
        match UnixStream::connect(socket_path) {
            Ok(mut stream) => {
                let msg = format!("set_gpu_mode {}\n", prime_mode);
                if let Err(e) = stream.write_all(msg.as_bytes()) {
                    tracing::warn!("Failed writing to daemon socket: {:?}", e);
                } else {
                    tracing::info!("Sent GPU mode change request to daemon: {}", prime_mode);
                    return Ok(());
                }
            }
            Err(e) => {
                tracing::warn!("Failed connecting to daemon socket: {:?}", e);
            }
        }
    }

    // Fallback: Run directly (e.g. if running as root or debug)
    let output = Command::new("prime-select")
        .arg(prime_mode)
        .output()?;
    if !output.status.success() {
        anyhow::bail!("prime-select command failed. Ensure Vainy daemon is running.");
    }
    Ok(())
}
