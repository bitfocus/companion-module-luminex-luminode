import type { CompanionVariableDefinition } from '@companion-module/base'
import { Device } from './device.js'

export function getVariables(device: Device): CompanionVariableDefinition[] {
	const variables = []

	variables.push({
		variableId: 'short_name',
		name: 'Short Name',
	})

	variables.push({
		variableId: 'long_name',
		name: 'Long Name',
	})

	variables.push({
		variableId: 'device_id',
		name: 'Device ID',
	})

	variables.push({
		variableId: 'color_1',
		name: 'Device Color 1',
	})

	variables.push({
		variableId: 'color_2',
		name: 'Device Color 2',
	})

	variables.push({
		variableId: 'nr_dmx_ports',
		name: 'Number of DMX ports',
	})

	variables.push({
		variableId: 'nr_processblocks',
		name: 'Number of Process Engines',
	})

	variables.push({
		variableId: 'serial',
		name: 'Serial Number',
	})

	variables.push({
		variableId: 'mac_address',
		name: 'MAC address',
	})

	variables.push({
		variableId: 'device_type',
		name: 'Device Model',
	})

	variables.push({
		variableId: 'current_snapshot',
		name: 'Current Snapshot',
	})

	variables.push({
		variableId: 'next_snapshot',
		name: 'Next Snapshot',
	})

	variables.push({
		variableId: 'active_profile_name',
		name: 'Active Profile Name',
	})

	variables.push({
		variableId: 'current_version',
		name: 'Current Software Version',
	})

	variables.push({
		variableId: 'alternate_version',
		name: 'Alternate Software Version',
	})

	Array(40)
		.fill(0)
		.forEach((_, i) => {
			const id = i + 1
			variables.push({
				name: `Profile ${id} name`,
				variableId: `profile_${id}_name`,
			})
		})

	if (device.use_websockets && device.deviceInfo?.nr_processblocks) {
		Array(device.deviceInfo.nr_processblocks)
			.fill(0)
			.forEach((_, index) => {
				const id = index + 1
				variables.push({
					name: `Process Block ${id} name`,
					variableId: `processblock_${id}_name`,
				})
				variables.push({
					name: `Process Block ${id} color 1`,
					variableId: `processblock_${id}_color_1`,
				})
				variables.push({
					name: `Process Block ${id} color 2`,
					variableId: `processblock_${id}_color_2`,
				})
				variables.push({
					name: `Process Block ${id} mode`,
					variableId: `processblock_${id}_mode`,
				})
			})
	}

	return variables
}
