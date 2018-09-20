const exec = require('../utils/exec');

module.exports = (context, task) => {
	const { config } = context;
	const args = [config.cmd, config.name, '--directory', config.directory, '--skip-npm'];
	const options = { env: {}};

	if (config.packageManager === 'yarn') {
		args.push('--yarn');
	}

	args.push(config.welcome ? '--welcome' : '--no-welcome');

	if (config['web.component']) {
		args.push('--web-component', config['web-component']);
	}

	if (config.blueprint) {
		args.push('-b', config.blueprint);
	}

	for (let experiment of config.experiments) {
		options.env[`EMBER_CLI_${experiment}`] = true;
	}

	return exec('ember', args, options);
};
