package com.racesync.services;

import com.racesync.model.InspectionStatus;
import com.racesync.model.Vehicle;
import com.racesync.repository.VehicleRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class VehicleService {

    private final VehicleRepository vehicleRepository;

    public VehicleService(VehicleRepository vehicleRepository) {
        this.vehicleRepository = vehicleRepository;
    }

    // Listar todos os veículos
    public List<Vehicle> listarTodos() {
        return vehicleRepository.findAll();
    }

    // Buscar veículo por ID (Optional)
    public Optional<Vehicle> buscarPorId(Long id) {
        return vehicleRepository.findById(id);
    }

    // Listar veículos por proprietário
    public List<Vehicle> listarPorProprietario(Long ownerId) {
        return vehicleRepository.findByOwnerId(ownerId);
    }

    // Cadastrar veículo
    public Vehicle cadastrar(Vehicle vehicle) {
        return vehicleRepository.save(vehicle);
    }

    // Registrar vistoria do veículo
    public Vehicle registrarVistoria(Long id, InspectionStatus status, String notes) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Veículo não encontrado com id: " + id));
        vehicle.setInspectionStatus(status);
        vehicle.setInspectionNotes(notes != null ? notes.trim() : "");
        return vehicleRepository.save(vehicle);
    }

    // Atualizar dados gerais do veículo
    public Vehicle atualizar(Long id, Vehicle dados) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Veículo não encontrado com id: " + id));

        if (dados.getName() != null && !dados.getName().isBlank()) {
            vehicle.setName(dados.getName().trim());
        }
        if (dados.getNumber() != null && !dados.getNumber().isBlank()) {
            vehicle.setNumber(dados.getNumber().trim());
        }
        if (dados.getCategory() != null && !dados.getCategory().isBlank()) {
            vehicle.setCategory(dados.getCategory().trim());
        }
        if (dados.getInspectionStatus() != null) {
            vehicle.setInspectionStatus(dados.getInspectionStatus());
        }
        if (dados.getInspectionNotes() != null) {
            vehicle.setInspectionNotes(dados.getInspectionNotes().trim());
        }

        return vehicleRepository.save(vehicle);
    }

    // Excluir veículo
    public void excluir(Long id) {
        Vehicle vehicle = vehicleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Veículo não encontrado com id: " + id));
        vehicleRepository.delete(vehicle);
    }
}
