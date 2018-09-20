const chalk = require('chalk');

module.exports = [
	{
		name: `Beginner\n  ${chalk.dim('-> If you are new to ember, use this!')}`,
		value: 'beginner'
	}, {
		name: `Ember App\n  ${chalk.dim('-> Regular ember app wo/ welcome page')}`,
		value: 'app'
	}, {
		name: `Ember Addon\n  ${chalk.dim('-> Regular ember addon')}`,
		value: 'addon'
	}, {
		name: `Octane\n  ${chalk.dim('-> MU, Decorators, Sparkles, ...')}`,
		value: 'octane'
	}, {
		name: `Octane + TS\n  ${chalk.dim('-> Fuel up your Octane with Type-Power!')}`,
		value: 'octane-ts'
	}, {
		name: `Glimmer\n  ${chalk.dim('-> Create a glimmer project')}`,
		value: 'glimmer'
	}, {
		name: `Glimmer WebComponent\n  ${chalk.dim('-> Create a web component with glimmer')}`,
		value: 'glimmer-wc'
	}, {
		name: `Manual... \n  ${chalk.dim('-> Run this wizard on your own, select your needs')}`,
		value: 'manual'
	}
];
