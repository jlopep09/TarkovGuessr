package com.bezkoder.spring.data.mongodb.dto;

import java.util.List;

public class GuessRequest {
    // Se espera un array de 9 objetos (o nulls). Cada objeto puede contener 'id' y 'isMainCell' (según frontend).
    private List<CellDTO> grid;

    public List<CellDTO> getGrid() { return grid; }
    public void setGrid(List<CellDTO> grid) { this.grid = grid; }

    public static class CellDTO {
        private String id; // id del item (si existe)
        private Boolean isMainCell;

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }

        public Boolean getIsMainCell() { return isMainCell; }
        public void setIsMainCell(Boolean isMainCell) { this.isMainCell = isMainCell; }
    }
}
