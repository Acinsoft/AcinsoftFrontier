'use strict';

import AcinsoftScope from "./Scope";
import AcinsoftSmartElement from "./Smart";
import AcinsoftFormat from "./Format";

export default class AcinsoftPage<T = any> extends AcinsoftScope {

    model!: T;
    isPage!: boolean;
    paths!: Record<string, string>;
    format!: AcinsoftFormat;

    build() {

        this.format = new AcinsoftFormat();
        this.paths = {};
        this.isPage = true;
        this.setAttribute('itemscope', '');
        this.setAttribute('itemtype', 'https://schema.org/WebPage');

    }
    preInit() {

        const pathElems = document.querySelectorAll('template[path]');
        pathElems.forEach(e => {
            const name = e.getAttribute('name');
            const path = e.getAttribute('path');
            if (name && path) {
                this.paths[name] = path;
                e.remove();
            }
        });

    }

    setModel(object: Partial<T>) {
        // Si no existe modelo, lo creamos; si existe, le vamos asignando/reescribiendo solo las props nuevas
        if (!this.model) {
            this.model = { ...object } as T;
        } else {
            Object.assign(this.model, object);
        }

        // Actualizamos la UI de forma incremental
        Object.keys(this.modelItems).forEach((key) => {
            const val = (this.model as any)[key] ?? '';
            this.modelItems[key]?.forEach(el => {
                el.innerHTML = String(val);
            });
        });
    }

    setValues(object) {
        const objeKeys = Object.keys(object);
        objeKeys.forEach((key) => {
            const vtype = typeof object[key];
            if ((vtype == 'string' || vtype == 'number') && this.items[key]) {
                this.items[key].setValue(object[key]);
            }
        });
    }

    async reload() {
        await this.app.layout.openPage(document.location.pathname);
    }

    async close() {
        return true;
    }
}

