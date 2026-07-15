import { useEffect, useState } from 'react'
import {useOrderStore, type Order} from '../stores/orderStrore'
import { Link, useParams, useNavigate } from 'react-router';
import { useSignalR } from "../hooks/useSignalR";
import { signalRStore } from '../stores/signalRStore';
import { Button } from 'react-bootstrap';

export function OrderDetailsPage() {
    const { id } = useParams<string>();
    const getCurrentOrderById = useOrderStore((state) => state.getCurrentOrderById);
    const [currentOrder, setCurrentOrder] = useState<Order | undefined>();
    const navigate = useNavigate();
    // const {onOrderStatusChanged, subscribeToOrder, unsubscribeFromOrder, updateOrderStatus} = useSignalR();


    useEffect(()=>{
        if(id)
            setCurrentOrder(getCurrentOrderById(id)); 
    },[id])

// useEffect(()=>{
//         let unsubscribe = onOrderStatusChanged((data)=>{
//             updateOrderStatus(data.orderId, data.newStatus);
//         })   
//         return unsubscribe;
//     },[onOrderStatusChanged])
   


    if (!id) {
        return <div>Order ID is missing</div>;
    }

    if (!currentOrder) {
        return <div>Loading order details...</div>;
    }
  return (
    <>
     <span>Number: {currentOrder.orderNumber}</span>
     <span>Status: {currentOrder.status}</span>
     {/* <Button onClick={()=>subscribeToOrder(id)}>Подписаться на уведомления</Button>
     <Button onClick={()=>unsubscribeFromOrder(id)}>Отписаться от уведомлений</Button> */}
    </>
  )
}


