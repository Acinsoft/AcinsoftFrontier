'use strict';

import AcinsoftApplication from "./Acinsoft";
import AcinsoftAuth from "./Auth";

interface ApiConfig {
    host?: string;
    token?: string;
    refreshToken?: string;
    onTokenRefresh?: () => void;
}

interface RequestOptions {
    data?: any;
    method: string;
    endpoint: string;
    contentType?: string;
    accept?: string;
    headers?: { [key: string]: string };
}

export interface ApiResponse<T = any> {
    code: number;
    data?: T;
    success: boolean;
    headers?: Record<string, string>;
}

export interface ApiProcessMessage {
    type: string;
    title: string;
    text: string;
}

export default class AcinsoftApi {

    public host: string;
    private token: string;
    private refreshToken: string;
    private onTokenRefresh: () => void;
    public auth: AcinsoftAuth;
    public account: string;
    public app: AcinsoftApplication;

    constructor(config: ApiConfig, app: AcinsoftApplication) {
        this.host = config.host || document.location.host;
        this.token = config.token || '';
        this.refreshToken = config.refreshToken || '';
        this.onTokenRefresh = config.onTokenRefresh || (() => { });
        this.account = document.location.pathname.split('/')[1];
        this.auth = new AcinsoftAuth(this);
        this.app = app;
    }

    // Función genérica para realizar solicitudes
    async makeRequest<T = any>(options: RequestOptions): Promise<ApiResponse<T>> {
        // Validar que no se envíen 'Accept' ni 'Content-Type' directamente en headers
        if (options.headers) {
            for (const key of Object.keys(options.headers)) {
                const lowerKey = key.toLowerCase();
                if (lowerKey === 'accept' || lowerKey === 'content-type') {
                    throw new Error(
                        "No se deben definir 'Accept' o 'Content-Type' en los headers. Utiliza las propiedades 'accept' y 'contentType' en requestoptions."
                    );
                }
            }
        }

        // Valores por defecto para Accept y Content-Type
        const accept = options.accept || 'application/json';
        let contentType: string | undefined = options.contentType;

        let headersConfig: Record<string, string> = {};
        let url = '';

        if (options.endpoint.startsWith('/')) {
            if (this.account) {
                url = `https://${this.host}/${this.account}${options.endpoint}`;
            }
            else {
                url = `https://${this.host}${options.endpoint}`;
            }
            const accessToken = await this.auth.getAccessToken();
            headersConfig['Authorization'] = `Bearer ${accessToken}`;
        } else if (options.endpoint.startsWith('https://')) {
            url = options.endpoint;
        } else {
            url = `/${options.endpoint}`;
        }

        const requestOptions: RequestInit = {
            method: options.method,
            headers: new Headers(headersConfig)
        };

        if (options.data) {
            if (options.data instanceof HTMLFormElement) {
                requestOptions.body = new FormData(options.data);
                contentType = undefined;
            } else if (options.data instanceof FormData) {
                requestOptions.body = options.data;
                contentType = undefined;
            } else if (typeof options.data === 'object' || typeof options.data === 'string') {
                requestOptions.body = JSON.stringify(options.data);
                contentType = 'application/json';
            } else {
                requestOptions.body = options.data;
            }
        }

        // Asignar Accept por defecto
        headersConfig['Accept'] = accept;

        // Asignar Content-Type solo si es necesario
        if (contentType) {
            headersConfig['Content-Type'] = contentType;
        }

        // Fusionar headers adicionales si existen
        if (options.headers) {
            headersConfig = { ...headersConfig, ...options.headers };
        }

        // Asignar los headers a la solicitud
        requestOptions.headers = new Headers(headersConfig);

        try {

            const response = await fetch(url, requestOptions);
            const headers: Record<string, string> = {};
            response.headers.forEach((value, key) => {
                headers[key] = value;
            });

            if (accept === 'acinsoft/page') {
                const textContent = await response.text();
                return {
                    code: response.status,
                    success: response.ok,
                    headers,
                    data: textContent as any
                };
            }

            try {
                const responseData = await response.json();
                return {
                    code: response.status,
                    data: responseData,
                    headers,
                    success: response.ok,
                };
            }
            catch {
                console.error('Invalid JSON data: ', url);
                return {
                    code: response.status,
                    success: response.ok,
                    headers,
                    data: "" as any
                };
            }
        }
        catch (ex) {
            console.error(ex);
            throw 'No se reolvió la solicitud: ' + url;
        }

    }

    notify(result: ApiResponse) {
        const message = this.getMessage(result);
        this.app.layout.notifier[message.type](`<div><strong>${message.title}</strong></div><div>${message.text}</div>`);
    }

    message(result: ApiResponse) {
        const message = this.getMessage(result);
        this.app.layout.notifier.message(message.title, message.text);
    }

    getMessage(result: ApiResponse): ApiProcessMessage {
        if (!result?.code) {
            return {
                title: 'Existe un problema con el servicio',
                text: 'El resultado no es un valor aceptable',
                type: 'danger'
            };
        }

        if (result.data?.errorMessage) {
            return {
                title: '¡Ups!',
                text: result.data?.errorMessage,
                type: 'danger'
            };
        }

        const code = result.code;
        const rawData = result.data;

        // Detectar errores de modelo (400 con ModelState)
        if (code === 400 && rawData && typeof rawData === 'object' && !('message' in rawData)) {
            // Extraemos todos los arrays de errores
            const errorArrays = Object.values(rawData)
                .filter(v => Array.isArray(v)) as string[][];
            // Aplanamos en un solo array
            const allErrors = ([] as string[]).concat(...errorArrays);
            if (allErrors.length) {
                // Unimos con <br> para HTML
                const combined = allErrors.join('<br>');
                return {
                    type: 'warning',
                    title: 'Solicitud inválida',
                    text: combined
                };
            }
        }

        // 2) Flujo normal para cualquier otro tipo de respuesta
        const initialMessage = typeof rawData === 'string'
            ? rawData
            : (rawData as any)?.message;
        let message = (initialMessage ?? '').toString().trim();

        let type: 'success' | 'warning' | 'danger' | 'info' = 'info';
        let title = '';

        const maps = {
            success: {
                titles: { 200: 'Operación exitosa', 201: 'Recurso creado', /*…*/ },
                texts: { 200: 'Operación exitosa.', 201: 'Recurso creado correctamente.', /*…*/ }
            },
            client: {
                titles: { 400: 'Solicitud inválida', 401: 'No autorizado', /*…*/ },
                texts: { 400: 'Solicitud inválida.', 401: 'No autorizado. Verifica tus credenciales.', /*…*/ }
            },
            server: {
                titles: { 500: 'Error interno del servidor', /*…*/ },
                texts: { 500: 'Error interno del servidor. Intenta más tarde.', /*…*/ }
            }
        };

        const codeType = code.toString()[0];
        switch (codeType) {
            case '2':
                type = 'success';
                title = maps.success.titles[code] ?? 'Éxito';
                if (!message) message = maps.success.texts[code] ?? '¡Listo!';
                break;
            case '4':
                type = 'warning';
                title = maps.client.titles[code] ?? 'Error en la solicitud';
                if (!message) message = maps.client.texts[code] ?? 'Error en la solicitud. Revisa los datos enviados.';
                break;
            case '5':
                type = 'danger';
                title = maps.server.titles[code] ?? 'Error del servidor';
                if (!message) message = maps.server.texts[code] ?? 'Error del servidor. Contacta al administrador.';
                break;
            default:
                type = 'info';
                title = 'Información';
                if (!message) message = 'Respuesta inesperada. Verifica el estado del sistema.';
        }

        return { title, text: message, type };
    }


    // Prepara el objeto RequestOptions con valores por defecto y validaciones
    private prepareRequestFormat(
        endpointOrOptions: string | RequestOptions,
        data: any,
        method: string
    ): RequestOptions {
        if (typeof endpointOrOptions === 'string') {
            const options: RequestOptions = {
                endpoint: endpointOrOptions,
                method,
                data: data || undefined,
                accept: 'application/json'
            };
            if (data) {
                options.contentType = 'application/json';
            }
            return options;
        } else {
            // Verificar que no se hayan definido 'Accept' o 'Content-Type' en headers
            if (endpointOrOptions.headers) {
                for (const key of Object.keys(endpointOrOptions.headers)) {
                    const lowerKey = key.toLowerCase();
                    if (lowerKey === 'accept' || lowerKey === 'content-type') {
                        throw new Error(
                            "No se deben definir 'Accept' o 'Content-Type' en los headers. Utiliza las propiedades 'accept' y 'contentType' en requestoptions."
                        );
                    }
                }
            }
            return {
                ...endpointOrOptions,
                method,
                data: endpointOrOptions.data ?? data,
                accept: endpointOrOptions.accept || 'application/json',
                contentType: endpointOrOptions.contentType || (data ? 'application/json' : undefined)
            };
        }
    }

    // Métodos CRUD simplificados

    async get<T = any>(endpoint: string): Promise<ApiResponse<T>> {
        const requestOptions = this.prepareRequestFormat(endpoint, null, 'GET');
        return await this.makeRequest<T>(requestOptions);
    }

    async post<T = any>(endpoint: string, data: any): Promise<ApiResponse<T>> {
        const requestOptions = this.prepareRequestFormat(endpoint, data, 'POST');
        return await this.makeRequest<T>(requestOptions);
    }

    async put<T = any>(endpoint: string, data: any): Promise<ApiResponse<T>> {
        const requestOptions = this.prepareRequestFormat(endpoint, data, 'PUT');
        return await this.makeRequest<T>(requestOptions);
    }

    async patch<T = any>(endpoint: string, data: any): Promise<ApiResponse<T>> {
        const requestOptions = this.prepareRequestFormat(endpoint, data, 'PATCH');
        return await this.makeRequest<T>(requestOptions);
    }

    async delete<T = any>(endpoint: string): Promise<ApiResponse<T>> {
        const requestOptions = this.prepareRequestFormat(endpoint, null, 'DELETE');
        return await this.makeRequest<T>(requestOptions);
    }

    async raw(endpoint: string, extraHeaders: Record<string, string> = {}): Promise<Response> {
        // Reutilizamos la misma validación de prepareRequestFormat
        // para que se mantenga la consistencia de tu API.
        const opts = this.prepareRequestFormat(endpoint, null, 'GET');
        opts.accept = '*/*';                 // Acepta cualquier tipo
        opts.headers = { ...extraHeaders };  // Headers adicionales

        // *** Lo mismo que makeRequest pero SIN leer el body ***
        // (copiamos solo la parte necesaria)

        // 1) Construcción de URL + Auth
        let headersConfig: Record<string, string> = {};
        let url = '';

        if (opts.endpoint.startsWith('/')) {
            url = this.account
                ? `https://${this.host}/${this.account}${opts.endpoint}`
                : `https://${this.host}${opts.endpoint}`;

            const accessToken = await this.auth.getAccessToken();
            headersConfig['Authorization'] = `Bearer ${accessToken}`;
        } else if (opts.endpoint.startsWith('https://')) {
            url = opts.endpoint;
        } else {
            url = `/${opts.endpoint}`;
        }

        // 2) Headers
        headersConfig['Accept'] = opts.accept || '*/*';
        if (opts.headers) {
            headersConfig = { ...headersConfig, ...opts.headers };
        }

        const requestInit: RequestInit = {
            method: 'GET',
            headers: new Headers(headersConfig)
        };

        // 3) Ejecutamos fetch y devolvemos el Response sin procesarlo
        const response = await fetch(url, requestInit);

        // Si quieres controlar aquí los códigos de error,
        // podrías lanzar una excepción en caso de !response.ok,
        // pero al tratarse de “raw” es habitual retornar el Response tal cual.
        return response;
    }
}

