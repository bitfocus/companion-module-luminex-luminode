import { type SomeCompanionConfigField } from '@companion-module/base'

export interface config {
	luminode_host: string
	host: string
	password: string
	processblock_state_variables: number
	[key: string]: any
}

export const getConfigFields = (): SomeCompanionConfigField[] => {
	return [
		{
			type: 'bonjour-device',
			id: 'luminode_host',
			label: 'LumiNode',
			width: 6,
		},
		{
			type: 'textinput',
			id: 'host',
			label: 'LumiNode IP',
			isVisibleExpression: '!$(options:luminode_host)',
			width: 6,
		},
		{
			type: 'textinput',
			id: 'password',
			label: 'Password',
			tooltip: 'Only provide a password when authentication is enabled on the device',
			width: 6,
		},
		{
			type: 'dropdown',
			id: 'processblock_state_variables',
			label: 'Process Block State Variables',
			tooltip:
				'Starting from firmware v2.8, additional state information is available for all process engines.\nIt is possible to have this information available as variables but having this for all process engines might affect performance due to the increased number of variables created and updated. With this option, you can limited the amount of process engines for which the variables are created.',
			width: 6,
			default: 1,
			choices: [
				{
					id: 0,
					label: 'Disabled',
				},
				{
					id: 1,
					label: 'Only for first process block',
				},
				{
					id: 4,
					label: 'Only for first 4 process blocks',
				},
				{
					id: -1,
					label: 'For all process blocks',
				},
			],
		},
	]
}
