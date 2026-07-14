import { useEffect, useState } from 'react'
import {useOrderStore} from './stores/orderStrore'
import './App.css'
import { Routes, Route, Navigate } from 'react-router-dom';
import { OrderForm } from './components/OrderForm';
import { OrderList } from './components/OrderList';
import { NotificationPanel } from './components/NotificationPanel';
import { OrderDetailsPage } from './components/OrderDetailsPage';


function App() {
  const fetchOrders = useOrderStore((state) => state.fetchOrders);

useEffect(()=>{
  fetchOrders();
},[])
  
  return (
    <Routes>
      <Route path="/" element={
                    <>
                        <OrderForm />
                        <NotificationPanel />
                        <OrderList />
                    </>
                } />
      <Route path="/order/:id" element={<OrderDetailsPage/>}/>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
     
  )
}

export default App
