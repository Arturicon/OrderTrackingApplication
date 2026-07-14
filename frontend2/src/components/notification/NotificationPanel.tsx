// import { useSignalR } from "../../hooks/useSignalR";
// import { useState, useEffect } from 'react';
// import type { OrderStatusUpdate } from "../../stores/orderStrore";


// export function NotificationPanel() {
//     const {onOrderStatusChanged} = useSignalR();
//     const[notifications, setNotifications] = useState<OrderStatusUpdate[]>([])
    
//     useEffect(()=>{
//         let unsubscribe = onOrderStatusChanged((data)=>{
//             setNotifications(prev => [data, ...prev]);
//         })   
        
//         return unsubscribe();
//     },[onOrderStatusChanged])


//     return (
//         <>
//             <h3>Order Status Updates</h3>
            
//             {notifications.length === 0 ? (
//                 <p>No updates yet</p>
//             ) : (
//                 <ul>
//                     {notifications.map((notification) => (
//                         <li key={`${notification.orderId}-${notification.timestamp}`}>
//                             Заказ {notification.orderNumber} изменил статус с {notification.oldStatus} на {notification.newStatus}
//                             <small style={{ marginLeft: '10px', color: '#666' }}>
//                                 {new Date(notification.timestamp).toLocaleTimeString()}
//                             </small>
//                         </li>
//                     ))}
//                 </ul>
//             )}
//         </>
//     );
// }