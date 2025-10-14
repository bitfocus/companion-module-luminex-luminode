import { ModuleInstance } from './main.js'
import { FeedbackId } from './feedbacks.js'
import { WS } from './websocket.js'
import { type CompanionVariableValues, InstanceStatus } from '@companion-module/base'

export class Device {
	host = ''
	password = ''
	instance: ModuleInstance

	connected = false
	use_websockets = false

	devicePoll?: NodeJS.Timeout
	deviceLongPoll?: NodeJS.Timeout

	private ws?: WS

	mainPlayerIdx = -1
	current_snapshot = '-'
	next_snapshot = '-'

	active_profile?: string
	profiles: any[] = []
	deviceInfo?: any
	versionInfo?: any

	constructor(instance: ModuleInstance) {
		this.instance = instance
	}

	// When module gets deleted
	public async destroy(): Promise<void> {
		this.log('debug', 'destroy')
		this.stopDevicePoll()
		this.ws?.close()
		delete this.ws
		this.updateStatus(InstanceStatus.Disconnected)
	}

	private safeStringify(value: unknown): string {
		try {
			if (typeof value === 'string') return value
			if (value === null) return 'null'
			if (value === undefined) return 'undefined'
			return JSON.stringify(value)
		} catch (_) {
			return String(value)
		}
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
		fetch(`http://${this.host}/api/software/version`, options)
			.then(async (res) => {
				if (res.ok) {
					const contentType = res.headers.get('content-type')
					if (contentType && contentType.indexOf('application/json') !== -1) {
						res
							.json()
							.then((json: any) => {
								this.versionInfo = json
								this.instance.setVariableValues({
									current_version: json.current,
									alternate_version: json.alternate,
								})
								this.use_websockets = this.supportsWs()
								this.log('debug', `Support for Websockets: ${this.use_websockets}`)
								this.updateStatus(InstanceStatus.Ok)
								if (this.use_websockets) {
									this.createWebSocket()
								}
								this.startDevicePoll()
							})
							.catch((error) => {
								this.log('debug', `Failed to parse software version: ${error.toString()}`)
								this.updateStatus(InstanceStatus.ConnectionFailure)
							})
					}
					return
				}
				throw new Error(this.safeStringify(res))
			})
			.catch((error) => {
				this.log('debug', error)
				this.updateStatus(InstanceStatus.ConnectionFailure)
			})
	}

	/**
	 * Determine whether this device version supports WebSocket features.
	 * Returns true for versions >= 2.7.0, false otherwise.
	 */
	supportsWs(): boolean {
		const verRaw = this.versionInfo?.current
		if (!verRaw || typeof verRaw !== 'string') return false

		// Match version at start like: v2.7.1 or 2.7.1 or 2.7.1RC1-...
		const m = verRaw.match(/^v?(\d+)(?:\.(\d+))?(?:\.(\d+))?/)
		// If no match: assume custom firmware that supports WebSockets
		if (!m) return true

		const major = parseInt(m[1] ?? '0', 10)
		const minor = parseInt(m[2] ?? '0', 10)
		const patch = parseInt(m[3] ?? '0', 10)
		if (isNaN(major) || isNaN(minor) || isNaN(patch)) return false

		// Compare to 2.7.0
		if (major > 2) return true
		if (major < 2) return false
		if (minor > 7) return true
		if (minor < 7) return false
		return patch >= 0
	}

	createWebSocket(): void {
		if (!this.use_websockets) {
			return
		}
		if (this.ws != undefined) {
			this.ws.close()
			delete this.ws
		}
		this.ws = new WS(this.host, {
			onopen: this.websocketOpen.bind(this),
			onmessage: this.websocketMessage.bind(this),
			onerror: this.websocketError.bind(this),
			ondisconnect: this.websocketDisconnect.bind(this),
		})
	}

	initWebSocket(): void {
		if (!this.use_websockets) {
			return
		}
		this.ws?.init()
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

		if (this.use_websockets) {
			this.initWebSocket()
		} else {
			this.getDeviceInfo()
			this.getProfileNames()
		}
		this.getPlayInfo()

		this.log('debug', `Starting device poll for ${this.host}`)

		this.devicePoll = setInterval(() => {
			if (!this.use_websockets) {
				this.getDeviceInfo()
			}
			this.getPlayInfo()
		}, 5000)

		if (!this.use_websockets) {
			this.deviceLongPoll = setInterval(() => {
				this.getProfileNames()
			}, 15000)
		}
	}

	stopDevicePoll(): void {
		if (this.devicePoll) {
			clearInterval(this.devicePoll)
			delete this.devicePoll
		}
		if (this.deviceLongPoll) {
			clearInterval(this.deviceLongPoll)
			delete this.deviceLongPoll
		}
		this.log('debug', `Stopped device poll for ${this.host}`)
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
					throw new Error(this.safeStringify(res))
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
			if (!Array.isArray(data)) {
				return
			}
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

	updateProfile(id: number, profile: { name: string }): void {
		const oldProfile = this.profiles?.find(({ profileId }) => profileId === id)
		if (!oldProfile || oldProfile?.name !== profile.name) {
			this.instance.setVariableValues({ [`profile_${id + 1}_name`]: profile.name })
		}
		this.profiles[id] = profile
	}

	websocketOpen(): void {
		this.updateStatus(InstanceStatus.Ok)
		this.log('debug', `Connection opened to ${this.host}`)
	}

	websocketError(data: string): void {
		this.log('error', `WebSocket error: ${this.safeStringify(data)}`)
	}

	websocketDisconnect(msg: string): void {
		this.log('debug', msg)
		this.updateStatus(InstanceStatus.Disconnected, msg)
	}

	// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
	websocketMessage(msgValue: any): void {
		if (msgValue && msgValue.op && msgValue.path) {
			if (msgValue.path === '/api') {
				this.processData('deviceinfo', msgValue.value.deviceinfo)
				this.processData('active_profile_name', msgValue.value.active_profile_name)
				this.processData('profile', msgValue.value.profile)
			} else if (msgValue.path === '/api/deviceinfo') {
				this.processData('deviceinfo', msgValue.value)
			} else if (msgValue.path === '/api/active_profile_name') {
				this.processData('active_profile_name', msgValue.value)
			} else if (msgValue.path.startsWith('/api/profile')) {
				if (msgValue.op === 'replace') {
					const profileId = parseInt(msgValue.path.replace('/api/profile/', ''), 10)
					this.updateProfile(profileId, msgValue.value)
				} else {
					this.log('debug', `Unhandled profile WS message: ${msgValue.path} (${msgValue.op})`)
				}
			} else {
				this.log('debug', `Unhandled WS message: ${msgValue.path}`)
			}
		}
	}
}
