'use strict';

import AcinsoftComponent from "./Component";

class AcinsoftTransitions extends AcinsoftComponent {
    /**
     * Aplica un bloqueo visual al elemento objetivo.
     * @param {HTMLElement} target - El elemento al que se aplicará el bloqueo.
     */
    static lock(target: HTMLElement & { blockedElement?: HTMLElement }): void {
        if (!target) return;

        if (target.blockedElement) {
            console.warn('El elemento ya está bloqueado.');
            return;
        }

        // Crear el elemento de bloqueo
        const blockDiv = document.createElement('div');
        blockDiv.className = 'block-animate';
        blockDiv.innerHTML = '<div class="loader"></div>';

        // Agregar referencia al elemento bloqueado
        target.blockedElement = blockDiv;
        target.appendChild(blockDiv);

        // Aplicar transición para mostrar el bloqueo
        requestAnimationFrame(() => {
            blockDiv.classList.add('show');
        });
    }

    /**
     * Elimina el bloqueo visual del elemento objetivo.
     * @param {HTMLElement} target - El elemento del que se eliminará el bloqueo.
     */
    static unlock(target: HTMLElement & { blockedElement?: HTMLElement | null }): void {
        if (!target || !target.blockedElement) {
            console.warn('El elemento no está bloqueado.');
            return;
        }

        // Ocultar el elemento de bloqueo con una transición
        const blockDiv = target.blockedElement;
        blockDiv.classList.remove('show');

        // Esperar la transición antes de eliminar el elemento
        setTimeout(() => {
            if (blockDiv && blockDiv.parentNode) {
                blockDiv.remove();
            }
            target.blockedElement = null;
        }, 320);
    }

    /**
     * Método auxiliar para transiciones genéricas de entrada.
     * @param {HTMLElement} element - El elemento que será animado.
     * @param {() => void} [callback] - Función que se ejecutará después de la animación.
     */
    static fadeIn(element: HTMLElement, callback?: () => void): void {
        if (!element) return;
        element.style.opacity = '0';
        element.style.display = '';

        requestAnimationFrame(() => {
            element.style.transition = 'opacity 0.3s ease';
            element.style.opacity = '1';
            if (callback) setTimeout(callback, 300);
        });
    }

    /**
     * Método auxiliar para transiciones genéricas de salida.
     * @param {HTMLElement} element - El elemento que será animado.
     * @param {() => void} [callback] - Función que se ejecutará después de la animación.
     */
    static fadeOut(element: HTMLElement, callback?: () => void): void {
        if (!element) return;
        element.style.transition = 'opacity 0.3s ease';
        element.style.opacity = '0';

        setTimeout(() => {
            element.style.display = 'none';
            if (callback) callback();
        }, 300);
    }
}

export default AcinsoftTransitions;
