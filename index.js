const fs = require('fs')
const express = require('express')
const bodyParser = require('body-parser')
const neo4j = require('neo4j-driver')
const esprima = require('esprima')
const colors = require('colors')

const app = express()

function transformToJs(rules) {
	let newStatement
	newStatement = rules.replace('NOT ', '!')
	newStatement = newStatement.replace(/AND/g, '&&')
	newStatement = newStatement.replace(/OR/g, '||')
	newStatement = newStatement.replace(/\[/g, '"')
	newStatement = newStatement.replace(/\]/g, '"')

	return newStatement
}

function getAvailableOptions() {
	const raw = fs.readFileSync('availableOptions.json')
	const optionsJson = JSON.parse(raw)

	const optionsArraySeparated = []
	optionsJson.forEach((o) => {
		if (o.id) {
			optionsArraySeparated.push(o.id)
		}
		if (!o.id) {
			for (const comp in o) {
				if (o.hasOwnProperty(comp)) {
					const elAr = []
					const elements = o[comp]
					elements.forEach((el) => {
						elAr.push(el.id)
					})
					optionsArraySeparated.push(elAr)
				}
			}
		}
	})
	const notSeparated = optionsArraySeparated.flat()
	return [optionsArraySeparated, notSeparated]
}

function getAllRules() {
	const rawRules = fs.readFileSync('sampleBOM.json')
	const sampleBOM = JSON.parse(rawRules)

	const allRules = []
	sampleBOM.rules?.forEach((rule) => {
		allRules.push(transformToJs(rule))
	})
	sampleBOM.components?.forEach((comp) => {
		comp.rules?.forEach((r) => {
			allRules.push(transformToJs(r))
		})
	})
	return allRules
}

const allRules = getAllRules()
const allOptions = getAvailableOptions()

app.use(bodyParser.json())

app.use(function (req, res, next) {
	res.header('Access-Control-Allow-Origin', 'http://localhost:8080')
	res.header(
		'Access-Control-Allow-Headers',
		'Origin, X-Requested-With, Content-Type, Accept'
	)
	next()
})

app.use('/getOptions', (req, res) => {
	const raw = fs.readFileSync('availableOptions.json')
	const dataOptions = JSON.parse(raw)

	res.send(dataOptions)
})

app.post('/GetConfiguredBOM', (req, res) => {
	const ids = req.body

	const [separated, notSeparated] = allOptions
	// console.log(separated)
	// console.log(notSeparated)

	const elementsToCancel = []
	// 1 Getting rid of the other variants
	ids.forEach((id) => {
		separated.forEach((nestedArray) => {
			if (nestedArray.includes(id) && typeof nestedArray !== 'string') {
				nestedArray.forEach((el) => {
					if (id !== el) return elementsToCancel.push(el)
				})
			}
		})
	})

	const concernedRules = []
	allRules.forEach((rule) => {
		ids.forEach((id) => {
			if (rule.includes(id)) {
				concernedRules.push(rule)
			}
		})
	})
	let restOptions = notSeparated.filter((el) => !elementsToCancel.includes(el))
	restOptions = restOptions.filter((el) => !ids.includes(el))

	concernedRules.forEach((rule) => {
		// the variants have already been removed from restOptions
		const idsInRuleConcerned = restOptions.filter((id) => rule.includes(id))
		console.log('CHECKED from VueJS =>>>> %s\n', ids[0])
		console.log('idsInRuleConcerned =>>>>> %s\n', idsInRuleConcerned)
		console.log('RULE is ===>>>\n%s', rule)
		idsInRuleConcerned.forEach((id) => {})
	})

	restOptions.forEach((id) => {
		// i have to iterate over resOptions and ids and concerned rules !
		console.log('iterated ID == ', id)
		concernedRules.forEach((rule) => {})
		if (concernedRules[0]?.includes(id)) {
			if (eval(concernedRules[0])) {
				console.log('%s is FINE', id)
			} else {
				console.log('%s is IMPOSSIBLE', id)
				elementsToCancel.push(id)
			}
		}
	})

	// Send back either the ones not possible (to desactivate)
	// OR the ones still available (and desactivate the others from the front end)
	res.send({ elementsToDesactivate: elementsToCancel })
})

const port = 3000

app.listen(port, () => {
	console.log(`app listening at http://localhost:${port}`)
})
