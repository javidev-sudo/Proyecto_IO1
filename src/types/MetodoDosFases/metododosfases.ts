import { Polinomio } from "../polinomio";
import { Monomio } from "../monomio";
import type { Operacion, Restriccion } from "../operacion";
import type { TablasIteracion } from "../../types/tablasIteracion";
import type { Iteracion } from "../../types/iteracion";

export class MetodoDosFases {
  protected tablasIteracion: TablasIteracion;
  protected funcionPenalizada: Polinomio = new Polinomio('z', 1); // -W + X1 +X2 = -X1 -X2 + 0E ....
  protected funcionesObjetivos: Map<string, Polinomio> = new Map();
  protected variablesdeEntrada: string[] = [];
  protected funcionPenalizadaAux: Polinomio = new Polinomio('r', 1);
  
  // {
  //   't1': [result] = [.,..,].
  //   't2': [result] = [.,..,],
  // }
  constructor(
    protected operacion: Operacion,
    protected objetivo: string = "max"
  ) 

  {
    this.tablasIteracion = {
      iteraciones: [],
      variablesFila: []
    }
    this.procesarDatosIniciales();
  }


public procesarDatosIniciales() {
    
     this.operacion.variables.forEach((variable, index) => {
      this.funcionPenalizada.agregarMonomio(
        new Monomio(variable, `x${index + 1}`)
      );
    });

    this.operacion.variables.forEach((variable, index) => {
      this.funcionPenalizadaAux.agregarMonomio(
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

        this.funcionPenalizadaAux.agregarMonomio(
          new Monomio(0, "S" + (index + 1))
        );
      }


      if (restriccion.operador == "myi") {
        this.funcionesObjetivos
          .get(`f${index}`)
          ?.agregarMonomio(new Monomio(-1, "S" + (index + 1)));
        this.funcionesObjetivos
          .get(`f${index}`)
          ?.agregarMonomio(new Monomio(1, "a" + (index + 1)));

          this.funcionPenalizadaAux.agregarMonomio(
          new Monomio(0, "S" + (index + 1))
        );
          this.funcionPenalizadaAux.agregarMonomio(
          new Monomio(1, "a" + (index + 1), true)
        );
      }

      if (restriccion.operador == "i") {
        this.funcionesObjetivos
          .get(`f${index}`)
          ?.agregarMonomio(new Monomio(1, "a" + (index + 1)));

          this.funcionPenalizadaAux.agregarMonomio(
          new Monomio(1, "a" + (index + 1), true)
        );
      }
    });


    this.funcionPenalizada.moverMonomioAPrincipal();



  }

// primera fase

generarMatrizInicialFase1(funcionPenalizadaFase1: Polinomio, variablesDisponibles: string[]) : number[][]
{
   variablesDisponibles.push('');
   const matrizInicial : number[][] = [];
   const mapaVariables: Map<string, number> = new Map(); // se crea un map como llave es un string y el valor es un number

     variablesDisponibles.forEach((variable : string) => { // hago un recorrido de las variables disponibles
          mapaVariables.set(variable, 0);
     });
     funcionPenalizadaFase1.principalMonomios.forEach((monomio: Monomio) => {

          mapaVariables.set(monomio.getVariable()!, monomio.getCoeficiente()); // aqui metemos su variable como llave y su coeficiente
     })

     matrizInicial.push(Array.from(mapaVariables.values()));

      variablesDisponibles.pop();

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

private encontrarColumnaPivoteFase1(matriz: number[][]) : number|undefined // siempre es minimizacion
{

     let columnaPivote = 1;
     let mayor = matriz[0][1];
     for(let i = 1; i < matriz[0].length-1; i++)
     {
          const actual = matriz[0][i];
          if(mayor < actual)
          {
               mayor = actual;
               columnaPivote = i;
          }
     }

     return (mayor > 0) ? columnaPivote : undefined;
     
}


encuentraPivote(matriz: number[][],columnaPivote: number): number{
    
    const division = new Map<number, number>();
    
    for (let i = 1; i < matriz.length; i++) // este for la division para encontra el mas positivo y la posicion del pivote
    {
      const numerador = matriz[i][matriz[i].length-1];
      const denominador = matriz[i][columnaPivote];
      if(denominador !== 0)
      {
        division.set(i, parseFloat((numerador / denominador).toFixed(2)));
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


  dividirConElementoPivote(matrizInicial: number[][], pivote: number, columna: number): void
  {
    const elementoPivote = matrizInicial[pivote][columna];
    for(let i = 0; i < matrizInicial[pivote].length; i++)
    {   
      const elemento = matrizInicial[pivote][i];
      matrizInicial[pivote][i] = parseFloat((elemento / elementoPivote).toFixed(2));
    }
  }
operacionesfilasConPivote(matriz: number[][], pivote: number, columnaPivote: number, filaACambiar: number): void
  {
    const elemento = (matriz[filaACambiar][columnaPivote])*-1;
    for(let i = 0; i < matriz[filaACambiar].length; i++)
    {
      const elementoFilaRe = matriz[filaACambiar][i];
      const reglonPivote = matriz[pivote][i];
      matriz[filaACambiar][i] = parseFloat(((elemento*reglonPivote) + elementoFilaRe).toFixed(2));
    }
  }


  filasAOperar(matriz: number[][], columna: number, pivote: number) : number[]
  {
    const filas: number[] = [];
    
    for (let i = 0; i < matriz.length; i++) 
    {
      const elemento = matriz[i][columna];
      if(elemento !== 0)
      {
        filas.push(i);
      }      
    }
    return filas.filter(x => x !== pivote);
  }
existePositivo(matriz: number[][]): boolean
{
  return this.encontrarColumnaPivoteFase1(matriz) !== undefined;
}


obtenerVariablesDeEntrada(): string[]
  {
    const variablesDeEntrada: string[] = [];
    for(const  [_, polinomio] of this.funcionesObjetivos)
    {
      variablesDeEntrada.push(polinomio.obtenerUltimoMonomio().getVariable()||'');
    }
    return variablesDeEntrada;
  }

primeraFase(): number[][]
{
const funcionPenalizadaFase1 = new Polinomio('r', 1); // r = a1 + a2

const variablesDisponibles: string[] = this.funcionPenalizadaAux.obtenerVariablesDisponibles(); // obtenemos las variables disponibles
const filasO : number[] = [];
let variablesEncontradas = this.obtenerVariablesDeEntrada();// son las variables de entrada

let filasAOperar = 0;
this.funcionesObjetivos.forEach((polinomio: Polinomio) => {
     
     polinomio.monomios.forEach((monomio: Monomio) => {

          if(monomio.existeVariable('a'))
          {
            filasAOperar++;
            filasO.push(filasAOperar);
            funcionPenalizadaFase1.agregarMonomio(monomio.clonar());
          }
      });
})

funcionPenalizadaFase1.moverMonomioAPrincipal();

const matrizInicial = this.generarMatrizInicialFase1(funcionPenalizadaFase1, variablesDisponibles);


for(let fila = 0; fila < filasO.length; fila++) // aqui operamos las columnas que tenian variables artificiales
{
     for(let j = 0; j < matrizInicial[0].length; j++)
     {
          matrizInicial[0][j] = matrizInicial[0][j] + matrizInicial[filasO[fila]][j];
     }
}

let pivoteFinalFila: number | undefined = undefined; //vista
let pivoteFinalColumna: number | undefined = undefined; //vista

while((Math.trunc((matrizInicial[0][matrizInicial[0].length - 1] )) !== 0) && (this.existePositivo(matrizInicial)))
{  
     const pivoteColumna = this.encontrarColumnaPivoteFase1(matrizInicial);
     const pivoteFila = this.encuentraPivote(matrizInicial, pivoteColumna!);
     if(pivoteFila === undefined)
     {
          break;
     }
     const variable = variablesDisponibles[pivoteColumna!];
     variablesEncontradas[pivoteFila-1] = variable;
     this.dividirConElementoPivote(matrizInicial, pivoteFila, pivoteColumna!);

     const filas = this.filasAOperar(matrizInicial, pivoteColumna!, pivoteFila);

     for(const fila of filas)
     {
          this.operacionesfilasConPivote(matrizInicial, pivoteFila, pivoteColumna!, fila);
     }
      pivoteFinalFila = pivoteFila; // vista
      pivoteFinalColumna = pivoteColumna; //vista
     
}
this.variablesdeEntrada = variablesEncontradas;

const iteracion: Iteracion = { // vista
  matriz: [...JSON.parse(JSON.stringify(matrizInicial))],
  filaPivote: pivoteFinalFila ?? 0,
  columnaPivote: pivoteFinalColumna ?? 0,
  numeroIteracion: 1,
  variablesEntrada: ['r',...this.variablesdeEntrada],
  variablesColumna: [...variablesDisponibles, 'RHS'],
  funcionPenalizada: funcionPenalizadaFase1.clonar(),
  functionObjetivos: [...this.funcionesObjetivos.values()].map((polinomio: Polinomio) => polinomio.clonar())
}
this.tablasIteracion.iteraciones.push(iteracion); // vista

return matrizInicial;

};




// segunda fase

esVariableArtificial(variable: string): boolean
{
  let existe = false;
  const regex: RegExp = new RegExp(`^a\\d+$`);
  if(regex.test(variable))
  {
    existe = true;
  }
  return existe;
}

limpiarLaColumnaVariablesEntrada(matriz: number[][], variablesEntrada: string[], variablesDisponibles: string[]): void
{
  const columnasALimpiar: number[] = [];
  const filasALimpiar: number[] = [];
  for(let i = 0; i < variablesEntrada.length; i++)
  {
    const columna = variablesDisponibles.indexOf(variablesEntrada[i]); // aqui obtenemos la posicion de la columna de la variable de entrada en la matriz
    for(let fila = 0; fila < matriz.length; fila++)
    {
      if(matriz[fila][columna] !== 0 && matriz[fila][columna] !== 1)
      {
         columnasALimpiar.push(columna);
         filasALimpiar.push(fila);
      }
    }
  }
  
  const columnasALimpiarSinRepetidos = Array.from(new Set(columnasALimpiar));

  for(let i = 0; i < columnasALimpiarSinRepetidos.length; i++)
  {
      const pivote = this.buscar1(matriz, columnasALimpiarSinRepetidos[i]);
      this.operacionesfilasConPivote(matriz, pivote! , columnasALimpiarSinRepetidos[i], filasALimpiar[i]);
  }
}

buscar1(matriz: number[][], columnaPivote: number): number | undefined
{
  for(let i = 0; i < matriz.length; i++)
  {
    if(matriz[i][columnaPivote] === 1)
    {
      return i;
    }
  }
}

encontrarPivoteColumnaMasNegativo(matriz: number[][]): number | undefined
{
  let columnaPivote = 1;
     let menor = matriz[0][1];
     for(let i = 1; i < matriz[0].length-1; i++)
     {
          const actual = matriz[0][i];
          if(menor > actual)
          {
               menor = actual;
               columnaPivote = i;
          }
     }

     return (menor < 0) ? columnaPivote : undefined;
}

existeNegativo(matriz: number[][]): boolean
{
  return this.encontrarPivoteColumnaMasNegativo(matriz) !== undefined;
}

existeArtificiales(variablesdeEntrada: string[]): boolean
{
  for(let i = 0; i < variablesdeEntrada.length; i++)
  {
    if(this.esVariableArtificial(variablesdeEntrada[i]))
    {
      return true;
    }
  }
  return false;
}
segundaFase():void
{
    const matrizFase2 = this.primeraFase();
    let variablesEntrada: string[] = structuredClone(this.variablesdeEntrada);
    if(Math.trunc(matrizFase2[0][matrizFase2[0].length-1]) == 0 && !this.existeArtificiales(variablesEntrada)) // si la ultima columna de la matriz es 0 y existen variables artificiales
    {
        const variablesDisponibles: string[] = this.funcionPenalizadaAux.obtenerVariablesDisponibles();
        variablesDisponibles[0] = "z";
        variablesDisponibles.push('RHS');
        const columnasEliminar: number[] = [];
        const mapaVariables: Map<string, number> = new Map(); // se crea un map como llave es un string y el valor es un number
        

       // aqui vamos a obtener las posiciones de las variables artificiales
       for(let i = 0; i < variablesDisponibles.length; i++)
      {
           if(this.esVariableArtificial(variablesDisponibles[i]))
           {
            columnasEliminar.push(i);
           } 
      }
    columnasEliminar.sort((a, b) => b - a); // invertimos las columnas para evitar problemas

    const variablesDisponiblesSinArtificiales = variablesDisponibles.filter(variable => !/^a\d+$/.test(variable)); // aqui vamos a eliminar las a1, a2...
    
    // aqui eliminamos las columnas de las que pertenecian a las variables artificiales
    for(let i = 0; i < columnasEliminar.length; i++)
    {
        for(const fila of matrizFase2)
        {
            fila.splice(columnasEliminar[i], 1);
        }
    } 

    // en esta parte va,os a meter de primera funcion penalizada a nuestra matriz
    variablesDisponiblesSinArtificiales.forEach((variable : string) => { // hago un recorrido de las variables disponibles sin artificiales
          mapaVariables.set(variable, 0);
     });
     this.funcionPenalizada.principalMonomios.forEach((monomio: Monomio) => {

          mapaVariables.set(monomio.getVariable()!, monomio.getCoeficiente()); // aqui metemos su variable como llave y su coeficiente
     })

      const filafuncionpenalizada = Array.from(mapaVariables.values());

    
      // aqui montomos los coeficientes de la funcion penalizada en la primera fila de la matriz
     matrizFase2[0] = filafuncionpenalizada;


     // hasta aqui ya estaria todo listo para hacer las iteraciones

     this.limpiarLaColumnaVariablesEntrada(matrizFase2, this.variablesdeEntrada, variablesDisponiblesSinArtificiales); // todas las variables de entrada tienen que tener una solucion factible inicial la cual aqui logramos ese cometido
     // una vez limpiada la matriz se hace metodo simplex, aqui dependemos de si es maximzar o minimizar para que nos de la solucion correcta
    let pivoteFinalColumna: number | undefined = undefined;
    let pivoteFinalFila: number | undefined = undefined;
    while(this.objetivo == "max" && this.existeNegativo(matrizFase2) || this.objetivo != "max" && this.existePositivo(matrizFase2)) // aqui usamos el metodo simplex
    {
        const pivoteColumna = this.objetivo == "max" ? this.encontrarPivoteColumnaMasNegativo(matrizFase2) : this.encontrarColumnaPivoteFase1(matrizFase2);
        const pivoteFila = this.encuentraPivote(matrizFase2,pivoteColumna!);
        if(pivoteFila === undefined)
        {
          break;
        }
        this.dividirConElementoPivote(matrizFase2,pivoteFila,pivoteColumna!)
        let elementoentrada = variablesDisponibles[pivoteColumna!];
        variablesEntrada[pivoteFila - 1] = elementoentrada;
        const filas = this.filasAOperar(matrizFase2, pivoteColumna!, pivoteFila);
        for(const fila of filas)
        {
          this.operacionesfilasConPivote(matrizFase2, pivoteFila, pivoteColumna!, fila);
        }
        pivoteFinalFila = pivoteFila;
        pivoteFinalColumna = pivoteColumna;
        
    }

    const valoresVariablesSalida: Map<string, number> = this.obtenerValoresDeLasVariablesSalida(matrizFase2, variablesEntrada);

    const iteracion: Iteracion = {
      matriz: [...JSON.parse(JSON.stringify(matrizFase2))],
      filaPivote: pivoteFinalFila ?? 0,
      columnaPivote: pivoteFinalColumna ?? 0,
      numeroIteracion: 2,
      variablesEntrada: ['',...variablesEntrada],
      variablesColumna: [...variablesDisponiblesSinArtificiales],
      funcionPenalizada: this.funcionPenalizada.clonar(),
    }
    this.tablasIteracion.iteraciones.push(iteracion);
    this.tablasIteracion.variableSalida = valoresVariablesSalida; // metemos los valores de las variables de salida en la tabla de iteraciones
    this.tablasIteracion.resultado = this.valorDeZ(this.funcionPenalizada, valoresVariablesSalida); // obtenemos el valor de Z
  
   }
    else
    {
        this.tablasIteracion.mensaje = 'No hay solucion optima' + (this.existeArtificiales(variablesEntrada)? ' - Existe variables artificiales' : '');
    }

    
}

  obtenerTabladeIteraciones(): TablasIteracion {
    return this.tablasIteracion;
  }
  

  private valorDeZ(funcionPenalizada: Polinomio, valoresVariablesSalida: Map<string, number>): number {
    let resultado: number = 0;
    funcionPenalizada.principalMonomios.forEach((monomio: Monomio) => { // recorremos los monomios de la funcion penalizada
      if (monomio.getVariable() && this.esVariableX(monomio.getVariable()!)) {
        resultado += monomio.getCoeficiente() * (valoresVariablesSalida.get(monomio.getVariable()!) ?? 0);
      }
    });
    return resultado*-1;
  }
  
  esVariableX(variable: string): boolean {
    let existe = false;
    const regex: RegExp = new RegExp(`^x\\d+$`);
    if (regex.test(variable)) {
      existe = true;
    }
    return existe;
  }



  private obtenerValoresDeLasVariablesSalida(matriz: number[][], variablesEntrada: string[]): Map<string, number> {
    const valoresVariablesSalida: Map<string, number> = new Map();
    for(let i = 0 ; i < variablesEntrada.length; i++) // recorremos las variables de entrada
    {
      const valor = parseFloat((matriz[i+1][matriz[i+1].length - 1]).toFixed(3)); // obtenemos el valor de la ultima columna de cada fila
      valoresVariablesSalida.set(variablesEntrada[i], valor); // metemos la variable de entrada y su valor en el map
    }
    return valoresVariablesSalida; // retornamos el map con las variables de salida y sus valores
  }


};





