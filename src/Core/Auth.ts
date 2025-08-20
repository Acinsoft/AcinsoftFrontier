'use strict';

import AcinsoftApi from "./Api";

export default class AcinsoftAuth {

    private paddRenewSeconds: number;
    private api: AcinsoftApi;
    private tokenPath: string | null;
    private accessToken: string | null;
    private expToken: Date;
    private requestTokenPromise: Promise<number | null> | null;

    private onSuccessRenew: (expirationTime: Date) => Promise<void>;
    private onFailedRenew: () => Promise<void>;

    constructor(api: AcinsoftApi) {

        this.paddRenewSeconds = 15; // Se debe establecer 10 segundos abajo del paddSecondsTime del servidor
        this.api = api;
        this.tokenPath = null;
        this.accessToken = null;
        this.expToken = new Date(0);
        this.requestTokenPromise = null;

        this.onSuccessRenew = async () => { };
        this.onFailedRenew = async () => { };

    }

    /**
     * Configura la ruta para la renovación del token y la inicia automáticamente
     */
    async startRenewAtPath(
        path: string,
        onSuccess?: (expirationTime: Date) => Promise<void>,
        onFailed?: () => Promise<void>
    ): Promise<boolean> {
        if (onSuccess) this.onSuccessRenew = onSuccess;
        if (onFailed) this.onFailedRenew = onFailed;
        this.tokenPath = path;
        return await this.autoRenewToken();
    }

    /**
     * Inicia el proceso de renovación automática del token
     */
    private async autoRenewToken(): Promise<boolean> {
        this.requestTokenPromise = this.rotateToken();
        const leftSeconds = await this.requestTokenPromise;
        if (leftSeconds === null) {
            return false;
        }
        const timeout = leftSeconds - this.paddRenewSeconds;
        setTimeout(() => this.autoRenewToken(), timeout * 1000);
        return true;
    }

    /**
     * Obtiene los segundos restantes hasta que el token expire
     */
    private getRemainSecondsTime(): number {
        const now = Date.now();
        const expTime = this.expToken.getTime();
        return Math.floor((expTime - now) / 1000);
    }

    /**
     * Rota el token y obtiene un nuevo token de acceso
     */
    private async rotateToken(): Promise<number | null> {
        const remainSeconds = this.getRemainSecondsTime();

        if (remainSeconds > this.paddRenewSeconds) {
            return remainSeconds;
        }

        if (!this.tokenPath) {
            console.error('No se ha configurado la ruta del token.');
            return null;
        }

        try {

            const response = await this.api.post(this.tokenPath.substring(1),{});

            if (response.code === 200) {
                const now = Date.now();
                const expirationTime = new Date(now + response.data.expiresIn * 1000);
                this.expToken = expirationTime;
                this.accessToken = response.data.accessToken;
                await this.onSuccessRenew(expirationTime);
                return response.data.expiresIn;
            }

        } catch (error) {
            console.error('Error al rotar el token:', error);
        }

        await this.onFailedRenew();
        return null;
    }

    /**
     * Obtiene el token de acceso actual o lo renueva si es necesario
     */
    async getAccessToken(): Promise<string> {
        if (!this.requestTokenPromise) {
            return '';
        }

        const tokenTimeRemain = await this.requestTokenPromise.catch((error) => {
            console.error('Error en requestTokenPromise:', error);
            return -1;
        });

        if (!tokenTimeRemain || tokenTimeRemain < 0) {
            console.warn('No se pudo obtener el Access Token.');
            return '';
        }

        return this.accessToken || '';
    }

    /**
     * Inicia sesión con las credenciales proporcionadas
     */
    async startSession(endpoint: string, data: object): Promise<any> {
        if (!endpoint.startsWith('/')) {
            throw new Error("La ruta debe comenzar con '/'. Por favor, corrige la configuración.");
        }
        return await this.api.post(endpoint.substring(1), data);
    }

    /**
     * Cierra sesión llamando al endpoint correspondiente
     */
    async closeSession(endpoint: string): Promise<any> {
        if (!endpoint.startsWith('/')) {
            throw new Error("La ruta debe comenzar con '/'. Por favor, corrige la configuración.");
        }
        return await this.api.post(endpoint.substring(1), {});
    }
}
