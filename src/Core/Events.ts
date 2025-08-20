'use strict';

import AcinsoftApplication from "./Acinsoft";

export default class AcinsoftEvents {

    private app: AcinsoftApplication;

    constructor(app: AcinsoftApplication) {
        this.app = app;
    }

    /**
     * Inicializa los eventos de la aplicación
     */
    initializeEvents(): void {
        this.initializeClickCapture();
        this.initializePopStateListener();
    }

    /**
     * Captura eventos de clic en enlaces y botones para manejar navegación SPA y acciones
     */
    private initializeClickCapture(): void {

        document.addEventListener('click', (event: MouseEvent) => {

            if (this.app.layout == null) {
                throw Error('The layout is not defined');
            }

            this.app.layout.onClick();

            const linkElement = (event.target as HTMLElement).closest('a');

            if (this.app.layout.isSPAMode && linkElement) {
                if (linkElement.hasAttribute('download')) {
                    return;
                }
                let target = linkElement.getAttribute('target');
                if (target != '_blank') {
                    let href = linkElement.getAttribute('href');
                    event.preventDefault();
                    if (href) {
                        if (
                            href.startsWith('http://') ||
                            href.startsWith('https://') ||
                            href.startsWith('//') ||
                            href.startsWith('tel:') ||
                            href.startsWith('mailto:') ||
                            href.startsWith('ftp:') ||
                            href.startsWith('javascript:') ||
                            href.startsWith('sms:')
                        ) {
                            window.open(href, '_blank');
                        } else {
                            if (!href.startsWith('/' + this.app.api.account + '/')) {
                                href = '/' + this.app.api.account + href;
                            }
                            this.app.layout.openPage(href); // Navegación interna SPA
                            return;
                        }
                    }
                }
                return;
            }

            const btnElement = (event.target as HTMLElement).closest('button');

            if (btnElement) {
                const action = btnElement.getAttribute('action');
                if (action) {
                    event.preventDefault();
                    let params = btnElement.getAttribute('params')?.split(',') || [];

                    if (this.app.layout.page?.[action]) {
                        this.app.layout.page[action](...params);
                    } else if (this.app.layout[action]) {
                        this.app.layout[action](...params);
                    } else {
                        console.error('Action not found', action);
                    }
                }
                return;
            }

        });

    }

    /**
     * Captura eventos de navegación para manejar el historial en modo SPA
     */
    private initializePopStateListener(): void {

        window.addEventListener('popstate', (event: PopStateEvent) => {


            if (this.app.layout == null) {
                throw Error('The layout is not defined');
            }

            if (window.location.pathname == this.app.layout.currentPage) {
                return;
            }

            if (this.app.layout.isSPAMode) {
                const path = event.state?.path ?? window.location.pathname;
                this.app.layout.openPage(path, true);
            }

        });


        window.addEventListener('hashchange', (event) => {

            if (document.location.hash) {
                const parts = document.location.hash.split('#');
                parts.forEach(part => {

                    if (part) {
                        const sections = part.split(':');
                        if (sections[0] == 'bk') {
                            const page = document.getElementById(sections[2]);
                            (page as any).open();
                        }
                    }

                });
            }
        });

    }
}

