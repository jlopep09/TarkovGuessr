// src/main/java/com/example/pouch/service/ItemService.java
package com.bezkoder.spring.data.mongodb.service;


import org.springframework.stereotype.Service;

import com.bezkoder.spring.data.mongodb.model.Item;
import com.bezkoder.spring.data.mongodb.repository.ItemRepository;

import java.util.List;
import java.util.Optional;

@Service
public class ItemService {
    private final ItemRepository repo;

    public ItemService(ItemRepository repo) {
        this.repo = repo;
    }

    public List<Item> findAll() {
        return repo.findAll();
    }

    public Optional<Item> findById(String id) {
        return repo.findById(id);
    }

    public Item save(Item item) {
        return repo.save(item);
    }

    public void deleteById(String id) {
        repo.deleteById(id);
    }

    public void saveAll(List<Item> items) {
        repo.saveAll(items);
    }
}
