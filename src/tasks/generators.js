const fs = require('fs');
const path = require('path');
const Observable = require('zen-observable');
const exec = require('../utils/exec');

module.exports = (context) => {
	const { config } = context;

	return new Observable(async observer => {
		if (config.addons.length) {
			const generators = [];
			// let's collect generators first
			for (const addon of config.addons) {
				if (fs.existsSync(path.join(config.directory, 'node_modules', addon, 'blueprints', addon))) {
					generators.push(addon);
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
						await exec('ember', ['g', generator], options);
					} catch (error) {
						observer.error(error);
					}
				}
			}
		}

		observer.complete();
	});
};
