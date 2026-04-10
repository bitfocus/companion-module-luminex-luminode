import { ActionId } from './actions.js'
import { FeedbackId } from './feedbacks.js'
import * as Color from './colors.js'
import { Device } from './device.js'
import { type CompanionButtonPresetDefinition, type CompanionPresetDefinitions } from '@companion-module/base'

interface CompanionPresetExt extends CompanionButtonPresetDefinition {
	feedbacks: Array<
		{
			feedbackId: FeedbackId | string
		} & CompanionButtonPresetDefinition['feedbacks'][0]
	>
	steps: Array<{
		down: Array<
			{
				actionId: ActionId
			} & CompanionButtonPresetDefinition['steps'][0]['down'][0]
		>
		up: Array<
			{
				actionId: ActionId
			} & CompanionButtonPresetDefinition['steps'][0]['up'][0]
		>
	}>
}
interface CompanionPresetDefinitionsExt {
	[id: string]: CompanionPresetExt | undefined
}

export function getPresets(device: Device): CompanionPresetDefinitions {
	const presets: CompanionPresetDefinitionsExt = {}
	presets[`active_profile`] = {
		type: 'button',
		category: 'Profiles',
		name: `Active Profile Name\nEmpty if no profile active`,
		style: {
			text: `$(GigaCore:active_profile_name)`,
			size: 'auto',
			color: Color.LightGreen,
			bgcolor: 0,
		},
		steps: [
			{
				down: [
					{
						actionId: ActionId.Identify,
						options: {},
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	presets[`reboot`] = {
		type: 'button',
		category: 'Device',
		name: `Reboot device`,
		style: {
			text: `Reboot\n$(Luminode:short_name)`,
			size: 10,
			color: Color.White,
			bgcolor: Color.Black,
		},
		steps: [
			{
				down: [
					{
						actionId: ActionId.Reboot,
						options: {},
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	presets[`reset`] = {
		type: 'button',
		category: 'Device',
		name: `Reset device`,
		style: {
			text: `Reset\n$(Luminode:short_name)`,
			size: 10,
			color: Color.White,
			bgcolor: Color.Black,
		},
		steps: [
			{
				down: [
					{
						actionId: ActionId.Reset,
						options: {
							keep_ip_settings: true,
							keep_user_profiles: true,
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	presets[`play_reset`] = {
		type: 'button',
		category: 'Play',
		name: `Play Reset\nReset player to first cue`,
		style: {
			text: `Reset`,
			size: 'auto',
			color: Color.Yellow,
			bgcolor: 0,
		},
		steps: [
			{
				down: [
					{
						actionId: ActionId.PlayControl,
						options: {
							action: 'reset',
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	presets[`play_back`] = {
		type: 'button',
		category: 'Play',
		name: `Play Back\nMove next Cue back`,
		style: {
			text: `Back`,
			size: 'auto',
			color: Color.Yellow,
			bgcolor: 0,
		},
		steps: [
			{
				down: [
					{
						actionId: ActionId.PlayControl,
						options: {
							action: 'back',
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	presets[`play_forward`] = {
		type: 'button',
		category: 'Play',
		name: `Play Forward\nMove next Cue forward`,
		style: {
			text: `Next`,
			size: 'auto',
			color: Color.Yellow,
			bgcolor: 0,
		},
		steps: [
			{
				down: [
					{
						actionId: ActionId.PlayControl,
						options: {
							action: 'forward',
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	presets[`play_go`] = {
		type: 'button',
		category: 'Play',
		name: `Play Go\nPlay next cue`,
		style: {
			text: `Play`,
			size: 'auto',
			color: Color.Yellow,
			bgcolor: 0,
		},
		steps: [
			{
				down: [
					{
						actionId: ActionId.PlayControl,
						options: {
							action: 'go',
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	presets[`play_snapshot`] = {
		type: 'button',
		category: 'Play',
		name: `Play Snapshot\nPlay a specific snapshot. Button will become RED if snapshot is playing`,
		style: {
			text: `Play 1.00`,
			size: 'auto',
			color: Color.Green,
			bgcolor: Color.Black,
		},
		steps: [
			{
				down: [
					{
						actionId: ActionId.PlaySnapshot,
						options: {
							snapshot_id: '1.00',
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [
			{
				feedbackId: FeedbackId.playingCue,
				options: {
					snapshot_id: '1.00',
				},
				style: {
					color: Color.White,
					bgcolor: Color.Red,
				},
			},
			{
				feedbackId: FeedbackId.nextCue,
				options: {
					snapshot_id: '1.00',
				},
				style: {
					color: Color.White,
					bgcolor: Color.Orange,
				},
			},
		],
	}

	presets[`record_snapshot`] = {
		type: 'button',
		category: 'Play',
		name: `Record Snapshot\nRecord a specific snapshot`,
		style: {
			text: `Show 1: Record 1.00`,
			size: 'auto',
			color: Color.Green,
			bgcolor: Color.Black,
		},
		steps: [
			{
				down: [
					{
						actionId: ActionId.RecordSnapshot,
						options: {
							show_idx: 1,
							snapshot_id: '1.00',
							fade_in_time: 2000,
							hold_time: -1,
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}
	Array(40)
		.fill(0)
		.forEach((_, i) => {
			const id = i + 1
			presets[`recall_profile_${id}`] = {
				type: 'button',
				category: 'Profiles',
				name: `Profile ${id} name\nIncludes Name`,
				style: {
					text: `Recall $(LumiNode:profile_${id}_name)`,
					size: 'auto',
					color: Color.LightBlue,
					bgcolor: 0,
				},
				steps: [
					{
						down: [
							{
								actionId: ActionId.RecallProfile,
								options: {
									profile: id,
									keep_ip_settings: true,
								},
							},
						],
						up: [],
					},
				],
				feedbacks: [],
			}
			presets[`save_profile_${id}`] = {
				type: 'button',
				category: 'Profiles',
				name: `Save to profile ${id}`,
				style: {
					text: `Save to profile ${id}`,
					size: 'auto',
					color: Color.Yellow,
					bgcolor: 0,
				},
				steps: [
					{
						down: [
							{
								actionId: ActionId.SaveProfile,
								options: {
									profile: id,
									name: `Profile ${id}`,
								},
							},
						],
						up: [],
					},
				],
				feedbacks: [],
			}
		})

	if (device.use_websockets && device.deviceInfo?.nr_dmx_ports) {
		Array(device.deviceInfo.nr_dmx_ports)
			.fill(0)
			.forEach((_, index) => {
				const id = index + 1
				presets[`dmx_port_state_${id}`] = {
					type: 'button',
					category: 'DMX Ports',
					name: `Indicates the state of DMX Port ${id} and allows to acknowledge stream loss indications for that port`,
					style: {
						text: `Port ${id}`,
						size: 'auto',
						color: Color.White,
						bgcolor: Color.Black,
					},
					steps: [
						{
							down: [
								{
									actionId: ActionId.DmxAcknowledgePort,
									options: {
										port: id,
									},
								},
							],
							up: [],
						},
					],
					feedbacks: [
						{
							feedbackId: FeedbackId.dmxPortState,
							options: {
								port_nr: id,
							},
						},
					],
				}
			})
		presets[`dmx_port_global_state`] = {
			type: 'button',
			category: 'DMX Ports',
			name: `Indicates the global state of all DMX ports combined, based on the 'worst' state among all ports, and allows to acknowledge stream loss indications by pressing the button`,
			style: {
				text: `DMX Ports state`,
				size: 'auto',
				color: Color.White,
				bgcolor: Color.Black,
			},
			steps: [
				{
					down: [
						{
							actionId: ActionId.DmxAcknowledge,
							options: {},
						},
					],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: FeedbackId.dmxGlobalState,
					options: {},
				},
			],
		}
	}

	if (device.use_websockets && device.has_2_8_features && device.deviceInfo?.nr_processblocks) {
		if (device.processblock_state_variables == -1 || device.processblock_state_variables > 0) {
			Array(device.deviceInfo.nr_processblocks)
				.fill(0)
				.forEach((_, index) => {
					if (index < device.processblock_state_variables) {
						const id = index + 1
						presets[`processblock_${id}_selected_input`] = {
							type: 'button',
							category: 'Process Blocks',
							name: `Indicates the selected input of process block ${id} when in BACKUP or SWITCH modes`,
							style: {
								text: `PB${id}: $(LumiNode:processblock_${id}_selected_input)`,
								size: 'auto',
								color: Color.White,
								bgcolor: Color.Black,
							},
							steps: [],
							feedbacks: [
								{
									feedbackId: FeedbackId.pbSelectedInput,
									options: {
										pb_id: id,
									},
								},
							],
						}
					}
				})
		}
	}

	return presets
}
