/**
 * Valida una contraseña según las reglas del sistema:
 * - Mínimo 4 caracteres
 * - Solo letras y números (sin caracteres especiales)
 * - Sin 3 o más caracteres consecutivos (ej: 123, abc, cba, 321)
 *
 * Retorna un mensaje de error, o null si es válida.
 */
export function validarClave(clave: string): string | null {
  if (clave.length < 4) {
    return "La contraseña debe tener al menos 4 caracteres"
  }

  if (!/^[a-zA-Z0-9]+$/.test(clave)) {
    return "Solo se permiten letras y números"
  }

  for (let i = 0; i < clave.length - 2; i++) {
    const a = clave.charCodeAt(i)
    const b = clave.charCodeAt(i + 1)
    const c = clave.charCodeAt(i + 2)
    const ascendente = b === a + 1 && c === b + 1
    const descendente = b === a - 1 && c === b - 1
    if (ascendente || descendente) {
      return "La contraseña no puede contener secuencias consecutivas (ej: 123, abc, 321)"
    }
  }

  return null
}
