import type { Operacion, Restriccion } from "./operacion";
import { Polinomio } from "./polinomio";
import { Monomio } from "./monomio";
import type { TablasIteracion } from "./tablasIteracion";
import type { Iteracion } from "./iteracion";
export class MetodoGranM {
  protected funcionPenalizada: Polinomio = new Polinomio('W', 1);
  protected funcionesObjetivos: Map<string, Polinomio> = new Map();
  protected tablasIteracion: TablasIteracion;
  // {
  //   't1': [result] = [.,..,].
  //   't2': [result] = [.,..,],
  // }
  constructor(
    protected operacion: Operacion,
    protected objetivo: string = "max"
  ) {
    this.tablasIteracion = {
      iteraciones: [],
      variablesColumna: [],
      variablesFila: [],
    }
    this.procesarDatosIniciales();
  }

  private procesarDatosIniciales() {
    this.operacion.variables.forEach((variable, index) => {
      this.funcionPenalizada.agregarMonomio(
        new Monomio(variable, `x${index + 1}`)
      );
    });
    this.operacion.restricciones.forEach((restriccion: Restriccion, index) => {
      this.funcionesObjetivos.set(`f${index}`, new Polinomio(undefined, restriccion.resultado));
      restriccion.variables.forEach((variable, index2) => {
        this.funcionesObjetivos
          .get(`f${index}`)
          ?.agregarMonomio(new Monomio(variable, `x${index2 + 1}`));
      });
      if (restriccion.operador == "mni") {
        this.funcionesObjetivos
          .get(`f${index}`)
          ?.agregarMonomio(new Monomio(1, "S" + (index + 1)));
        this.funcionPenalizada.agregarMonomio(
          new Monomio(0, "S" + (index + 1))
        );
      }
      if (restriccion.operador == "myi") {
        this.funcionesObjetivos
          .get(`f${index}`)
          ?.agregarMonomio(new Monomio(-1, "e" + (index + 1)));
        this.funcionesObjetivos
          .get(`f${index}`)
          ?.agregarMonomio(new Monomio(1, "a" + (index + 1)));
        this.funcionPenalizada.agregarMonomio(
          new Monomio(0, "e" + (index + 1))
        );
        this.funcionPenalizada.agregarMonomio(
          new Monomio(this.objetivo == "max" ? -1 : 1, "a" + (index + 1), true)
        );
      }

      if (restriccion.operador == "i") {
        this.funcionesObjetivos
          .get(`f${index}`)
          ?.agregarMonomio(new Monomio(1, "a" + (index + 1)));
        this.funcionPenalizada.agregarMonomio(
          new Monomio(this.objetivo == "max" ? -1 : 1, "a" + (index + 1), true)
        );
      }
    });
    if (this.objetivo != "max") {
      this.funcionPenalizada.multiplicarPorNegativo();
    }
    this.funcionPenalizada.moverMonomioAPrincipal();
  }


  generarResultadoDeMatrizRegionZ(): Polinomio[] {
    const matrizZ: Polinomio[][] = [];
    const primeraFila: Polinomio[] = [];
    const variablesDisponibles: string[] = this.funcionPenalizada.obtenerVariablesDisponibles();
    for (const monomio of this.funcionPenalizada.principalMonomios) {
      const polinomio = new Polinomio();
      polinomio.agregarMonomio(new Monomio(monomio.getCoeficiente(), monomio.getIsM() ? 'M' : undefined));
      primeraFila.push(polinomio);
    }
    
    const polinomio = new Polinomio();
    polinomio.agregarMonomio(new Monomio(0));
    primeraFila.push(polinomio);
    matrizZ.push(primeraFila);

    this.funcionesObjetivos.forEach(function (polinomio: Polinomio) {
      const mapaVariables: Map<string, Polinomio> = new Map();
      const numeroM = polinomio.existeVariable('a') ? -1 : 1;
      variablesDisponibles.forEach((variable: string) => {
        const polinomioAux = new Polinomio();
        polinomioAux.agregarMonomio(new Monomio(0, numeroM == -1 ? 'M' : undefined));
        mapaVariables.set(variable, polinomioAux);
      });
      for (const monomio of polinomio.monomios) {
        const polinomioAux = new Polinomio();
        polinomioAux.agregarMonomio(new Monomio(monomio.getCoeficiente() * numeroM, numeroM == -1 ? 'M' : undefined));
        mapaVariables.set(monomio.getVariable()!, polinomioAux);
      }
      const polinomioAux = new Polinomio();
      polinomioAux.agregarMonomio(new Monomio(polinomio.principalMonomios[0].getCoeficiente() * numeroM, numeroM == -1 ? 'M' : undefined));
      mapaVariables.set('', polinomioAux);
      matrizZ.push(Array.from(mapaVariables.values()));
    });
    // matrizZ
    // [
    //   [Polinomio, Polinomio, Polinomio, ...],
    //   [Polinomio, Polinomio, Polinomio, ...],
    //   [Polinomio, Polinomio, Polinomio, ...],
    // ]

    const resultado: Map<string, Polinomio> = new Map();

    for (let i = 1; i < matrizZ.length; i++) {
      const firstPolinomio: Polinomio | undefined = matrizZ[i][0] ?? undefined;
      if (firstPolinomio && !firstPolinomio.existeVariable('M')) {
        continue;
      }
      for (let j = 0; j < matrizZ[i].length; j++) {
        if (!resultado.has(`id-${j}`)) {
          resultado.set(`id-${j}`, matrizZ[i][j]);
        } else {
          const actualPolinomio: Polinomio | undefined = resultado.get(`id-${j}`);
          if (actualPolinomio) {
            actualPolinomio.sumarPolinomio(matrizZ[i][j]);
            resultado.set(`id-${j}`, actualPolinomio);
          }
        }
      }
    }

    if (matrizZ.length > 0) {
      const primeraFila: Polinomio[] = matrizZ[0];
      for (let i = 0; i < primeraFila.length - 1; i++) {
        const actualPolinomio: Polinomio | undefined = resultado.get(`id-${i}`);
        if (actualPolinomio) {
          actualPolinomio.sumarPolinomio(primeraFila[i]);
          resultado.set(`id-${i}`, actualPolinomio);
        }
      }
    }
    return Array.from(resultado.values());
  }



  masNegativo(polinomios: Polinomio[]): number | undefined{

    let menor = polinomios[1].evaluar(1000);
    let pos = 1;
    for (let i = 2; i < polinomios.length-1; i++)
   {
      const actual = polinomios[i].evaluar(1000);
       if(menor > actual)
       {
          pos = i;
          menor = actual;
       }
    }
      return (menor < 0) ? pos : undefined; // le pongo esto por si ya no hay polinomios negativos  
  }

  encuentraPivote(matriz: number[][],columna: number): number{
    
    const division = new Map<number, number>();
    
    for (let i = 0; i < matriz.length; i++) // este for la division para encontra el mas positivo y la posicion del pivote
    {
      const numerador = matriz[i][matriz[i].length-1];
      const denominador = matriz[i][columna];
      if(denominador !== 0)
      {
        division.set(i, numerador / denominador);
      }      
    }   

    const filtroPositivos = new Map(Array.from(division).filter(x => x[1] > 0)); // filtara los numeros positivos usando un artificio de array
    const llavePrimera = filtroPositivos.keys().next().value!;

    let menor = filtroPositivos.get(llavePrimera);
    let posicion = llavePrimera;

    

    for (const[pos, valor] of filtroPositivos) // solo usamos los valores positivos
    {
      const actual = valor;
      if(menor! > actual)
      {
        menor = actual;
        posicion = pos;
      }
    }
    return posicion;
  }

  existeNegativo(polinomios: Polinomio[]): boolean{
    const pos = this.masNegativo(polinomios);
    return pos !== undefined;
  }

  dividirConElementoPivote(matrizInicial: number[][], pivote: number, columna: number): void
  {
    const elementoPivote = matrizInicial[pivote][columna];
    for(let i = 0; i < matrizInicial[pivote].length; i++)
    {
      const elemento = matrizInicial[pivote][i];
      matrizInicial[pivote][i] = elemento / elementoPivote;
    }
  }

  filasAOperar(matriz: number[][], columna: number) : number[]
  {
    const filas: number[] = [];
    const pivote = this.encuentraPivote(matriz, columna);
    
    for (let i = 0; i < matriz.length; i++) // este for la division para encontra el mas positivo y la posicion del pivote
    {
      const elemento = matriz[i][columna];
      if(elemento !== 0)
      {
        filas.push(i);
      }      
    }
    return filas.filter(x => x !== pivote);
  }

  operacionesfilasConPivote(matriz: number[][], pivote: number, columnaPivote: number, filaACambiar: number): void
  {
    const elemento = (matriz[filaACambiar][columnaPivote])*-1;
    for(let i = 0; i < matriz[filaACambiar].length; i++)
    {
      const elementoFilaRe = matriz[filaACambiar][i];
      const reglonPivote = matriz[pivote][i];
      matriz[filaACambiar][i] = (elemento*reglonPivote) + elementoFilaRe;
    }
  }

  operacionFilaPolinomios(polinomios: Polinomio[], matriz: number[][], pivote: number, columnaPivote: number): void
  {
    const elemento: Polinomio = polinomios[columnaPivote].clonar(); // evita la mutabilidad del objeto
    elemento.multiplicar(-1); // se mantiene el valor
    for(let i = 0; i < polinomios.length; i++)
    {
      let resultado: Polinomio = elemento.clonar();
      resultado.multiplicar(matriz[pivote][i]); 
      resultado.sumarPolinomio(polinomios[i]);     
      polinomios[i] = resultado;
      
    }
  }


  obtenerVariablesDeEntrada(): String[]
  {
    const variablesDeEntrada: string[] = [];
    for(const  [_, polinomio] of this.funcionesObjetivos)
    {
      variablesDeEntrada.push(polinomio.obtenerUltimoMonomio().getVariable()||'');
    }
    return variablesDeEntrada;
  }
  resolver(): void {
    const resultadoMatrizZ: Polinomio[] = this.generarResultadoDeMatrizRegionZ();
    const variablesDisponibles: string[] = this.funcionPenalizada.obtenerVariablesDisponibles();
    variablesDisponibles.pop();
    let variablesEncontradas = this.obtenerVariablesDeEntrada();// son las variables de entrada
    

    const matrizInicial: number[][] = this.obtenerMatrizInicial(variablesDisponibles);
    this.tablasIteracion.variablesColumna = variablesDisponibles;
    this.tablasIteracion.variablesColumna.push('RHS');
    this.tablasIteracion.variablesFila = this.obtenerVariablesFila(matrizInicial.length + 1);
    let numeroIteraciones = 0;
    while (this.existeNegativo(resultadoMatrizZ))
      {
      const columnaPivote = this.masNegativo(resultadoMatrizZ); // encuentra la columna del elemento mas negativo
      const pivote = this.encuentraPivote(matrizInicial, columnaPivote!); // encuentra el pivote osea la fila
      if(pivote === undefined) // por si no encuentra pivote
      {
        break;
      }
      
      const iteracion: Iteracion = {
        numeroIteracion: numeroIteraciones,
        columnaPivote: columnaPivote!,
        filaPivote: pivote + 1,
        matriz: [this.clonarPolinomios(resultadoMatrizZ),...JSON.parse(JSON.stringify(matrizInicial))],
        variablesEntrada: [...variablesEncontradas]
      }
      this.tablasIteracion.iteraciones.push(iteracion);


      this.dividirConElementoPivote(matrizInicial, pivote, columnaPivote!); // aqui dividimos el pivote con todos los demas elementos
      const entrada = variablesDisponibles[columnaPivote!];
      variablesEncontradas[pivote] = entrada;

      const filas = this.filasAOperar(matrizInicial, columnaPivote!); // aqui obtenemos las filas que son diferentes de cero para poder operarlas
      
      for (const fila of filas) // hace las operaciones con las filas para cambiarlas
      {
        
        this.operacionesfilasConPivote(matrizInicial, pivote, columnaPivote!, fila); // aqui se hacen las operaciones con this.operacionesfilasConPivote
      } 
      
      this.operacionFilaPolinomios(resultadoMatrizZ, matrizInicial, pivote, columnaPivote!);
      numeroIteraciones++;
    }
      const iteracion: Iteracion = {
        numeroIteracion: numeroIteraciones,
        columnaPivote: 0,
        filaPivote: 0,
        matriz: [this.clonarPolinomios(resultadoMatrizZ),...JSON.parse(JSON.stringify(matrizInicial))],
        variablesEntrada: [...variablesEncontradas]
      }
      this.tablasIteracion.iteraciones.push(iteracion);
    
/*     console.log(variablesEncontradas);
    
    for(let i = 0; i < variablesEncontradas.length; i++)
    {
      console.log(variablesEncontradas[i] + " = " + matrizInicial[i][matrizInicial[i].length-1]);
    }
    //console.log(matrizInicial);
    //console.log(resultadoMatrizZ); */
  } 

  private obtenerMatrizInicial(variablesDisponibles: string[]): number[][] {
    const matrizInicial: number[][] = [];
    this.funcionesObjetivos.forEach(function (polinomio: Polinomio) {
      const mapaVariables: Map<string, number> = new Map();

      variablesDisponibles.forEach((variable: string) => {
        mapaVariables.set(variable, 0);
      });

      for (const monomio of polinomio.monomios) {
        mapaVariables.set(monomio.getVariable()!, monomio.getCoeficiente());
      }

      mapaVariables.set(polinomio.principalMonomios[0].getVariable()!, polinomio.principalMonomios[0].getCoeficiente());
      matrizInicial.push(Array.from(mapaVariables.values()));
    });
    return matrizInicial;
  }

  private obtenerVariablesFila(numFilas: number): string[] {
    const variablesFila: string[] = [];
    for (let i = 0; i < numFilas; i++) {
      variablesFila.push("R" + i);
    }
    return variablesFila;
  }

  private clonarPolinomios(polinomios: Polinomio[]): Polinomio[] {
    const clones: Polinomio[] = [];
    for (const polinomio of polinomios) {
      clones.push(polinomio.clonar());
    }
    return clones;
  }

  obtenerTabladeIteraciones(): TablasIteracion {
    return this.tablasIteracion;
  }
}
