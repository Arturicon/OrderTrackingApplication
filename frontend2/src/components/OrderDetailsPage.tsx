import { useEffect, useState } from 'react'
import {useOrderStore, type Order} from '../stores/orderStrore'
import { Link, useParams, useNavigate } from 'react-router';
import { useSignalR } from "../hooks/useSignalR";
import { signalRStore } from '../stores/signalRStore';

export function OrderDetailsPage() {
    const { id } = useParams<string>();
    const getCurrentOrderById = useOrderStore((state) => state.getCurrentOrderById);
    const [currentOrder, setCurrentOrder] = useState<Order | undefined>();
    const navigate = useNavigate();
    const {onOrderStatusChanged} = useSignalR();
    const getHandlersCount = signalRStore((state) => state.getHandlersCount); // ← из стора

    useEffect(()=>{
        if(id)
            setCurrentOrder(getCurrentOrderById(id)); 
    },[id])

useEffect(()=>{
        let unsubscribe = onOrderStatusChanged((data)=>{

        })   
        console.log(getHandlersCount());
        return unsubscribe();
    },[onOrderStatusChanged])

    // useEffect(()=>{
    // let connection = new signalR.HubConnectionBuilder()
    // .withUrl("https://localhost:7125/orderHub")
    // .build();

    // connection.start()
    //  .then(() => connection.invoke("subscribeToOrder", `${id}`));
    
    //  connection.on("OrderStatusChanged", (data)=>{
    //     console.log('📦 Order status changed:', data);
    //  });

    // },[])

    
    

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
    </>
  )
}


