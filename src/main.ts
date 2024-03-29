import { InstanceBase, InstanceStatus, runEntrypoint, type SomeCompanionConfigField } from '@companion-module/base'
import { type config, getConfigFields } from './config.js'
import { getActions } from './actions.js'
import { getPresets } from './presets.js'
import { getVariables } from './variables.js'
import { getFeedbacks } from './feedbacks.js'
import { upgradeScripts } from './upgrades.js'
import { Device } from './device.js'

export class ModuleInstance extends InstanceBase<config> {
	config: config | undefined
	public device?: Device

	constructor(internal: unknown) {
		super(internal)
	}

	async init(config: config): Promise<void> {
		const old_host = this.getHostAddress()
		this.config = config
		const host = this.getHostAddress()
		if (host) {
			if (this.device && old_host !== host) {
				await this.device?.destroy()
				delete this.device
			}
			this.device = new Device(this)
			this.updateStatus(InstanceStatus.Connecting)
			this.device.setConfig(host, this.config ? this.config.password : '')
			this.device.initConnection()
		} else {
			await this.device?.destroy()
			delete this.device
		}
		this.initVariables()
		this.initFeedbacks()
		this.initActions()
		this.initPresets()
	}

	// When module gets deleted
	async destroy(): Promise<void> {
		this.log('debug', 'destroy module instance')
		await this.device?.destroy()
		this.updateStatus(InstanceStatus.Disconnected)
	}

	/**
	 * Creates the configuration fields for web config.
	 */
	public getConfigFields(): SomeCompanionConfigField[] {
		return getConfigFields()
	}

	async configUpdated(config: config): Promise<void> {
		this.updateStatus(InstanceStatus.Disconnected)
		await this.init(config)
	}

	initVariables(): void {
		if (this.device) {
			const variables = getVariables()
			this.setVariableDefinitions(variables)
		} else {
			this.setVariableDefinitions([])
		}
	}

	initFeedbacks(): void {
		if (this.device) {
			const feedbacks = getFeedbacks(this.device)
			this.setFeedbackDefinitions(feedbacks)
		} else {
			this.setFeedbackDefinitions({})
		}
	}

	initPresets(): void {
		if (this.device) {
			const presets = getPresets()
			this.setPresetDefinitions(presets)
		} else {
			this.setPresetDefinitions({})
		}
	}

	initActions(): void {
		if (this.device) {
			const actions = getActions(this.device)
			this.setActionDefinitions(actions)
		} else {
			this.setActionDefinitions({})
		}
	}

	getHostAddress(): string | null {
		if (!this.config) {
			return null
		}
		if (this.config.bonjour_host) {
			const ip = this.config.bonjour_host.split(':')[0]
			const regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
			if (ip.match(regex)) {
				return ip
			}
			this.log('warn', `IP ${ip} has unexpected format`)
			return null
		} else if (this.config.host) {
			return this.config.host
		}
		return null
	}
}

runEntrypoint(ModuleInstance, upgradeScripts)
