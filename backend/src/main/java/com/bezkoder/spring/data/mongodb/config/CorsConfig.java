package com.bezkoder.spring.data.mongodb.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class CorsConfig {

    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**") // aplica a todos los endpoints
                        .allowedOrigins("*") // tu front
                        .allowedMethods("GET","POST","PUT","DELETE","OPTIONS")
                        .allowCredentials(false); // necesario si usas cookies o auth
            }
        };
    }
}