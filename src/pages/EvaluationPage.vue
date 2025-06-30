<script setup lang="ts">
import { useRoute } from "vue-router";
import type { Operacion, Restriccion } from "../types/operacion";
import { MetodoGranM } from "../types/metodoGranM";
import type { TablasIteracion } from "../types/tablasIteracion";
import { ref, computed, reactive } from "vue";
import { MetodoDosFases } from "../types/MetodoDosFases/metododosfases";
import { Polinomio } from "../types/polinomio";
const query = useRoute().query;
const maxVariables = query.maxVariables as unknown as number;
const maxRestricciones = query.maxRestricciones as unknown as number;
const metodo = query.metodo as unknown as string;

const operacion = reactive<Operacion>({
  variables: Array.from(Array(+maxVariables).keys()).map((x) => x * 0),
  restricciones: generarRestricciones(),
});
const objetivo = ref("max");
const tablasDeIteraciones = ref<TablasIteracion>(
  {
    iteraciones: [],
    variablesColumna: [],
    variablesFila: [],
  }
);
const funcionPenalizada = ref<Polinomio|undefined>(undefined)
const funcionObjetivos = ref<Polinomio[]>([]);

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
  if (metodo == "df") {
    resolverDosFases();
    return;
  }
  if (metodo == "gm") {
    resolverGranM();
    return;
  }
}

const existeTodosMenoresIguales = computed(() => {
  return operacion.restricciones.every((restriccion) => restriccion.operador === "mni");
});

function resolverDosFases() {
  const metodoDosFases = new MetodoDosFases(operacion, objetivo.value);
  metodoDosFases.segundaFase();
  tablasDeIteraciones.value = metodoDosFases.obtenerTabladeIteraciones();
}

function resolverGranM() {
  const metodoGranM = new MetodoGranM(operacion, objetivo.value);
  metodoGranM.resolver();
  funcionPenalizada.value = metodoGranM.getFunctionPenalizada();
  funcionObjetivos.value = metodoGranM.getFuncionesObjetivos();
  tablasDeIteraciones.value = metodoGranM.obtenerTabladeIteraciones();
  console.log(tablasDeIteraciones.value);
}
</script>
<template>
  <div
    class="overflow-y-scroll p-10 bg-gradient-to-tl from-gray-400 to-gray-200 flex flex-col items-start w-screen h-full rounded"
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
    <div class="flex flex-col" v-for="restriccion in operacion.restricciones" v-bind:key="restriccion.operador">
      <div class="flex flex-row p-2">
        <div class="flex flex-row" v-for="(y, index2) in restriccion.variables" v-bind:key="index2">
          <h2 class="pr-1 text-xl" v-if="index2 != 0">+</h2>
          <input
            v-model="restriccion.variables[index2]"
            type="number"
            class="text-center rounded w-10 h-8 border border-gray-500"
          />
          <h2 class="pl-1 text-xl">x{{ index2 + 1 }}</h2>
        </div>
        <select
          v-model="restriccion.operador"
          class="mr-2 ml-2 h-8 w-full bg-transparent placeholder:text-slate-400 text-slate-700 border border-gray-500 rounded transition duration-300 ease cursor-pointer"
        >
          <option value="mni"><=</option>
          <option value="myi">>=</option>
          <option value="i">=</option>
        </select>
        <input
          class="text-center rounded w-10 h-8 border border-gray-500"
          v-model="restriccion.resultado"
          type="number"
        />
      </div>
    </div>
    <p class="text-2xl"><span v-for="(x, index) in operacion.variables" v-bind:key="x">x{{ index + 1 }}{{ index != operacion.variables.length - 1 ? "," : "" }}</span> > 0</p>
    <h2>Objetivo</h2>
    <select
      v-model="objetivo"
      class="h-8 w-full bg-transparent placeholder:text-slate-400 text-slate-700 border border-gray-500 rounded transition duration-300 ease cursor-pointer"
    >
      <option value="max">Maximizar</option>
      <option value="min">Minimizar</option>
    </select>
    <div v-if="existeTodosMenoresIguales" class="text-red-500"> Son todos menores o iguales, no puede ser resuelto por granM o dos fases</div>
    <div class="flex flex-row items-center justify-center">
      <button :disabled="existeTodosMenoresIguales"
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

  <section class="bg-white py-20 lg:py-[120px] dark:bg-dark">
    <div class="container mx-auto">
      <div class="-mx-4 flex flex-wrap">
        <div class="w-full px-4">
          <div class="flex flex-col max-w-full overflow-x-auto mb-10" v-if="metodo == 'gm' && funcionPenalizada">
            <div class=" flex flex-col items-start justify-center">
              <h2 class="text-2xl font-bold">Funcion Penalizada</h2>
              <p class="text-2xl ml-4">{{ funcionPenalizada.toStringPrincipal() }}</p>
            </div>
            <div class="flex flex-col items-start justify-center">
              <h2 class="text-2xl font-bold">Funcion Objetivo</h2>
              <p class="text-2xl ml-4" v-for="funcionObjetivo in funcionObjetivos">
                {{ funcionObjetivo.toStringPrincipal(true) }}
              </p>
            </div>
          </div>
          <div class="max-w-full overflow-x-auto mb-10" v-for="iteracion in tablasDeIteraciones.iteraciones" v-bind:key="iteracion.numeroIteracion">
            <div class="flex flex-col">
            <div class="flex flex-col max-w-full overflow-x-auto mb-10" v-if="metodo == 'df' && iteracion.funcionPenalizada">
              <div class=" flex flex-col items-start justify-center">
                <h2 class="text-2xl font-bold">Funcion Penalizada</h2>
                <p class="text-2xl ml-4">{{ iteracion.funcionPenalizada.toStringPrincipal() }}</p>
              </div>
              <div class="flex flex-col items-start justify-center" v-if="iteracion.functionObjetivos && iteracion.functionObjetivos.length > 0">
                <h2 class="text-2xl font-bold">Funcion Objetivo</h2>
                <p class="text-2xl ml-4" v-for="funcionObjetivo in iteracion.functionObjetivos">
                  {{ funcionObjetivo.toStringPrincipal(true) }}
                </p>
              </div>
            </div>
            <div class="flex flex-row max-w-full overflow-x-auto mb-10">
              <div class="w-1/12 flex flex-col items-center justify-center">
                <div class="p-7"></div>
                <div class="p-7" v-for="variableEntrada in tablasDeIteraciones.variablesFila">{{ variableEntrada }}</div>
              </div>
              <table class="w-1/12 table-auto">
                <thead>
                  <tr class="bg-primary text-center">
                    <th
                      v-if="metodo == 'gm'"
                      class="w-1/6 min-w-[160px] border-l border-transparent px-3 py-4 text-lg font-medium lg:px-4 lg:py-7"
                    >
                      Iteracion {{ iteracion.numeroIteracion }}
                    </th>
                    <th
                      v-if="metodo == 'df'"
                      class="w-1/6 min-w-[160px] border-l border-transparent px-3 py-4 text-lg font-medium lg:px-4 lg:py-7"
                    >
                      Fase {{ iteracion.numeroIteracion }}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr></tr>
                  <tr v-if="metodo == 'gm'">
                    <td
                      class="text-white bg-blue-400 px-2 py-5 text-center"
                    >
                    </td>
                  </tr>
                  <tr v-for="variableEntrada in iteracion.variablesEntrada">
                    
                    <td
                      class="text-white bg-blue-400 px-2 py-5 text-center font-medium"
                    >
                      {{ variableEntrada }}
                    </td>
                  </tr>
      
                </tbody>
              </table>

              <table class="w-3/4 table-fixed">
                <thead>
                  <tr class="bg-primary text-center">
                    <th
                      v-if="metodo == 'gm'"
                      v-for="variableColumna in tablasDeIteraciones.variablesColumna"
                      class="w-1/6 min-w-[160px] border-l border-transparent px-3 py-4 text-lg font-medium text-white lg:px-4 lg:py-7 bg-blue-400"
                    >
                      {{variableColumna}}
                    </th>
                    <th
                      v-if="metodo == 'df'"
                      v-for="variableColumna in iteracion.variablesColumna"
                      class="w-1/6 min-w-[160px] border-l border-transparent px-3 py-4 text-lg font-medium text-white lg:px-4 lg:py-7 bg-blue-400"
                    >
                      {{variableColumna}}
                    </th>
                    
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(filas, index) in iteracion.matriz">
                    <td
                      v-for="(columna, index2) in filas"
                      class="border-b border-l border-[#E8E8E8] px-2 py-5 text-center text-base font-medium" v-bind:class="{'bg-yellow-400': (index2 == iteracion.columnaPivote && index == iteracion.filaPivote && iteracion.filaPivote != 0)}"
                    >
                      {{ typeof columna == 'number' ? parseFloat(columna.toFixed(5)) : columna }}
                    </td>
                    
                  </tr>
                </tbody>
              </table>
            </div>
            </div>
          </div>
          <div v-if="tablasDeIteraciones.mensaje" class="flex flex-row max-w-full overflow-x-auto mb-10 text-center">
            <h2 class="text-2xl font-bold">{{ tablasDeIteraciones.mensaje }}</h2>
          </div>
          
        </div>
      </div>
      
    </div>
  </section>
</template>
