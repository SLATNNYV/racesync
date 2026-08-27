package com.racesync.controller;

import com.racesync.model.Event;
import com.racesync.model.TrackBooking;
import com.racesync.model.Vehicle;
import com.racesync.repository.BookingRepository;
import com.racesync.repository.EventRepository;
import com.racesync.repository.VehicleRepository;
import com.racesync.security.UserPrincipal;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Controller responsável pela reserva de baterias na pista, reservas de box e check-in via QR Code.
 * A anotação @RestController declara um endpoint RESTful.
 * A anotação @RequestMapping vincula a classe ao path base "/api/bookings".
 * A anotação @RequiredArgsConstructor gera automaticamente o construtor injetando as dependências final.
 */
@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    // Repositórios JPA de agendamentos, eventos e veículos
    private final BookingRepository bookingRepository;
    private final EventRepository eventRepository;
    private final VehicleRepository vehicleRepository;

    /**
     * Rota de reserva de bateria (/api/bookings) - Método POST.
     * Reserva um horário de treino de pista para um veículo cadastrado e opcionalmente reserva uma vaga de box se disponível.
     * A anotação @Transactional garante que todas as operações com o banco de dados (decrementar vagas e salvar reserva) sejam executadas com atomicidade (todas ou nenhuma).
     * 
     * @param userPrincipal Usuário autenticado que faz a reserva
     * @param request Dados do formulário da reserva (id do evento, id do carro, slot de tempo, opção do box)
     * @return Retorna a reserva criada no banco de dados
     */
    @PostMapping
    @Transactional
    public ResponseEntity<?> createBooking(@AuthenticationPrincipal UserPrincipal userPrincipal,
                                           @Valid @RequestBody BookingRequest request) {
        // Verifica se o usuário de sessão está autenticado
        if (userPrincipal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not authenticated");
        }

        // Verifica se o evento existe no banco
        Optional<Event> eventOpt = eventRepository.findById(request.getEventId());
        if (eventOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Evento não encontrado.");
        }

        // Verifica se o veículo existe no banco
        Optional<Vehicle> vehicleOpt = vehicleRepository.findById(request.getVehicleId());
        if (vehicleOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Veículo não encontrado.");
        }

        Event event = eventOpt.get();
        Vehicle vehicle = vehicleOpt.get();

        // Se o piloto escolheu reservar um box de suporte
        if (request.getBookBox()) {
            // Se as vagas de box do autódromo esgotaram, rejeita a reserva
            if (event.getBoxSlotsRemaining() <= 0) {
                return ResponseEntity.badRequest().body("Não há vagas de Box restantes para este evento.");
            }
            // Decrementa 1 vaga de box restante no evento
            event.setBoxSlotsRemaining(event.getBoxSlotsRemaining() - 1);
            eventRepository.save(event);
        }

        // Constrói o agendamento associando o evento, piloto, carro e gera um Token de segurança único UUID para o QR Code
        TrackBooking booking = TrackBooking.builder()
                .event(event)
                .pilot(userPrincipal.getUser())
                .vehicle(vehicle)
                .timeSlot(request.getTimeSlot())
                .status("CONFIRMED") // Inicialmente CONFIRMADO
                .qrCodeToken(UUID.randomUUID().toString()) // Token UUID do QR Code
                .build();

        TrackBooking savedBooking = bookingRepository.save(booking);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedBooking);
    }

    /**
     * Rota de listagem pessoal (/api/bookings) - Método GET.
     * Retorna todas as baterias agendadas pelo piloto logado atual.
     * 
     * @param userPrincipal Usuário de sessão autenticado
     * @return Lista das reservas criadas por este piloto
     */
    @GetMapping
    public ResponseEntity<?> getMyBookings(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not authenticated");
        }

        List<TrackBooking> bookings = bookingRepository.findByPilotId(userPrincipal.getId());
        return ResponseEntity.ok(bookings);
    }

    /**
     * Rota administrativa (/api/bookings/all) - Método GET.
     * Exibe todas as reservas do sistema para permitir o controle na portaria e check-in.
     * A anotação @PreAuthorize restringe o acesso apenas para gestores (MANAGER) ou organizadores (ORGANIZER).
     * 
     * @return Lista completa de todas as reservas de baterias
     */
    @GetMapping("/all")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ORGANIZER')")
    public ResponseEntity<?> getAllBookings() {
        List<TrackBooking> bookings = bookingRepository.findAll();
        return ResponseEntity.ok(bookings);
    }

    /**
     * Rota administrativa de check-in na portaria (/api/bookings/check-in) - Método POST.
     * Processa a entrada do piloto no autódromo validando o QR Code apresentado na entrada.
     * Regras cruciais de segurança são checadas:
     * 1. A credencial precisa existir.
     * 2. O check-in não pode ter sido feito previamente.
     * 3. O veículo vinculado ao passe precisa ter sido APROVADO na vistoria técnica presencial.
     * 
     * @param request Contém o qrCodeToken lido do piloto
     * @return Agendamento atualizado com status CHECKED_IN
     */
    @PostMapping("/check-in")
    @Transactional
    public ResponseEntity<?> scanCheckIn(@RequestBody CheckInRequest request) {
        // Procura a reserva pelo token do QR Code
        Optional<TrackBooking> bookingOpt = bookingRepository.findByQrCodeToken(request.getQrCodeToken());
        if (bookingOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Credencial inválida ou não encontrada.");
        }

        TrackBooking booking = bookingOpt.get();
        
        // Evita reutilização fraudulenta do mesmo passe
        if ("CHECKED_IN".equals(booking.getStatus())) {
            return ResponseEntity.badRequest().body("Esta credencial já foi utilizada para check-in.");
        }

        // Validação da Vistoria Técnica: Regra de segurança número 1 da pista.
        // O check-in na pista é bloqueado se o veículo não estiver APROVADO ("APPROVED").
        if (!"APPROVED".equals(booking.getVehicle().getInspectionStatus().name())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body("Check-in recusado. O veículo " + booking.getVehicle().getName() + 
                          " não foi aprovado na vistoria técnica (Status atual: " + 
                          booking.getVehicle().getInspectionStatus() + ").");
        }

        // Realiza o check-in do piloto no autódromo
        booking.setStatus("CHECKED_IN");
        bookingRepository.save(booking);

        return ResponseEntity.ok(booking);
    }

    // --- PAYLOADS / DTOs (Data Transfer Objects) ---

    @Data
    public static class BookingRequest {
        @NotNull(message = "O ID do evento é obrigatório.")
        private Long eventId;

        @NotNull(message = "O ID do veículo é obrigatório.")
        private Long vehicleId;

        @NotBlank(message = "O slot de horário da bateria é obrigatório.")
        private String timeSlot;

        @NotNull
        private Boolean bookBox; // Se deseja reservar vaga de box coberto
    }

    @Data
    public static class CheckInRequest {
        @NotBlank(message = "O token do QR Code é obrigatório para check-in.")
        private String qrCodeToken;
    }
}
