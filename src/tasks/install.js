const Observable = require('zen-observable');
const exec = require('../utils/exec');

module.exports = (context) => {
	const { config } = context;

	return exec(config.packageManager, ['install']);

	// return new Observable(async observer => {

	// 	observer.next('Install Project');
	// 	await configureExperiments(config, observer);

	// 	observer.next('Configure Features');
	// 	await configureFeatures(config, observer);

	// 	observer.complete();
	// });
};
