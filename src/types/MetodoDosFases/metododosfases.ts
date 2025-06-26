import { Polinomio } from "../polinomio";
import { Monomio } from "../monomio";
import type { Operacion, Restriccion } from "../operacion";

export class MetodoDosFases {
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


  filasAOperar(matriz: number[][], columna: number) : number[]
  {
    const filas: number[] = [];
    const pivote = this.encuentraPivote(matriz, columna);
    
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

const variablesDisponibles: string[] = this.funcionPenalizadaAux.obtenerVariablesDisponibles();
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


while(this.existePositivo(matrizInicial))
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

     const filas = this.filasAOperar(matrizInicial, pivoteColumna!);

     for(const fila of filas)
     {
          this.operacionesfilasConPivote(matrizInicial, pivoteFila, pivoteColumna!, fila);
     }
     
}
this.variablesdeEntrada = variablesEncontradas;


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
     //const pivote = this.encuentraPivote(matriz, columnasALimpiarSinRepetidos[i]);  
      this.operacionesfilasConPivote(matriz, i+1 , columnasALimpiarSinRepetidos[i], filasALimpiar[i]);
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

segundaFase():void
{
    const matrizFase2 = this.primeraFase();
    console.log(matrizFase2);
    console.log(this.variablesdeEntrada);
    if(matrizFase2[0][matrizFase2[0].length-1] == 0)
    {
        const variablesDisponibles: string[] = this.funcionPenalizadaAux.obtenerVariablesDisponibles();
        variablesDisponibles[0] = "z";
        variablesDisponibles.push('');
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
    columnasEliminar.sort((a, b) => b - a);

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
    variablesDisponiblesSinArtificiales.forEach((variable : string) => { // hago un recorrido de las variables disponibles
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
     if(this.objetivo == "max")
     {
        while(this.existeNegativo(matrizFase2))
        {
            const pivoteColumna = this.encontrarPivoteColumnaMasNegativo(matrizFase2);
            if(pivoteColumna === undefined)
            {
              break;
            }
            const pivoteFila = this.encuentraPivote(matrizFase2,pivoteColumna);
            if(pivoteFila === undefined)
            {
              break;
            }
            this.dividirConElementoPivote(matrizFase2,pivoteFila,pivoteColumna)
            const filas = this.filasAOperar(matrizFase2, pivoteColumna!);
            for(const fila of filas)
            {
              this.operacionesfilasConPivote(matrizFase2, pivoteFila, pivoteColumna!, fila);
            }
        }
     }
     else
     {
        while(this.existePositivo(matrizFase2))
        {
            const pivoteColumna = this.encontrarColumnaPivoteFase1(matrizFase2);
            if(pivoteColumna === undefined)
            {
              break;
            }
            const pivoteFila = this.encuentraPivote(matrizFase2,pivoteColumna);
            if(pivoteFila === undefined)
            {
              break;
            }
            this.dividirConElementoPivote(matrizFase2,pivoteFila,pivoteColumna);
            const filas = this.filasAOperar(matrizFase2, pivoteColumna!);
            for(const fila of filas)
            {
              this.operacionesfilasConPivote(matrizFase2, pivoteFila, pivoteColumna!, fila);
            }
        }
     }

    console.log(matrizFase2);
    console.log(this.variablesdeEntrada);
    }
    else
    {
        console.log('no hay solucion optima');
    }
    
}



};


