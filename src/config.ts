import { InstanceBase, type SomeCompanionConfigField } from '@companion-module/base'

export interface config {
	bonjour_host: string
	host: string
	password: string
}

export interface InstanceBaseExt<TConfig> extends InstanceBase<TConfig> {
	[x: string]: any
	config: TConfig
	UpdateVariablesValues(): void
	InitVariables(): void
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
			isVisible: (options) => !options['luminode_host'],
			width: 6,
		},
		{
			type: 'static-text',
			id: 'luminode-filler',
			width: 6,
			label: '',
			isVisible: (options) => !!options['luminode_host'],
			value: '',
		},
		{
			type: 'textinput',
			id: 'password',
			label: 'Password',
			tooltip: 'Only provide a password when authentication is enabled on the device',
			width: 6,
		},
	]
}
