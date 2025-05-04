export class Fraccion {
    numerador: number;
    denominador: number;
    constructor(numerador: number, denominador: number) {
        this.numerador = numerador;
        this.denominador = denominador;
    }

    sumar(f: Fraccion, f2: Fraccion): Fraccion {
        f.numerador = f.numerador + f2.numerador;
        f.denominador = f.denominador + f2.denominador;
        return f;
    }

    
}