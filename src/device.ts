import { ModuleInstance } from './main.js'
import { FeedbackId } from './feedbacks.js'
import { type CompanionVariableValues, InstanceStatus } from '@companion-module/base'

export class Device {
	host = ''
	password = ''
	instance: ModuleInstance

	connected = false

	devicePoll: NodeJS.Timeout | null = null
	deviceLongPoll: NodeJS.Timeout | null = null

	mainPlayerIdx = -1
	current_snapshot = '-'
	next_snapshot = '-'

	active_profile?: string
	profiles: any[] = []
	deviceInfo?: any

	constructor(instance: ModuleInstance) {
		this.instance = instance
	}

	// When module gets deleted
	public async destroy(): Promise<void> {
		this.log('debug', 'destroy')
		this.stopDevicePoll()
	}

	updateStatus(status: InstanceStatus, msg: string | null = null): void {
		this.connected = status === InstanceStatus.Ok
		this.instance.updateStatus(status, msg)
	}

	log(level: 'debug' | 'info' | 'warn' | 'error', message: string): void {
		this.instance.log(level, message)
	}

	public setConfig(host: string, password: string): void {
		this.host = host
		this.password = password
	}

	initConnection(): void {
		this.stopDevicePoll()
		const requestHeaders = new Headers()
		requestHeaders.set('Content-Type', 'application/json')
		if (this.password !== '') {
			requestHeaders.set('Authorization', `Basic ${Buffer.from('admin:' + this.password).toString('base64')}`)
		}
		const options = {
			headers: requestHeaders,
		}
		fetch(`http://${this.host}/api/deviceinfo`, options)
			.then(async (res) => {
				if (res.status == 200) {
					return
				}
				throw new Error(res.toString())
			})
			.then(() => {
				this.updateStatus(InstanceStatus.Ok)
				this.startDevicePoll()
			})
			.catch((error) => {
				this.log('debug', error)
				this.updateStatus(InstanceStatus.ConnectionFailure)
			})
	}

	getDeviceInfo(): void {
		this.sendCommand('deviceinfo', 'GET')
	}

	getPlayInfo(): void {
		// Find a Player input
		this.sendCommand(`IO?io_class=player`, 'GET')
		if (this.mainPlayerIdx >= 0) {
			this.sendCommand(`play/player/${this.mainPlayerIdx}`, 'GET')
		}
	}

	getProfileNames(): void {
		this.sendCommand(`active_profile_name`, 'GET')
		this.sendCommand(`profile`, 'GET')
	}

	startDevicePoll(): void {
		this.stopDevicePoll()

		this.getDeviceInfo()
		this.getPlayInfo()
		this.getProfileNames()

		this.devicePoll = setInterval(() => {
			this.getDeviceInfo()
			this.getPlayInfo()
		}, 5000)

		this.deviceLongPoll = setInterval(() => {
			this.getProfileNames()
		}, 15000)
	}

	stopDevicePoll(): void {
		if (this.devicePoll) {
			clearInterval(this.devicePoll)
			this.devicePoll = null
		}
		if (this.deviceLongPoll) {
			clearInterval(this.deviceLongPoll)
			this.deviceLongPoll = null
		}
	}

	sendCommand(
		cmd: string,
		type: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | undefined,
		params: any = undefined,
	): void {
		const url = `http://${this.host}/api/${cmd}`
		const requestHeaders = new Headers()
		requestHeaders.set('Content-Type', 'application/json')
		if (this.password !== '') {
			requestHeaders.set('Authorization', `Basic ${Buffer.from('admin:' + this.password).toString('base64')}`)
		}
		const options = {
			method: type,
			body: params != undefined ? JSON.stringify(params) : null,
			headers: requestHeaders,
		}

		fetch(url, options)
			.then(async (res) => {
				if (res.ok) {
					if (type && type !== 'GET') {
						// No response expected, process empty data
						this.processData(cmd, '')
						return
					}
					const contentType = res.headers.get('content-type')
					if (contentType && contentType.indexOf('application/json') !== -1) {
						res
							.json()
							.then((json) => {
								this.processData(cmd, json)
							})
							.catch((error) => {
								this.log('debug', `CMD error: ${error.toString()}`)
							})
					} else {
						throw new Error(`Unexpected content type: ${contentType}`)
					}
				} else {
					throw new Error(res.toString())
				}
			})
			.catch((error) => {
				this.log('debug', `CMD error: ${error.toString()}`)
			})
	}

	private processData(cmd: string, data: any): void {
		if (cmd.startsWith('deviceinfo')) {
			this.deviceInfo = data

			this.instance.setVariableValues({
				short_name: data.short_name,
				long_name: data.long_name,
				nr_dmx_ports: data.nr_dmx_ports,
				nr_processblocks: data.nr_processblocks,
				serial: data.serial,
				mac_address: data.mac_address,
				device_type: data.type,
			})
		} else if (cmd.startsWith(`IO?io_class=player`)) {
			const players = data
			if (players.length === 0) {
				this.mainPlayerIdx = -1
				this.current_snapshot = '-'
				this.next_snapshot = '-'
				this.instance.setVariableValues({
					current_snapshot: '-',
					next_snapshot: '-',
				})
				this.instance.checkFeedbacks(FeedbackId.playingCue, FeedbackId.nextCue)
			} else {
				this.mainPlayerIdx = players[0]['id']
			}
		} else if (cmd.startsWith('play/player')) {
			this.current_snapshot = data.playing_snapshot_id
			this.next_snapshot = data.next_snapshot_id
			this.instance.setVariableValues({
				current_snapshot: data.playing_snapshot_id,
				next_snapshot: data.next_snapshot_id,
			})
			this.instance.checkFeedbacks(FeedbackId.playingCue, FeedbackId.nextCue)
		} else if (cmd.startsWith('active_profile_name')) {
			if (!this.active_profile || this.active_profile !== data.name) {
				this.active_profile = data.name
				this.instance.setVariableValues({ active_profile_name: data.name })
			}
		} else if (cmd.startsWith('profile')) {
			const changedVariables: CompanionVariableValues = {}
			data.forEach((profile: any) => {
				const id = profile.id + 1
				const oldProfile = this.profiles?.find(({ profileId }) => profileId === profile.id)
				if (!oldProfile || oldProfile?.name !== profile.name) {
					changedVariables[`profile_${id}_name`] = profile.name
				}
			})
			this.instance.setVariableValues(changedVariables)
			this.profiles = data
		} else if (cmd.startsWith('play/control')) {
			this.getPlayInfo()
		} else if (cmd.startsWith('play/play_snapshot')) {
			this.getPlayInfo()
		} else {
			this.log('debug', `Unhandled command ${cmd}: ${JSON.stringify(data)}`)
		}
	}
}
