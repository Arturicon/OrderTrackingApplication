// components/Layout/Header.tsx
import { Link } from 'react-router-dom';
import { Container, Navbar, Stack } from 'react-bootstrap';
import { NotificationBell } from './NotificationBell';

export function Header() {
    return (
        <Navbar bg="white" className="border-bottom shadow-sm" sticky="top">
            <Container>
                <Navbar.Brand as={Link} to="/" className="fw-bold">
                    📦 Система отслеживания заказов
                </Navbar.Brand>
                <Navbar.Collapse className="justify-content-end">
                    <Stack direction="horizontal" gap={3}>
                        <NotificationBell />
                    </Stack>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    );
}