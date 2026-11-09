package com.racesync.controller;

import com.racesync.model.InspectionStatus;
import com.racesync.model.User;
import com.racesync.model.Vehicle;
import com.racesync.security.UserPrincipal;
import com.racesync.services.VehicleService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

/**
 * Controller responsável pelo gerenciamento de veículos dos pilotos (Garagem) e pela realização de vistorias técnicas.
 * Utiliza o VehicleService como camada de regras de negócio.
 */
@RestController
@RequestMapping("/api/vehicles")
@RequiredArgsConstructor
public class VehicleController {

    private final VehicleService vehicleService;

    /**
     * Rota para cadastrar um novo veículo (/api/vehicles) - Método POST.
     * Vincula o veículo de forma automática ao piloto autenticado com status PENDING.
     */
    @PostMapping
    public ResponseEntity<?> createVehicle(@AuthenticationPrincipal UserPrincipal userPrincipal,
                                           @Valid @RequestBody VehicleRequest vehicleRequest) {
        if (userPrincipal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Collections.singletonMap("error", "Usuário não autenticado"));
        }

        User owner = userPrincipal.getUser();

        Vehicle vehicle = Vehicle.builder()
                .name(vehicleRequest.getName().trim())
                .number(vehicleRequest.getNumber().trim())
                .category(vehicleRequest.getCategory().trim())
                .owner(owner)
                .inspectionStatus(InspectionStatus.PENDING)
                .inspectionNotes("Aguardando vistoria técnica presencial.")
                .build();

        Vehicle savedVehicle = vehicleService.cadastrar(vehicle);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedVehicle);
    }

    /**
     * Rota para listar veículos do piloto atual (/api/vehicles) - Método GET.
     * Filtra apenas os veículos pertencentes ao ID do usuário autenticado atual.
     */
    @GetMapping
    public ResponseEntity<?> getMyVehicles(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Collections.singletonMap("error", "Usuário não autenticado"));
        }

        List<Vehicle> vehicles = vehicleService.listarPorProprietario(userPrincipal.getId());
        return ResponseEntity.ok(vehicles);
    }

    /**
     * Rota administrativa para listar todos os veículos (/api/vehicles/all) - Método GET.
     * Usada pelos gestores para ver os veículos inscritos e pendentes de vistoria técnica.
     */
    @GetMapping("/all")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ORGANIZER')")
    public ResponseEntity<?> getAllVehicles() {
        List<Vehicle> vehicles = vehicleService.listarTodos();
        return ResponseEntity.ok(vehicles);
    }

    /**
     * Rota administrativa para registrar vistoria do veículo (/api/vehicles/{id}/inspect) - Método PUT.
     * Permite alterar o status da vistoria de um veículo para APROVADO ("APPROVED") ou REPROVADO ("REJECTED") com notas explicativas.
     */
    @PutMapping("/{id}/inspect")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ORGANIZER')")
    public ResponseEntity<?> inspectVehicle(@PathVariable Long id,
                                            @Valid @RequestBody InspectionRequest request) {
        Optional<Vehicle> optionalVehicle = vehicleService.buscarPorId(id);
        if (optionalVehicle.isEmpty()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Collections.singletonMap("error", "Veículo não encontrado."));
        }

        InspectionStatus status;
        try {
            status = InspectionStatus.valueOf(request.getStatus().trim().toUpperCase());
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Collections.singletonMap("error", "Status de vistoria inválido: " + request.getStatus()));
        }

        Vehicle updatedVehicle = vehicleService.registrarVistoria(id, status, request.getNotes());
        return ResponseEntity.ok(updatedVehicle);
    }

    // --- PAYLOADS / DTOs (Data Transfer Objects) ---

    @Data
    public static class VehicleRequest {
        @NotBlank(message = "O nome do veículo é obrigatório.")
        private String name;

        @NotBlank(message = "O número do veículo é obrigatório.")
        private String number;

        @NotBlank(message = "A categoria de inscrição é obrigatória.")
        private String category;
    }

    @Data
    public static class InspectionRequest {
        @NotBlank(message = "O status de vistoria é obrigatório.")
        private String status;

        private String notes;
    }
}
