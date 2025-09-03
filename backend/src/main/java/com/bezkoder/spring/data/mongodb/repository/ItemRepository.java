package com.bezkoder.spring.data.mongodb.repository;


import org.springframework.data.mongodb.repository.MongoRepository;

import com.bezkoder.spring.data.mongodb.model.Item;
import org.springframework.stereotype.Repository;

@Repository
public interface ItemRepository extends MongoRepository<Item, String> {
    // puedes añadir búsquedas personalizadas si las necesitas
}
