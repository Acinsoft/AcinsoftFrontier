'use strict';

import AcinsoftApplication from "./Acinsoft";
import AcinsoftSmartElement from "./Smart";

export default class AcinsoftNotifications {

    element!: HTMLElement | null;
    app: AcinsoftApplication;

    constructor(app: AcinsoftApplication) {
        this.element = document.getElementById('notifications');
        this.app = app;
    }

    success(message: string): void {
        this.alert('success', message);
    }

    info(message: string): void {
        this.alert('info', message);
    }

    danger(message: string): void {
        this.alert('danger', message);
    }

    error(message: string): void {
        this.alert('danger', message);
    }

    warning(message: string): void {
        this.alert('warning', message);
    }

    async alert(type: string, message: string): Promise<void> {
        console.log('ALERT');

        const notify = this.app.builder.makeSmart(document.createElement('div'));
        const text = document.createElement('p');

        // Seguridad: evitar inyección usando textContent en lugar de innerHTML
        text.innerHTML = message;
        notify.className = type;
        notify.appendChild(text);
        this.element?.appendChild(notify);

        await (notify as any).fadeIn();

        let timeoutId: number;

        const removeNotify = async () => {
            await (notify as any).fadeOut();
            setTimeout(() => notify.remove(), 200);
        };

        const startTimer = () => {
            timeoutId = window.setTimeout(removeNotify, 5000);
        };

        const clearTimer = () => {
            clearTimeout(timeoutId);
        };

        // Cuando el cursor entra, pausamos la eliminación
        notify.addEventListener('mouseenter', clearTimer);

        // Cuando sale, reiniciamos el conteo
        notify.addEventListener('mouseleave', startTimer);

        // Clic para cerrar inmediatamente
        notify.addEventListener('click', () => {
            clearTimer();
            removeNotify();
        });

        // Iniciar el temporizador la primera vez
        startTimer();
    }

    async message(
        titleHtml: string | Node,
        bodyHtml: string | Node
    ): Promise<HTMLDivElement> {
        return new Promise(async resolve => {

            const pagemodals = document.getElementById('pagemodals')!;

            // 1. Crea modal + form
            const modal = document.createElement('div');
            modal.id = `id_notify_${Math.random().toString(36).substring(2, 10)}`;
            modal.classList.add('modal');

            const form = document.createElement('form');
            form.classList.add('form-container');
            modal.appendChild(form);

            // 2. Header
            const header = document.createElement('div');
            header.classList.add('form-header');
            const h4 = document.createElement('h4');
            if (typeof titleHtml === 'string') h4.innerHTML = titleHtml;
            else h4.appendChild(titleHtml);
            header.appendChild(h4);

            // 3. Body
            const body = document.createElement('div');
            body.classList.add('form-body');
            if (typeof bodyHtml === 'string') body.innerHTML = bodyHtml;
            else body.appendChild(bodyHtml);

            // 4. Footer + botón
            const footer = document.createElement('div');
            footer.classList.add('form-footer');
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.classList.add('btn', 'btn-primary', 'btn-continue');
            btn.setAttribute('close', '');
            btn.textContent = 'Continuar';
            footer.appendChild(btn);

            // Ensambla form
            form.append(header, body, footer);

            // 5. Inserta el modal en el DOM antes de construirlo
            pagemodals.appendChild(modal);

            // 6. Construye el modal con el builder
            this.app.builder.build(modal);

            // 7. Asegura que esté conectado al DOM
            if (!modal.isConnected) {
                pagemodals.appendChild(modal);
            }

            // 8. Configura el clic de 'Continuar'
            btn.addEventListener('click', async () => {
                await (modal as any).close();
                resolve(modal);
                modal.remove();
            });

            // 9. Ábrelo
            await (modal as any).open();
        });
    }

    async loading(
        titleHtml: string | Node,
        bodyHtml: string | Node
    ): Promise<AcinsoftSmartElement> {
        return new Promise(resolve => {

            const modal = document.createElement('div');
            modal.id = `id_notify_${Math.random().toString(36).substring(2, 10)}`;
            modal.classList.add('modal');

            const form = document.createElement('form');
            form.style.gap = '0';
            modal.appendChild(form);

            const header = document.createElement('div');
            header.classList.add('form-header');
            const h4 = document.createElement('h4');
            if (typeof titleHtml === 'string') h4.innerHTML = titleHtml;
            else h4.appendChild(titleHtml);
            h4.innerHTML += '<div style="position:absolute;right:10px;" class="loader"></div>';
            header.appendChild(h4);

            const body = document.createElement('div');
            body.classList.add('form-body');
            if (typeof bodyHtml === 'string') body.innerHTML = bodyHtml;
            else body.appendChild(bodyHtml);

            form.append(header, body);

            this.app.builder.build(modal);
            (modal as any).onClose = () => { };
            (modal as any).open();

            resolve(modal as any as AcinsoftSmartElement);
        });
    }

    async confirm(
        titleHtml: string | Node,
        bodyHtml: string | Node
    ): Promise<boolean> {
        return new Promise(async resolve => {

            const activemodals = document.getElementById('activemodals')!;
            const layoutmodals = document.getElementById('layoutmodals')!;

            const modal = document.createElement('div');
            modal.id = `id_notify_${Math.random().toString(36).substring(2, 10)}`;
            modal.classList.add('modal');

            const form = document.createElement('form');
            form.classList.add('form-container');

            const header = document.createElement('div');
            header.classList.add('form-header');
            const h4 = document.createElement('h4');
            if (typeof titleHtml === 'string') h4.innerHTML = titleHtml;
            else h4.appendChild(titleHtml);
            header.appendChild(h4);

            const bodyDiv = document.createElement('div');
            bodyDiv.classList.add('form-body');
            if (typeof bodyHtml === 'string') bodyDiv.innerHTML = bodyHtml;
            else bodyDiv.appendChild(bodyHtml);

            const footer = document.createElement('div');
            footer.classList.add('form-footer');

            const btnCancel = document.createElement('button');
            btnCancel.type = 'button';
            btnCancel.classList.add('btn', 'btn-secondary', 'btn-cancel');
            btnCancel.setAttribute('close', '');
            btnCancel.textContent = 'Cancelar';

            const btnContinue = document.createElement('button');
            btnContinue.type = 'button';
            btnContinue.classList.add('btn', 'btn-success', 'btn-continue');
            btnContinue.setAttribute('close', '');
            btnContinue.textContent = 'Continuar';

            footer.append(btnCancel, btnContinue);
            form.append(header, bodyDiv, footer);
            modal.appendChild(form);

            layoutmodals.appendChild(modal);
            activemodals.appendChild(modal);

            btnContinue.addEventListener('click', () => {
                setTimeout(() => modal.remove(), 1000);
                resolve(true);
            });
            btnCancel.addEventListener('click', () => {
                setTimeout(() => modal.remove(), 1000);
                resolve(false);
            });

            await this.app.builder.buildFragment(activemodals);

            await (modal as any).open();

        });
    }

}
