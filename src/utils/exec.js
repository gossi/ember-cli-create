const execa = require('execa');
const split = require('split');

module.exports = (program, args = [], options = {}) => {
	return execa(program, args, options).stdout.pipe(split(/\r?\n/, null, { trailing: false }));
};
