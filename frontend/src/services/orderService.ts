import type {Order} from '../stores/orderStrore'

class OrderService{



async fetchCreateOrder(description:string) : Promise<Order>{
    const host = "https://localhost:7099"; //todo get from config
        try {
            const response = await fetch(`${host}/api/Orders/CreateOrder`, {
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

    // async getOrderById(id:string) : Promise<Order>{

}


export const orderService = new OrderService();