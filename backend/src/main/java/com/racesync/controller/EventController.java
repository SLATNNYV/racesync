package com.racesync.controller;

import com.racesync.model.Event;
import com.racesync.repository.EventRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
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

/**
 * Controller responsável pelo gerenciamento de Eventos no autódromo.
 * Disponibiliza endpoints para listagem de eventos e cadastro de novos eventos por gestores/organizadores.
 */
@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class EventController {

    private final EventRepository eventRepository;

    /**
     * Lista todos os eventos cadastrados no sistema (/api/events) - Método GET.
     * Aberto a usuários autenticados para permitir consulta de datas, valores e vagas.
     *
     * @return Lista completa de eventos
     */
    @GetMapping
    public ResponseEntity<List<Event>> getAllEvents() {
        List<Event> events = eventRepository.findAll();
        return ResponseEntity.ok(events);
    }

    /**
     * Cadastro de um novo evento (/api/events) - Método POST.
     * Rota administrativa restrita a gestores (MANAGER) e organizadores (ORGANIZER).
     *
     * @param request Dados do novo evento a ser criado
     * @return Evento criado com status HTTP 201 Created
     */
    @PostMapping
    @PreAuthorize("hasRole('MANAGER') or hasRole('ORGANIZER')")
    public ResponseEntity<?> createEvent(@Valid @RequestBody EventRequest request) {
        Event event = Event.builder()
                .name(request.getName().trim())
                .city(request.getCity().trim())
                .date(request.getDate().trim())
                .registrationFee(request.getRegistrationFee())
                .boxSlotsTotal(request.getBoxSlotsTotal())
                .boxSlotsRemaining(request.getBoxSlotsTotal()) // Inicialmente todas as vagas estão livres
                .status(request.getStatus() != null && !request.getStatus().isBlank() ? request.getStatus().trim().toUpperCase() : "CONFIRMADO")
                .build();

        Event savedEvent = eventRepository.save(event);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedEvent);
    }

    // --- DTO para criação de Evento ---

    @Data
    public static class EventRequest {
        @NotBlank(message = "O nome do evento é obrigatório.")
        private String name;

        @NotBlank(message = "A cidade / autódromo é obrigatória.")
        private String city;

        @NotBlank(message = "A data do evento é obrigatória.")
        private String date;

        @NotNull(message = "A taxa de inscrição é obrigatória.")
        @DecimalMin(value = "0.0", inclusive = true, message = "A taxa de inscrição deve ser maior ou igual a zero.")
        private BigDecimal registrationFee;

        @NotNull(message = "O total de vagas de box é obrigatório.")
        @Min(value = 0, message = "O número de vagas de box não pode ser negativo.")
        private Integer boxSlotsTotal;

        private String status;
    }
}
