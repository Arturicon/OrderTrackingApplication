import type {Order} from '../stores/orderStrore'
import {API_CONFIG} from '../utils/helpers'
class OrderService{



async fetchCreateOrder(description:string) : Promise<Order>{
        try {
            const response = await fetch(`${API_CONFIG.backendUrl}/${API_CONFIG.endpoints.createOrder}`, {
                method:'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({description: description})
            } );
             if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data; 

        } catch (error) {
        console.error('Failed to create order:', error);
        throw error; 
        }
    }
}


export const orderService = new OrderService();