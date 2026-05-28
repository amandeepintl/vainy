
pub struct ThermalStats {
    pub cpu_temp: f32,
    pub ssd_temp: f32,
    pub motherboard_temp: f32,
    pub fan_speed_rpm: u32,
}
pub fn get_thermal_stats() -> Result<ThermalStats, String> {
    Ok(ThermalStats {
        cpu_temp: 45.0,
        ssd_temp: 38.0,
        motherboard_temp: 40.0,
        fan_speed_rpm: 2000,
    })
}
