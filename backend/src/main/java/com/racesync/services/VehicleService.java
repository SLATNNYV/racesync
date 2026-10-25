
package com.racesync.services;

import com.racesync.model.Vehicle;
import com.racesync.repository.VehicleRepository;
import org.springframework.stereotype.Service;

import java.util.List;

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

    // Buscar veículo por ID
    public Vehicle buscarPorId(Long id) {
        return vehicleRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Veículo não encontrado: " + id));
    }

    // Listar veículos por proprietário
    public List<Vehicle> listarPorProprietario(Long ownerId) {
        return vehicleRepository.buscarPorProprietario(ownerId);
    }

    // Cadastrar veículo
    public Vehicle cadastrar(Vehicle vehicle) {
        return vehicleRepository.save(vehicle);
    }

    // Atualizar veículo
    public Vehicle atualizar(Long id, Vehicle dados) {
        Vehicle vehicle = buscarPorId(id);

        // Atualize aqui os campos conforme sua entidade Vehicle
        // Exemplo:
        // vehicle.setBrand(dados.getBrand());
        // vehicle.setModel(dados.getModel());
        // vehicle.setYear(dados.getYear());

        return vehicleRepository.save(vehicle);
    }

    // Excluir veículo
    public void excluir(Long id) {
        Vehicle vehicle = buscarPorId(id);
        vehicleRepository.delete(vehicle);
    }
}
