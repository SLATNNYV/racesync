package com.racesync.controller;

import com.racesync.model.InspectionStatus;
import com.racesync.model.User;
import com.racesync.model.Vehicle;
import com.racesync.repository.VehicleRepository;
import com.racesync.security.UserPrincipal;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;

/**
 * Controller responsável pelo gerenciamento de veículos dos pilotos (Garagem) e pela realização de vistorias técnicas.
 * A anotação @RestController declara endpoints REST JSON.
 * A anotação @RequestMapping amarra o endpoint base à rota "/api/vehicles".
 * A anotação @RequiredArgsConstructor gera automaticamente o construtor injetando as dependências.
 */
@RestController
@RequestMapping("/api/vehicles")
@RequiredArgsConstructor
public class VehicleController {

    // Repositório JPA para lidar com as operações de persistência de veículos
    private final VehicleRepository vehicleRepository;

    /**
     * Rota para cadastrar um novo veículo (/api/vehicles) - Método POST.
     * Vincula o veículo de forma automática ao piloto autenticado.
     * Quando criado, o status de vistoria é definido obrigatoriamente como PENDING (Pendente) para forçar a vistoria técnica.
     * 
     * @param userPrincipal Usuário de sessão autenticado (Piloto)
     * @param vehicleRequest Dados estruturados do veículo (nome, numero, categoria)
     * @return Retorna o veículo salvo no banco
     */
    @PostMapping
    public ResponseEntity<?> createVehicle(@AuthenticationPrincipal UserPrincipal userPrincipal,
                                           @Valid @RequestBody VehicleRequest vehicleRequest) {
        if (userPrincipal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not authenticated");
        }

        User owner = userPrincipal.getUser();
        
        // Constrói a entidade Vehicle definindo o status inicial pendente
        Vehicle vehicle = Vehicle.builder()
                .name(vehicleRequest.getName())
                .number(vehicleRequest.getNumber())
                .category(vehicleRequest.getCategory())
                .owner(owner)
                .inspectionStatus(InspectionStatus.PENDING) // Status inicial
                .inspectionNotes("Aguardando vistoria técnica presencial.") // Nota padrão
                .build();

        Vehicle savedVehicle = vehicleRepository.save(vehicle);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedVehicle);
    }

    /**
     * Rota para listar veículos do piloto atual (/api/vehicles) - Método GET.
     * Filtra apenas os veículos pertencentes ao ID do usuário autenticado atual.
     * 
     * @param userPrincipal Usuário de sessão autenticado
     * @return Lista de veículos do piloto
     */
    @GetMapping
    public ResponseEntity<?> getMyVehicles(@AuthenticationPrincipal UserPrincipal userPrincipal) {
        if (userPrincipal == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not authenticated");
        }

        List<Vehicle> vehicles = vehicleRepository.findByOwnerId(userPrincipal.getId());
        return ResponseEntity.ok(vehicles);
    }

    /**
     * Rota administrativa para listar todos os veículos (/api/vehicles/all) - Método GET.
     * Usada pelos gestores para ver os veículos inscritos e pendentes de vistoria técnica.
     * Restrita a gestores (MANAGER) ou organizadores (ORGANIZER) via @PreAuthorize.
     * 
     * @return Lista completa de veículos cadastrados no sistema
     */
    @GetMapping("/all")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ORGANIZER')")
    public ResponseEntity<?> getAllVehicles() {
        List<Vehicle> vehicles = vehicleRepository.findAll();
        return ResponseEntity.ok(vehicles);
    }

    /**
     * Rota administrativa para registrar vistoria do veículo (/api/vehicles/{id}/inspect) - Método PUT.
     * Permite alterar o status da vistoria de um veículo para APROVADO ("APPROVED") ou REPROVADO ("REJECTED") com notas explicativas.
     * O acesso é restrito apenas para gestores (MANAGER) ou organizadores (ORGANIZER).
     * 
     * @param id Identificador único (ID) do veículo que está sendo inspecionado
     * @param request Payload contendo o novo status ("APPROVED" ou "REJECTED") e anotações técnicas
     * @return Retorna o veículo atualizado no banco
     */
    @PutMapping("/{id}/inspect")
    @PreAuthorize("hasRole('MANAGER') or hasRole('ORGANIZER')")
    public ResponseEntity<?> inspectVehicle(@PathVariable Long id,
                                            @Valid @RequestBody InspectionRequest request) {
        // Busca o veículo pelo ID
        Optional<Vehicle> optionalVehicle = vehicleRepository.findById(id);
        if (optionalVehicle.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Vehicle vehicle = optionalVehicle.get();
        
        // Tenta converter a string de status para o Enum InspectionStatus
        try {
            InspectionStatus status = InspectionStatus.valueOf(request.getStatus().toUpperCase());
            vehicle.setInspectionStatus(status);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Status de vistoria inválido: " + request.getStatus());
        }

        // Salva as notas de inspeção detalhadas informadas pelo gestor
        vehicle.setInspectionNotes(request.getNotes());
        Vehicle updatedVehicle = vehicleRepository.save(vehicle);
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
