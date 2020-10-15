async function setUpDataModel() {
	// TODO for tomorrow
	// 1 Connect to the DB through the neo4j-driver
	const db = {
		boltURL: 'bolt://localhost:7687',
		name: 'Express',
		password: 'qwert',
		username: 'neo4j',
	}
	const rawRules = fs.readFileSync('sampleBOM.json')
	const sampleBOM = JSON.parse(rawRules)

	const driver = neo4j.driver(
		db.boltURL,
		neo4j.auth.basic(db.username, db.password)
	)
	const session = driver.session()

	session
		.run(
			// 2 Parse and Modelize the whole sampleBOM in neo4j
			// 3 add the relationships : options and variants
			// session
			// .run
			`CALL apoc.load.json('sampleBOM.json') YIELD value
      UNWIND value.components AS comps
      CREATE (z:CAR { name: value.name, rules: value.rules})
      FOREACH (comp IN comps |
        CREATE (:a {id: comp.id, name: comp.name, rules: comp.rules, option: comp.option}) <- [:COMPONENTS] - (product)
        )
      RETURN comps
      `

			// `CALL apoc.load.json("sampleBOM.json") YIELD value
			// UNWIND value.name AS n
			// CREATE (a:n {name: n, rules: value.rules})

			// RETURN a`
		)
		.then((result) => {
			result.records.forEach((record) => {
				console.log(record)
			})
		})
		.catch((error) => {
			console.log(error)
		})
		.then(() => session.close())
}

setUpDataModel()

app.use(async (req, res, next) => {
	const db = {
		boltURL: 'bolt://localhost:7687',
		name: 'Express',
		password: 'qwert',
		username: 'neo4j',
	}

	const raw = fs.readFileSync('sampleBOM.json')
	const rules = JSON.parse(raw)

	const driver = neo4j.driver(
		db.boltURL,
		neo4j.auth.basic(db.username, db.password)
	)
	const session = driver.session()
	session
		.run(
			`CALL apoc.load.json("sampleBOM.json") YIELD value
      UNWIND value.name AS n
      UNWIND value.rules AS r
      CREATE (a:n {name: n, rules: r})
      FOREACH (c IN value.components | CREATE (:c {id: c.id, name: c.name, rules: c.rules}))
      RETURN a`
		)
		.then((result) => {
			// console.log(result.records)
			result.records.forEach((r) => console.log(r.get('a')))
		})
		.catch((error) => {
			console.log(error)
		})
		.then(() => session.close())
	next()
})
