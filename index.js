const fs = require('fs')
const express = require('express')
const app = express()

// app.get('/', (req, res) => {
// 	res.send('HOMEPAGE')
// })

app.use('/getOptions', (req, res) => {
	// TODO : GetOptions endpoint
	// ■ It doesn’t take inputs
	// ■ It reads the content of the json file
	// ■ It returns all the available options grouped
	// Example is availableOptions.json

	console.log('\n *STARTING* \n')
	// Get content from file
	const raw = fs.readFileSync('availableOptions.json')
	const dataOptions = JSON.parse(raw)
	res.send(dataOptions)
	// TODO dataOptions are all the options available, now we need to send it to the client
})

app.post('/GetConfiguredBOM', (req, res) => {
	// TODO : GetConfiguredBOM
	//   ● It takes as an input a list of part numbers
	// Ex: [“pn004”,”tou001”]
	// ● It returns a json similar to the sample but with forbidden elements filtered.
	// If you provide [“pn004”,”tou001”] as an input, it should return the file
	// resolvedSample.json
	res.send('GetConfiguredBOM')
})

const port = 3000

app.listen(port, () => {
	console.log(`app listening at http://localhost:${port}`)
})
