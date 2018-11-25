const inquirer = require('inquirer');
const Listr = require('listr');
const FEATURES = require('@ember/optional-features/features');
const compileQuestions = require('../prompts/create-wizard');
const path = require('path');
const chalk = require('chalk');
const ui = require('cliui')();

module.exports = class CreateCommand {

	constructor(args, options) {
		this.args = args;
		this.options = options;
		this.workingDirectory = process.cwd();
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

		return this.compileConfig(answers);
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
			},
			{
				title: 'Run Generators',
				task: require('../tasks/generators')
			}
		]);

		try {
			await tasks.run({ config });

			ui.div({
				text:
					`🐹 Your ember project setup is finished.\n` +
					`🚀 Change to your project directory and enjoy developing:`,
				padding: [1, 0, 0, 1]
			});

			ui.div({
				text: chalk.yellow('cd ' + path.relative(this.workingDirectory, config.directory) + '/'),
				padding: [1, 0, 0, 4]
			});

			ui.div({
				text:
					'Commands to get started:\n' +
					'------------------------',
				padding: [1, 0, 0, 1]
			})

			ui.div({
				text:
					`Serve:       \t${chalk.yellow('ember serve')}\n` +
					`Build:       \t${chalk.yellow('ember build')}\n` +
					`Generate:    \t${chalk.yellow('ember generate') + chalk.yellow.dim(' <blueprint> <name>')}\n` +
					`Test:        \t${chalk.yellow('ember test')}\n` +
					`Test Server: \t${chalk.yellow('ember serve -e test')}`,
				padding: [0, 0, 1, 1]
			});

			console.log(ui.toString());
		} catch (err) {
			ui.div({
				text: '⚠️  ' + chalk.red(`Could not setup your project: ${err.message}`),
				padding: [1, 0, 1, 1]
			});
			console.error(ui.toString());
		}
	}

	loadPreset(preset) {
		try {
			// no slash means built-in preset
			if (!preset.includes('/')) {
				return require(`../presets/${preset}`);
			}
		} catch (e) {
			return require(`../presets/manual`);
		}
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

		config.cmd = config.type === 'addon' || config.type === 'engine' ? 'addon' : 'new';

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
