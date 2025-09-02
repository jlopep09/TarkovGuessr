import React, { useState, useRef } from 'react';

const PouchGrid = () => {
  // Estado de la mesa de crafteo (3x3)
  const [craftingGrid, setCraftingGrid] = useState(
    Array(9).fill(null) // 9 slots vacíos
  );

  // Items disponibles con diferentes tamaños
  const availableItems = [
    { id: 'sword', name: 'Espada', color: '#C0C0C0', emoji: '⚔️', width: 1, height: 3 },
    { id: 'shield', name: 'Escudo', color: '#8B4513', emoji: '🛡️', width: 2, height: 2 },
    { id: 'potion', name: 'Poción', color: '#FF6B6B', emoji: '🧪', width: 1, height: 1 },
    { id: 'bow', name: 'Arco', color: '#8B4513', emoji: '🏹', width: 1, height: 2 },
    { id: 'scroll', name: 'Pergamino', color: '#F4E4BC', emoji: '📜', width: 2, height: 1 },
    { id: 'gem', name: 'Gema', color: '#9932CC', emoji: '💎', width: 1, height: 1 },
    { id: 'staff', name: 'Bastón', color: '#4169E1', emoji: '🪄', width: 1, height: 3 },
    { id: 'tome', name: 'Tomo', color: '#228B22', emoji: '📚', width: 2, height: 2 },
    { id: 'ring', name: 'Anillo', color: '#FFD700', emoji: '💍', width: 1, height: 1 },
    { id: 'spear', name: 'Lanza', color: '#8B4513', emoji: '🔱', width: 3, height: 1 },
  ];

  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [previewPosition, setPreviewPosition] = useState(null);
  const gridRef = useRef(null);

  const SLOT_SIZE = 60;
  const SLOT_GAP = 2;

  // Convertir índice a coordenadas de fila/columna
  const getGridPosition = (index) => ({
    row: Math.floor(index / 3),
    col: index % 3
  });

  // Convertir coordenadas a índice
  const getGridIndex = (row, col) => row * 3 + col;

  // Verificar si un item puede colocarse en una posición específica
  const canPlaceItem = (item, startRow, startCol, currentGrid = craftingGrid) => {
    // Verificar que no se salga del grid
    if (startRow < 0 || startCol < 0 || 
        startRow + item.height > 3 || 
        startCol + item.width > 3) {
      return false;
    }

    // Verificar que todas las celdas necesarias estén vacías
    for (let row = startRow; row < startRow + item.height; row++) {
      for (let col = startCol; col < startCol + item.width; col++) {
        const index = getGridIndex(row, col);
        if (currentGrid[index] !== null) {
          return false;
        }
      }
    }

    return true;
  };

  // Colocar item en el grid
  const placeItem = (item, startRow, startCol) => {
    const newGrid = [...craftingGrid];
    
    for (let row = startRow; row < startRow + item.height; row++) {
      for (let col = startCol; col < startCol + item.width; col++) {
        const index = getGridIndex(row, col);
        newGrid[index] = {
          ...item,
          isMainCell: row === startRow && col === startCol,
          originRow: startRow,
          originCol: startCol
        };
      }
    }
    
    setCraftingGrid(newGrid);
  };

  // Remover item del grid
  const removeItem = (originRow, originCol) => {
    const newGrid = [...craftingGrid];
    
    // Encontrar el item en la posición origen
    const originIndex = getGridIndex(originRow, originCol);
    const item = newGrid[originIndex];
    
    if (!item) return newGrid;

    // Limpiar todas las celdas ocupadas por el item
    for (let row = originRow; row < originRow + item.height; row++) {
      for (let col = originCol; col < originCol + item.width; col++) {
        const index = getGridIndex(row, col);
        newGrid[index] = null;
      }
    }
    
    return newGrid;
  };

  // Detectar posición del mouse en el grid
  const getGridPositionFromMouse = (clientX, clientY) => {
    if (!gridRef.current) return null;

    const gridRect = gridRef.current.getBoundingClientRect();
    const relativeX = clientX - gridRect.left;
    const relativeY = clientY - gridRect.top;

    const col = Math.floor(relativeX / (SLOT_SIZE + SLOT_GAP));
    const row = Math.floor(relativeY / (SLOT_SIZE + SLOT_GAP));

    if (row >= 0 && row < 3 && col >= 0 && col < 3) {
      return { row, col };
    }

    return null;
  };

  // Iniciar drag desde la barra de items
  const handleItemMouseDown = (e, item) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    setDraggedItem({...item, fromInventory: true});
    setDragOffset({
      x: e.clientX - rect.left - rect.width / 2,
      y: e.clientY - rect.top - rect.height / 2
    });
  };

  // Iniciar drag desde el grid
  const handleGridItemMouseDown = (e, row, col) => {
    e.preventDefault();
    const index = getGridIndex(row, col);
    const item = craftingGrid[index];
    
    if (!item || !item.isMainCell) return;

    const rect = e.currentTarget.getBoundingClientRect();
    setDraggedItem({...item, fromGrid: true, originalRow: row, originalCol: col});
    setDragOffset({
      x: e.clientX - rect.left - rect.width / 2,
      y: e.clientY - rect.top - rect.height / 2
    });

    // Remover item del grid temporalmente
    setCraftingGrid(removeItem(row, col));
  };

  // Manejar movimiento del mouse
  const handleMouseMove = (e) => {
    if (!draggedItem) return;

    // Actualizar posición del elemento arrastrado
    const dragElement = document.getElementById('dragged-item');
    if (dragElement) {
      dragElement.style.left = `${e.clientX - dragOffset.x}px`;
      dragElement.style.top = `${e.clientY - dragOffset.y}px`;
    }

    // Mostrar preview de colocación
    const gridPos = getGridPositionFromMouse(e.clientX, e.clientY);
    if (gridPos) {
      const canPlace = canPlaceItem(draggedItem, gridPos.row, gridPos.col);
      setPreviewPosition(canPlace ? gridPos : null);
    } else {
      setPreviewPosition(null);
    }
  };

  // Soltar elemento
  const handleMouseUp = (e) => {
    if (!draggedItem) return;

    const gridPos = getGridPositionFromMouse(e.clientX, e.clientY);
    
    if (gridPos && canPlaceItem(draggedItem, gridPos.row, gridPos.col)) {
      // Colocar item en la nueva posición
      placeItem(draggedItem, gridPos.row, gridPos.col);
    } else if (draggedItem.fromGrid) {
      // Si venía del grid y no se puede colocar, devolverlo a su posición original
      placeItem(draggedItem, draggedItem.originalRow, draggedItem.originalCol);
    }

    setDraggedItem(null);
    setPreviewPosition(null);
  };

  // Limpiar grid
  const clearGrid = () => {
    setCraftingGrid(Array(9).fill(null));
  };

  // Renderizar preview de colocación
  const renderPreview = () => {
    if (!previewPosition || !draggedItem) return null;

    const previews = [];
    for (let row = previewPosition.row; row < previewPosition.row + draggedItem.height; row++) {
      for (let col = previewPosition.col; col < previewPosition.col + draggedItem.width; col++) {
        previews.push(
          <div
            key={`preview-${row}-${col}`}
            className="absolute bg-green-400 bg-opacity-30 border-2 border-green-400 rounded pointer-events-none"
            style={{
              left: `${col * (SLOT_SIZE + SLOT_GAP)}px`,
              top: `${row * (SLOT_SIZE + SLOT_GAP)}px`,
              width: `${SLOT_SIZE}px`,
              height: `${SLOT_SIZE}px`,
            }}
          />
        );
      }
    }
    return previews;
  };

  return (
    <div 
      className="min-h-screen"
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="w-full">
        
        <div className="bg-neutral-800 rounded-lg py-6 shadow-2xl">
          {/* Mesa de crafteo 3x3 */}
          <div className="mb-2">
            <h2 className="text-xl font-semibold text-white mb-4">Secure container Gamma</h2>
            <div 
              ref={gridRef}
              className="relative bg-neutral-900 rounded-lg inline-block border-3 mx-auto"
              style={{ 
                width: `${3 * SLOT_SIZE + 2 * SLOT_GAP }px`,
                height: `${3 * SLOT_SIZE + 2 * SLOT_GAP }px`,
                padding: `${92}px`
              }}
            >
              {/* Slots del grid - capa de fondo */}
              {Array.from({ length: 9 }, (_, index) => {
                const row = Math.floor(index / 3);
                const col = index % 3;
                
                return (
                  <div
                    key={`slot-${index}`}
                    className="absolute bg-neutral-700 border border-neutral-600 rounded"
                    style={{
                      left: `${col * (SLOT_SIZE + SLOT_GAP) }px`,
                      top: `${row * (SLOT_SIZE + SLOT_GAP)}px`,
                      width: `${SLOT_SIZE}px`,
                      height: `${SLOT_SIZE}px`,
                      zIndex: 1,
                    }}
                  />
                );
              })}
              
              {/* Items - capa superior */}
              {craftingGrid.map((item, index) => {
                if (!item || !item.isMainCell) return null;
                
                const row = Math.floor(index / 3);
                const col = index % 3;
                
                return (
                  <div
                    key={`item-${item.id}-${index}`}
                    className="absolute flex items-center justify-center text-white font-bold rounded cursor-pointer hover:brightness-110 transition-all select-none"
                    style={{
                      left: `${col * (SLOT_SIZE + SLOT_GAP)}px`,
                      top: `${row * (SLOT_SIZE + SLOT_GAP)}px`,
                      width: `${item.width * SLOT_SIZE + (item.width - 1) * SLOT_GAP}px`,
                      height: `${item.height * SLOT_SIZE + (item.height - 1) * SLOT_GAP}px`,
                      backgroundColor: item.color || '#4B5563',
                      border: '2px solid rgba(255,255,255,0.3)',
                      fontSize: `${Math.min(item.width, item.height) * 16}px`,
                      zIndex: 10,
                    }}
                    onMouseDown={(e) => handleGridItemMouseDown(e, row, col)}
                    title={`${item.name} (${item.width}x${item.height})`}
                  >
                    <div className="text-center">
                      <div className="text-2xl">{item.emoji}</div>
                      <div className="text-xs">{item.width}x{item.height}</div>
                    </div>
                  </div>
                );
              })}
              
              {/* Preview de colocación - capa media */}
              <div style={{ zIndex: 5 }}>
                {renderPreview()}
              </div>
            </div>
          </div>

          {/* Botón limpiar */}
          <div className="mb-8">
            <button
              onClick={clearGrid}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-semibold transition-colors"
            >
              Limpiar Mochila
            </button>
          </div>

          {/* Barra de items disponibles */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-4">Items Disponibles</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 bg-neutral-900 p-6 rounded-lg">
              {availableItems.map((item) => (
                <div
                  key={item.id}
                  className="relative bg-neutral-700 border-2 border-neutral-600 rounded cursor-grab active:cursor-grabbing hover:bg-neutral-600 transition-colors p-3"
                  onMouseDown={(e) => handleItemMouseDown(e, item)}
                  style={{ backgroundColor: item.color }}
                  title={`${item.name} (${item.width}x${item.height})`}
                >
                  <div className="text-center text-white select-none pointer-events-none">
                    <div className="text-2xl mb-1">{item.emoji}</div>
                    <div className="text-xs font-semibold">{item.name}</div>
                    <div className="text-xs opacity-75">{item.width}x{item.height}</div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-neutral-400 text-sm mt-2">
              Arrastra los items hacia la mochila. Los items ocupan diferentes espacios según su tamaño.
            </p>
          </div>
        </div>

        {/* Elemento siendo arrastrado */}
        {draggedItem && (
          <div
            id="dragged-item"
            className="fixed pointer-events-none z-50 rounded shadow-2xl border-2 border-white border-opacity-50"
            style={{
              left: '0px',
              top: '0px',
              width: `${draggedItem.width * 50}px`,
              height: `${draggedItem.height * 50}px`,
              backgroundColor: draggedItem.color || '#4B5563',
            }}
          >
            <div className="w-full h-full flex items-center justify-center text-white font-bold">
              <div className="text-center">
                <div className="text-2xl">{draggedItem.emoji}</div>
                <div className="text-xs">{draggedItem.width}x{draggedItem.height}</div>
              </div>
            </div>
          </div>
        )}

        {/* Información del estado actual */}
        <div className="mt-8 bg-neutral-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-white mb-2">Estado Actual:</h3>
          <div className="text-neutral-300">
            <p>Slots ocupados: {craftingGrid.filter(item => item !== null).length}/9</p>
            <p>Items únicos: {craftingGrid.filter(item => item !== null && item.isMainCell).length}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PouchGrid;