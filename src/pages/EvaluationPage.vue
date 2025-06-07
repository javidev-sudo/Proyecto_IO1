<script setup lang="ts">
import { useRoute } from "vue-router";
import type { Operacion, Restriccion } from "../types/operacion";
import { MetodoGranM } from "../types/metodoGranM";
import { ref } from "vue";
import type { Polinomio } from "../types/polinomio";
const query = useRoute().query;
const maxVariables = query.maxVariables as unknown as number;
const maxRestricciones = query.maxRestricciones as unknown as number;
const metodo = query.metodo as unknown as string;

const operacion: Operacion = {
  variables: Array.from(Array(+maxVariables).keys()).map((x) => x * 0),
  restricciones: generarRestricciones(),
};
const objetivo = ref('max');

function generarRestricciones(): Restriccion[] {
  const restricciones: Restriccion[] = [];
  for (let i = 0; i < +maxRestricciones; i++) {
    restricciones.push({
      variables: Array.from(Array(+maxVariables).keys()).map((x) => x * 0),
      operador: "mni",
      resultado: 0,
    });
  }
  return restricciones;
}

function resolver() {
 
    if (metodo == 'df') {
        resolverDosFases()
        return
    }
    if (metodo == 'gm') {
        resolverGranM()
        return
    }
}

function resolverDosFases() {
   
}

function resolverGranM() {
  //  const data: Operacion = {
  //   variables: [1, 3],
  //   restricciones: [
  //     {
  //       variables: [1, 2],
  //       operador: "myi",
  //       resultado: 8,
  //     },
  //     {
  //       variables: [3, 1],
  //       operador: "mni",
  //       resultado: 7,
  //     },
  //     {
  //       variables: [1, -1],
  //       operador: "i",
  //       resultado: 2,
  //     }

  //   ]
  //  }
  //     console.log(data);
  //   const metodoGranM = new MetodoGranM(data, objetivo.value);
    const metodoGranM = new MetodoGranM(operacion, objetivo.value);
    const resultados: Polinomio[] = metodoGranM.generarResultadoDeMatrizRegionZ();
    console.log(resultados);
    for (const resultado of resultados) {
      console.log(resultado.toString());
    }
    metodoGranM.resolver();
}
</script>
<template>
  <div
    class="p-10 bg-gradient-to-tl from-gray-500 to-gray-200 h-1/2 flex flex-col items-start w-full"
  >
    <h2>Funcion Objetivo</h2>
    <div class="flex flex-row">
      <div class="flex flex-row p-2" v-for="(x, index) in operacion.variables">
        <h2 class="pr-1 text-xl" v-if="index != 0">+</h2>
        <input
          v-model="operacion.variables[index]"
          type="number"
          class="text-center rounded w-10 h-8 border border-gray-500"
        />
        <h2 class="pl-1 text-xl">x{{ index + 1 }}</h2>
      </div>
    </div>

    <h2>Restricciones</h2>
    <div class="flex flex-col" v-for="restriccion in operacion.restricciones">
      <div class="flex flex-row p-2">
        <div class="flex flex-row" v-for="(y, index2) in restriccion.variables">
          <h2
            class="pr-1 text-xl"
            v-if="index2 != 0"
          >
            +
          </h2>
          <input
            v-model="restriccion.variables[index2]"
            type="number"
            class="text-center rounded w-10 h-8 border border-gray-500"
          />
          <h2
            class="pl-1 text-xl"
          >
            x{{ index2 + 1 }}
          </h2>
        </div>
        <select
          v-model="restriccion.operador"
          class="mr-2 ml-2 h-8 w-full bg-transparent placeholder:text-slate-400 text-slate-700 border border-gray-500 rounded transition duration-300 ease cursor-pointer"
        >
          <option value="mni"><=</option>
          <option value="myi">>=</option>
          <option value="i">=</option>
        </select>
        <input class="text-center rounded w-10 h-8 border border-gray-500" v-model="restriccion.resultado" type="number" />
      </div>
    </div>
    <h2>Objetivo</h2>
    <select
      v-model="objetivo"
      class="h-8 w-full bg-transparent placeholder:text-slate-400 text-slate-700 border border-gray-500 rounded transition duration-300 ease cursor-pointer"
    >
      <option value="max">Maximizar</option>
      <option value="min">Minimizar</option>
    </select>
    <div class="flex flex-row items-center justify-center">
      <button
        @click="resolver"
        class="cursor-pointer m-1 bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded"
      >
        Resolver
      </button>
      <button
        class="cursor-pointer m-1 bg-gray-600 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded"
      >
        Limpiar
      </button>
    </div>
  </div>

</template>
