const exec = require('../utils/exec');
const path = require('path');
const fs = require('fs');
const walk = require('walk');

function workspaceContains(pkgJsonFile, projectFolder) {
	const pkg = require(pkgJsonFile);
	const base = path.dirname(pkgJsonFile);
	if (pkg.workspaces) {
		for (let workspace of pkg.workspaces) {
			workspace = workspace.includes('*') ? workspace.replace('*', '') : workspace;
			let dir = path.join(base, workspace);
			if (projectFolder.startsWith(dir)) {
				return true;
			}
		}
	}
	return false;
}

function projectInWorkspace(projectFolder) {
	// let dir = path.dirname(projectFolder);

	// let isRoot = false;

	return new Promise(resolve => {
		let found = false;
		const walker = walk.walk(projectFolder, {followSymlinks: false});

		walker.on('directory', function (root, stats, next) {
			console.log('name', stats);

			// const pkgJsonFile = path.join(stats.name, 'package.json');
			// if (fs.existsSync(pkgJsonFile) && workspaceContains(pkgJsonFile, projectFolder)) {
			// 	found = true;
			// }
			next();

		});


		walker.on('file', function (root, stats, next) {
			console.log('file', stats.name);
			next();
		});

		walker.on('end', function () {
			resolve(found);
		});
	});




	// debugger;

	// do {
	// 	// const pkgJsonFile = path.join(dir, 'package.json');
	// 	// if (fs.existsSync(pkgJsonFile)) {
	// 	// 	if (workspaceContains(pkgJsonFile, projectFolder)) {
	// 	// 		found = true;
	// 	// 	}
	// 	// }
	// 	isRoot = path.parse(dir).root === dir;
	// 	dir = path.dirname(dir);
	// } while (!found || !isRoot);
}

module.exports = async (context) => {
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

	// add --skip-git when we are in a workspace
	let inWorkspace = await projectInWorkspace(config.directory);
	console.log('isWorkspace', inWorkspace);
	if (inWorkspace) {
		args.push('--skip-git');
	}

	return exec('ember', args, options);
};
