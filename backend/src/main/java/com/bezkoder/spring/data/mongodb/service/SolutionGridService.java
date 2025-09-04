package com.bezkoder.spring.data.mongodb.service;

import com.bezkoder.spring.data.mongodb.model.Item;
import com.bezkoder.spring.data.mongodb.model.SolutionGrid;
import com.bezkoder.spring.data.mongodb.repository.SolutionGridRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;

@Service
public class SolutionGridService {

    private final SolutionGridRepository repository;
    private final ItemService itemService; // tu servicio existente para items

    public SolutionGridService(SolutionGridRepository repository, ItemService itemService) {
        this.repository = repository;
        this.itemService = itemService;
    }

    public SolutionGrid findOrCreateForToday() {
        LocalDate today = LocalDate.now(ZoneId.of("Europe/Madrid"));
        return findOrCreateForDate(today);
    }

    public SolutionGrid findOrCreateForDate(LocalDate date) {
        String dateStr = date.toString(); // ISO yyyy-MM-dd
        Optional<SolutionGrid> found = repository.findByDate(dateStr);
        if (found.isPresent()) {
            SolutionGrid sg = found.get();
            // asegura que 'cells' esté poblado (compatibilidad con documentos antiguos)
            if (sg.getCells() == null || sg.getCells().size() != 9) {
                populateCellsFromMainCells(sg);
                repository.save(sg);
            }
            return sg;
        }

        SolutionGrid generated = generateSolutionForDate(dateStr);
        return repository.save(generated);
    }

    private void populateCellsFromMainCells(SolutionGrid sg) {
        List<String> main = sg.getMainCells();
        List<String> cells = new ArrayList<>();
        for (int i = 0; i < 9; i++) cells.add(null);

        if (main == null) {
            sg.setCells(cells);
            return;
        }

        for (int start = 0; start < 9; start++) {
            String itemId = main.get(start);
            if (itemId == null) continue;
            // obtener item para conocer w/h (si existe)
            Optional<Item> maybeItem = itemService.findById(itemId);
            if (!maybeItem.isPresent()) {
                // si no existe el item en la BBDD, ponemos solo la main cell
                cells.set(start, itemId);
                continue;
            }
            Item item = maybeItem.get();
            int w = Math.max(1, item.getWidth());
            int h = Math.max(1, item.getHeight());
            int row = start / 3;
            int col = start % 3;
            for (int r = row; r < row + h; r++) {
                for (int c = col; c < col + w; c++) {
                    int idx = r * 3 + c;
                    if (idx >= 0 && idx < 9) cells.set(idx, itemId);
                }
            }
        }
        sg.setCells(cells);
    }

    private SolutionGrid generateSolutionForDate(String dateStr) {
        List<Item> items = itemService.findAll();
        // determinismo por fecha (sacar o no semilla según prefieras)
        //Collections.shuffle(items, new Random(dateStr.hashCode()));
        Collections.shuffle(items, new Random());
        
        boolean[] occupied = new boolean[9]; // 3x3 flattened
        List<String> mainCells = new ArrayList<>();
        List<String> cells = new ArrayList<>();
        for (int i = 0; i < 9; i++) { mainCells.add(null); cells.add(null); }

        for (Item item : items) {
            int w = Math.max(1, item.getWidth());
            int h = Math.max(1, item.getHeight());

            boolean placed = false;
            for (int row = 0; row <= 3 - h && !placed; row++) {
                for (int col = 0; col <= 3 - w && !placed; col++) {
                    // comprobar solapamiento
                    boolean ok = true;
                    for (int r = row; r < row + h && ok; r++) {
                        for (int c = col; c < col + w; c++) {
                            int idx = r * 3 + c;
                            if (occupied[idx]) { ok = false; break; }
                        }
                    }
                    if (ok) {
                        // marcar ocupadas las celdas cubiertas
                        for (int r = row; r < row + h; r++) {
                            for (int c = col; c < col + w; c++) {
                                int idx = r * 3 + c;
                                occupied[idx] = true;
                                cells.set(idx, item.getId()); // <-- marcamos la celda cubierta
                            }
                        }
                        // guardar el itemId en la main cell (row*3+col)
                        int startIdx = row * 3 + col;
                        mainCells.set(startIdx, item.getId());
                        placed = true;
                    }
                }
            }
        }

        SolutionGrid sg = new SolutionGrid();
        sg.setDate(dateStr);
        sg.setMainCells(mainCells);
        sg.setCells(cells);
        return sg;
    }
}
