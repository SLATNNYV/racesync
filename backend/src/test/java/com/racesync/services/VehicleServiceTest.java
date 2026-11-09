package com.racesync.services;

import com.racesync.model.InspectionStatus;
import com.racesync.model.User;
import com.racesync.model.Vehicle;
import com.racesync.repository.VehicleRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VehicleServiceTest {

    @Mock
    private VehicleRepository vehicleRepository;

    @InjectMocks
    private VehicleService vehicleService;

    private Vehicle sampleVehicle;
    private User owner;

    @BeforeEach
    void setUp() {
        owner = User.builder().id(1L).name("Piloto Teste").email("piloto@test.com").build();
        sampleVehicle = Vehicle.builder()
                .id(10L)
                .name("Opala 6cc Turbo")
                .number("44")
                .category("Carros Turbo")
                .owner(owner)
                .inspectionStatus(InspectionStatus.PENDING)
                .inspectionNotes("Aguardando vistoria.")
                .build();
    }

    @Test
    void testCadastrar() {
        when(vehicleRepository.save(sampleVehicle)).thenReturn(sampleVehicle);

        Vehicle saved = vehicleService.cadastrar(sampleVehicle);

        assertNotNull(saved);
        assertEquals("Opala 6cc Turbo", saved.getName());
        verify(vehicleRepository, times(1)).save(sampleVehicle);
    }

    @Test
    void testBuscarPorId() {
        when(vehicleRepository.findById(10L)).thenReturn(Optional.of(sampleVehicle));

        Optional<Vehicle> found = vehicleService.buscarPorId(10L);

        assertTrue(found.isPresent());
        assertEquals("Opala 6cc Turbo", found.get().getName());
        verify(vehicleRepository, times(1)).findById(10L);
    }

    @Test
    void testRegistrarVistoria() {
        when(vehicleRepository.findById(10L)).thenReturn(Optional.of(sampleVehicle));
        when(vehicleRepository.save(any(Vehicle.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Vehicle updated = vehicleService.registrarVistoria(10L, InspectionStatus.APPROVED, "Pneus novos e cinto OK.");

        assertEquals(InspectionStatus.APPROVED, updated.getInspectionStatus());
        assertEquals("Pneus novos e cinto OK.", updated.getInspectionNotes());
        verify(vehicleRepository, times(1)).save(sampleVehicle);
    }

    @Test
    void testAtualizar_Success() {
        when(vehicleRepository.findById(10L)).thenReturn(Optional.of(sampleVehicle));
        when(vehicleRepository.save(any(Vehicle.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Vehicle dados = Vehicle.builder()
                .name("Opala 6cc TT")
                .number("45")
                .category("Carros Turbo Forjado")
                .inspectionStatus(InspectionStatus.APPROVED)
                .inspectionNotes("Aprovado com ressalvas.")
                .build();

        Vehicle updated = vehicleService.atualizar(10L, dados);

        assertEquals("Opala 6cc TT", updated.getName());
        assertEquals("45", updated.getNumber());
        assertEquals("Carros Turbo Forjado", updated.getCategory());
        assertEquals(InspectionStatus.APPROVED, updated.getInspectionStatus());
        assertEquals("Aprovado com ressalvas.", updated.getInspectionNotes());
        verify(vehicleRepository, times(1)).save(sampleVehicle);
    }

    @Test
    void testListarPorProprietario() {
        when(vehicleRepository.findByOwnerId(1L)).thenReturn(List.of(sampleVehicle));

        List<Vehicle> list = vehicleService.listarPorProprietario(1L);

        assertEquals(1, list.size());
        assertEquals("Opala 6cc Turbo", list.get(0).getName());
        verify(vehicleRepository, times(1)).findByOwnerId(1L);
    }

    @Test
    void testExcluir() {
        when(vehicleRepository.findById(10L)).thenReturn(Optional.of(sampleVehicle));

        vehicleService.excluir(10L);

        verify(vehicleRepository, times(1)).delete(sampleVehicle);
    }
}
