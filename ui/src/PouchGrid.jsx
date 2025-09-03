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
        const response = await fetch('http://localhost:6868/api/items'); 
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
                onMouseDown={(e) => onGridItemMouseDown(e, row, col)}
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
    );
  };

  // Controls: limpia mochila
  const Controls = ({ onClear }) => (
    <div className="mb-4">
      <button
        onClick={onClear}
        className="bg-green-700 hover:bg-green-900 text-white px-4 w-20 mr-2 py-2 rounded font-semibold transition-colors"
      >
        Guess
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
      <h2 className="text-xl font-semibold text-white mb-4">Items Disponibles</h2>
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
            <div className="text-2xl">{draggedItem.emoji}</div>
            <div className="text-xs">{draggedItem.width}x{draggedItem.height}</div>
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
          <Controls onClear={clearGrid} />

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
