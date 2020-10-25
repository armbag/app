const fs = require('fs')
const express = require('express')
const bodyParser = require('body-parser')

const app = express()

function readFile(path) {
	const raw = fs.readFileSync(path)
	const optionsJson = JSON.parse(raw)
	return optionsJson
}
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
	const optionsJson = readFile('availableOptions.json')
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
function getAllRulesAndOptionals() {
	const rawRules = fs.readFileSync('sampleBOM.json')
	const sampleBOM = JSON.parse(rawRules)

	const allRules = []
	const optionalIds = []
	sampleBOM.rules?.forEach((rule) => {
		allRules.push(transformToJs(rule))
	})
	sampleBOM.components?.forEach((component) => {
		if (component.option) {
			if (component.variants) {
				component.variants.forEach((v) => {
					optionalIds.push(v.id)
				})
			} else {
				optionalIds.push(component.id)
			}
		}

		component.rules?.forEach((nestedRule) => {
			allRules.push(transformToJs(nestedRule))
		})
	})
	return [allRules, optionalIds]
}
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
function getUniqueIds(array1, array2) {
	return array1.filter((obj) => array2.indexOf(obj) == -1)
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
	const optionsJson = readFile('availableOptions.json')
	res.send(optionsJson)
})

app.post('/GetConfiguredBOM', (req, res) => {
	const ids = req.body
	const [separated, notSeparated] = getAvailableOptions()
	const [allRules, optionalIds] = getAllRulesAndOptionals()

	// 1 Getting rid of the other variants
	const elementsToCancel = getRidOfOtherVariants(ids, separated)

	// 2 getting the concerned rules, which means the rules
	// that include any of the ids sent from Vue
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
	const rightIdsForVariant = testingThroughRules(
		concernedRules,
		restOptions,
		elementsToCancel
	)

	// 5 we target the array of components if rightIdsForVariant isn't empty
	const [theOne, isUnique] = getConcernedVariantsIds(
		rightIdsForVariant,
		separated
	)

	// 6 if there is a unique id remaining (isUnique)
	// then we filter that array to get only the ones that are not already in right ones
	// to desactivate them from the front-end
	const indirectlyWrong = getUniqueIds(theOne, rightIdsForVariant)

	// is it an option or variant ?
	const isOptional = optionalIds.includes(isUnique)
	const lastId = isOptional ? '' : isUnique

	res.send({
		toCancelIds: [...elementsToCancel, ...indirectlyWrong],
		lastId,
	})
})

const port = 3000

app.listen(port, () => {
	console.log(`app listening at http://localhost:${port}`)
})
