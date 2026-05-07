import type { CompanionStaticUpgradeScript, CompanionStaticUpgradeResult } from '@companion-module/base'
import type { config } from './config.js'

export const upgradeScripts: CompanionStaticUpgradeScript<config>[] = [
	/*
	 * Upgrade script to add processblock_state_variables config option with default value 1 for all existing instances
	 * This is needed because this option was added in a later version and without this upgrade script,
	 * existing instances would not have this option set and thus would not create any process block state variables
	 */
	((_context, props): CompanionStaticUpgradeResult<config> => {
		return {
			updatedConfig: {
				...props.config,
				processblock_state_variables: props.config?.processblock_state_variables ?? 1,
			},
			updatedSecrets: null,
			updatedActions: [],
			updatedFeedbacks: [],
		}
	}) as CompanionStaticUpgradeScript<config>,
]
