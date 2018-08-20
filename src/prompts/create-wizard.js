const chalk = require('chalk');
const inquirer = require('inquirer');
const EXPERIMENTS = require('../contents/experiments');
const ADDONS = require('../contents/addons');
const FEATURES = require('../contents/features');
const TYPES = ['app', 'addon'];

const PRESETS = [
	{
		name: `Stable\n  ${chalk.dim('-> Solid ember installation you can bet on')}`,
		value: 'stable'
	}, {
		name: `Modern\n  ${chalk.dim('-> MU, TS, Decorators, Sparkles, ...')}`,
		value: 'modern'
	}, {
		name: `Manual... \n  ${chalk.dim('-> Run this wizard on your own, select your needs')}`,
		value: 'manual'
	}
]

module.exports = function (args, options) {
	return [
		{
			type: 'list',
			name: 'preset',
			message: 'Choose a preset (or proceed manually)',
			choices: PRESETS,
			when: () => {
				return !options.preset;
			}
		},
		{
			type: 'list',
			name: 'type',
			message: 'Which type of project are you generating?',
			choices: ['app', 'addon', new inquirer.Separator('engine (One day... One day!)')],
			when: () => {
				return !TYPES.includes(args.type);
			}
		}, {
			type: 'input',
			name: 'name',
			message: 'What is the name of your project',
			suffix: ':',
			when: () => {
				return !args.name;
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
				return !options.directory || options.directory !== '';
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
			message: 'Experiments for ember-cli (This will install canary versions of ember and ember-cli)',
			pageSize: EXPERIMENTS.length,
			choices: EXPERIMENTS
		}, {
			type: 'checkbox',
			name: 'features',
			message: 'Enable/Disable features (@ember/optional-features)',
			pageSize: FEATURES.length,
			choices: FEATURES
		}
	];
}
