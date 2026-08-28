package com.pulse.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class PulseApiApplication {

    public static void main(String[] args) {
        SpringApplication.run(PulseApiApplication.class, args);
    }
}
