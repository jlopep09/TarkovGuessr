// src/utils/gridUtils.js
// Funciones puras para la lógica del grid (no tocan React state, devuelven nuevos arrays)

export const getGridPosition = (index, cols = 3) => ({
  row: Math.floor(index / cols),
  col: index % cols
});

export const getGridIndex = (row, col, cols = 3) => row * cols + col;

/**
 * canPlaceItem(item, startRow, startCol, currentGrid, cols = 3)
 * Comprueba si un item (con width, height) cabe en el grid sin overlap ni salirse.
 * currentGrid es un array (posibles null o objetos).
 */
export const canPlaceItem = (item, startRow, startCol, currentGrid, cols = 3) => {
  if (!item) return false;
  if (startRow < 0 || startCol < 0) return false;
  if (startRow + item.height > cols) return false;
  if (startCol + item.width > cols) return false;

  for (let row = startRow; row < startRow + item.height; row++) {
    for (let col = startCol; col < startCol + item.width; col++) {
      const index = getGridIndex(row, col, cols);
      if (currentGrid[index] !== null) {
        return false;
      }
    }
  }
  return true;
};

/**
 * placeItemOnGrid(currentGrid, item, startRow, startCol, cols = 3)
 * Devuelve un nuevo array con el item colocado (marca isMainCell y origen).
 */
export const placeItemOnGrid = (currentGrid, item, startRow, startCol, cols = 3) => {
  const newGrid = [...currentGrid];

  for (let row = startRow; row < startRow + item.height; row++) {
    for (let col = startCol; col < startCol + item.width; col++) {
      const index = getGridIndex(row, col, cols);
      newGrid[index] = {
        ...item,
        isMainCell: row === startRow && col === startCol,
        originRow: startRow,
        originCol: startCol
      };
    }
  }

  return newGrid;
};

/**
 * removeItemFromGrid(currentGrid, originRow, originCol, cols = 3)
 * Devuelve un nuevo array con las celdas del item (referenciado por su origen) puestas a null.
 */
export const removeItemFromGrid = (currentGrid, originRow, originCol, cols = 3) => {
  const newGrid = [...currentGrid];
  const originIndex = getGridIndex(originRow, originCol, cols);
  const item = newGrid[originIndex];

  if (!item) return newGrid;

  for (let row = originRow; row < originRow + item.height; row++) {
    for (let col = originCol; col < originCol + item.width; col++) {
      const index = getGridIndex(row, col, cols);
      newGrid[index] = null;
    }
  }

  return newGrid;
};

/**
 * getGridPositionFromMouse(gridRef, slotSize, slotGap, clientX, clientY, cols = 3)
 * Convierte coordenadas del mouse a row/col relativas al grid DOM.
 * Devuelve {row, col} o null si está fuera.
 */
export const getGridPositionFromMouse = (gridRef, slotSize, slotGap, clientX, clientY, cols = 3) => {
  if (!gridRef || !gridRef.current) return null;

  const gridRect = gridRef.current.getBoundingClientRect();
  const relativeX = clientX - gridRect.left;
  const relativeY = clientY - gridRect.top;

  const col = Math.floor(relativeX / (slotSize + slotGap));
  const row = Math.floor(relativeY / (slotSize + slotGap));

  if (row >= 0 && row < cols && col >= 0 && col < cols) {
    return { row, col };
  }

  return null;
};
