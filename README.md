# RaceSync - Sistema de Gestão e Credenciamento de Pistas

O **RaceSync** é uma plataforma moderna e responsiva para a gestão, vistoria técnica e agendamento de baterias/treinos em autódromos e pistas de arrancada (como o Race park Maringá). O sistema permite que pilotos cadastrem seus veículos, gerando um passaporte digital criptografado via QR Code, enquanto gestores e organizadores realizam vistorias de segurança e validam a entrada dos veículos.

---

## 🚀 Funcionalidades

### 🏁 Para Pilotos
- **Autenticação Segura (JWT):** Cadastro e login integrados com criptografia de senha (BCrypt).
- **Minha Garagem:** Cadastro de veículos (nome,número,categoria) com visualização do histórico e status de vistoria técnica.
- **Reserva de Boxes:** Opção de reserva de box e detalhamento do valor da inscrição.
- **Passaporte Digital QR Code:** Geração de QR Code dinâmico encriptado para apresentação e validação no autódromo.

### 🛠️ Para Gestores e Organizadores
- **Vistoria Técnica de Segurança:** Portal completo para vistoriar veículos pendentes. Permite aprovar/reprovar veículos e registrar relatórios técnicos sobre pneus, freios, vazamentos, cintos de segurança, etc.
- **Controle de Portaria & Check-in:** Sistema de validação por leitura de QR Code. Valida se o veículo associado ao passe possui vistoria técnica aprovada antes de liberar a entrada na pista.
- **Cadastro de Eventos:** Suporte para novos eventos de pista administrados por organizadores.

---

## 🛠️ Stack Tecnológica

### Backend (Java / Spring Boot)
- **Spring Boot 3.3.2** com Java 17+
- **Spring Security & JWT:** Autenticação stateless baseada em tokens.
- **Spring Data JPA & Hibernate:** Persistência robusta.
- **H2 Database (In-Memory):** Banco de dados local para facilitar o desenvolvimento sem necessidade de setups complexos.
- **Lombok & Jakarta Validation:** Código limpo e validações de payloads automatizadas.

### Frontend (React / Vite)
- **React 18** + **Vite** para desenvolvimento ultra-rápido.
- **Lucide React:** Ícones modernos e consistentes.
- **QRCode.react:** Geração dinâmica dos passaportes de pista.
- **CSS Vanilla Premium:** Estilização com design de alto padrão (Glassmorphism, gradientes modernos, paletas Tailored e animações fluidas baseadas no grid de corrida).

---


