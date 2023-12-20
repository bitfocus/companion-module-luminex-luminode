import * as Color from './colors.js'
import { type CompanionFeedbackDefinition, type CompanionFeedbackDefinitions } from '@companion-module/base'
import { Device } from './device.js'

export enum FeedbackId {
	playingCue = 'playing_cue',
	nextCue = 'next_cue',
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

	return feedbacks
}
