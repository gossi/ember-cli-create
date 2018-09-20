const chalk = require('chalk');
const inquirer = require('inquirer');
const path = require('path');
const fs = require('fs');
const execa = require('execa');
const split = require('split');
const Listr = require('listr');
const Observable = require('zen-observable');
const FEATURES = require('@ember/optional-features/features');
const getEmberSourceUrl = require('ember-source-channel-url');
const compileQuestions = require('../prompts/create-wizard');

module.exports = class CreateCommand {

	constructor(args, options) {
		this.args = args;
		this.options = options;
	}

	async run() {
		const config = await this.interact();
		await this.execute(config);
	}

	async interact() {

		const answers = await new inquirer.prompt(compileQuestions(this.args, this.options));
		if (!answers.preset && this.options.preset) {
			answers.preset = this.options.preset;
		}

		const config = this.compileConfig(answers);
		console.log(config);
		return config;
	}

	async execute(config) {
		const tasks = new Listr([
			{
				title: 'Init Project',
				task: require('../tasks/init')
			},
			{
				title: 'Configure Project',
				task: require('../tasks/config')
			},
			{
				title: 'Install Project',
				task: require('../tasks/install')
			}
			// {
			// 	title: 'Install Ember',
			// 	task: () => {
			// 		return new Listr([
			// 			{
			// 				title: 'Run ember install',
			// 				task: () => this.installProject(config)
			// 			},
			// 			{
			// 				title: 'Post ember install',
			// 				task: () => this.processPostInstallProject(config)
			// 			}
			// 		]);
			// 	}
			// }, {
			// 	title: 'Install Addons',
			// 	task: () => this.installAddons(config)
			// }, {
			// 	title: 'Run Generators',
			// 	task: () => this.runGenerators(config)
			// }
		]);

		tasks.run({config}).catch(err => {
			console.error(err);
		});
	}

	exec(program, args = [], options = {}) {
		return execa(program, args, options).stdout.pipe(split(/\r?\n/, null, {trailing: false}));
	}

	installProject(config) {
		const subCommands = {
			app: 'new',
			addon: 'addon'
		};
		const args = [subCommands[config.type], config.name, '--directory', config.target];
		const options = { env: {}};

		if (config.packageManager === 'yarn') {
			args.push('--yarn');
		}

		args.push(config.welcome ? '--welcome' : '--no-welcome');

		for (let experiment of config.experiments) {
			options.env[`EMBER_CLI_${experiment}`] = true;
		}

		return this.exec('ember', args, options);
	}

	processPostInstallProject(config) {
		return new Observable(async observer => {
			observer.next('Change working directory')
			process.chdir(config.target);

			observer.next('Process experiments');
			await this.processPostInstallProjectExperiments(config, observer);

			observer.next('Process features');
			await this.processPostInstallProjectFeatures(config, observer);

			observer.complete();
		});
	}

	async processPostInstallProjectExperiments(config, observer) {
		// 1) install canary versions
		if (config.experiments.length) {
			const pkg = require(path.join(config.target, '/package.json'));
			pkg.devDependencies['ember-source'] = await getEmberSourceUrl('canary');
			pkg.devDependencies['ember-cli'] = 'github:ember-cli/ember-cli';

			fs.writeFileSync(path.join(config.target, '/package.json'), JSON.stringify(pkg, null, '  '), 'utf-8');

			observer.next('Upgrade to ember canary');
			try {
				await execa(config.packageManager, ['install']);
			} catch (error) {
				observer.error(error);
			}
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

	async processPostInstallProjectFeatures(config, observer) {
		// 1) write config/optional-features.json
		observer.next('Write config/optional-features.json')
		fs.writeFileSync(path.join(config.target, '/config/optional-features.json'), JSON.stringify(config.features, null, '  '), 'utf-8');

		// 2) remove @ember/jquery (if opt out)
		const pkg = require(path.join(config.target, '/package.json'));

		if (config.features['jquery-integration'] === false && '@ember/jquery' in pkg.devDependencies) {
			observer.next('Remove @ember/jquery');

			const args = [config.packageManager === 'yarn' ? 'remove' : 'uninstall', '@ember/jquery'];
			try {
				await execa(config.packageManager, args);
			} catch (error) {
				observer.error(error);
			}
		}
	}

	installAddons(config) {
		if (config.addons.length) {
			const args = [config.packageManager === 'yarn' ? 'add' : 'install', '-D'].concat(config.addons);

			return this.exec(config.packageManager, args);
		}
	}

	runGenerators(config) {
		if (config.addons.length) {
			const generators = [];
			// let's collect generators first
			for (const addon of config.addons) {
				if (fs.existsSync(path.join(config.target, 'node_modules', addon, 'blueprints', addon))) {
					generators.push(addon);
				}
			}

			if (generators.length) {
				const options = { env: {}};

				for (let experiment of config.experiments) {
					options.env[`EMBER_CLI_${experiment}`] = true;
				}

				return new Observable(async observer => {
					for (const generator of generators) {
						observer.next(`generate ${generator}`);
						try {
							await execa('ember', ['g', generator], options);
						} catch (error) {
							observer.error(error);
						}
					}
					observer.complete();
				});
			}
		}
	}

	loadPreset(preset) {
		try {
			if (preset) {
				let config = require(`../presets/${preset}`);
				return config;
			}
		} catch (e) {

		} finally {
			return require(`../presets/manual`);
		}
	}

	/**
	 * Sanitizes the preset
	 *
	 * @param {*} preset
	 */
	getConfig(preset) {
		const config = preset;

		// features
		const feats = {};
		for (let feat of Object.keys(FEATURES)) {
			feats[feat] = preset.features.includes(feat);
		}
		config.features = feats;

		// experiments

		// enable broccoli2 when system_temp is enabled
		if (config.experiments.includes('SYSTEM_TEMP') && !config.experiments.includes('BROCCOLI_2')) {
			config.experiments.push('BROCCOLI_2');
		}

		return config;
	}

	compileConfig(answers) {
		const config = {
			packageManager: this.options.npm ? 'npm' : 'yarn',
			type: 'app',
			addons: [],
			features: [],
			experiments: [],
			welcome: !!this.options.welcome
		};
		const preset = this.loadPreset(answers.preset);
		Object.assign(config, preset, answers);

		config.cmd = config.type === 'addon' ? 'addon' : 'new';

		// features
		const feats = {};
		for (let feat of Object.keys(FEATURES)) {
			feats[feat] = config.features.includes(feat);
		}
		config.features = feats;

		// experiments

		// enable broccoli2 when system_temp is enabled
		if (config.experiments.includes('SYSTEM_TEMP') && !config.experiments.includes('BROCCOLI_2')) {
			config.experiments.push('BROCCOLI_2');
		}

		return config;
	}

};
