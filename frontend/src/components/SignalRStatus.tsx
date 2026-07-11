import { useSignalR } from '../hooks/useSignalR';

export function SignalRStatus() {
    const { isConnected, transport, connectionId, ping } = useSignalR();

    const transportIcons: Record<string, string> = {
        'WebSockets': '🔌',
        'ServerSentEvents': '📡',
        'LongPolling': '📨',
    };

    const transportName = transport || 'Неизвестно';
    const icon = transportIcons[transportName] || '🔌';

    return (
        <div className="card shadow-sm">
            <div className="card-body">
                <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-3">
                        <div className="fs-2">{icon}</div>
                        <div>
                            <div className="d-flex align-items-center gap-2">
                                <div 
                                    className={`rounded-circle ${isConnected ? 'bg-success' : 'bg-danger'}`}
                                    style={{ width: '12px', height: '12px' }}
                                />
                                <span className="fw-semibold">
                                    {isConnected ? '🟢 Подключено' : '🔴 Отключено'}
                                </span>
                            </div>
                            <small className="text-muted d-block">
                                Транспорт: <strong>{transportName}</strong>
                            </small>
                            {connectionId && (
                                <small className="text-muted d-block">
                                    Connection ID: <code>{connectionId.slice(0, 8)}</code>
                                </small>
                            )}
                        </div>
                    </div>
                    <div className="d-flex gap-2">
                        <button 
                            className="btn btn-sm btn-outline-primary"
                            onClick={ping}
                            disabled={!isConnected}
                        >
                            🏓 Ping
                        </button>
                        {isConnected && transport === 'ServerSentEvents' && (
                            <span className="badge bg-warning text-dark align-self-center">
                                ⚠️ Только получение данных
                            </span>
                        )}
                    </div>
                </div>
                {isConnected && transport === 'ServerSentEvents' && (
                    <div className="alert alert-warning mt-2 mb-0">
                        <small>
                            <strong>⚠️ Внимание:</strong> SSE поддерживает только 
                            одностороннюю связь (сервер → клиент). Для отправки 
                            данных используйте HTTP API.
                        </small>
                    </div>
                )}
            </div>
        </div>
    );
}