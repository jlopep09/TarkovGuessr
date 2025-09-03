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
                    new Item("surv12","Surv12","#20160e","https://static.wikia.nocookie.net/escapefromtarkov_gamepedia/images/3/36/Surv12.png",3,1),
                    new Item("grizzly","Grizzly","#20160e","https://static.wikia.nocookie.net/escapefromtarkov_gamepedia/images/4/4b/EFT_Grizzly.png",2,2),
                    new Item("bitcoin","0.2 BTC","#2b202d","https://static.wikia.nocookie.net/escapefromtarkov_gamepedia/images/5/50/Bitcoin.png",1,1),
                    new Item("salewa","Salewa","#20160e","https://static.wikia.nocookie.net/escapefromtarkov_gamepedia/images/a/a3/EFT_Salewa-First-Aid-Kit.png",1,2),
                    new Item("docs","Documents case","#20160e","https://static.wikia.nocookie.net/escapefromtarkov_gamepedia/images/1/15/Document-Case_ins.png",1,2),
                    new Item("m855A1","M855A1","#302f1e","https://static.wikia.nocookie.net/escapefromtarkov_gamepedia/images/f/f5/M855A1.png",1,1),
                    new Item("gpu","GPU","#132025","https://static.wikia.nocookie.net/escapefromtarkov_gamepedia/images/b/b3/Graphics_Card_icon.png",2,1),
                    new Item("cms","CMS","#20160e","https://static.wikia.nocookie.net/escapefromtarkov_gamepedia/images/6/6d/CMS_Icon.png",2,1),
                    new Item("ibuprofen","Ibuprofen","#20160e","https://static.wikia.nocookie.net/escapefromtarkov_gamepedia/images/8/8a/Ibuprofen_painkiller_icon.png",1,1),
                    new Item("dogtag","Dogtag","#132025","https://static.wikia.nocookie.net/escapefromtarkov_gamepedia/images/3/33/BEAR_Dogtag_Icon.png",1,1)
                );
                itemService.saveAll(items);
                System.out.println("Seeded items to Mongo");
            }
        };
    }
}