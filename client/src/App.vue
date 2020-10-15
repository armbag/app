<template>
	<h2>Hello Ganister</h2>
	<ul v-for="option in options" :key="option.id">
		<input
			type="checkbox"
			v-if="option.name"
			:id="option.id"
			v-model="checked"
			@click="sendInputs(option.id)"
		/>
		<label :for="option.id"
			>{{ option.name || Object.keys(option)[0] }}
			{{ option.name ? `(${option.id})` : '' }}</label
		>
		<div v-if="!option.name">
			<ul v-for="opt in option" :key="opt.length">
				<div v-for="o in opt" :key="o.id">
					<input
						type="checkbox"
						:id="o.id"
						@click="sendInputs(o.id)"
						v-model="checked"
					/>
					<label :for="o.id">{{ o.name }} ({{ o.id }})</label>
				</div>
			</ul>
		</div>
	</ul>
	<br />
	<br />
	<br />
</template>

<script>
	import { ref, onMounted } from 'vue'

	export default {
		setup() {
			const newToDo = ref('')
			const toDos = ref([])
			const options = ref([])
			const checkedItems = ref([])

			async function fetchOptions() {
				const endpoint = 'http://localhost:3000/getOptions'
				options.value = await fetch(endpoint, {
					headers: {
						'Content-Type': 'application/json',
					},
				}).then((raw) => raw.json())
			}

			onMounted(() => {
				fetchOptions()
			})

			async function sendInputs(id) {
				if (!checkedItems.value.includes(id)) {
					checkedItems.value.push(id)
				} else {
					checkedItems.value = checkedItems.value.filter((i) => i !== id)
				}
				const endpoint2 = 'http://localhost:3000/getConfiguredBOM'
				fetch(endpoint2, {
					method: 'POST',
					body: JSON.stringify(checkedItems.value),
					headers: {
						'Content-Type': 'application/json',
					},
				})
					.then((raw) => raw.json())
					.then((data) => console.log(data))
				console.log(checkedItems.value)
			}

			function addNewToDo() {
				toDos.value.push({
					id: Date.now(),
					done: false,
					content: newToDo.value,
				})
				newToDo.value = ''
			}

			function toggleDone(toDo) {
				toDo.done = !toDo.done
			}

			function removeToDo(index) {
				toDos.value.splice(index, 1)
			}

			function markThemAll() {
				toDos.value.map((toDo) => (toDo.done = true))
			}
			return {
				toDos,
				newToDo,
				addNewToDo,
				toggleDone,
				removeToDo,
				markThemAll,
				options,
				sendInputs,
			}
		},
	}
</script>

<style>
	#app {
		font-family: Avenir, Helvetica, Arial, sans-serif;
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
		color: #2c3e50;
		margin-top: 60px;
		width: 300px;
		margin: 0 auto;
	}

	.notavailable {
		text-decoration: line-through;
	}

	.container {
	}

	.category {
		display: flex;
		flex-direction: column;
		border: 2px solid black;
		background-color: aliceblue;
		margin: 5px;
	}
</style>
