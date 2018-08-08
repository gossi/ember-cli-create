const chalk = require('chalk');
const inquirer = require('inquirer');
const path = require('path');
const fs = require('fs');
const execa = require('execa');
const split = require('split');
const Listr = require('listr');
const Observable = require('zen-observable');
const features = require('@ember/optional-features/features');
const getEmberSourceUrl = require('ember-source-channel-url');


// const prompt = inquirer.createPromptModule();
// process.env.FORCE_COLOR = true;
const sep = new inquirer.Separator();


const TYPES = ['app', 'addon'];

const section = (title) => { return new inquirer.Separator(chalk.reset.green.underline(title)); };
const STYLERS = ['ember-cli-sass', 'ember-cli-less'];
const HELPERS = ['ember-composable-helpers', 'ember-truth-helpers', 'ember-math-helpers'];
const LANGUAGE = ['ember-decorators', 'ember-cli-typescript', 'ember-component-css'];
const UIFRAMEWORKS = ['ember-cli-tailwind', 'ember-bootstrap', 'ember-paper'];
const TESTING = ['qunit-dom', 'ember-cli-mirage', 'ember-mocha'];
const POPULAR = ['ember-concurrency', 'ember-simple-auth', 'ember-intl', 'ember-power-select'];
const ADDONS = [].concat(
	section('Language Features & Structure'), LANGUAGE,
	section('CSS Preprocessors'), STYLERS,
	section('Helpers'), HELPERS,
	section('UI Frameworks'), UIFRAMEWORKS,
	section('Testing'), TESTING,
	section('Popular'), POPULAR
);

const EXPERIMENTS = [
	{
		name: 'Packager',
		value: 'PACKAGER'
	}, {
		name: 'Module Unification (MU)',
		value: 'MODULE_UNIFICATION'
	}, {
		name: 'Broccoli 2',
		value: 'BROCCOLI_2'
	}, {
		name: 'System Temp Directory (will enable Broccoli 2)',
		value: 'SYSTEM_TEMP'
	}, {
		name: 'Delayed Transpilation',
		value: 'DELAYED_TRANSPILATION'
	}
];

const enabledFeatures = ['template-only-glimmer-components'];
const FEATURES = Object.keys(features).map(feature => {
	return {
		name: feature,
		value: feature,
		checked: enabledFeatures.includes(feature)
	};
});

module.exports = class CreateCommand {

	constructor(args, options) {
		this.args = args;
		this.options = options;
	}

	async run() {
		const preset = await this.interact();
		await this.execute(preset);
	}

	async interact() {
		const answers = await inquirer.prompt([
			{
				type: 'list',
				name: 'type',
				message: 'Which type of project are you generating?',
				choices: ['app', 'addon', new inquirer.Separator('engine (One day... One day!)')],
				when: () => {
					return !TYPES.includes(this.args.type);
				}
			}, {
				type: 'input',
				name: 'name',
				message: 'What is the name of your project',
				suffix: ':',
				when: () => {
					return !this.args.name;
				},
				validate(input) {
					if (input !== '') {
						return true;
					}

					return 'Please enter a name for your project';
				}
			}, {
				type: 'input',
				name: 'target',
				message: 'Where to create your project?',
				suffix: ':',
				default(answers) {
					return path.join(process.cwd(), answers.name);
				},
				validate(input) {
					return input !== '';
				},
				when: () => {
					return !this.options.directory || this.options.directory !== '';
				}
			}, {
				type: 'checkbox',
				name: 'addons',
				message: 'Which addons do you want?',
				pageSize: ADDONS.length,
				choices: ADDONS
			}, {
				type: 'checkbox',
				name: 'experiments',
				message: 'Go crazy and enable some ember-cli experiments (This will install canary versions of ember and ember-cli)',
				pageSize: EXPERIMENTS.length,
				choices: EXPERIMENTS
			}, {
				type: 'checkbox',
				name: 'features',
				message: 'Enable/Disable features (@ember/optional-features)',
				pageSize: FEATURES.length,
				choices: FEATURES
			}
		]);

		const preset = {
			packageManager: this.options.npm ? 'npm' : 'yarn',
			type: this.args.type || answers.type,
			name: this.args.name || answers.name,
			target: this.options.diretory ||  answers.target,
			addons: answers.addons,
			experiments: answers.experiments,
			features: answers.features,
			welcome: !!this.options.welcome
		}

		return preset;
	}

	async execute(preset) {
		const config = this.getConfig(preset);
		const tasks = new Listr([
			{
				title: 'Install Ember',
				task: () => {
					return new Listr([
						{
							title: 'Run ember install',
							task: () => this.installProject(config)
						},
						{
							title: 'Post ember install',
							task: () => this.processPostInstallProject(config)
						}
					]);
				}
			}, {
				title: 'Install Addons',
				task: () => this.installAddons(config)
			}, {
				title: 'Run Generators',
				task: () => this.runGenerators(config)
			}
		]);

		tasks.run().catch(err => {
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

	/**
	 * Sanitizes the preset
	 *
	 * @param {*} preset
	 */
	getConfig(preset) {
		const config = preset;

		// features
		const feats = {};
		for (let feat of Object.keys(features)) {
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

};
