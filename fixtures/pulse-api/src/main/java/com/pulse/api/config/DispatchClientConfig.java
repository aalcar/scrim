package com.pulse.api.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.client.RestClient;

/**
 * Builds the {@link RestClient} used to talk to dispatch-service.
 */
@Configuration
public class DispatchClientConfig {

    @Bean
    RestClient dispatchRestClient(RestClient.Builder builder, PulseProperties properties) {
        return builder
                .baseUrl(properties.dispatch().baseUrl())
                .defaultHeader("X-Calling-Service", "pulse-api")
                .build();
    }
}
