package com.bezkoder.spring.data.mongodb.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

@Document(collection = "items")
public class Item {
    @Id
    private String id;
    private String name;
    private String color;
    private String emoji;
    private int width;
    private int height;

    public Item() {}

    public Item(String id, String name, String color, String emoji, int width, int height) {
        this.id = id;
        this.name = name;
        this.color = color;
        this.emoji = emoji;
        this.width = width;
        this.height = height;
    }

    // getters + setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
    public String getEmoji() { return emoji; }
    public void setEmoji(String emoji) { this.emoji = emoji; }
    public int getWidth() { return width; }
    public void setWidth(int width) { this.width = width; }
    public int getHeight() { return height; }
    public void setHeight(int height) { this.height = height; }
}
