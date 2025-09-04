package com.bezkoder.spring.data.mongodb.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.ArrayList;
import java.util.List;

@Document(collection = "solution_grids")
public class SolutionGrid {
    @Id
    private String id;

    // Fecha en formato ISO (yyyy-MM-dd) para identificar el día
    private String date;

    // mainCells: itemId donde empieza (main cell) o null
    private List<String> mainCells = new ArrayList<>();

    // cells: itemId que ocupa cada casilla 0..8 (incluye las celdas "cubiertas" por items de tamaño >1)
    private List<String> cells = new ArrayList<>();

    public SolutionGrid() {
        // inicializar a 9 nulls
        this.mainCells = new ArrayList<>();
        this.cells = new ArrayList<>();
        for (int i = 0; i < 9; i++) {
            this.mainCells.add(null);
            this.cells.add(null);
        }
    }

    public SolutionGrid(String date, List<String> mainCells, List<String> cells) {
        this.date = date;
        this.mainCells = mainCells;
        this.cells = cells;
    }

    // getters / setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getDate() { return date; }
    public void setDate(String date) { this.date = date; }

    public List<String> getMainCells() { return mainCells; }
    public void setMainCells(List<String> mainCells) { this.mainCells = mainCells; }

    public List<String> getCells() { return cells; }
    public void setCells(List<String> cells) { this.cells = cells; }
}
