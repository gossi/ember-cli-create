const fs = require('fs');
const path = require('path');
const getEmberSourceUrl = require('ember-source-channel-url');
const Observable = require('zen-observable');
const latestVersion = require('latest-version');

function readPackage(config) {
	return require(path.join(config.directory, '/package.json'));
}

function writePackage(config, contents) {
	fs.writeFileSync(path.join(config.directory, '/package.json'), JSON.stringify(contents, null, '  '), 'utf-8');
}

async function configureExperiments(config, observer) {
	// 1) install canary versions
	if (config.experiments.length) {
		observer.next('Require canary version because of experiments');
		const pkg = readPackage(config);
		pkg.devDependencies['ember-source'] = await getEmberSourceUrl('canary');
		pkg.devDependencies['ember-cli'] = 'github:ember-cli/ember-cli';

		writePackage(config, pkg);
	}

	// 2) dump experiments into .ember-cli
	observer.next('dump experiments into .ember-cli');
	const json = {
		disableAnalytics: false,
		environment: {}
	};

	for (let experiment of config.experiments) {
		json.environment[`EMBER_CLI_${experiment}`] = true;
	}

	fs.writeFileSync('.ember-cli', JSON.stringify(json, null, '  '), 'utf-8');
}

async function configureFeatures(config, observer) {
	// 1) write config/optional-features.json
	observer.next('Write config/optional-features.json')
	fs.writeFileSync(path.join(config.directory, '/config/optional-features.json'), JSON.stringify(config.features, null, '  '), 'utf-8');

	// 2) remove @ember/jquery (if opted out)
	const pkg = readPackage(config);

	if (config.features['jquery-integration'] === false && '@ember/jquery' in pkg.devDependencies) {
		observer.next('Remove @ember/jquery');

		delete pkg.devDependencies['@ember/jquery'];
	}
}

async function configureAddons(config, observer) {
	if (config.addons.length) {
		const pkg = readPackage(config);
		for (let addon of config.addons) {
			const version = await latestVersion(addon);
			pkg.devDependencies[addon] = `^${version}`;
		}
		writePackage(config, pkg);
	}
}

module.exports = (context) => {
	const { config } = context;

	return new Observable(async observer => {

		// test if project folder exists
		if (!fs.existsSync(config.directory)) {
			observer.error(new Error('Project creation failed, directory does not exists'));
		}

		process.chdir(config.directory);

		observer.next('Configure Experiments');
		await configureExperiments(config, observer);

		observer.next('Configure Features');
		await configureFeatures(config, observer);

		observer.next('Configure Addons');
		await configureAddons(config, observer);

		observer.complete();
	});
};
