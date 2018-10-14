const path = require('path');
const fs = require('fs');

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

function isRoot(dir) {
	return path.parse(dir).root === dir;
}

function getWorkspaceDir(projectFolder) {
	let found = '';
	let dir = path.dirname(projectFolder);

	do {
		const pkgJsonFile = path.join(dir, 'package.json');
		if (fs.existsSync(pkgJsonFile)) {
			if (workspaceContains(pkgJsonFile, projectFolder)) {
				found = dir;
			}
		}
		dir = path.dirname(dir);
	} while (found === '' && !isRoot(dir));

	return found;
}

function projectInWorkspace(projectFolder) {
	return getWorkspaceDir(projectFolder) !== '';
}

module.exports = {
	projectInWorkspace,
	workspaceContains,
	getWorkspaceDir
}
