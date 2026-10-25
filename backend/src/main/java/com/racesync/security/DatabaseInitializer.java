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
                    .email("vinnyrace@racesync.com")
                    .cpf("10671874993")
                    .password(passwordEncoder.encode("123456"))
                    .role(Role.MANAGER)
                    .build();

            userRepository.save(admin);
            System.out.println(">>> RaceSync: Default manager account created (admin@racesync.com / admin) <<<");
        }
    }
}
