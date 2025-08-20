'use strict';

import AcinsoftComponent from "../Core/Component";
import AcinsoftSmartElement from "../Core/Smart";

type ModalParams = Record<string, any>;

export default class AcinsoftModal extends AcinsoftComponent {

    storageElement!: HTMLElement;
    activeModals!: HTMLElement;
    modalcontainer!: AcinsoftSmartElement;
    isLayoutModal: boolean = true;
    static selector: string = '.modal';

    // Cola estática para encolar aperturas/cierres
    private static _queue: Promise<void> = Promise.resolve();
    private static fadeOutTimer?: number;

    private static _enqueue(fn: () => Promise<void>): Promise<void> {
        this._queue = this._queue.then(() => fn());
        return this._queue;
    }

    /**
     * Abre el modal identificado por modalId.
     */
    static open(modalId: string, button: HTMLElement, params: ModalParams = {}): Promise<void> {

        if (AcinsoftModal.fadeOutTimer) {
            clearTimeout(AcinsoftModal.fadeOutTimer);
            AcinsoftModal.fadeOutTimer = undefined;
        }

        return this._enqueue(async () => {
            const modal = document.getElementById(modalId) as unknown as AcinsoftModal;
            if (modal)  await modal.openImpl(button, params);
        });
    }

    /**
     * Cierra el modal identificado por modalId.
     */
    static close(modalId: string): Promise<void> {
        return this._enqueue(async () => {
            const modal = document.getElementById(modalId) as unknown as AcinsoftModal;
            if (!modal) console.error(`Modal '${modalId}' not found`);
            else await modal.closeImpl();
        });
    }

    // Implementación real de apertura (no expuesta directo)
    private async openImpl(button: HTMLElement, params: ModalParams) {

        await this.onOpen();
        if (this.id && this.scope && this.scope[this.id + 'OnOpen']) {
            await this.scope[this.id + 'OnOpen'](this, button, params);
        }

        // 1) Inserto el modal en el overlay
        this.activeModals.appendChild(this);

        // 2) Muestro el overlay si hace falta (por ejemplo, quitando 'hidden')
        this.modalcontainer.fadeIn();

        // 3) Ahora hago zoomIn **sobre el modal**  
        await this.zoomIn();

        // opcional: marcar como abierto para CSS
        this.classList.add('open');
    }

    // Implementación real de cierre (no expuesta directo)
    private async closeImpl() {
        // 1) Quito clase 'open' para CSS
        this.classList.remove('open');

        // 2) Hago zoomOut **sobre el modal**  
        await this.zoomOut();

        // 3) Vuelvo a su contenedor de almacenamiento
        this.storageElement.appendChild(this);

        // 4) Si ya no hay modales abiertos, oculto el overlay
        if (this.activeModals.children.length === 0) {
            AcinsoftModal.fadeOutTimer = window.setTimeout(async () => {
                // Sólo ocultar si sigue sin haber modales
                if (this.activeModals.children.length === 0) {
                    await this.modalcontainer.fadeOut(.3);
                }
                AcinsoftModal.fadeOutTimer = undefined;
            }, 50);
        }

        // 5) Trigger hook onClose
        if (this.scope && this.scope[this.id + 'OnClose']) {
            await this.scope[this.id + 'OnClose'](this);
        }

        this.reset();
    }

    /**
     * Resetea formularios dentro del modal.
     */
    async reset(): Promise<void> {
        this.querySelectorAll('form').forEach((form: HTMLFormElement) => {
            try {
                form.reset();

                const fields = form.querySelectorAll<HTMLElement>('[name]');
                fields.forEach(field => {
                    const defaultAttr = field.getAttribute('default');
                    const defaultValue = defaultAttr !== null ? defaultAttr : '';

                    const anyField = field as any;
                    if (typeof anyField.setValue === 'function') {
                        anyField.setValue(defaultValue);
                    } else {
                        if (field instanceof HTMLInputElement) {
                            // checkbox o radio
                            if (field.type === 'checkbox' || field.type === 'radio') {
                                field.checked = defaultAttr !== null
                                    ? defaultAttr === 'true'
                                    : false;
                            } else {
                                // inputs de texto, number, date, etc.
                                field.value = defaultValue;
                            }
                        } else if (field instanceof HTMLSelectElement) {
                            // select con validación de valor
                            const hasOption = Array.from(field.options)
                                .some(opt => opt.value === defaultValue);

                            if (hasOption) {
                                field.value = defaultValue;
                            } else {
                                // si no existe, selecciona la primera opción
                                field.selectedIndex = 0;
                            }
                        } else if (field instanceof HTMLTextAreaElement) {
                            // textarea
                            field.value = defaultValue;
                        } else if ('value' in field) {
                            // fallback genérico
                            (field as any).value = defaultValue;
                        }
                    }
                });

            } catch (err) {
                console.error('Error al resetear el formulario:', err);
            }
        });
    }


    build() {
        // Evita reconfigurar layout más de una vez
        if (!this.isLayoutModal) {
            this.isLayoutModal = false;
        }

        // Sobrescribo los métodos de instancia para que llamen a los estáticos
        (this as any).open = (button: HTMLElement, params: ModalParams = {}) => {
            return AcinsoftModal.open(this.id, button, params);
        };

        this.close = () => {
            return AcinsoftModal.close(this.id);
        };

        // Determina ámbito y contenedores
        const page = this.closest('#page');
        this.scope = page ? (page.children[0] as any) : (this.closest('html') as any);
        this.activeModals = document.getElementById('activemodals')!;
        this.modalcontainer = document.getElementById('modalcontainer')! as AcinsoftSmartElement;
        const layoutRoot = this.closest('#page') ? 'pagemodals' : 'layoutmodals';
        this.storageElement = document.getElementById(layoutRoot)!;

        // Botones de cierre delegan a this.close (que ahora llama al estático)
        this.querySelectorAll('[close], .close').forEach(btn => {
            btn.addEventListener('click', () => {
                this.close();
            });
        });

        // Botones que abren el modal delegan a this.open (que ahora llama al estático)
        document.querySelectorAll(`[modal="${this.id}"]`).forEach(rawBtn => {
            const btn = rawBtn as HTMLElement;
            btn.removeAttribute('modal');
            btn.addEventListener('click', () => {

                const params: ModalParams = {};
                const str = btn.getAttribute('params') || '';

                str.split('&').filter(p => p).forEach(pair => {
                    const [k, v] = pair.split('=');
                    params[decodeURIComponent(k)] = decodeURIComponent(v);
                });

                this.reset();
                (this as any).open(btn, params);

            });
        });
    }

    // Hooks para lógica adicional
    protected async onOpen(): Promise<void> { }
    protected async onClose(): Promise<void> { }
}
