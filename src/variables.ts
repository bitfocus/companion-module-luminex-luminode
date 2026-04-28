import type { CompanionVariableDefinitions } from '@companion-module/base'
import { Device } from './device.js'

export function getVariables(device: Device): CompanionVariableDefinitions {
	const variables: CompanionVariableDefinitions = {}

	variables['short_name'] = {
		name: 'Short Name',
	}

	variables['long_name'] = {
		name: 'Long Name',
	}

	variables['device_id'] = {
		name: 'Device ID',
	}

	variables['color_1'] = {
		name: 'Device Color 1',
	}

	variables['color_2'] = {
		name: 'Device Color 2',
	}

	variables['nr_dmx_ports'] = {
		name: 'Number of DMX ports',
	}

	variables['nr_processblocks'] = {
		name: 'Number of Process Engines',
	}

	variables['serial'] = {
		name: 'Serial Number',
	}

	variables['mac_address'] = {
		name: 'MAC address',
	}

	variables['device_type'] = {
		name: 'Device Model',
	}

	variables['current_snapshot'] = {
		name: 'Current Snapshot',
	}

	variables['next_snapshot'] = {
		name: 'Next Snapshot',
	}

	variables['active_profile_name'] = {
		name: 'Active Profile Name',
	}

	variables['current_version'] = {
		name: 'Current Software Version',
	}

	variables['alternate_version'] = {
		name: 'Alternate Software Version',
	}

	Array(40)
		.fill(0)
		.forEach((_, i) => {
			const id = i + 1
			variables[`profile_${id}_name`] = {
				name: `Profile ${id} name`,
			}
		})

	if (device.use_websockets && device.deviceInfo?.nr_processblocks) {
		Array(device.deviceInfo.nr_processblocks)
			.fill(0)
			.forEach((_, index) => {
				const id = index + 1
				variables[`processblock_${id}_name`] = {
					name: `Process Block ${id} name`,
				}
				variables[`processblock_${id}_color_1`] = {
					name: `Process Block ${id} color 1`,
				}
				variables[`processblock_${id}_color_2`] = {
					name: `Process Block ${id} color 2`,
				}
				variables[`processblock_${id}_mode`] = {
					name: `Process Block ${id} mode`,
				}
				if (device.has_2_8_features) {
					if (device.processblock_state_variables == -1 || device.processblock_state_variables > index) {
						variables[`processblock_${id}_selected_input`] = {
							name: `Process Block ${id} selected input`,
						}
						Array(4)
							.fill(0)
							.forEach((_, source_index) => {
								const source_nr = source_index + 1
								variables[`processblock_${id}_source_${source_nr}_active`] = {
									name: `Process Block ${id} source ${source_nr} active`,
								}
								variables[`processblock_${id}_source_${source_nr}_ip`] = {
									name: `Process Block ${id} source ${source_nr} IP`,
								}
								variables[`processblock_${id}_source_${source_nr}_name`] = {
									name: `Process Block ${id} source ${source_nr} name`,
								}
							})
					}
				}
			})
	}

	if (device.use_websockets && device.deviceInfo?.nr_dmx_ports) {
		Array(device.deviceInfo.nr_dmx_ports)
			.fill(0)
			.forEach((_, index) => {
				const id = index + 1
				variables[`dmx_port_${id}_stream_activity_state`] = {
					name: `DMX Port ${id} Stream Activity State`,
				}
				variables[`dmx_port_${id}_backup_active_dmx_tx`] = {
					name: `DMX Port ${id} Backup Active DMX TX`,
				}
			})
	}

	return variables
}
