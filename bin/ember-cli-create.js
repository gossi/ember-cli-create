#!/usr/bin/env node
'use strict';

const programm = require('commander');
const pkg = require('../package');
const CreateCommand = require('../src/commands/create');

programm
	.version(pkg.version)
	.arguments('[type] [name]')
	.option('--directory <path>', 'Where to place the files')
	.option('--npm', 'Use npm as package manager (instead of yarn)')
	.option('--welcome', 'To install the {{ember-welcome-page}}')
	.action(function (type, name, options) {
		const cmd = new CreateCommand({
			type: type,
			name: name
		}, options);
		cmd.run();
	});

programm.parse(process.argv);
