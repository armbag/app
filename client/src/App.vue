<template>
	<h2>Hello Ganister</h2>
	<ul v-for="option in options" :key="option.id">
		<input
			type="checkbox"
			v-if="option.name"
			:id="option.id"
			:checked="option.id === isUnique"
			:disabled="checkIfDisable(option.id)"
			@click="sendInputs(option.id)"
		/>
		<label :for="option.id" :class="checkIfDisable(option.id) ? 'off' : ''"
			>{{ option.name || Object.keys(option)[0] }}
			{{ option.name ? `(${option.id})` : '' }}</label
		>
		<div v-if="!option.name">
			<ul v-for="opt in option" :key="opt.length">
				<div v-for="o in opt" :key="o.id">
					<input
						type="checkbox"
						:id="o.id"
						:checked="o.id === isUnique"
						@click="sendInputs(o.id)"
						:disabled="checkIfDisable(o.id)"
					/>
					<label :for="o.id" :class="checkIfDisable(o.id) ? 'off' : ''"
						>{{ o.name }} ({{ o.id }})</label
					>
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
			const options = ref([])
			const checkedItems = ref([])
			const idsToDesactivate = ref([])
			const isUnique = ref([])

			async function fetchOptions() {
				const endpoint = 'http://localhost:3000/getOptions'
				options.value = await fetch(endpoint, {
					headers: {
						'Content-Type': 'application/json',
					},
				}).then((raw) => raw.json())
				options.value.forEach((o) => console.log(o))
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
					.then((data) => {
						console.log(data.elementsToDesactivate)
						console.log(data.isUnique)
						idsToDesactivate.value = data.elementsToDesactivate
						isUnique.value = data.isUnique
					})
				console.log(checkedItems.value)
			}

			function checkIfDisable(id) {
				const res = idsToDesactivate.value.includes(id)
				return res
			}

			return {
				options,
				sendInputs,
				idsToDesactivate,
				checkIfDisable,
				isUnique,
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

	h2 {
		text-align: center;
	}

	input[type='checkbox'][disabled] {
		border: aqua;
	}

	.off {
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
