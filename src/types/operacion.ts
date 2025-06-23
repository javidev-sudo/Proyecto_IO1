export interface Operacion { // w = 45x1 + 4x2 .....
    variables: number[]; // FUNCION OBJETIVA
    restricciones: Restriccion[]; // RESTRICCIONES
}

export interface Restriccion { 
    operador: string; // >= <= =
    resultado: number; // 12x1 >= 12
    variables: number[]; // 12x1
}