package com.bezkoder.spring.data.mongodb.repository;

import com.bezkoder.spring.data.mongodb.model.SolutionGrid;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface SolutionGridRepository extends MongoRepository<SolutionGrid, String> {
    Optional<SolutionGrid> findByDate(String date);
}
