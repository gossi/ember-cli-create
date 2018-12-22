const inquirer = require('inquirer');
const chalk = require('chalk');

const STRUCTURE = ['ember-decorators', 'ember-cli-typescript', 'sparkles-component', 'sparkles-decorators', 'ember-css-modules', 'ember-auto-import', 'ember-bind-helper'];
const STYLERS = ['ember-cli-sass', 'ember-cli-less'];
const HELPERS = ['ember-composable-helpers', 'ember-truth-helpers', 'ember-math-helpers'];
const UIFRAMEWORKS = ['ember-cli-tailwind', 'ember-bootstrap', 'ember-paper'];
const TESTING = ['qunit-dom', 'ember-cli-mirage', 'ember-mocha'];
const POPULAR = ['ember-concurrency', 'ember-simple-auth', 'ember-intl', 'ember-power-select'];

const section = (title) => {
	return new inquirer.Separator(chalk.reset.green.underline(title));
};

module.exports = [].concat(
	section('Language Features & Structure'), STRUCTURE,
	section('CSS Preprocessors'), STYLERS,
	section('Helpers'), HELPERS,
	section('UI Frameworks'), UIFRAMEWORKS,
	section('Testing'), TESTING,
	section('Popular'), POPULAR
);
