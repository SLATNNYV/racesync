package com.racesync.security;

import com.racesync.model.Role;
import com.racesync.model.User;
import com.racesync.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DatabaseInitializer implements CommandLineRunner {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        if (userRepository.count() == 0) {
            User admin = User.builder()
                    .name("Administrador Principal")
                    .email("admin@racesync.com")
                    .cpf("00000000000")
                    .password(passwordEncoder.encode("admin"))
                    .role(Role.MANAGER)
                    .build();

            userRepository.save(admin);
            System.out.println(">>> RaceSync: Default manager account created (admin@racesync.com / admin) <<<");
        }
    }
}
