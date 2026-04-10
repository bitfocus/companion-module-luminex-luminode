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
	} else {
		device.log(
			'debug',
			`DMX port state feedbacks are not available because the device does not support WebSockets or DMX port information: ${device.use_websockets}, ${device.deviceInfo?.nr_dmx_ports}`,
		)
	}

	return feedbacks
}
