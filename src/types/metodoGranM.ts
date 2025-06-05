import type { Operacion, Restriccion } from "./operacion";
import { Polinomio } from "./polinomio";
import { Monomio } from "./monomio";
export class MetodoGranM {
  protected funcionPenalizada: Polinomio = new Polinomio();
  protected funcionesObjetivos: Map<string, Polinomio> = new Map();
  constructor(
    protected operacion: Operacion,
    protected objetivo: string = "max"
  ) {
    this.procesarDatosIniciales();
  }

  procesarDatosIniciales() {
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
          new Monomio(1, "S" + (index + 1))
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
    this.funcionPenalizada.multiplicarPorNegativo();
    this.funcionPenalizada.moverMonomioAPrincipal();
  }

  generarResultadoDeMatrizRegionZ(): Polinomio[] {
    const matrizZ: Polinomio[][] = [];
    const primeraFila: Polinomio[] = []
    for(const monomio of this.funcionPenalizada.principalMonomios) {
        const polinomio = new Polinomio();
        polinomio.agregarMonomio(new Monomio(monomio.getCoeficiente(), monomio.getIsM() ? 'M' : undefined));
        primeraFila.push(polinomio);
    }
    const polinomio = new Polinomio();
    polinomio.agregarMonomio(new Monomio(0));
    primeraFila.push(polinomio);
    matrizZ.push(primeraFila);

    this.funcionesObjetivos.forEach(function (polinomio: Polinomio) {
        const numeroM = polinomio.existeVariable('a') ? -1 : 1;
        const filaPolinomio: Polinomio[] = [];
        for (const monomio of polinomio.monomios) {
            const polinomioAux = new Polinomio();
            polinomioAux.agregarMonomio(new Monomio(monomio.getCoeficiente() * numeroM, 'M'));
            filaPolinomio.push(polinomioAux);
        }
        const polinomioAux = new Polinomio();
        polinomioAux.agregarMonomio(new Monomio(polinomioAux.principalMonomios[0].getCoeficiente() * numeroM, 'M'));
        filaPolinomio.push(polinomioAux);
        matrizZ.push(filaPolinomio);
    });


    return [];
  }
  resolver(): void {
    
  }
}
