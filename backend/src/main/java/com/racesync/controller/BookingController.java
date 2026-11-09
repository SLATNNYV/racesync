package com.racesync.controller;

import com.racesync.model.Event;
import com.racesync.model.InspectionStatus;
import com.racesync.model.Role;
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
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Controller responsável pela reserva de baterias na pista, reservas de box e check-in via QR Code.
 */
@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingRepository bookingRepository;
    private final EventRepository eventRepository;
    private final VehicleRepository vehicleRepository;

    /**
     * Rota de reserva de bateria (/api/bookings) - Método POST.
     * Reserva um horário de treino de pista para um veículo cadastrado e opcionalmente reserva uma vaga de box se disponível.
     */
    @PostMapping
    @Transactional
    public ResponseEntity<?> createBooking(@AuthenticationPrincipal UserPrincipal userPrincipal,
                                           @Valid @RequestBody BookingRequest request) {
        if (userPrincipal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Collections.singletonMap("error", "Usuário não autenticado"));
        }

        Optional<Event> eventOpt = eventRepository.findById(request.getEventId());
        if (eventOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Collections.singletonMap("error", "Evento não encontrado."));
        }

        Optional<Vehicle> vehicleOpt = vehicleRepository.findById(request.getVehicleId());
        if (vehicleOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Collections.singletonMap("error", "Veículo não encontrado."));
        }

        Event event = eventOpt.get();
        Vehicle vehicle = vehicleOpt.get();

        // Validação de segurança: apenas o proprietário do carro ou administradores podem inscrever o veículo
        boolean isStaff = userPrincipal.getUser().getRole() == Role.MANAGER || userPrincipal.getUser().getRole() == Role.ORGANIZER;
        if (!isStaff && (vehicle.getOwner() == null || !vehicle.getOwner().getId().equals(userPrincipal.getId()))) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Collections.singletonMap("error", "Você só pode reservar puxadas com veículos da sua própria garagem."));
        }

        // Se o piloto escolheu reservar um box de suporte
        if (Boolean.TRUE.equals(request.getBookBox())) {
            if (event.getBoxSlotsRemaining() == null || event.getBoxSlotsRemaining() <= 0) {
                return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Não há vagas de Box restantes para este evento."));
            }
            event.setBoxSlotsRemaining(event.getBoxSlotsRemaining() - 1);
            eventRepository.save(event);
        }

        TrackBooking booking = TrackBooking.builder()
                .event(event)
                .pilot(userPrincipal.getUser())
                .vehicle(vehicle)
                .timeSlot(request.getTimeSlot())
                .status("CONFIRMED")
                .qrCodeToken(UUID.randomUUID().toString())
                .build();

        TrackBooking savedBooking = bookingRepository.save(booking);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedBooking);
    }

    /**
     * Rota de listagem pessoal (/api/bookings) - Método GET.
     * Retorna todas as baterias agendadas pelo piloto logado atual.
     */
    @GetMapping
    public ResponseEntity<?> getMyBookings(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Collections.singletonMap("error", "Usuário não autenticado"));
        }

        List<TrackBooking> bookings = bookingRepository.findByPilotId(userPrincipal.getId());
        return ResponseEntity.ok(bookings);
    }

    /**
     * Rota administrativa (/api/bookings/all) - Método GET.
     * Exibe todas as reservas do sistema para permitir o controle na portaria e check-in.
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
     */
    @PostMapping("/check-in")
    @Transactional
    public ResponseEntity<?> scanCheckIn(@RequestBody CheckInRequest request) {
        if (request == null || request.getQrCodeToken() == null || request.getQrCodeToken().isBlank()) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", "O token do QR Code é obrigatório para check-in."));
        }

        Optional<TrackBooking> bookingOpt = bookingRepository.findByQrCodeToken(request.getQrCodeToken().trim());
        if (bookingOpt.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Collections.singletonMap("error", "Credencial inválida ou não encontrada."));
        }

        TrackBooking booking = bookingOpt.get();

        if ("CHECKED_IN".equals(booking.getStatus())) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Esta credencial já foi utilizada para check-in."));
        }

        // Validação da Vistoria Técnica: O check-in é bloqueado se o veículo não estiver APROVADO ("APPROVED").
        if (booking.getVehicle() == null || booking.getVehicle().getInspectionStatus() != InspectionStatus.APPROVED) {
            String vehicleName = booking.getVehicle() != null ? booking.getVehicle().getName() : "Desconhecido";
            Object status = (booking.getVehicle() != null && booking.getVehicle().getInspectionStatus() != null)
                    ? booking.getVehicle().getInspectionStatus() : "NÃO REALIZADA";
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Collections.singletonMap("error", "Check-in recusado. O veículo " + vehicleName + 
                          " não foi aprovado na vistoria técnica (Status atual: " + status + ")."));
        }

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
        private Boolean bookBox;
    }

    @Data
    public static class CheckInRequest {
        @NotBlank(message = "O token do QR Code é obrigatório para check-in.")
        private String qrCodeToken;
    }
}
