import * as Color from './colors.js'
import {
	type CompanionFeedbackDefinition,
	type CompanionFeedbackDefinitions,
	type CompanionAdvancedFeedbackResult,
} from '@companion-module/base'
import { Device } from './device.js'

export enum FeedbackId {
	playingCue = 'playing_cue',
	nextCue = 'next_cue',
	dmxPortState = 'dmx_port_state',
	dmxGlobalState = 'dmx_global_state',
	pbSelectedInput = 'pb_selected_input',
}

export function getFeedbacks(device: Device): CompanionFeedbackDefinitions {
	const feedbacks: { [id: string]: CompanionFeedbackDefinition | undefined } = {}

	feedbacks[FeedbackId.playingCue] = {
		type: 'boolean',
		name: 'Cue is playing',
		defaultStyle: {
			bgcolor: Color.Red,
			color: Color.White,
		},
		options: [
			{
				type: 'textinput',
				label: 'Snapshot ID',
				id: 'snapshot_id',
				default: '1.00',
			},
		],
		callback: (feedback): boolean => {
			if (device.current_snapshot && device.current_snapshot === feedback.options.snapshot_id) {
				return true
			} else {
				return false
			}
		},
	}

	feedbacks[FeedbackId.nextCue] = {
		type: 'boolean',
		name: 'Cue is staged next',
		defaultStyle: {
			bgcolor: Color.Orange,
			color: Color.White,
		},
		options: [
			{
				type: 'textinput',
				label: 'Snapshot ID',
				id: 'snapshot_id',
				default: '1.00',
			},
		],
		callback: (feedback): boolean => {
			if (device.next_snapshot && device.next_snapshot === feedback.options.snapshot_id) {
				return true
			} else {
				return false
			}
		},
	}

	if (device.use_websockets && device.deviceInfo?.nr_dmx_ports) {
		feedbacks[FeedbackId.dmxPortState] = {
			type: 'advanced',
			name: 'DMX port state',
			description: 'Change style based on the state of a DMX port.',
			options: [
				{
					type: 'number',
					label: 'Port',
					id: 'port_nr',
					tooltip: '1-based DMX port number',
					default: 1,
					min: 1,
					max: device.deviceInfo.nr_dmx_ports,
				},
			],
			callback: (feedback): CompanionAdvancedFeedbackResult => {
				const port_nr = Number(feedback.options.port_nr)
				if (!device.ports || port_nr < 1 || port_nr > device.ports.length) {
					return {}
				}
				const port = device.ports[port_nr - 1]
				if (!port) {
					return {}
				}
				if (port.stream_activity_state === 'stopped') {
					return { bgcolor: Color.Black, color: Color.Red }
				} else if (port.stream_activity_state === 'streaming_continues') {
					return { bgcolor: Color.Red, color: Color.White }
				} else if (port.stream_activity_state === 'streaming_continues_acknowledged') {
					return { bgcolor: Color.LightBlue, color: Color.Red }
				} else if (port.stream_activity_state === 'recovered') {
					return { bgcolor: Color.Orange, color: Color.White }
				} else if (port.stream_activity_state === 'streaming') {
					return { bgcolor: Color.LightBlue, color: Color.White }
				} else if (port.stream_activity_state === 'idle') {
					return { bgcolor: Color.Black, color: Color.LightBlue }
				} else {
					return {}
				}
			},
		}
		feedbacks[FeedbackId.dmxGlobalState] = {
			type: 'advanced',
			name: 'DMX global state',
			description:
				'Change style based on the state of all DMX ports combined. This will take style based on the "worst" state across all DMX ports.',
			options: [],
			callback: (): CompanionAdvancedFeedbackResult => {
				// Possible states in order of severity: stopped, streaming_continues, recovered, streaming_continues_acknowledged, streaming, idle
				let worstState = 'idle'
				if (!device.ports) {
					return {}
				}
				for (const port of device.ports) {
					if (port.stream_activity_state === 'stopped') {
						worstState = 'stopped'
						break
					} else if (
						['recovered', 'streaming_continues_acknowledged', 'streaming', 'idle'].includes(worstState) &&
						port.stream_activity_state === 'streaming_continues'
					) {
						worstState = port.stream_activity_state
					} else if (
						['streaming_continues_acknowledged', 'streaming', 'idle'].includes(worstState) &&
						port.stream_activity_state === 'recovered'
					) {
						worstState = port.stream_activity_state
					} else if (
						['streaming', 'idle'].includes(worstState) &&
						port.stream_activity_state === 'streaming_continues_acknowledged'
					) {
						worstState = port.stream_activity_state
					} else if (['idle'].includes(worstState) && port.stream_activity_state === 'streaming') {
						worstState = port.stream_activity_state
					}
				}
				if (worstState === 'stopped') {
					return { bgcolor: Color.Black, color: Color.Red }
				} else if (worstState === 'streaming_continues') {
					return { bgcolor: Color.Red, color: Color.White }
				} else if (worstState === 'streaming_continues_acknowledged') {
					return { bgcolor: Color.LightBlue, color: Color.Red }
				} else if (worstState === 'recovered') {
					return { bgcolor: Color.Orange, color: Color.White }
				} else if (worstState === 'streaming') {
					return { bgcolor: Color.LightBlue, color: Color.White }
				} else if (worstState === 'idle') {
					return { bgcolor: Color.Black, color: Color.LightBlue }
				} else {
					return {}
				}
			},
		}
	} else {
		device.log(
			'debug',
			`DMX port state feedbacks are not available because the device does not support WebSockets or DMX port information: ${device.use_websockets}, ${device.deviceInfo?.nr_dmx_ports}`,
		)
	}
	if (device.use_websockets && device.has_2_8_features && device.deviceInfo?.nr_processblocks) {
		feedbacks[FeedbackId.pbSelectedInput] = {
			type: 'advanced',
			name: 'Processblock selected input',
			description:
				'Shows the currently selected input for a processblock, as a 1-based index. Shows N/A if no input is selected.',
			options: [
				{
					type: 'number',
					label: 'Processblock ID',
					id: 'pb_id',
					default: 1,
					min: 1,
					max: device.deviceInfo.nr_processblocks,
				},
			],
			callback: (feedback): CompanionAdvancedFeedbackResult => {
				const pb_id = Number(feedback.options.pb_id)
				if (!device.processblocks || pb_id < 1 || pb_id > device.processblocks.length) {
					return {}
				}
				const pb = device.processblocks[pb_id - 1]
				if (!pb) {
					return {}
				}
				if (pb.summarized_active_input === null || pb.summarized_active_input === undefined) {
					return { text: `PB${pb_id}: N/A`, bgcolor: Color.Black, color: Color.White }
				} else if (pb.summarized_active_input === 0) {
					return {
						text: `PB${pb_id}: Input ${pb.summarized_active_input + 1}`,
						bgcolor: Color.Blue,
						color: Color.White,
					}
				} else if (pb.summarized_active_input === 1) {
					return { text: `PB${pb_id}: Input ${pb.summarized_active_input + 1}`, bgcolor: Color.Red, color: Color.White }
				} else if (pb.summarized_active_input === 2) {
					return {
						text: `PB${pb_id}: Input ${pb.summarized_active_input + 1}`,
						bgcolor: Color.LightGreen,
						color: Color.Black,
					}
				} else if (pb.summarized_active_input === 3) {
					return {
						text: `PB${pb_id}: Input ${pb.summarized_active_input + 1}`,
						bgcolor: Color.Yellow,
						color: Color.Black,
					}
				}
				return { text: 'N/A', bgcolor: Color.Black, color: Color.White }
			},
		}
	}

	return feedbacks
}
