import type { Iteracion } from "./iteracion"

export type TablasIteracion = {
    iteraciones: Iteracion[],
    variablesColumna?: string[],
    variablesFila: string[],
    mensaje?: string,
    resultado?: number;
    variableSalida?: Map<String, number>;
}