import { Monomio } from './monomio';

export class Polinomio {

    public monomios: Monomio[];
    public principalMonomios: Monomio[] = [];
    // [-w, +x1, 3X2, -2X3, 4X4] = []

    constructor(variable: string | undefined = undefined, coeficiente: number = 0) {
        this.principalMonomios = [new Monomio(coeficiente, variable)];
        this.monomios = [];
    }

    public agregarMonomio(monomio: Monomio): void {
        let existe = false;
        this.monomios.map((m: Monomio) => {
            if (m.getVariable() === monomio.getVariable()) {
                m.coeficiente += monomio.coeficiente;
                existe = true;
                return;
            }
        });
        if (!existe) {
            this.monomios.push(monomio);
        }
    }

    public agregarMonomioAPrincipal(monomio: Monomio): void {
        let existe = false;
        this.principalMonomios.map((m: Monomio) => {
            if (m.getVariable() === monomio.getVariable()) {
                m.coeficiente += monomio.coeficiente;
                existe = true;
                return;
            }
        });
        if (!existe) {
            this.monomios.push(monomio);
        }
    }

    public multiplicarPorNegativo(): void {
        this.monomios.map(monomio => {
            monomio.coeficiente *= -1;
        });
        this.principalMonomios.map(monomio => {
            monomio.coeficiente *= -1;
        });
    }

    public moverMonomioAPrincipal(): void {
        this.monomios.map(monomio => {
            monomio.coeficiente *= -1;
            this.principalMonomios.push(monomio);
        });
        this.monomios = [new Monomio(0)];

    }

    public sumarPolinomio(polinomio: Polinomio): void {
        polinomio.monomios.forEach(monomio => {
            this.agregarMonomio(monomio);
        });
    }

    public multiplicar(numero: number): void {
        this.principalMonomios.map(monomio => {           
            monomio.coeficiente *= numero;                               
        });
        this.monomios.map(monomio => {           
            monomio.coeficiente *= numero;          
        });
    }

    public existeVariable(variable: string = 'a'): boolean {
        const regex: RegExp = new RegExp(`^${variable}\\d+$`); // a2 a5 a10 //aa24 ab455
        for (const monomio of this.monomios) {
            if (monomio.getVariable() == undefined) {
                continue;
            }
            if (monomio.getVariable() == variable || regex.test(monomio.getVariable()!)) {
                return true;
            }
        }
        return false;
    }

    obtenerVariablesDisponibles(): string[] {
        const variablesDisponibles: string[] = [];
        for (const monomio of this.principalMonomios) {
            variablesDisponibles.push(monomio.getVariable() ?? '');
        }
        for (const monomio of this.monomios) {
            variablesDisponibles.push(monomio.getVariable() ?? '');
        }
        return variablesDisponibles;
    }

    evaluar(x: number): number {
        let resultado = 0;
        for(const monomio of this.monomios)
        {
            resultado += monomio.evaluar(x);
        }
        return resultado;
    }

    clonar(): Polinomio {
    const copia = new Polinomio(); // Llama al constructor por defecto
    // Clonamos los monomios
    copia.principalMonomios = this.principalMonomios.map(m => m.clonar());
    copia.monomios = this.monomios.map(m => m.clonar());
    return copia;
  }

  obtenerUltimoMonomio(): Monomio
  {
     return this.monomios[this.monomios.length - 1];
  }
    
    
  
public toStringPrincipal(voltear: boolean = false): string {
        let resultadoP = '';
        this.principalMonomios.forEach((monomio, index) => {
            if (index > 0 && monomio.coeficiente > 0) {
                resultadoP += '+';
            }
            resultadoP += monomio.toString();
        });
        if (resultadoP == '') {
            resultadoP = '0';
        }
        let resultadoM = '';
        this.monomios.forEach((monomio, index) => {
            if (monomio.coeficiente == 0 && monomio.getVariable())
                return;
            if (index > 0 && monomio.coeficiente > 0) {
                resultadoM += '+';
            }
            resultadoM += monomio.toString();
        }
        );
        if (resultadoM == '') {
            resultadoM = '0';
        }
        if (voltear) {
            return resultadoM + ' = ' + resultadoP;
        }
        return resultadoP + ' = ' + resultadoM;
    }

    public toString(): string {
        // TODO mejorar este metodo
        let resultado = '';
        let sinVar = false;
        this.monomios.forEach((monomio, index) => {
            if (monomio.coeficiente == 0 && monomio.getVariable()) { // Si el coeficiente es 0 y la variable no es undefined
                sinVar = true
                return;
            }
            if (index > 0 && monomio.coeficiente > 0 && !sinVar) {

                resultado += '+';
            }
            if(!sinVar && monomio.coeficiente == 0)
            {
                return;
            }
            resultado += monomio.toString();
        });

        if(resultado == '')
        {
           resultado = '0';
        }
        return resultado;
    }
}