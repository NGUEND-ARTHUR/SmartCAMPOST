package com.smartcampost.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class SmartCampostBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(SmartCampostBackendApplication.class, args);
    }

}
