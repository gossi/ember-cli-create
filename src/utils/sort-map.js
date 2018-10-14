module.exports = (map) => {
	const collection = {};
	for (let key of Object.keys(map).sort()) {
		collection[key] = map[key];
	}

	return collection;
}
