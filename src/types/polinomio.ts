import { Monomio } from './monomio';

export class Polinomio {

    public monomios: Monomio[];
    public principalMonomios: Monomio[] = [];
    // [-w, +x1, 3X2, -2X3, 4X4] = []

    constructor(variable: string = 'W') {
        this.principalMonomios = [new Monomio(1, variable)];
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

        this.monomios = [];
        
    }

    public sumarPolinomio(polinomio: Polinomio): void {
        polinomio.monomios.forEach(monomio => {
            this.agregarMonomio(monomio);
        });
    }

    public toString(): string {
        let resultado = '';
        this.principalMonomios.forEach((monomio, index) => {
            if (index > 0 && monomio.coeficiente >= 0) {
                resultado += '+';
            }
            resultado += monomio.toString();
        });
        resultado += ' = ';
        this.monomios.forEach((monomio, index) => {
            if (index > 0 && monomio.coeficiente >= 0) {
                resultado += '+';
            }
            resultado += monomio.toString();
        });
        return resultado;
    }
}