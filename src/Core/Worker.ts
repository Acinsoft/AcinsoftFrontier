'use strict';

interface AcinsoftApp {
    // Define aquí las propiedades necesarias de la aplicación principal
}

interface WorkerMessage {
    action: string;
    accessToken?: string;
    message?: string;
}

class AcinsoftWorker {
    private app: AcinsoftApp;
    private isWorkerActive: boolean;
    private isMessageListenerSet: boolean;

    constructor(app: AcinsoftApp) {
        this.app = app; // Aplicación principal
        this.isWorkerActive = false; // Bandera para determinar si se está usando el Worker
        this.isMessageListenerSet = false; // Evita configurar múltiples listeners
    }

    /**
     * Inicializa el Service Worker si está disponible.
     */
    static async start(app: AcinsoftApp): Promise<AcinsoftWorker> {
        const worker = new AcinsoftWorker(app);

        if ('serviceWorker' in navigator) {
            try {
                // Registro el Service Worker
                const registration = await navigator.serviceWorker.register('/sw.js');

                // Esperar a que el Service Worker esté listo
                await navigator.serviceWorker.ready;
                if (navigator.serviceWorker.controller) {
                    worker.useWorker();
                } else {
                    const activeWorker = registration.active;
                    if (activeWorker) {
                        worker.useWorker();
                    } else {
                        worker.useLegacy('No se pudo activar el Service Worker.');
                    }
                }
            } catch (error) {
                console.error('Error al registrar el Service Worker:', error);
                worker.useLegacy(error);
            }
        } else {
            worker.useLegacy('El navegador no soporta Service Workers.');
        }

        return worker; // Devuelve la instancia actual para encadenar llamadas si es necesario
    }

    /**
     * Configura el listener de mensajes del Service Worker.
     */
    private setupMessageListener(): void {
        if (this.isMessageListenerSet) {
            console.warn('El listener de mensajes ya está configurado.');
            return;
        }

        navigator.serviceWorker.addEventListener('message', (event: MessageEvent) => {
            console.log('Mensaje recibido del Service Worker:', event.data);

            // Procesar diferentes tipos de mensajes
            this.handleWorkerMessage(event.data);
        });

        this.isMessageListenerSet = true; // Marca como configurado
    }

    /**
     * Maneja los mensajes recibidos del Service Worker.
     */
    private handleWorkerMessage(data: WorkerMessage): void {
        if (!data || !data.action) {
            console.warn('Mensaje no reconocido del Service Worker:', data);
            return;
        }

        switch (data.action) {
            case 'updateAccessToken':
                console.log('Nuevo token recibido:', data.accessToken);
                if (data.accessToken) {
                    localStorage.setItem('accessToken', data.accessToken);
                }
                break;

            case 'showNotification':
                console.log('Mostrar notificación:', data.message);
                if (data.message) {
                    alert(data.message);
                }
                break;

            default:
                console.warn('Acción desconocida del Service Worker:', data.action);
        }
    }

    /**
     * Activa el uso del Service Worker.
     */
    private useWorker(): void {
        this.isWorkerActive = true;

        // Configurar mensajes del Service Worker si no se ha hecho ya
        this.setupMessageListener();
    }

    /**
     * Activa el modo legacy si el Service Worker no está disponible.
     */
    private useLegacy(error: any): void {
        this.isWorkerActive = false;
        console.error('Modo Legacy activado. Detalles del error:', error);
    }

    /**
     * Envía un mensaje al Service Worker y espera una respuesta.
     */
    async send<T = any>(message: any): Promise<T> {
        return new Promise((resolve, reject) => {
            if (!('serviceWorker' in navigator)) {
                reject(new Error('El navegador no soporta Service Workers.'));
                return;
            }

            const controller = navigator.serviceWorker.controller;

            if (!controller) {
                reject(new Error('No hay un Service Worker controlando esta página.'));
                return;
            }

            const messageChannel = new MessageChannel();

            messageChannel.port1.onmessage = (event) => {
                if (event.data?.error) {
                    reject(new Error(event.data.error));
                } else {
                    resolve(event.data);
                }
            };

            // Enviar mensaje al Service Worker
            controller.postMessage(message, [messageChannel.port2]);
        });
    }
}

export default AcinsoftWorker;
