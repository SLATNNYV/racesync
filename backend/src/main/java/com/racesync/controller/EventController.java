package com.racesync.controller;

import com.racesync.model.Event;
import com.racesync.repository.EventRepository;
import jakarta.annotation.PostConstruct;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {

    private final EventRepository eventRepository;

    @PostConstruct
    public void seedInitialEvents() {
        if (eventRepository.count() == 0) {
            Event trackDay = Event.builder()
                    .name("FESTIVAL DE ARRANCADA 201M")
                    .city("Maringá / PR")
                    .date("15/10/2026")
                    .registrationFee(new BigDecimal("300.00"))
                    .boxSlotsTotal(40)
                    .boxSlotsRemaining(18)
                    .status("PATROCINADO")
                    .build();

            eventRepository.save(trackDay);
        }
    }

    @GetMapping
    public ResponseEntity<List<Event>> getAllEvents() {
        List<Event> events = eventRepository.findAll();
        return ResponseEntity.ok(events);
    }

    @PostMapping
    @PreAuthorize("hasRole('ORGANIZER') or hasRole('MANAGER')")
    public ResponseEntity<?> createEvent(@Valid @RequestBody EventRequest request) {
        Event event = Event.builder()
                .name(request.getName())
                .city(request.getCity())
                .date(request.getDate())
                .registrationFee(request.getRegistrationFee())
                .boxSlotsTotal(request.getBoxSlotsTotal())
                .boxSlotsRemaining(request.getBoxSlotsTotal()) // starts full
                .status(request.getStatus())
                .build();

        Event savedEvent = eventRepository.save(event);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedVehicle(savedEvent));
    }

    private Event savedVehicle(Event event) {
        return event;
    }

    @Data
    public static class EventRequest {
        @NotBlank
        private String name;

        @NotBlank
        private String city;

        @NotBlank
        private String date;

        @NotNull
        private BigDecimal registrationFee;

        @NotNull
        private Integer boxSlotsTotal;

        @NotBlank
        private String status; // "PATROCINADO", "CONFIRMADO", "PENDING"
    }
}
