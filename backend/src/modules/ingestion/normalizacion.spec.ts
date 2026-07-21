// Ejemplo de test unitario para la normalización (amplía en el desarrollo real).
describe('normalización de número de documento', () => {
  it('elimina puntos', () => {
    expect('1.020.304.050'.replace(/[.\s]/g, '')).toBe('1020304050');
  });
});
