const features = require('@ember/optional-features/features');
const enabledFeatures = ['template-only-glimmer-components'];

module.exports = Object.keys(features).map(feature => {
	return {
		name: feature,
		value: feature,
		checked: enabledFeatures.includes(feature)
	};
});
