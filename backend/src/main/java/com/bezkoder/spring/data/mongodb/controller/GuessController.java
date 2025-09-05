package com.bezkoder.spring.data.mongodb.controller;

import com.bezkoder.spring.data.mongodb.dto.GuessRequest;
import com.bezkoder.spring.data.mongodb.dto.GuessResponse;
import com.bezkoder.spring.data.mongodb.dto.GuessResponse.CorrectCell;
import com.bezkoder.spring.data.mongodb.model.SolutionGrid;
import com.bezkoder.spring.data.mongodb.service.SolutionGridService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/api")
public class GuessController {

    private final SolutionGridService solutionGridService;

    public GuessController(SolutionGridService solutionGridService) {
        this.solutionGridService = solutionGridService;
    }

    @PostMapping("/guess")
    public ResponseEntity<GuessResponse> guess(@RequestBody GuessRequest request) {
        if (request == null || request.getGrid() == null || request.getGrid().size() != 9) {
            return ResponseEntity.badRequest().build();
        }

        LocalDate today = LocalDate.now(ZoneId.of("Europe/Madrid"));
        SolutionGrid solution = solutionGridService.findOrCreateForDate(today);

        List<CorrectCell> correctCells = new ArrayList<>();
        List<String> solutionMain = solution.getMainCells(); // mainCells (start positions)
        List<String> solutionCells = solution.getCells();     // coverage por celda 0..8

        // número de items en la solución (contando mainCells no-nulas)
        int solutionItemsCount = 0;
        for (String s : solutionMain) if (s != null) solutionItemsCount++;

        // Para cada índice 0..8, comprobar si el cliente puso una main cell ahí
        for (int i = 0; i < 9; i++) {
            GuessRequest.CellDTO cell = request.getGrid().get(i);
            if (cell == null) continue;
            String sentId = cell.getId();
            // sólo consideramos comparación si el cliente indica isMainCell (por seguridad)
            Boolean isMain = cell.getIsMainCell();
            if (isMain == null || !isMain) continue;

            // si en la solución en esa misma posición hay una main cell con el mismo id -> correcto
            String solMainId = (solutionMain != null && solutionMain.size() > i) ? solutionMain.get(i) : null;
            if (solMainId != null && Objects.equals(solMainId, sentId)) {
                // encontrar todas las posiciones cubiertas por ese item en solutionCells
                List<Integer> covered = new ArrayList<>();
                if (solutionCells != null) {
                    for (int j = 0; j < solutionCells.size(); j++) {
                        if (Objects.equals(solutionCells.get(j), solMainId)) {
                            covered.add(j);
                        }
                    }
                }
                int row = i / 3;
                int col = i % 3;
                correctCells.add(new CorrectCell(i, row, col, solMainId, covered));
            }
        }

        boolean allCorrect = (correctCells.size() == solutionItemsCount);

        GuessResponse resp = new GuessResponse(allCorrect, correctCells);
        return ResponseEntity.ok(resp);
    }
}
