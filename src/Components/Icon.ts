'use strict';

import AcinsoftComponent from "../Core/Component";

class AcinsoftIcon extends AcinsoftComponent {
    static selector: string = 'i[svg]';

    /**
     * Reemplaza el contenido del icono con una referencia SVG.
     */
    build() {

        const faceAttr = this.getAttribute('svg');

        if (!faceAttr) {
            console.error(`El atributo "svg" no está definido en el elemento con ID "${this.id}".`);
            return;
        }

        this.innerHTML = `<svg class="icon"><use href="/assets/images/icons/_map.svg#${faceAttr}"></use></svg>`;
    }
}

export default AcinsoftIcon;
