<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
const router = useRouter()
const maxVariables = ref('')
const maxRestricciones = ref('')
const metodo = ref('df')

const limpiar = () => {
  maxVariables.value = ''
  maxRestricciones.value = ''
}

const generarModelo = (event: Event) => {
  event.preventDefault()
  console.log(maxVariables.value)
  console.log(maxRestricciones.value)
  router.push({ name: 'Evaluation', query: { maxVariables: maxVariables.value, maxRestricciones: maxRestricciones.value, metodo: metodo.value } })
}

</script>

<template>
  <div class="bg-gradient-to-tl from-gray-950 to-gray-700 h-screen flex flex-row items-center justify-center w-full">
    <div class="bg-gray-200 w-90 h-70 rounded flex flex-col items-start justify-center">
      <form class="w-full">
        <div class="flex flex-col justify-center p-5">
          <h2>Numero de variables</h2>
          <input v-model="maxVariables" type="number" max="10" class="h-8 border border-gray-500"
            placeholder="max (10)">
          <h2>Numero de restricciones</h2>
          <input v-model="maxRestricciones" type="number" max="10" class="h-8 border border-gray-500"
            placeholder="max (10)">
          <h2>Metodo</h2>
          <select
            v-model="metodo"
            class="h-8 w-full bg-transparent placeholder:text-slate-400 text-slate-700 border border-gray-500 rounded transition duration-300 ease cursor-pointer">
            <option value="df">Dos fases</option>
            <option value="gm">Gran M</option>
          </select>
        </div>
        <div class="flex flex-row items-center justify-center">
          <button @click="generarModelo"
            class="cursor-pointer m-1 bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded">Generar
            Modelo</button>
          <button @click="limpiar"
            class="cursor-pointer m-1 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded">Limpiar</button>
        </div>
      </form>
    </div>
  </div>
</template>
