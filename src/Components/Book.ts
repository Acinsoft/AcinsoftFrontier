'use strict';

import AcinsoftComponent from "../Core/Component";

export default class AcinsoftBook extends AcinsoftComponent {

    static selector: string = '.book-page[book]';
    book: string = '';
    page: string = '';

    async open() {

        // Actualiza la clase active en botones y páginas
        const btns = document.querySelectorAll('[book="' + this.book + '"]');
        btns.forEach((item) => {
            const pagei = item.getAttribute('book-page');
            if (pagei) { // Es botón
                if (this.page === pagei) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            } else { // Es página
                if (this.page === item.id) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            }
        });

        // Actualiza el hash sin perder otros valores existentes
        let hash = document.location.hash;
        if (hash.startsWith('#')) {
            hash = hash.substring(1);
        }
        // Separa los valores usando '#' como delimitador
        const segments = hash ? hash.split('#') : [];
        let bookSegmentFound = false;

        // Actualiza el segmento del libro, si existe
        for (let i = 0; i < segments.length; i++) {
            if (segments[i].startsWith('bk:' + this.book + ':')) {
                segments[i] = 'bk:' + this.book + ':' + this.page;
                bookSegmentFound = true;
            }
        }
        // Si no existe ningún segmento para este libro, se agrega
        if (!bookSegmentFound) {
            segments.push('bk:' + this.book + ':' + this.page);
        }
        // Reasigna el hash sin perder los otros valores
        document.location.hash = segments.join('#');
    }

    build() {

        this.book = this.getAttribute('book')!;
        this.page = this.getAttribute('id')!;

        // Configura el evento click en cada botón asociado
        const btns = document.querySelectorAll('[book="' + this.book + '"][book-page="' + this.page + '"]');
        btns.forEach(btn => {
            const btne = btn as HTMLElement;
            btne.onclick = () => {
                if (btne.classList.contains('disabled')) return;
                if (btne.classList.contains('active')) return;
                this.open();
            };
        });

        // Verifica si el hash ya contiene una configuración para este libro
        let currentHash = document.location.hash;
        if (currentHash.startsWith('#')) {
            currentHash = currentHash.substring(1);
        }
        const segments = currentHash ? currentHash.split('#') : [];
        let found = false;
        segments.forEach(seg => {
            if (seg.startsWith('bk:' + this.book + ':')) {
                const parts = seg.split(':');
                // parts[0] = bk, parts[1] = book, parts[2] = page
                if (parts[2] === this.page) {
                    found = true;
                }
            }
        });

        // Si se encontró el segmento con la página actual, se abre el libro
        if (found) {
            this.open();
        } else {
            // Si no existe configuración para este libro en el hash,
            // se abre si la página actual es la default
            if (!currentHash.includes('bk:' + this.book + ':')) {
                const currPage = document.getElementById(this.page);
                if (currPage && currPage.classList.contains('default')) {
                    this.open();
                }
            }
        }
    }

}
