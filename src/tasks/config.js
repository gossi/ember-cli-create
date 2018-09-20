const fs = require('fs');

module.exports = (context) => {
	const { config } = context;
	// test if project folder exists
	if (!fs.existsSync(config.directory)) {
		throw new Error('Project creation failed, directory does not exists');
	}
};
