import type { Operacion, Restriccion } from "./operacion";
import { Polinomio } from "./polinomio";
import { Monomio } from "./monomio";
import type { TablasIteracion } from "./tablasIteracion";
import type { Iteracion } from "./iteracion";
export class MetodoGranM {
  protected funcionPenalizada: Polinomio = new Polinomio('W', 1); // -W + X1 +X2 = -X1 -X2 + 0E ....
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

  public getFunctionPenalizada(): Polinomio {
    return this.funcionPenalizada;
  }

  public getFuncionesObjetivos(): Polinomio[] {
    return Array.from(this.funcionesObjetivos.values());
  }

  // aqui procesamos los datos iniciales como ser la funcion penalizada y las funciones objetivos
  private procesarDatosIniciales() {
    this.operacion.variables.forEach((variable, index) => { // aqui recorremos las variables y las metemos en la funcion penalizada como monomios
      this.funcionPenalizada.agregarMonomio(
        new Monomio(variable, `x${index + 1}`)
      );
    });
    this.operacion.restricciones.forEach((restriccion: Restriccion, index) => { // aqui recorremos las restricciones
      this.funcionesObjetivos.set(`f${index}`, new Polinomio(undefined, restriccion.resultado)); // aqui solo creamos el polinomio para cada restriccion
      restriccion.variables.forEach((variable, index2) => { // aqui recorremos las variables de las restricciones y las metemos en el polinomio dependiendo que llave es
        this.funcionesObjetivos
          .get(`f${index}`)
          ?.agregarMonomio(new Monomio(variable, `x${index2 + 1}`));
      });
      // aqui preguntamos que tipo de restriccion es para aumentar la funcion objetivo y la funcion penalizada

      if (restriccion.operador == "mni") { // si es menor igual
        this.funcionesObjetivos            // agregamos el monomio a la funcion objetivo
          .get(`f${index}`)
          ?.agregarMonomio(new Monomio(1, "S" + (index + 1)));
        this.funcionPenalizada.agregarMonomio(  // agregamos el monomio a la funcion penalizada
          new Monomio(0, "S" + (index + 1))
        );
      }
      if (restriccion.operador == "myi") { // si es mayor igual
        this.funcionesObjetivos            // agregamos el monomio como variable de exceso a la funcion objetivo
          .get(`f${index}`)
          ?.agregarMonomio(new Monomio(-1, "e" + (index + 1)));
        this.funcionesObjetivos            // agregamos el monomio como variable artificial a la funcion objetivo
          .get(`f${index}`)
          ?.agregarMonomio(new Monomio(1, "a" + (index + 1)));
        this.funcionPenalizada.agregarMonomio(
          new Monomio(0, "e" + (index + 1))
        );
        this.funcionPenalizada.agregarMonomio(   // aqui agregamos el monomio a la funcion penalizada dependiendo si es maximizar o minimizar
          new Monomio(this.objetivo == "max" ? -1 : 1, "a" + (index + 1), true)
        );
      }

      if (restriccion.operador == "i") { // si es igual
        this.funcionesObjetivos          // agregamos el monomio como variable artificial a la funcion objetivo
          .get(`f${index}`)
          ?.agregarMonomio(new Monomio(1, "a" + (index + 1)));
        this.funcionPenalizada.agregarMonomio(      // aqui agregamos el monomio a la funcion penalizada dependiendo si es maximizar o minimizar
          new Monomio(this.objetivo == "max" ? -1 : 1, "a" + (index + 1), true)
        );
      }
    });
    if (this.objetivo != "max") { // preguntamos si es minimizar
      this.funcionPenalizada.multiplicarPorNegativo(); // si es minimizar lo multiplicamos por -1 la funcion penalizada
    }
    this.funcionPenalizada.moverMonomioAPrincipal();   // movemos el monomio principal a la funcion penalizada osea estamos despejando
  }

  // en esta parte de trabaja con la region Z, donde tenemos que multiplicar por -m y sumar al reglon R0
  generarResultadoDeMatrizRegionZ(): Polinomio[] {
    const matrizZ: Polinomio[][] = [];
    const primeraFila: Polinomio[] = [];
    const variablesDisponibles: string[] = this.funcionPenalizada.obtenerVariablesDisponibles(); // ontenemos las variables disponibles
    for (const monomio of this.funcionPenalizada.principalMonomios) { // recorremos la funcion penalizada la parte de principal monomios
      const polinomio = new Polinomio();
      polinomio.agregarMonomio(new Monomio(monomio.getCoeficiente(), monomio.getIsM() ? 'M' : undefined)); // creamos el polinomio donde añadimos el coeficiente y si es M
      primeraFila.push(polinomio); // metemos el polinomio en la primera fila
    }
    
    const polinomio = new Polinomio(); // creamos el polinomio
    polinomio.agregarMonomio(new Monomio(0)); // agregamos el monomio con coeficiente 0
    primeraFila.push(polinomio); // metemos el polinomio en la primera fila
    matrizZ.push(primeraFila); // metemos la primera fila en la matriz, recuerda que lo que vamos a devolver va a ser un array de polinomios

    this.funcionesObjetivos.forEach(function (polinomio: Polinomio) { // se recorren los polinomios de las funciones objetivos
      const mapaVariables: Map<string, Polinomio> = new Map();  // se crea un map como llave es un string y el valor es un polinomio
      const numeroM = polinomio.existeVariable('a') ? -1 : 1;   // preguntamos si existe la variable a para saber si es -1 o 1
      variablesDisponibles.forEach((variable: string) => {       // hago un recorrido de las variables disponibles con una funcion flecha con parametro  variable:string
        const polinomioAux = new Polinomio();
        polinomioAux.agregarMonomio(new Monomio(0, numeroM == -1 ? 'M' : undefined)); // creamos el polinomio con coeficiente 0 y con variable M deoendiendo si es -1
        mapaVariables.set(variable, polinomioAux);  // metemos la variable como llave y el polinomioAux como valor en el map
      });
      for (const monomio of polinomio.monomios) { // recorremos el polinomio
        const polinomioAux = new Polinomio();
        polinomioAux.agregarMonomio(new Monomio(monomio.getCoeficiente() * numeroM, numeroM == -1 ? 'M' : undefined)); // aqui multiplicamos el coeficiente por -1, si es menos uno le ponemos M como variable
        mapaVariables.set(monomio.getVariable()!, polinomioAux);
      }
      const polinomioAux = new Polinomio();
      polinomioAux.agregarMonomio(new Monomio(polinomio.principalMonomios[0].getCoeficiente() * numeroM, numeroM == -1 ? 'M' : undefined));
      mapaVariables.set('', polinomioAux);
      matrizZ.push(Array.from(mapaVariables.values()));
    });
    // matrizZ, asi nos quedaria nuestra matriz de polinomios
    // [
    //   [Polinomio, Polinomio, Polinomio, ...],
    //   [Polinomio, Polinomio, Polinomio, ...],
    //   [Polinomio, Polinomio, Polinomio, ...],
    // ]

    // aca vamos a hacer la operacion de la region Z sumar cada fila que haya sido multiplicada por -m 
    const resultado: Map<string, Polinomio> = new Map(); // se crea un map como llave es un string y el valor es un polinomio

    for (let i = 1; i < matrizZ.length; i++) { // recorremos la matriz de polinomios
      const firstPolinomio: Polinomio | undefined = matrizZ[i][0] ?? undefined; // obtenemos el primer polinomio de cada fila
      if (firstPolinomio && !firstPolinomio.existeVariable('M')) { // si el primer polinomio no tiene la variable M
        continue; // salimos a la siguiente fila
      }
      for (let j = 0; j < matrizZ[i].length; j++) { // recorremos los polinomios de cada fila
        if (!resultado.has(`id-${j}`)) { // si no tenemos la llave
          resultado.set(`id-${j}`, matrizZ[i][j]); // metemos el polinomio en el map
        } 
        else // si tenemos la llave
        {
          const actualPolinomio: Polinomio | undefined = resultado.get(`id-${j}`); // obtenemos el polinomio
          if (actualPolinomio) { // si tenemos el polinomio osea si no es undefined
            actualPolinomio.sumarPolinomio(matrizZ[i][j]); // sumamos el polinomio
            resultado.set(`id-${j}`, actualPolinomio); // y el resultado lo metemos en el map
          }
        }
      }
    }

    // como aqui ya tenemos el resultado de la region Z osea todas las sumas de los polinomios tenemos que sumarle con el polinomio de la primera fila
    if (matrizZ.length > 0) { // si la matriz no esta vacia
      const primeraFila: Polinomio[] = matrizZ[0]; // obtenemos la primera fila de la matriz de polinomios
      for (let i = 0; i < primeraFila.length - 1; i++) { // recorremos los polinomios de la primera fila
        const actualPolinomio: Polinomio | undefined = resultado.get(`id-${i}`); // obtenemos el polinomio del resulado anterior por su llave
        if (actualPolinomio) {
          actualPolinomio.sumarPolinomio(primeraFila[i]); // sumamos el polinomio actual con el polinomio de la primera fila
          resultado.set(`id-${i}`, actualPolinomio); // y lo metemos en el map con su misma llave
        }
      }
    }
    return Array.from(resultado.values()); // aqui obtenemos los polinomios de la region Z como array
  }



   // esta funcion nos ayuda a encontrar el pivoteColumna , si no lo encuentra nos devuelve undefined
  masNegativo(polinomios: Polinomio[]): number | undefined{

    let menor = polinomios[1].evaluar(1000); // obtenemos el polinomio de la posicion 1 y la evaluamos con un valor de 1000 ya es es un polinomio
    let pos = 1; // guardamos la posicion del menor
    for (let i = 2; i < polinomios.length-1; i++)
   {
      const actual = polinomios[i].evaluar(1000);
       if(menor > actual) // aqui vamos cambiando al mas menor de todo el array
       {
          pos = i;
          menor = actual;
       }
    }
      return (menor < 0) ? pos : undefined; // le pongo esto por si ya no hay polinomios negativos  
  }

  // aqui encontamos el pivote de la fila
  encuentraPivote(matriz: number[][],columna: number): number{
    
    const division = new Map<number, number>(); // aqui guardaremos en un map <fila, division>
    
    for (let i = 0; i < matriz.length; i++) // este for la division para encontra el mas positivo y la posicion del pivote
    {
      const numerador = matriz[i][matriz[i].length-1]; // obtenemos el numerador que es la ultima columna de cada fila
      const denominador = matriz[i][columna]; // obtenemos el denominador que es el elemento de la columna pivote
      if(denominador !== 0) // si el denominador no es 0
      {
        division.set(i, numerador / denominador); // lo metemos en el map <fila, division>
      }      
    }   

    const filtroPositivos = new Map(Array.from(division).filter(x => x[1] > 0)); // filtara los numeros positivos usando un artificio de array
    const llavePrimera = filtroPositivos.keys().next().value!; // obtenemos la llave primera fila

    let menor = filtroPositivos.get(llavePrimera); // com
    let posicion = llavePrimera; // posicion de la fila

    

    for (const[pos, valor] of filtroPositivos) // solo usamos los valores positivos
    {
      const actual = valor;
      if(menor! > actual)
      {
        menor = actual;
        posicion = pos;
      }
    }
    return posicion; // retornamos la posicion de esa fila
  }

  // esta funcion nos ayuda hacer el ciclo hasta que no haya mas negativos
  existeNegativo(polinomios: Polinomio[]): boolean{
    const pos = this.masNegativo(polinomios); // esto nos devuelve la posicion del polinomio mas negativo pero si nos devuelve undefined significa que no hay
    return pos !== undefined;
  }

  // solo nos ayuda a dividir por el pivote en la matriz
  dividirConElementoPivote(matrizInicial: number[][], pivote: number, columna: number): void
  {
    const elementoPivote = matrizInicial[pivote][columna];
    for(let i = 0; i < matrizInicial[pivote].length; i++)
    {
      const elemento = matrizInicial[pivote][i];
      matrizInicial[pivote][i] = elemento / elementoPivote;
    }
  }

  // esta tiene la misma logica que la problema para encontrar la filapivote
  filasAOperar(matriz: number[][], columna: number) : number[]
  {
    const filas: number[] = [];
    const pivote = this.encuentraPivote(matriz, columna);
    
    for (let i = 0; i < matriz.length; i++) // este for la division para encontra el mas positivo y la posicion del pivote
    {
      const elemento = matriz[i][columna];
      if(elemento !== 0) // siel elemento no es 0 guarda su fila
      {
        filas.push(i);
      }      
    }
    return filas.filter(x => x !== pivote); // aqui filtramos la fila del pivote
  }

  operacionesfilasConPivote(matriz: number[][], pivote: number, columnaPivote: number, filaACambiar: number): void
  {
    const elemento = (matriz[filaACambiar][columnaPivote])*-1; // obtenemos el elemento de la columna pivote con la fila a cambiar y lo multiplicamos por -1
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
      let resultado: Polinomio = elemento.clonar(); // clonamos el elemento
      resultado.multiplicar(matriz[pivote][i]); 
      resultado.sumarPolinomio(polinomios[i]);     
      polinomios[i] = resultado;
      
    }
  }

  // aqui solamente nos ayuda a obtener las variables de entrada
  obtenerVariablesDeEntrada(): string[]
  {
    const variablesDeEntrada: string[] = [];
    for(const  [_, polinomio] of this.funcionesObjetivos)
    {
      variablesDeEntrada.push(polinomio.obtenerUltimoMonomio().getVariable()||'');
    }
    return variablesDeEntrada;
  }





  resolver(): void {
    const resultadoMatrizZ: Polinomio[] = this.generarResultadoDeMatrizRegionZ(); // nos ayuda a encontrar el resultado de la region Z ya sumada al reglon R0
    const variablesDisponibles: string[] = this.funcionPenalizada.obtenerVariablesDisponibles(); // nos ayuda a encontrar con mayor facilidad las variables de salida
    variablesDisponibles.pop(); // esto nos ayuda a elimianar el uktimo elemento ya que nos daba unacolumna demas al darle al matriz inicial
    let variablesEncontradas = this.obtenerVariablesDeEntrada();// son las variables de entrada
    

    const matrizInicial: number[][] = this.obtenerMatrizInicial(variablesDisponibles); // esta es nuestra matriz inicial de puros enteros o decimales
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
      
      const iteracion: Iteracion = { // esto solo es para la vista
        numeroIteracion: numeroIteraciones,
        columnaPivote: columnaPivote!,
        filaPivote: pivote + 1,
        matriz: [this.clonarPolinomios(resultadoMatrizZ),...JSON.parse(JSON.stringify(matrizInicial))],
        variablesEntrada: [...variablesEncontradas]
      }
      this.tablasIteracion.iteraciones.push(iteracion); // vista


      this.dividirConElementoPivote(matrizInicial, pivote, columnaPivote!); // aqui dividimos el pivote con todos los demas elementos
      const entrada = variablesDisponibles[columnaPivote!]; // esta es la variable que entra
      variablesEncontradas[pivote] = entrada; // cambiamos la variable de entrada

      const filas = this.filasAOperar(matrizInicial, columnaPivote!); // aqui obtenemos las filas que son diferentes de cero para poder operarlas
      
      for (const fila of filas) // hace las operaciones con las filas para cambiarlas
      {
        
        this.operacionesfilasConPivote(matrizInicial, pivote, columnaPivote!, fila); // aqui se hacen las operaciones con this.operacionesfilasConPivote
      } 
      
      this.operacionFilaPolinomios(resultadoMatrizZ, matrizInicial, pivote, columnaPivote!); // aqui hacemos las operaciones con los polinomios
      numeroIteraciones++;
    }
      const valoresVariablesSalida: Map<string, number> = this.obtenerValoresDeLasVariablesSalida(matrizInicial, variablesEncontradas); // obtenemos los valores de las variables de salida
      console.log(this.operacion.variables);


      const iteracion: Iteracion = { // esto es solo para la vista
        numeroIteracion: numeroIteraciones,
        columnaPivote: 0,
        filaPivote: 0,
        matriz: [this.clonarPolinomios(resultadoMatrizZ),...JSON.parse(JSON.stringify(matrizInicial))],
        variablesEntrada: [...variablesEncontradas]
      }

      this.tablasIteracion.iteraciones.push(iteracion);
      this.tablasIteracion.variableSalida = valoresVariablesSalida; // metemos los valores de las variables de salida en la tabla de iteraciones
      this.tablasIteracion.resultado = this.valorDeZ(this.funcionPenalizada, valoresVariablesSalida); // obtenemos el valor de Z
      console.log(this.tablasIteracion.resultado);
  } 

  private obtenerValoresDeLasVariablesSalida(matriz: number[][], variablesEntrada: string[]): Map<string, number> {
    const valoresVariablesSalida: Map<string, number> = new Map();
    for(let i = 0 ; i < variablesEntrada.length; i++) // recorremos las variables de entrada
    {
      const valor = parseFloat((matriz[i][matriz[i].length - 1]).toFixed(3)); // obtenemos el valor de la ultima columna de cada fila
      valoresVariablesSalida.set(variablesEntrada[i], valor); // metemos la variable de entrada y su valor en el map
    }
    return valoresVariablesSalida; // retornamos el map con las variables de salida y sus valores
  }

  private valorDeZ(funcionPenalizada: Polinomio, valoresVariablesSalida: Map<string, number>): number {
    let resultado: number = 0;
    funcionPenalizada.principalMonomios.forEach((monomio: Monomio) => { // recorremos los monomios de la funcion penalizada
      if (monomio.getVariable() && this.esVariableX(monomio.getVariable()!)) {
        resultado += monomio.getCoeficiente() * (valoresVariablesSalida.get(monomio.getVariable()!) ?? 0);
      }
    });
    return this.objetivo == 'max' ? resultado * -1 : resultado;
  }
  esVariableX(variable: string): boolean {
    let existe = false;
    const regex: RegExp = new RegExp(`^x\\d+$`);
    if (regex.test(variable)) {
      existe = true;
    }
    return existe;
  }

  private obtenerMatrizInicial(variablesDisponibles: string[]): number[][] {
    const matrizInicial: number[][] = [];
    this.funcionesObjetivos.forEach(function (polinomio: Polinomio) { // se recorren los polinomios
      const mapaVariables: Map<string, number> = new Map(); // se crea un map como llave es un string y el valor es un number

      variablesDisponibles.forEach((variable: string) => { // hago un recorrido de las variables disponibles
        mapaVariables.set(variable, 0);
      });

      for (const monomio of polinomio.monomios) { // barremos los polinomios de las funciones objetivos
        mapaVariables.set(monomio.getVariable()!, monomio.getCoeficiente()); // aqui metemos su variable como llave y su coeficiente
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
