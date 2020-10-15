const fs = require('fs')
const express = require('express')
const bodyParser = require('body-parser')
const neo4j = require('neo4j-driver')

const app = express()

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
	// console.log(req.body)
	const rawRules = fs.readFileSync('sampleBOM.json')
	const sampleBOM = JSON.parse(rawRules)
	// TODO :
	// 1 look into the DB to send back only the remaining possibilities
	// 2 interrogate the DB if it breaks any rules
	if (sampleBOM.rules) {
		sampleBOM.rules.forEach((r) => console.log(r))
		// TODO Does it pass the rules ?
		// checkIfOk()
		if (sampleBOM.components) {
			sampleBOM.components.forEach((component) => {
				if (component.rules) {
					component.rules.forEach((r) => console.log(r))
				}
			})
		}
	}
	res.send({ receivedValue: [...req.body] })
})

const port = 3000

app.listen(port, () => {
	console.log(`app listening at http://localhost:${port}`)
})
