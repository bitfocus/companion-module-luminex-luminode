## Luminex LumiNode / LumiCore

Control your LumiNode or LumiCore devices

This should work with all models of LumiNode or LumiCore.

Firmware version 2.5.0 and later should work. Some actions or feedbacks may not work with earlier versions.

The devices have to be reachable over the Bitfocus Companion network.

### Configuration

- Type in the IP address of the device. Any IP on which the LumiNode Web interface can be reached, should work.
- If authentication is enabled on the device, provide the password.
- Process block state variables: in some situations, there can be regular updates on the various process engines. Especially with lots of process engines triggering regular updats of variables, this can affect the performance of Bitfocus Companion. Therefore there can be put a limit on the number of process engines for which variables are created.

### Actions implemented

General actions:

- Identify the device
- Reboot
- Reset
- Recall a profile
- Turn the LCD display on or off

DMX / RDM:

- Acknowledge DMX stream loss indications, either per port or on all ports
- Trigger RDM discovery, either per port or on all ports

Play:

- Play Control: `go`, `forward`, `back` and `reset`
- Play a specific snapshot
- Record a specific snapshot

### Feedbacks implemented

- Playing Cue: Red background color when the `snapshot_id` is the current snapshot
- Next Cue: Orange background color when the `snapshot_id` is the next snapshot
- DMX Port state: Advanced feedback showing the state of a DMX port. This follows the color scheme as indicated on the LED of the DMX port.
- DMX global state: feedback showing the state of all DMX ports combined. If at least 1 port stopped transmitting DMX, the feedback will be RED. Otherwise if at least one is in the orange state, it will be orange and so on.
- Processblock selected input: Shows the currently selected input for a processblock. This will show N/A if no input is selected. This is only useful for BACKUP and SWITCH merge modes.

### Presets implemented

General presets:

- Active profile name. Identify device when triggered
- Reboot
- Reset

Play:

- Play Reset. Reset players to first cue.
- Play Back. Move next cue back.
- Play Forward. Move next cue forward.
- Play Go. Play next cue.
- Play Snapshot. Play a specific snapshot. Button will become RED if snapshot is playing, orange when staged as the next cue.
- Record snapshot. Record a specific snapshot for a show.

Profiles:

- For each profile slot: button to recall the profile

DMX:

- DMX Port state: Indicates the state of DMX port and allows to acknowledge stream loss indiciations for that specific port.
- DMX global state: Indicates the global state of all DMX ports combined, based on the 'worst' state among all ports, and allows to acknowledge stream loss indiciations by pressing the button.

Process Blocks:

- Processblock selected input: Indicates the selected input of a process block when in BACKUP or SWITCH modes.

### Variables implemented

| Id                    | Name                       |
| --------------------- | -------------------------- |
| `short_name`          | Short Name                 |
| `long_name`           | Long Name                  |
| `nr_dmx_ports`        | Number of DMX ports        |
| `nr_processblocks`    | Number of Process Engines  |
| `serial`              | Serial Number              |
| `mac_address`         | MAC address                |
| `device_type`         | Device Model               |
| `current_snapshot`    | Current Snapshot           |
| `next_snapshot`       | Next Snapshot              |
| `active_profile_name` | Active Profile Name        |
| `current_version`     | Current Firmware version   |
| `alternate_version`   | Alternate Firmware version |
| `profile_${id}_name`  | Profile `${id}` Name       |

For Firmware version v2.7.1 and newer, the following variables are also implemented:

| Id                           | Name                          |
| ---------------------------- | ----------------------------- |
| `processblock_${id}_name`    | Process Block `${id}` Name    |
| `processblock_${id}_color_1` | Process Block `${id}` Color 1 |
| `processblock_${id}_color_2` | Process Block `${id}` Color 2 |
| `processblock_${id}_mode`    | Process Block `${id}` Mode    |

For Firmware version v2.8.0 and newer, the following variables are also implemented:

| Id                                              | Name                                                    |
| ----------------------------------------------- | ------------------------------------------------------- |
| `processblock_${id}_selected_input`             | Process Block `${id}` Selected input source             |
| `processblock_${id}_source_${source_nr}_active` | Process Block `${id}` source `${nr}` active indication  |
| `processblock_${id}_source_${source_nr}_ip`     | Process Block `${id}` source `${nr}` active IP address  |
| `processblock_${id}_source_${source_nr}_name`   | Process Block `${id}` source `${nr}` active source name |
| `dmx_port_${id}_stream_activity_state`          | DMX port `${id}` Stream Activity State                  |
| `dmx_port_${id}_backup_active_dmx_tx`           | DMX port `${id}` Backup Activity indication             |
