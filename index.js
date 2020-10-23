const fs = require('fs')
const express = require('express')
const bodyParser = require('body-parser')
const neo4j = require('neo4j-driver')

const app = express()

const raw = fs.readFileSync('availableOptions.json')
const optionsJson = JSON.parse(raw)

function transformToJs(rules) {
	let newStatement
	newStatement = rules.replace(/NOT/g, '!')
	newStatement = newStatement.replace(/AND/g, '&&')
	newStatement = newStatement.replace(/OR/g, '||')
	newStatement = newStatement.replace(/\[/g, '"')
	newStatement = newStatement.replace(/\]/g, '"')

	return newStatement
}

function getAvailableOptions() {
	const optionsSeparated = []
	optionsJson.forEach((o) => {
		if (o.id) {
			optionsSeparated.push([o.id])
		}
		if (!o.id) {
			for (const comp in o) {
				if (o.hasOwnProperty(comp)) {
					const elAr = []
					const elements = o[comp]
					elements.forEach((el) => {
						elAr.push(el.id)
					})
					optionsSeparated.push(elAr)
				}
			}
		}
	})
	const notSeparated = optionsSeparated.flat()
	return [optionsSeparated, notSeparated]
}

function getAllRules() {
	const rawRules = fs.readFileSync('sampleBOM.json')
	const sampleBOM = JSON.parse(rawRules)

	const allRules = []
	sampleBOM.rules?.forEach((rule) => {
		allRules.push(transformToJs(rule))
	})
	sampleBOM.components?.forEach((component) => {
		component.rules?.forEach((nestedRule) => {
			allRules.push(transformToJs(nestedRule))
		})
	})
	return allRules
}

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
	res.send(optionsJson)
})

app.post('/GetConfiguredBOM', (req, res) => {
	const ids = req.body
	const [separated, notSeparated] = getAvailableOptions()
	const allRules = getAllRules()

	// 1 Getting rid of the other variants
	function getRidOfOtherVariants(ids, separatedArrays) {
		const otherVariants = []
		// 1 Getting rid of the other variants
		ids.forEach((id) => {
			separatedArrays.forEach((nestedArray) => {
				if (nestedArray.includes(id)) {
					nestedArray.forEach((el) => {
						if (id !== el) return otherVariants.push(el)
					})
				}
			})
		})
		return otherVariants
	}
	const elementsToCancel = getRidOfOtherVariants(ids, separated)

	// 2 getting the concerned rules, which means the rules
	// that include any of the ids sent from Vue
	function getAllConcernedRules(rules, ids) {
		const rulesContainingIds = []
		rules.forEach((rule) => {
			ids.forEach((id) => {
				if (rule.includes(id)) {
					rulesContainingIds.push(rule)
				}
			})
		})
		return rulesContainingIds
	}

	const concernedRules = getAllConcernedRules(allRules, ids)

	// 3 we calculate all the remaining options after we eliminated the other variants
	// so we remove from all options :
	// the one sent by Vue (ids) + the other variants (elementsToCancel)
	const restOptions = notSeparated.filter(
		(el) => !elementsToCancel.includes(el) && !ids.includes(el)
	)

	// 4 for each rule that we change a bit to be able to eval()
	// for each remaining options, if it's included in the rule
	// we eval() it to see if it passes the rule or not
	function testingThroughRules(rules, options, idsToCancel) {
		const rightIds = []
		rules.forEach((rule) => {
			options.forEach((id) => {
				if (rule.includes(id)) {
					if (eval(rule)) {
						// this will allow us to indirectly disable the other options
						rightIds.push(id)
					} else {
						idsToCancel.push(id)
					}
				}
			})
		})
		// return [rightIds, idsToCancel]
		return rightIds
	}

	const rightIdsForVariant = testingThroughRules(
		concernedRules,
		restOptions,
		elementsToCancel
	)

	// 5 we target the array of components if rightIdsForVariant isn't empty
	function getConcernedVariantsIds(rightIds, separated) {
		let theOne = []
		let isUnique
		if (rightIds.length) {
			separated.forEach((sep) => {
				const yesOrNo = sep.some((el) => rightIds.includes(el))
				if (yesOrNo) {
					theOne = sep
				}
			})
			if (rightIds.length === 1) {
				isUnique = rightIds[0]
			}
		}

		return [theOne, isUnique]
	}

	const [theOne, isUnique] = getConcernedVariantsIds(
		rightIdsForVariant,
		separated
	)

	// then we filter that array to get only the ones that are not already in rightIdsForVariant
	function getUniqueIds(array1, array2) {
		return array1.filter((obj) => array2.indexOf(obj) == -1)
	}

	const indirectlyWrong = getUniqueIds(theOne, rightIdsForVariant)

	// 6 we need to check if it's the last one
	// is it an option or variant ?
	// if variant then automatically check it

	res.send({
		elementsToDesactivate: [...elementsToCancel, ...indirectlyWrong],
		isUnique,
	})
})

const port = 3000

app.listen(port, () => {
	console.log(`app listening at http://localhost:${port}`)
})
