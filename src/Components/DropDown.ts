'use strict';

import AcinsoftComponent from "../Core/Component";

export default class AcinsoftDropdown extends AcinsoftComponent {

    static selector: string = '[dropdown]';
    private dropdownRef: HTMLElement | null = null;

    /**
     * Inicializa el dropdown enlazándolo con su referencia.
     */
    build() {

        console.log('Build dropdown');

        const dropdownId = this.getAttribute('dropdown');
        if (!dropdownId) {
            console.error(`El atributo "dropdown" no está definido en el elemento con ID "${this.id}".`);
            return;
        }

        this.dropdownRef = document.getElementById(dropdownId);
        if (!this.dropdownRef) {
            console.error(`No se encontró un elemento con el ID "${dropdownId}" para el dropdown.`);
            return;
        }

        console.log(this.getBoundingClientRect());

        this.addEventListener('click', () => {
            this.toggleDropdown();
        });
    }

    /**
     * Alterna la clase 'open' en el dropdown.
     */
    private toggleDropdown(): void {
        if (this.dropdownRef) {
            this.dropdownRef.classList.toggle('open');
        }
    }
}

