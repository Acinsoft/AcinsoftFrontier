'use strict';

import AcinsoftApplication from "./Acinsoft";
import AcinsoftComponent from "./Component";
import AcinsoftNotifications from "./Notifications";
import AcinsoftSmartElement from "./Smart";

export default class AcinsoftScope extends AcinsoftComponent {

    modelItems!: Record<string, AcinsoftSmartElement[]>;
    components!: Record<string, AcinsoftComponent>;
    items!: Record<string, AcinsoftSmartElement>;
    notifier!: AcinsoftNotifications;
    app!: AcinsoftApplication;
    isScope!: boolean;

    showMessage(type: "info" | "danger" | "warning" | "success", message: string): void {
        switch (type) {
            case "info":
                this.notifier.info(message);
                break;
            case "danger":
                this.notifier.danger(message);
                break;
            case "warning":
                this.notifier.warning(message);
                break;
            case "success":
                this.notifier.success(message);
                break;
        }
    }

    build() {
        this.build = () => { throw Error('The scope is builded'); };
        this.isScope = true;
        this.items = {};
        this.components = {};
        this.modelItems = {};
        window.addEventListener('resize', () => { this.onResize(); });
    }

    onResize() {
    }

    showItems(displayName) {
        const displayItems = this.querySelectorAll(displayName);
        displayItems.forEach((item) => {
            item.classList.remove('hidden');
        });
    }

    enableItems(displayName) {
        const displayItems = this.querySelectorAll(displayName);
        displayItems.forEach((item) => {
            item.classList.remove('disabled');
            item.removeAttribute('disabled');
        });
    }

    hideItems(displayName) {
        const displayItems = this.querySelectorAll(displayName);
        displayItems.forEach((item) => {
            item.classList.add('hidden');
        });
    }

    disableItems(displayName) {
        const displayItems = this.querySelectorAll(displayName);
        displayItems.forEach((item) => {
            item.classList.add('disabled');
            item.setAttribute('disabled', 'disabled');
        });
    }

    /**
     * Obtiene los parámetros de la URL actual y los devuelve como un objeto.
     * @returns {Record<string, string>} Objeto con los parámetros de la URL.
     */
    get params(): Record<string, string> {

        // Obtener el query string de la URL actual
        const queryString = window.location.search;

        // Crear un objeto URLSearchParams para analizar el query string
        const params = new URLSearchParams(queryString);

        // Convertir los parámetros a un objeto
        const result: Record<string, string> = {};
        for (const [key, value] of params.entries()) {
            result[key] = value;
        }

        return result;
    }

    getPath(path, params: any = null): string {

        if (!params || typeof params !== 'object') {
            return '/' + this.app.api.account + path;
        }

        return '/' + this.app.api.account + path.replace(/{([^}]+)}/g, (match, key) => {
            const paramKey = Object.keys(params).find(k => k.toLowerCase() === key.toLowerCase());
            return paramKey ? params[paramKey] : match;
        });
    }

    async run(...actions) {
        for (let i = 0; i < actions.length; i++) {
            await actions[i];
        }
    }

    async goto(path) {
        return this.app.layout.openPage(path, false);
    }
}

