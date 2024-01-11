import type { CompanionActionDefinition } from '@companion-module/base'
import { Device } from './device.js'

export enum ActionId {
	Identify = 'identify',
	Reboot = 'reboot',
	Reset = 'reset',
	RecallProfile = 'recall_profile',
	SaveProfile = 'save_profile',
	DisplayOn = 'display_on',
	DmxAcknowledge = 'dmx_acknowledge',
	DmxAcknowledgePort = 'dmx_acknowledge_port',
	ForceRdmDiscovery = 'force_rdm_discovery',
	ForceRdmDiscoveryPort = 'force_rdm_discovery_port',
	PlayControl = 'play_control',
	PlaySnapshot = 'play_snapshot',
}

export function getActions(device: Device): { [id in ActionId]: CompanionActionDefinition } {
	const playActions = [
		{ id: 'go', label: 'Go' },
		{ id: 'forward', label: 'Forward' },
		{ id: 'back', label: 'Back' },
		{ id: 'reset', label: 'Reset' },
	]

	const actions: { [id in ActionId]: CompanionActionDefinition } = {
		[ActionId.Identify]: {
			name: 'Identify',
			options: [],
			callback: () => {
				device.sendCommand(`identify`, 'GET')
			},
		},
		[ActionId.Reboot]: {
			name: 'Reboot',
			options: [],
			callback: () => {
				device.sendCommand(`reboot`, 'POST')
			},
		},
		[ActionId.Reset]: {
			name: 'Reset',
			options: [
				{
					id: 'keep_ip_settings',
					type: 'checkbox',
					label: 'Keep IP Settings',
					default: true,
				},
				{
					id: 'keep_user_profiles',
					type: 'checkbox',
					label: 'Keep User Profiles',
					default: true,
				},
			],
			callback: (action) => {
				const keep_ip = action.options.keep_ip_settings !== undefined ? Boolean(action.options.keep_ip_settings) : true
				const keep_profiles =
					action.options.keep_user_profiles !== undefined ? Boolean(action.options.keep_user_profiles) : true
				device.sendCommand(`reset`, 'POST', {
					keep_ip_settings: keep_ip,
					keep_user_profiles: keep_profiles,
				})
			},
		},
		[ActionId.DisplayOn]: {
			name: 'Turn on or off the display',
			options: [
				{
					id: 'display_on',
					type: 'checkbox',
					label: 'Display On',
					default: true,
				},
			],
			callback: (action) => {
				device.sendCommand(`display`, 'POST', { display_on: action.options.display_on })
			},
		},
		[ActionId.RecallProfile]: {
			name: 'Recall configuration from profile',
			options: [
				{
					type: 'number',
					label: 'Profile',
					id: 'profile',
					tooltip: '1-based profile number',
					default: 1,
					min: 1,
					max: 40,
				},
				{
					id: 'keep_ip_settings',
					type: 'checkbox',
					label: 'Keep Ip Settings',
					default: true,
				},
			],
			callback: (action) => {
				const profile = Number(action.options.profile)
				device.sendCommand(`profile/${profile - 1}/recall`, 'POST', {
					keep_ip_settings: action.options.keep_ip_settings,
				})
			},
		},
		[ActionId.SaveProfile]: {
			name: 'Save current configuration to profile',
			options: [
				{
					type: 'number',
					label: 'Profile number',
					id: 'profile',
					tooltip: '1-based profile number',
					default: 1,
					min: 1,
					max: 40,
				},
				{
					type: 'textinput',
					label: 'Profile name',
					id: 'name',
					tooltip: 'The name that the new profile should get',
					default: 'Profile',
				},
			],
			callback: (action) => {
				if (action.options.profile === undefined || action.options.name === undefined) {
					device.log('info', `No profile number or name defined`)
					return
				}
				const profile = Number(action.options.profile)
				device.sendCommand(`profile/${profile - 1}/save`, 'POST', {
					name: action.options.name.toString(),
				})
			},
		},

		// DMX / RDM

		[ActionId.DmxAcknowledge]: {
			name: 'Acknowledge all stream loss indications',
			options: [],
			callback: () => {
				device.sendCommand(`dmx/acknowledge`, 'POST')
			},
		},
		[ActionId.DmxAcknowledgePort]: {
			name: 'Acknowledge stream loss indications for the given port',
			options: [
				{
					type: 'number',
					label: 'Port',
					id: 'port',
					tooltip: '1-based DMX port number',
					default: 1,
					min: 1,
					max: 12,
				},
			],
			callback: (action) => {
				const port_nr = Number(action.options.port)
				device.sendCommand(`dmx/${port_nr - 1}/acknowledge`, 'POST')
			},
		},
		[ActionId.ForceRdmDiscovery]: {
			name: 'Force RDM discovery for all DMX ports',
			options: [],
			callback: () => {
				device.sendCommand(`dmx/force_discovery`, 'POST')
			},
		},
		[ActionId.ForceRdmDiscoveryPort]: {
			name: 'Force RDM discovery for the given port',
			options: [
				{
					type: 'number',
					label: 'Port',
					id: 'port',
					tooltip: '1-based DMX port number',
					default: 1,
					min: 1,
					max: 12,
				},
			],
			callback: (action) => {
				const port_nr = Number(action.options.port)
				device.sendCommand(`dmx/${port_nr - 1}/force_discovery`, 'POST')
			},
		},

		// Play
		[ActionId.PlayControl]: {
			name: 'Control all players',
			options: [
				{
					type: 'dropdown',
					label: 'Action',
					id: 'action',
					default: 'go',
					choices: playActions,
				},
			],
			callback: (action) => {
				device.sendCommand(`play/control`, 'POST', { action: action.options.action })
			},
		},
		[ActionId.PlaySnapshot]: {
			name: 'Play a specific snapshot',
			options: [
				{
					type: 'textinput',
					label: 'Snapshot ID',
					id: 'snapshot_id',
					default: '1.00',
					regex: '^d+(.d{1,2})?$',
				},
			],
			callback: (action) => {
				device.sendCommand(`play/play_snapshot`, 'POST', { snapshot_id: action.options.snapshot_id })
			},
		},
	}

	return actions
}
