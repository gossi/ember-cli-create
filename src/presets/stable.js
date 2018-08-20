module.exports = {
	packageManager: 'yarn',
	type: this.args.type || answers.type,
	name: this.args.name || answers.name,
	target: this.options.diretory ||  answers.target,
	addons: answers.addons,
	experiments: answers.experiments,
	features: answers.features,
	welcome: !!this.options.welcome
}
