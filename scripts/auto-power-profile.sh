#!/bin/bash

# Vainy Standalone Auto-Power Daemon
# Automatically switches power profiles and CPU governors based on charger state.

PROFILE_PATH="/sys/firmware/acpi/platform_profile"
GOV_PATHS="/sys/devices/system/cpu/cpu*/cpufreq/scaling_governor"
EPP_PATHS="/sys/devices/system/cpu/cpu*/cpufreq/energy_performance_preference"

set_profile() {
    local profile=$1
    local governor=$2
    local epp=$3
    
    echo "$(date): Transitioning system to $profile profile (Governor: $governor, EPP: $epp)"
    
    # 1. Write ACPI platform profile
    if [ -f "$PROFILE_PATH" ]; then
        echo "$profile" > "$PROFILE_PATH"
    fi
    
    # 2. Write CPU scaling governors
    for gov in $GOV_PATHS; do
        if [ -f "$gov" ]; then
            echo "$governor" > "$gov"
        fi
    done
    
    # 3. Write EPP (Energy Performance Preference) if supported
    for epp_file in $EPP_PATHS; do
        if [ -f "$epp_file" ]; then
            echo "$epp" > "$epp_file"
        fi
    done
}

LAST_STATE=""

while true; do
    # Read battery status (checks BAT0 or BAT1)
    BAT_STATUS=""
    if [ -f "/sys/class/power_supply/BAT0/status" ]; then
        BAT_STATUS=$(cat /sys/class/power_supply/BAT0/status)
    elif [ -f "/sys/class/power_supply/BAT1/status" ]; then
        BAT_STATUS=$(cat /sys/class/power_supply/BAT1/status)
    fi
    
    # Determine state (charging/full = performance, discharging = battery save)
    if [ "$BAT_STATUS" = "Discharging" ]; then
        CURRENT_STATE="battery"
    else
        CURRENT_STATE="charging"
    fi
    
    if [ "$CURRENT_STATE" != "$LAST_STATE" ]; then
        if [ "$CURRENT_STATE" = "charging" ]; then
            # Connected to AC -> Performance (full resources)
            set_profile "performance" "performance" "performance"
        else
            # On battery -> Low-power / Quiet (powersave)
            set_profile "low-power" "powersave" "power"
        fi
        LAST_STATE=$CURRENT_STATE
    fi
    
    sleep 3
done
