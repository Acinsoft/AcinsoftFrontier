'use strict';

import AcinsoftComponent from "../Core/Component";

class AcinsoftForm extends AcinsoftComponent {

    static selector: string = 'form';

    /**
     * Inicializa los eventos y métodos personalizados en el formulario.
     */
    build(): void {

        // Asigna el evento submit si no está definido
        if (!this.onsubmit) {
            this.onsubmit = (event) => this.submit(event);
        }

    }

    /**
     * Previene el envío por defecto del formulario.
     * @param event - Evento de envío del formulario.
     */
    public submit(event: Event): void {
        event.preventDefault();
    }

    /**
     * Recolecta los datos del formulario como un objeto.
     * @returns Un objeto con los valores del formulario.
     */
    public getData(): Record<string, FormDataEntryValue> {

        const form = this as unknown as HTMLFormElement;
        const formData = new FormData(form);// (this.element as HTMLFormElement);

        console.log(formData);

        const data: Record<string, FormDataEntryValue> = {};

        formData.forEach((value, key) => {
            data[key] = value;
        });

        return data;
    }

    /**
     * Recolecta los datos del formulario como un `FormData` nativo.
     * @returns Instancia de `FormData` con los valores del formulario.
     */
    public getFormData(): FormData {

        const formCast = this as any as HTMLFormElement;

        // Asegurarse de que es un formulario válido
        if (!(formCast instanceof HTMLFormElement)) {
            throw new Error("El elemento no es un formulario válido.");
        }

        // Crear FormData con los valores reales del formulario
        const formData = new FormData(formCast);

        return formData;
    }

    public check(): boolean {
        const form = this as any;
        if (!form.checkValidity()) {
            form.reportValidity();
            return false;
        }
        return true;
    }

}

export default AcinsoftForm;
