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






    existeVariable(variable: string): boolean {
        const regex: RegExp = new RegExp(`^${variable}\\d+$`);
        if(this.getVariable === undefined)
        {
            return false;
        }
        if(this.getVariable() == variable || regex.test(this.getVariable()!))
        {
            return true;
        }
        return false;
        
    }

    toString(): string {
        const coeficienteDecimal = parseFloat(this.coeficiente.toFixed(4));
        if (this.variable === undefined) {
            return coeficienteDecimal.toString();
        } else if (this.isM) {
            if (coeficienteDecimal === 1) {
                return `M${this.variable}`;
            }
            return `${coeficienteDecimal}M${this.variable}`;
        } else {
            if (coeficienteDecimal === 1) {
                return `${this.variable}`;
            }
            if(coeficienteDecimal === 0)
            {
                return '';
            }
            return `${coeficienteDecimal}${this.variable}`;
        }
    }
}
