package com.smartcampost.backend.service.impl.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.reactive.function.client.ClientResponse;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
@Slf4j
public class OpenAIClient {

    private final WebClient webClient;

    public OpenAIClient(
            @Value("${OPENAI_API_KEY:}") String apiKey,
            @Value("${OPENAI_API_URL:https://api.openai.com}") String apiUrl
    ) {
        this.webClient = WebClient.builder()
                .baseUrl(apiUrl)
                .defaultHeader(HttpHeaders.AUTHORIZATION, "Bearer " + apiKey)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, MediaType.APPLICATION_JSON_VALUE)
                .build();
    }

    /**
     * Call chat completions endpoint (non-streaming)
     * Returns the assistant text or empty on error
     */
    public Mono<String> createChatCompletion(String model, List<Map<String, String>> messages, int maxTokens, double temperature) {
        Map<String, Object> body = new HashMap<>();
        body.put("model", model);
        body.put("messages", messages);
        body.put("max_tokens", maxTokens);
        body.put("temperature", temperature);

        return webClient.post()
                .uri(uriBuilder -> uriBuilder.path("/v1/chat/completions").build())
                .bodyValue(body)
                .exchangeToMono(response -> handleResponse(response))
                .timeout(Duration.ofSeconds(20))
                .onErrorResume(ex -> {
                    log.error("OpenAI call failed: {}", ex.getMessage());
                    return Mono.empty();
                });
    }

    private Mono<String> handleResponse(ClientResponse response) {
        if (response.statusCode().is2xxSuccessful()) {
            return response.bodyToMono(Map.class)
                    .flatMap(map -> {
                        try {
                            List choices = (List) map.get("choices");
                            if (choices != null && !choices.isEmpty()) {
                                Map first = (Map) choices.get(0);
                                Map message = (Map) first.get("message");
                                if (message != null && message.get("content") != null) {
                                    return Mono.just(message.get("content").toString());
                                }
                            }
                        } catch (Exception e) {
                            log.error("Error parsing OpenAI response: {}", e.getMessage());
                        }
                        return Mono.empty();
                    });
        }

        return response.bodyToMono(String.class).flatMap(body -> {
            log.warn("OpenAI non-2xx response: {} - {}", response.statusCode(), body);
            return Mono.empty();
        });
    }
}
