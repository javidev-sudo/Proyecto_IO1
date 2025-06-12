export class Monomio {
  constructor(
    public coeficiente: number,
    protected variable: string|undefined = undefined,
    protected isM = false
  ) {}

    getCoeficiente(): number {
        return this.coeficiente;
    }
    getVariable(): string|undefined {
        return this.variable;
    }
    getIsM(): boolean {
        return this.isM;
    }

    evaluar(x: number): number {
        if(this.variable != undefined)
        {
            return this.coeficiente * x;
        }
        else
        {
            return this.coeficiente;
        }
    }

    public clonar(): Monomio {
    return new Monomio(this.coeficiente, this.variable, this.isM);
    }

    toString(): string {
        if (this.variable === undefined) {
            return this.coeficiente.toString();
        } else if (this.isM) {
            return `${this.coeficiente}M${this.variable}`;
        } else {
            return `${this.coeficiente.toString()}${this.variable}`;
        }
    }
}
