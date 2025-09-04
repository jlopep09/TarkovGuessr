// src/components/PouchGrid.jsx
import React, { useState, useRef, useEffect } from 'react';

import {
  getGridIndex,
  canPlaceItem,
  placeItemOnGrid,
  removeItemFromGrid,
  getGridPositionFromMouse
} from './gridUtils';

const PouchGrid = () => {
  const [craftingGrid, setCraftingGrid] = useState(Array(9).fill(null));
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [dragPosition, setDragPosition] = useState({ x: -9999, y: -9999 });
  const [previewPosition, setPreviewPosition] = useState(null);
  const [showDragged, setShowDragged] = useState(false);
  const [availableItems, setAvailableItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [guessing, setGuessing] = useState(false); // estado para la petición Guess

  const gridRef = useRef(null);
  const SLOT_SIZE = 60;
  const SLOT_GAP = 2;

  // ------------------- FETCH ITEMS DESDE BACKEND -------------------
  useEffect(() => {
    const fetchItems = async () => {
      try {
        setLoading(true);
        setError(null);

        // Si tu backend corre en Docker Compose y tu frontend está en otro contenedor,
        // asegúrate de usar el nombre del servicio como hostname.
        const response = await fetch('https://api.tarkov.joselp.com/api/items'); 
        if (!response.ok) throw new Error(`Error ${response.status}`);

        const data = await response.json();
        setAvailableItems(data);
      } catch (err) {
        console.error('Error fetching items:', err);
        setError(err.message || 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, []);

  // ------------------- HANDLERS (igual que antes) -------------------
  const handleItemMouseDown = (e, item) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    setDraggedItem({ ...item, fromInventory: true });
    setShowDragged(false);
    const offset = {
      x: e.clientX - rect.left - rect.width / 2,
      y: e.clientY - rect.top - rect.height / 2
    };
    setDragOffset(offset);
    setDragPosition({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleGridItemMouseDown = (e, row, col) => {
    e.preventDefault();
    const index = getGridIndex(row, col);
    const item = craftingGrid[index];
    if (!item || !item.isMainCell) return;

    const rect = e.currentTarget.getBoundingClientRect();
    setDraggedItem({ ...item, fromGrid: true, originalRow: row, originalCol: col });
    setShowDragged(false);
    const offset = {
      x: e.clientX - rect.left - rect.width / 2,
      y: e.clientY - rect.top - rect.height / 2
    };
    setDragOffset(offset);
    setDragPosition({ x: e.clientX - offset.x, y: e.clientY - offset.y });

    setCraftingGrid(removeItemFromGrid(craftingGrid, row, col));
  };

  const handleMouseMove = (e) => {
    if (!draggedItem) return;
    if (!showDragged) setShowDragged(true);
    setDragPosition({ x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y });

    const gridPos = getGridPositionFromMouse(gridRef, SLOT_SIZE, SLOT_GAP, e.clientX, e.clientY);
    if (gridPos) {
      const canPlace = canPlaceItem(draggedItem, gridPos.row, gridPos.col, craftingGrid);
      setPreviewPosition(canPlace ? gridPos : null);
    } else {
      setPreviewPosition(null);
    }
  };

  const handleMouseUp = (e) => {
    if (!draggedItem) return;

    const gridPos = getGridPositionFromMouse(gridRef, SLOT_SIZE, SLOT_GAP, e.clientX, e.clientY);
    if (gridPos && canPlaceItem(draggedItem, gridPos.row, gridPos.col, craftingGrid)) {
      setCraftingGrid(placeItemOnGrid(craftingGrid, draggedItem, gridPos.row, gridPos.col));
    } else if (draggedItem.fromGrid) {
      setCraftingGrid(placeItemOnGrid(craftingGrid, draggedItem, draggedItem.originalRow, draggedItem.originalCol));
    }

    setDraggedItem(null);
    setPreviewPosition(null);
    setShowDragged(false);
    setDragPosition({ x: -9999, y: -9999 });
  };

  const clearGrid = () => {
    setCraftingGrid(Array(9).fill(null));
  };

  // ------------------ Aplicar resultado del guess ------------------
  const applyGuessResult = (result) => {
    // result.correctCells => array de { index, row, col, itemId, coveredIndices }
    if (!result || !Array.isArray(result.correctCells)) {
      // si no vienen correctCells, limpiamos todo
      setCraftingGrid(Array(9).fill(null));
      return;
    }

    // Construimos un nuevo grid vacío
    let newGrid = Array(9).fill(null);

    // Por cada correctCell colocamos el item correspondiente usando placeItemOnGrid
    for (const cc of result.correctCells) {
      const mainIdx = cc.index;
      const itemId = cc.itemId;

      // Intentar obtener el objeto item desde el craftingGrid actual (preferible)
      let itemObj = craftingGrid[mainIdx];

      // Si no está ahí, buscar en availableItems
      if (!itemObj || itemObj.id !== itemId) {
        const catalogItem = availableItems.find(ai => ai.id === itemId);
        if (catalogItem) {
          // clonamos y marcamos isMainCell
          itemObj = { ...catalogItem, isMainCell: true };
        } else {
          // fallback: construimos un objeto mínimo para poder colocarlo
          itemObj = { id: itemId, name: '', width: 1, height: 1, isMainCell: true, color: '#4B5563', emoji: '' };
        }
      } else {
        // si vino del craftingGrid, asegurarnos de tener isMainCell = true
        itemObj = { ...itemObj, isMainCell: true };
      }

      // marcar como correcto para que la UI le ponga el identificador verde
      itemObj.isCorrect = true;

      // Colocar el item en newGrid usando placeItemOnGrid (evita conflictos y rellena celdas cubiertas)
      newGrid = placeItemOnGrid(newGrid, itemObj, cc.row, cc.col);
    }

    setCraftingGrid(newGrid);
  };

  // ------------------ Handler para Guess ------------------
  const handleGuess = async () => {
    try {
      setGuessing(true);

      // Serializamos el estado actual del grid en una forma segura para enviar.
      // Cada celda será null o un objeto mínimo con los campos más relevantes.
      const payloadGrid = craftingGrid.map(item => {
        if (!item) return null;
        return {
          id: item.id,
          name: item.name,
          width: item.width,
          height: item.height,
          isMainCell: item.isMainCell
        };
      });

      const response = await fetch('http://localhost:6868/api/guess', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ grid: payloadGrid })
      });

      // Intentamos leer JSON (si el backend responde con JSON)
      if (!response.ok) {
        // mostrar error y, si hay body, intentar extraerlo
        let text;
        try { text = await response.text(); } catch { text = `<no body>`; }
        console.error(`Guess request failed: ${response.status} ${response.statusText}`, text);
        return;
      }

      const result = await response.json();
      console.log('Guess response:', result);

      // Aplicar el resultado al grid (conservar correctos, eliminar incorrectos)
      applyGuessResult(result);
    } catch (err) {
      console.error('Error sending guess:', err);
    } finally {
      setGuessing(false);
    }
  };

  // ----------------- Subcomponentes (mismo archivo) -----------------

  // GridArea: slots, items y preview
  const GridArea = ({ craftingGrid, gridRef, previewPosition, draggedItem, onGridItemMouseDown }) => {
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
      <div className="mb-2">
        <h2 className="text-xl font-semibold text-white mb-4">Secure container Gamma</h2>
        <div
          ref={gridRef}
          className="relative bg-neutral-900 rounded-lg inline-block border-3 mx-auto"
          style={{
            width: `${3 * SLOT_SIZE + 2 * SLOT_GAP}px`,
            height: `${3 * SLOT_SIZE + 2 * SLOT_GAP}px`,
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
                  left: `${col * (SLOT_SIZE + SLOT_GAP)}px`,
                  top: `${row * (SLOT_SIZE + SLOT_GAP)}px`,
                  width: `${SLOT_SIZE}px`,
                  height: `${SLOT_SIZE}px`,
                  zIndex: 1,
                }}
              />
            );
          })}

          {/* Items - capa superior (solo main cells) */}
          {craftingGrid.map((item, index) => {
            if (!item || !item.isMainCell) return null;

            const row = Math.floor(index / 3);
            const col = index % 3;

            return (
              <div
                key={`item-${item.id}-${index}`}
                className="absolute flex items-center justify-center font-bold rounded cursor-pointer hover:brightness-110 transition-all select-none"
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
                onMouseDown={(e) => onGridItemMouseDown(e, row, col)}
                title={`${item.name} (${item.width}x${item.height})`}
              >
                {/* Identificador verde si es correcto */}
                {item.isCorrect && (
                  <div className="absolute top-1 right-1 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center"
                       style={{ backgroundColor: '#34D399', zIndex: 20 }}>
                    {/* pequeño check opcional */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 20 20" fill="white">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414L8.414 15 5.293 11.879a1 1 0 011.414-1.414L8.414 12.172l6.879-6.879a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}

                <div className="text-center h-full">
                  <div className="text-2xl w-full p-0 h-full flex flex-col justify-center align-middle items-center ">
                    <img className='h-full object-cover' src={item.emoji} alt={item.name} />
                  </div>
                  <div className="text-xs hidden">{item.width}x{item.height}</div>
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
    );
  };

  // Controls: limpia mochila y guess
  const Controls = ({ onClear, onGuess, guessing }) => (
    <div className="mb-4">
      <button
        onClick={onGuess}
        disabled={guessing}
        className={`bg-green-700 hover:bg-green-900 text-white px-4 w-20 mr-2 py-2 rounded font-semibold transition-colors ${guessing ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {guessing ? 'Guessing...' : 'Guess'}
      </button>
      <button
        onClick={onClear}
        className="bg-red-700 hover:bg-red-900 text-white px-4 py-2 w-20 rounded font-semibold transition-colors"
      >
        Clear
      </button>
    </div>
  );

  // AvailableItemsBar: barra de items disponibles
  const AvailableItemsBar = ({ items, onItemMouseDown }) => (
    <div>
      <h2 className="text-xl font-semibold text-white mb-4">Items</h2>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 bg-neutral-900 p-6 rounded-lg">
        {items.map((item) => (
          <div
            key={item.id}
            className="relative bg-neutral-700 border-2 border-neutral-600 rounded cursor-grab active:cursor-grabbing hover:bg-neutral-600 transition-colors p-3"
            onMouseDown={(e) => onItemMouseDown(e, item)}
            style={{ backgroundColor: item.color }}
            title={`${item.name} (${item.width}x${item.height})`}
          >
            <div className="text-center text-white select-none pointer-events-none">
              <div className="text-2xl mb-1 w-12 h-12 "><img className='w-12 h-12 object-contain' src={item.emoji} alt={item.name} /></div>
              <div className="text-xs font-semibold">{item.name}</div>
              <div className="text-xs opacity-75">{item.width}x{item.height}</div>
            </div>
          </div>
        ))}
      </div>
      <p className="text-neutral-300 text-md mt-2">
        Drag items into your backpack. Items take up different spaces depending on their size. 
      </p>
      <p className="text-neutral-400 text-xs mt-2">Any suggestions or reports can be sent through the contact information found at <a className='text-neutral-300' target='_blank' href='https://joselp.com/'>my web</a></p>
    </div>
  );

  // DraggedItemOverlay: muestra el item arrastrado (fixed)
  const DraggedItemOverlay = ({ draggedItem, showDragged, dragPosition }) => {
    if (!draggedItem) return null;

    return (
      <div
        id="dragged-item"
        className="fixed pointer-events-none z-50 rounded shadow-2xl border-2 border-white border-opacity-50"
        style={{
          left: `${dragPosition.x}px`,
          top: `${dragPosition.y}px`,
          width: `${draggedItem.width * 50}px`,
          height: `${draggedItem.height * 50}px`,
          backgroundColor: draggedItem.color || '#4B5563',
          visibility: showDragged ? 'visible' : 'hidden'
        }}
      >
        <div className="w-full h-full flex items-center justify-center text-white font-bold">
          <div className="text-center">
            <div className="text-2xl"><img src={draggedItem.emoji} alt="" /></div>
            <div className="text-xs ">{draggedItem.width}x{draggedItem.height}</div>
          </div>
        </div>
      </div>
    );
  };

  // StatusPanel: muestra estado actual del grid
  const StatusPanel = ({ craftingGrid }) => (
    <div className="mt-8 bg-neutral-800 rounded-lg p-4 hidden">
      <h3 className="text-lg font-semibold text-white mb-2">Estado Actual:</h3>
      <div className="text-neutral-300">
        <p>Slots ocupados: {craftingGrid.filter(item => item !== null).length}/9</p>
        <p>Items únicos: {craftingGrid.filter(item => item !== null && item.isMainCell).length}</p>
      </div>
    </div>
  );

  // ------------------ JSX (maquetado principal) ------------------
  return (
    <div
      className=""
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="w-full">
        <div className="bg-neutral-800 rounded-lg py-6 shadow-2xl">
          {/* Sección GRID */}
          <GridArea
            craftingGrid={craftingGrid}
            gridRef={gridRef}
            previewPosition={previewPosition}
            draggedItem={draggedItem}
            onGridItemMouseDown={handleGridItemMouseDown}
          />

          {/* Controls (limpiar) */}
          <Controls onClear={clearGrid} onGuess={handleGuess} guessing={guessing} />

          {/* Barra de items disponibles */}
          <AvailableItemsBar items={availableItems} onItemMouseDown={handleItemMouseDown} />
        </div>

        {/* Elemento siendo arrastrado (overlay controlado por state) */}
        <DraggedItemOverlay draggedItem={draggedItem} showDragged={showDragged} dragPosition={dragPosition} />

        {/* Información del estado actual */}
        <StatusPanel craftingGrid={craftingGrid} />
      </div>
    </div>
  );
};

export default PouchGrid;
