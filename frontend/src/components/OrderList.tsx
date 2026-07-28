import { useEffect } from 'react'
import {useOrderStore} from '../stores/orderStrore'
import { Link } from 'react-router';
import {statusRuss} from '../types/types'

/**
 * Компонент для отображения списка заказов.
 */
export function OrderList() {
  const orders = useOrderStore((state) => state.orders);
  const fetchOrders = useOrderStore((state) => state.fetchOrders);

  useEffect(() => {
    fetchOrders();
  }, [])

  return (
    <>
      <li>
        <table className="table table-hover mb-0">
          <thead className="table-light">
            <tr>
              <th>№ заказа</th>
              <th>Описание</th>
              <th>Статус</th>
              <th>Перейти</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id}>
                <td>
                  <span>{order.orderNumber}</span>
                </td>
                <td>
                  <span>{order.description}</span>
                </td>
                <td>
                  <span>{statusRuss[order.status]}</span>
                </td>
                <td>
                  <Link to={`/order/${order.id}`}>Перейти</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </li>
    </>
  )
}
