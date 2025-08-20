'use strict';

import AcinsoftModal from "../Components/Modal";
import AcinsoftApi from "./Api";
import AcinsoftBuilder from "./Builder";
import AcinsoftSmartElement from "./Smart";
import AcinsoftScope from "./Scope";

export interface IConfigurable<TConfig> {
    config: TConfig;
}

export default class AcinsoftComponent extends AcinsoftSmartElement {

    static selector: string = '';

    modal!: AcinsoftModal;
    api!: AcinsoftApi;
    builder!: AcinsoftBuilder;
    scope!: AcinsoftScope;

    isComponent!: boolean;
    isReady!: boolean;
    isLoaded!: boolean;
    autoInit!: boolean;

    param(index) {
        index++;
        const path = document.location.pathname.split('/');
        return path[index];
    }

    configure<T extends IConfigurable<any>>(data: T['config']): T {
        const element = this as unknown as T;
        element.config = data;
        return element;
    }

    build() {

        this.build = () => { throw Error('The component is builded'); };

        this.isComponent = true;
        this.isReady = false;
        this.isLoaded = false;
        this.autoInit = true;

    }

    setCookie(name: string, value: string, days: number = 7): void {
        const expires = new Date(Date.now() + days * 864e5).toUTCString();
        document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Strict`;
    }

    setSessionCookie(name: string, value: string): void {
        document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; path=/; SameSite=Strict`;
    }


    getCookie(name: string): string | null {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${encodeURIComponent(name)}=`);
        if (parts.length === 2) {
            return decodeURIComponent(parts.pop()!.split(";").shift()!);
        }
        return null;
    }

    getAllCookies(): Record<string, string> {
        return document.cookie.split("; ").reduce<Record<string, string>>((acc, cookie) => {
            const [key, val] = cookie.split("=");
            if (key && val !== undefined) {
                acc[decodeURIComponent(key)] = decodeURIComponent(val);
            }
            return acc;
        }, {});
    }

    goSection(section, value) {
        // Obtiene el hash actual sin el '#' inicial
        let currentHash = document.location.hash;
        if (currentHash.startsWith('#')) {
            currentHash = currentHash.substring(1);
        }
        // Separa los segmentos por '#' (si existen)
        let segments = currentHash ? currentHash.split('#') : [];
        const newSegment = section + ':' + value;
        let sectionFound = false;

        // Filtra los segmentos removiendo aquellos que correspondan a la misma sección
        segments = segments.filter(segment => {
            if (segment.startsWith(section + ':')) {
                // Solo se permite un segmento para la sección
                if (!sectionFound) {
                    sectionFound = true;
                }
                return false;
            }
            return true;
        });

        // Agrega el nuevo segmento al final
        segments.push(newSegment);

        // Reasigna el hash sin afectar los otros segmentos
        document.location.hash = segments.join('#');
    }

    getSectionValue(section) {
        // Obtiene el hash actual sin el '#' inicial
        let currentHash = document.location.hash;
        if (currentHash.startsWith('#')) {
            currentHash = currentHash.substring(1);
        }
        // Separa el hash en segmentos usando '#' como delimitador
        const segments = currentHash ? currentHash.split('#') : [];

        // Busca el segmento que corresponde a la sección
        for (let segment of segments) {
            if (segment.startsWith(section + ':')) {
                // Devuelve todo lo que sigue al primer ':' de la sección
                return segment.substring(section.length + 1);
            }
        }
        return null;
    }

    init() { }

}

export interface IComponentConstructor {
    new(element: AcinsoftSmartElement): any;
    selector?: string;
    name?: string;
}

