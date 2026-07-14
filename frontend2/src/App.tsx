import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import { useOrderStore } from './stores/orderStrore';
import { Header } from './components/layout/Header';
import { OrderForm } from './components/OrderForm';
import { OrderList } from './components/OrderList';
import { OrderDetailsPage } from './components/OrderDetailsPage';
import 'bootstrap/dist/css/bootstrap.min.css';
import { useSignalR } from "./hooks/useSignalR";
import { notificationStore } from './stores/notificationStore';


function App() {
    const fetchOrders = useOrderStore((state) => state.fetchOrders);
    const {onOrderStatusChanged} = useSignalR();
    const addNotification = notificationStore((state) => state.addNotification); 
    useEffect(() => {
        fetchOrders();
    }, []);

    useEffect(()=>{
      console.log('🔄 Подписка на уведомления');
        let unsubscribe = onOrderStatusChanged((data)=>{
          console.log('📨 Получено уведомление:', data);
            addNotification({
                orderId: data.orderId,
                orderNumber: data.orderNumber,
                title: 'Заказ создан',
                message: `Заказ #${data.orderNumber} изменил статус с ${data.oldStatus} на ${data.newStatus}`,
                type: 'success',
                link: `/order/${data.orderId}`,
            });
        })   
        
        return ()=>{
          console.log('🗑️ Отписка от уведомлений');
          unsubscribe();
        }
    },[onOrderStatusChanged, addNotification])
    return (
        <div className="min-vh-100 bg-light">
            <Header />
            <Container className="py-4">
                <Routes>
                    <Route path="/" element={
                        <>
                            <OrderForm />
                            <OrderList />
                        </>
                    } />
                    <Route path="/order/:id" element={<OrderDetailsPage />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </Container>
        </div>
    );
}

export default App;