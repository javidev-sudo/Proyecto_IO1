import type { Operacion, Restriccion } from "./operacion";
import { Polinomio } from "./polinomio";
import { Monomio } from "./monomio";
export class MetodoGranM {
  protected funcionPenalizada: Polinomio = new Polinomio('W', 1);
  protected funcionesObjetivos: Map<string, Polinomio> = new Map();
  // {
  //   't1': [result] = [.,..,].
  //   't2': [result] = [.,..,],
  // }
  constructor(
    protected operacion: Operacion,
    protected objetivo: string = "max"
  ) {
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

  resolver(): void {
    const iteraciones = []
    const resultadoMatrizZ: Polinomio[] = this.generarResultadoDeMatrizRegionZ();
    const variablesDisponibles: string[] = this.funcionPenalizada.obtenerVariablesDisponibles();

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
    })
    iteraciones.push({
      'operacion': resultadoMatrizZ,
      'matriz': matrizInicial,
      'fila': 0,
      'columna': 0
    })
    console.log(variablesDisponibles)
    console.log(matrizInicial);
    

  }
}
