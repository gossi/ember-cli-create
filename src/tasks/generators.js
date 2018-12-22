const fs = require('fs');
const path = require('path');
const Observable = require('zen-observable');
const exec = require('../utils/exec');
const execa = require('execa');
const workspace = require('../utils/workspace');

const ADDON_WHITELIST = ['ember-cli-typescript'];

module.exports = (context) => {
	const { config } = context;

	return new Observable(async observer => {
		const generators = [];
		if (Object.keys(config.addons).length) {

			const dirs = [config.directory];
			const workspaceDir = workspace.getWorkspaceDir(config.directory);
			if (workspaceDir) {
				dirs.push(workspaceDir);
			}

			// let's collect generators first
			for (const addon of Object.keys(config.addons)) {
				for (const dir of dirs) {
					// check if whitelisted
					if (ADDON_WHITELIST.includes(addon)) {
						generators.push(addon);
						continue;
					}

					// check if defaultBlueprint is present in package.json
					const addonPackageFile = path.join(dir, 'node_modules', addon, 'package.json');
					if (fs.existsSync(addonPackageFile)) {
						const addonPackage = require(addonPackageFile);
						if (addonPackage['ember-addon'] && addonPackage['ember-addon'].defaultBlueprint) {
							generators.push(addonPackage['ember-addon'].defaultBlueprint);
							continue;
						}
					}

					// check for file-match of addon and blueprint name
					if (fs.existsSync(path.join(dir, 'node_modules', addon, 'blueprints', addon))) {
						generators.push(addon);
					}
				}
			}

			if (generators.length) {
				const options = { env: {} };

				for (let experiment of config.experiments) {
					options.env[`EMBER_CLI_${experiment}`] = true;
				}

				for (const generator of generators) {
					observer.next(`generate ${generator}`);
					try {
						await execa('ember', ['generate', generator], options);
					} catch (error) {
						observer.error(error);
					}
				}
			}
		}

		observer.complete();
	});
};
