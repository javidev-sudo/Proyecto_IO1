export interface Operacion {
    variables: number[];
    restricciones: Restriccion[];
}

export interface Restriccion {
    operador: string;
    resultado: number;
    variables: number[];
}