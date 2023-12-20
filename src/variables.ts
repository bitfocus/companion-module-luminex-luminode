import type { CompanionVariableDefinition } from '@companion-module/base'

export function getVariables(): CompanionVariableDefinition[] {
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

	Array(40)
		.fill(0)
		.forEach((_, i) => {
			const id = i + 1
			variables.push({
				name: `Profile ${id} name`,
				variableId: `profile_${id}_name`,
			})
		})

	return variables
}
