const inquirer = require('inquirer');
const path = require('path');

const EXPERIMENTS = require('../contents/experiments');
const ADDONS = require('../contents/addons');
const FEATURES = require('../contents/features');
const PRESETS = require('../contents/presets');
const TYPES = ['app', 'addon', new inquirer.Separator('engine (One day... One day!)')];


function dasherize(str) {
	return str.replace(/[A-Z]/g, function(char, index) {
		return (index !== 0 ? '-' : '') + char.toLowerCase();
	});
}

module.exports = function (args, options) {
	// put options into local variables (so they are overridable with answers)
	let preset = options.preset;
	let name = args.name;

	return [
		{
			type: 'list',
			name: 'preset',
			message: 'What kind of ember project you want to create?',
			choices: PRESETS,
			pageSize: PRESETS.length * 2,
			when: () => {
				return !preset;
			},
			filter: (input) => {
				preset = input;
				return input;
			}
		},
		{
			type: 'list',
			name: 'type',
			message: 'Which type of project are you generating?',
			choices: TYPES,
			pageSize: TYPES.length,
			when: () => {
				return preset === 'manual';
			}
		}, {
			type: 'input',
			name: 'name',
			message: 'What is the name of your project',
			suffix: ':',
			when: () => {
				return !name;
			},
			validate(input) {
				if (input !== '') {
					name = input;
					return name;
				}

				return 'Please enter a name for your project';
			}
		}, {
			type: 'input',
			name: 'directory',
			message: 'Where to create your project?',
			suffix: ':',
			default() {
				return './' + name;
			},
			validate(input) {
				return input !== '';
			},
			filter(input) {
				if (!path.isAbsolute(input)) {
					input = path.join(process.cwd(), input);
				}
				return input;
			},
			when: () => {
				return !options.directory || options.directory !== '';
			}
		}, {
			type: 'input',
			name: 'web-component',
			message: 'What is your web component tag name?',
			suffix: ':',
			default(answers) {
				return dasherize(answers.name);
			},
			validate(input) {
				if (input !== '') {
					if (!input.includes('-')) {
						return 'Your component must contain a hyphen (-)';
					}

					return true;
				}
				return 'Please give your component a tag name';
			},
			when: () => {
				return preset === 'glimmer-wc';
			}
		}, {
			type: 'checkbox',
			name: 'addons',
			message: 'Which addons do you want?',
			choices: ADDONS,
			pageSize: ADDONS.length,
			when: () => {
				return preset === 'manual';
			}
		}, {
			type: 'checkbox',
			name: 'experiments',
			message: 'Experiments for ember-cli (This will install canary versions of ember and ember-cli)',
			choices: EXPERIMENTS,
			pageSize: EXPERIMENTS.length,
			when: () => {
				return preset === 'manual';
			}
		}, {
			type: 'checkbox',
			name: 'features',
			message: 'Enable/Disable features (@ember/optional-features)',
			choices: FEATURES,
			pageSize: FEATURES.length,
			when: () => {
				return preset === 'manual';
			}
		}
	];
}
