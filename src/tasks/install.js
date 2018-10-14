const Observable = require('zen-observable');
const exec = require('../utils/exec');

module.exports = (context) => {
	const { config } = context;

	return exec(config.packageManager, ['install']);
};
