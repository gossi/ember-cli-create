module.exports = {
	type: 'app',
	addons: {
		'ember-decorators': {},
		'sparkles-component': {},
		'sparkles-decorators': {},
		'ember-auto-import': {},
		"ember-bind-helper": {},
		"ember-cli-babel": {
			version: '^7.1.0'
		}
	},
	experiments: ['MODULE_UNIFICATION', 'BROCCOLI_2', 'SYSTEM_TEMP'],
	features: ['template-only-glimmer-components'],
	welcome: false
};
