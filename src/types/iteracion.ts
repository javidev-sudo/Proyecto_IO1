import type { Polinomio } from "./polinomio";

export type Iteracion = {
    numeroIteracion: number;
    filaPivote: number;
    columnaPivote: number;
    matriz: (number|Polinomio)[][];
    variablesEntrada: String[];
    variablesColumna?: String[];
    funcionPenalizada?: Polinomio;
    functionObjetivos?: Polinomio[];
};