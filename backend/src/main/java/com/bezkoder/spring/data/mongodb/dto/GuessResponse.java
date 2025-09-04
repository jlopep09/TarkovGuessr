package com.bezkoder.spring.data.mongodb.dto;

import java.util.ArrayList;
import java.util.List;

public class GuessResponse {
    private boolean correct;
    private List<CorrectCell> correctCells = new ArrayList<>();

    public GuessResponse() {}

    public GuessResponse(boolean correct, List<CorrectCell> correctCells) {
        this.correct = correct;
        this.correctCells = correctCells;
    }

    public boolean isCorrect() { return correct; }
    public void setCorrect(boolean correct) { this.correct = correct; }

    public List<CorrectCell> getCorrectCells() { return correctCells; }
    public void setCorrectCells(List<CorrectCell> correctCells) { this.correctCells = correctCells; }

    public static class CorrectCell {
        private int index;   // main cell index 0..8 (donde está el item en el grid del jugador)
        private int row;     // row de la main cell
        private int col;     // col de la main cell
        private String itemId;
        private List<Integer> coveredIndices = new ArrayList<>(); // todas las celdas cubiertas por el item

        public CorrectCell() {}

        public CorrectCell(int index, int row, int col, String itemId, List<Integer> coveredIndices) {
            this.index = index;
            this.row = row;
            this.col = col;
            this.itemId = itemId;
            this.coveredIndices = coveredIndices;
        }

        // getters/setters...
        public int getIndex() { return index; }
        public void setIndex(int index) { this.index = index; }

        public int getRow() { return row; }
        public void setRow(int row) { this.row = row; }

        public int getCol() { return col; }
        public void setCol(int col) { this.col = col; }

        public String getItemId() { return itemId; }
        public void setItemId(String itemId) { this.itemId = itemId; }

        public List<Integer> getCoveredIndices() { return coveredIndices; }
        public void setCoveredIndices(List<Integer> coveredIndices) { this.coveredIndices = coveredIndices; }
    }
}
