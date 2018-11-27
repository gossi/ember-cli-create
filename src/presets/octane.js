let VersionChecker = require('ember-cli-version-checker');
let checker = new VersionChecker(this);
let emberCliVersion = checker.for('ember-cli');
let experiments;

if (emberCliVersion.gte('3.5.0')) {
	experiments = ['MODULE_UNIFICATION'];
} else {
	experiments = ['MODULE_UNIFICATION', 'BROCCOLI_2', 'SYSTEM_TEMP']
};

module.exports = {
	type: 'app',
	addons: ['ember-decorators', 'sparkles-component', 'sparkles-decorators', 'ember-auto-import'],
	experiments: experiments,
	features: ['template-only-glimmer-components'],
	welcome: false
};
