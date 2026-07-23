import type { CompanionStaticUpgradeScript, CompanionStaticUpgradeResult } from '@companion-module/base'
import type { config, secrets } from './config.js'

export const upgradeScripts: CompanionStaticUpgradeScript<config, secrets>[] = [
	/*
	 * Upgrade script to add processblock_state_variables config option with default value 1 for all existing instances
	 * This is needed because this option was added in a later version and without this upgrade script,
	 * existing instances would not have this option set and thus would not create any process block state variables
	 */
	((_context, props): CompanionStaticUpgradeResult<config, secrets> => {
		return {
			updatedConfig: {
				...props.config,
				processblock_state_variables: props.config?.processblock_state_variables ?? 1,
			},
			updatedSecrets: null,
			updatedActions: [],
			updatedFeedbacks: [],
		}
	}) as CompanionStaticUpgradeScript<config, secrets>,

	/*
	 * Upgrade script to move the password from the config store to the secrets store.
	 * The password field was changed to a `secret-text` field, whose value lives in the
	 * secrets store instead of the config store. Migrate any existing password so that
	 * authentication keeps working after the upgrade, and remove the plain-text copy
	 * from the config store.
	 */
	((_context, props): CompanionStaticUpgradeResult<config, secrets> => {
		const legacyConfig = props.config as (config & { password?: string }) | null
		const legacyPassword = legacyConfig?.password

		if (!legacyConfig || legacyPassword === undefined) {
			return {
				updatedConfig: null,
				updatedSecrets: null,
				updatedActions: [],
				updatedFeedbacks: [],
			}
		}

		const updatedConfig = { ...legacyConfig }
		delete updatedConfig.password

		return {
			updatedConfig,
			updatedSecrets: {
				...props.secrets,
				password: legacyPassword,
			},
			updatedActions: [],
			updatedFeedbacks: [],
		}
	}) as CompanionStaticUpgradeScript<config, secrets>,
]
