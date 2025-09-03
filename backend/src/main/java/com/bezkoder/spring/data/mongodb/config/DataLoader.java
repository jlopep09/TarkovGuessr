package com.bezkoder.spring.data.mongodb.config;
import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.bezkoder.spring.data.mongodb.model.Item;
import com.bezkoder.spring.data.mongodb.service.ItemService;

@Configuration
public class DataLoader {

    @Bean
    CommandLineRunner init(ItemService itemService) {
        return args -> {
            // Si la colección está vacía, insertar los items ejemplo
            if (itemService.findAll().isEmpty()) {
                List<Item> items = List.of(
                    new Item("sword","Espada","#C0C0C0","⚔️",1,3),
                    new Item("shield","Escudo","#8B4513","🛡️",2,2),
                    new Item("potion","Poción","#FF6B6B","🧪",1,1),
                    new Item("bow","Arco","#8B4513","🏹",1,2),
                    new Item("scroll","Pergamino","#F4E4BC","📜",2,1),
                    new Item("gem","Gema","#9932CC","💎",1,1),
                    new Item("staff","Bastón","#4169E1","🪄",1,3),
                    new Item("tome","Tomo","#228B22","📚",2,2),
                    new Item("ring","Anillo","#FFD700","💍",1,1),
                    new Item("spear","Lanza","#8B4513","🔱",3,1)
                );
                itemService.saveAll(items);
                System.out.println("Seeded items to Mongo");
            }
        };
    }
}