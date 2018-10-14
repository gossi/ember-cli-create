const exec = require('../utils/exec');
const workspace = require('../utils/workspace');

module.exports = async (context) => {
	const { config } = context;
	const args = [config.cmd, config.name, '--directory', config.directory, '--skip-npm'];
	const options = { env: {}};

	if (config.packageManager === 'yarn') {
		args.push('--yarn');
	}

	args.push(config.welcome ? '--welcome' : '--no-welcome');

	if (config['web-component']) {
		args.push('--web-component', config['web-component']);
	}

	if (config.blueprint) {
		args.push('-b', config.blueprint);
	}

	for (const experiment of config.experiments) {
		options.env[`EMBER_CLI_${experiment}`] = true;
	}

	// add --skip-git when we are in a workspace
	const inWorkspace = await workspace.projectInWorkspace(config.directory);
	if (inWorkspace) {
		args.push('--skip-git');
	}

	return exec('ember', args, options);
};
