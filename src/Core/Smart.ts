'use strict';

export default class AcinsoftSmartElement extends HTMLElement {
    isSmart!: boolean;
    testProp!: number;

    private _queue!: Promise<this>;

    build() {
        this.build = () => { throw new Error('The smart element is builded'); };
        this.isSmart = true;
    }

    private _enqueue(fn: () => Promise<this>): Promise<this> {
        if (!this._queue) this._queue = Promise.resolve(this);
        this._queue = this._queue.then(() => fn());
        return this._queue;
    }

    private async _raf(): Promise<void> {
        return new Promise(resolve => requestAnimationFrame(() => resolve()));
    }

    find(selector: string): NodeListOf<Element> { return this.querySelectorAll(selector); }
    swapClass(removeClass: string, addClass: string): this { this.classList.remove(removeClass); this.classList.add(addClass); return this; }
    toggleClass(c: string): boolean { this.classList.toggle(c); return this.classList.contains(c); }
    switchClass(a: string, b: string): this { return this.classList.contains(a) ? this.swapClass(b, a) : this.swapClass(a, b); }
    setText(text: string): this { this.innerHTML = text; return this; }
    setHtml(html: string): this { this.innerHTML = html; return this; }
    setClass(c: string): this { this.className = c; return this; }
    addClass(c: string): this { this.classList.add(c); return this; }
    removeClass(c: string): this { this.classList.remove(c); return this; }

    private async lock(): Promise<this> {
        const el = this as any;
        if (el.lockElement) return this;

        if (getComputedStyle(this).position === 'static') {
            this.style.position = 'relative';
        }

        const overlay = document.createElement('div');
        overlay.className = 'lock';
        overlay.style.display = 'flex';
        overlay.style.opacity = '0';
        overlay.style.transition = `opacity 0.3s ease`;
        this.appendChild(overlay);

        // fuerza reflow
        overlay.getBoundingClientRect();
        // dispara transición
        overlay.style.opacity = '1';

        await Promise.race([
            new Promise<void>(res => overlay.addEventListener('transitionend', () => res(), { once: true })),
            new Promise<void>(res => setTimeout(res, 350))
        ]);

        el.lockElement = overlay;
        return this;
    }

    private async unlock(): Promise<this> {

        const el = this as any;
        const overlay = el.lockElement as HTMLElement | undefined;
        if (!overlay) return this;

        overlay.style.transition = `opacity 0.3s ease`;
        overlay.style.opacity = '1';

        // fuerza reflow
        overlay.getBoundingClientRect();
        // dispara transición de salida
        overlay.style.opacity = '0';

        await Promise.race([
            new Promise<void>(res => overlay.addEventListener('transitionend', () => res(), { once: true })),
            new Promise<void>(res => setTimeout(res, 350))
        ]);

        overlay.remove();
        el.lockElement = null;
        return this;
    }

    // 3. loading()
    async loading(): Promise<this> {
        return this._enqueue(async () => {
            await this.lock();                      // reutiliza nuevo lock()

            const el = this as any;
            const overlay = el.lockElement as HTMLElement;
            const loader = document.createElement('span');

            loader.className = 'loader';
            loader.style.opacity = '0';
            loader.style.transition = `opacity 0.3s ease`;
            overlay.appendChild(loader);

            // fuerza reflow
            loader.getBoundingClientRect();
            // arranca la animación
            loader.style.opacity = '1';

            await Promise.race([
                new Promise<void>(res => loader.addEventListener('transitionend', () => res(), { once: true })),
                new Promise<void>(res => setTimeout(res, 350))
            ]);

            el.lockElement.loader = loader;
            return this;
        });
    }

    // 4. ready()
    async ready(): Promise<this> {
        return this._enqueue(async () => {
            return this.unlock();
        });
    }

    async fadeIn(duration: number = 0.3): Promise<this> {
        return this._enqueue(async () => {

            const el = this;

            el.classList.remove('hidden');
            el.style.display = '';
            el.style.opacity = '0';
            el.style.transition = `opacity ${duration}s ease`;

            // forzar reflow
            el.getBoundingClientRect();

            // arrancar animación
            el.style.opacity = '1';

            await Promise.race([
                new Promise<void>(res => el.addEventListener('transitionend', () => res(), { once: true })),
                new Promise<void>(res => setTimeout(res, duration * 1000 + 50))
            ]);

            el.style.transition = '';
            return el;
        });
    }

    async fadeOut(duration: number = 0.3): Promise<this> {
        return this._enqueue(async () => {
            const el = this;
            if (getComputedStyle(el).display === 'none') return el;

            el.style.transition = `opacity ${duration}s ease`;
            el.style.opacity = '1';

            // reflow
            el.getBoundingClientRect();
            // dispara fade out
            el.style.opacity = '0';

            await Promise.race([
                new Promise<void>(res => el.addEventListener('transitionend', () => res(), { once: true })),
                new Promise<void>(res => setTimeout(res, duration * 1000 + 50))
            ]);

            el.style.display = 'none';
            el.style.transition = '';
            return el;
        });
    }

    async zoomIn(duration: number = 0.3): Promise<this> {
        return this._enqueue(async () => {

            const el = this;

            el.classList.remove('hidden');
            el.style.display = '';
            el.style.opacity = '0';
            el.style.transform = 'scale(0.9) translateZ(0)';
            el.style.transition = `opacity ${duration}s ease, transform ${duration}s ease`;

            // forzar reflow
            el.getBoundingClientRect();

            // arrancar
            el.style.opacity = '1';
            el.style.transform = 'scale(1) translateZ(0)';

            await Promise.race([
                new Promise<void>(res => el.addEventListener('transitionend', () => res(), { once: true })),
                new Promise<void>(res => setTimeout(res, duration * 1000 + 50))
            ]);

            el.style.transition = '';
            el.style.transform = '';

            return el;

        });
    }

    async zoomOut(duration: number = 0.3): Promise<this> {
        return this._enqueue(async () => {
            const el = this;

            el.style.transition = `opacity ${duration}s ease, transform ${duration}s ease`;
            el.style.opacity = '1';
            el.style.transform = 'scale(1) translateZ(0)';

            // reflow
            el.getBoundingClientRect();
            // dispara salida
            el.style.opacity = '0';
            el.style.transform = 'scale(0.9) translateZ(0)';

            await Promise.race([
                new Promise<void>(res => el.addEventListener('transitionend', () => res(), { once: true })),
                new Promise<void>(res => setTimeout(res, duration * 1000 + 50))
            ]);

            el.style.transition = '';
            el.style.transform = '';
            el.style.display = 'none';
            return el;
        });
    }

    show(): this { this.classList.remove('hidden'); return this; }
    hide(): this { this.classList.add('hidden'); return this; }

    getValue(): string {
        const inp = this as unknown as HTMLInputElement;
        return inp.type === 'checkbox' ? (inp.checked ? 'on' : 'off') : inp.value;
    }

    create<K extends keyof HTMLElementTagNameMap>(type: K): HTMLElementTagNameMap[K] {
        return document.createElement(type);
    }

    setValue(value: string, sendevent: boolean = false): this {
        const el = this as HTMLElement & {
            value?: string;
            checked?: boolean;
            options?: HTMLOptionsCollection;
        };

        // 1) Determinar qué valor usar: atributo default o el valor pasado
        const defaultAttr = el.getAttribute('default');
        let v = (!value ? defaultAttr : value) ?? '';

        // 2) Manejo según tipo de elemento
        if (el instanceof HTMLInputElement) {
            switch (el.type) {
                case 'checkbox':
                    v = v.toString();
                    // Para checkbox: activado si default/on/true
                    el.checked = v == 'true' || v == 'on';
                    break;

                case 'radio':
                    // Para radio: activado si coincide con su propio value
                    el.checked = el.value === v;
                    break;

                case 'date':
                case 'time':
                case 'datetime-local': {
                    // Para date/time/date-time-local
                    const parts = v.split('T');
                    const datePart = parts[0] || '';
                    const timePart = (parts[1] || '').split('.')[0];
                    if (el.type === 'date') {
                        el.value = datePart;
                    } else if (el.type === 'time') {
                        el.value = timePart;
                    } else {
                        el.value = `${datePart}T${timePart}`;
                    }
                    break;
                }

                default:
                    // Otros inputs (text, number, email, etc.)
                    el.value = v;
            }

        } else if (el instanceof HTMLSelectElement) {

            // Si no viene valor, usar cadena vacía
            const options = Array.from(el.options);

            // Buscar opción que coincida con default
            let match = options.find(o => o.value == v);

            if (match) {
                match.selected = true;
                el.value = match.value;
            } else if (options.length > 0) {
                // Si nada coincide, seleccionar siempre la primera opción
                el.selectedIndex = 0;
                el.value = options[0].value;
            }

        } else if (el instanceof HTMLTextAreaElement) {
            // Textarea
            el.value = v;

        } else if ('value' in el) {
            // Fallback para cualquier otro elemento con value
            (el as any).value = v;

        } else if ('innerHTML' in el) {
            // Fallback para elementos de solo texto
            (el as any).innerHTML = v;

        } else if ('textContent' in el) {
            // Fallback para elementos de solo texto
            (el as any).textContent = v;

        } else {
            console.warn('Elemento no admite asignación de valor:', el);
        }

        // 3) Disparar evento change si se solicitó
        if (sendevent) {
            el.dispatchEvent(new Event('change', { bubbles: true }));
        }

        return this;
    }


    setAccept(value: string): this { (this as any).accept = value; return this; }

    parse(data: Record<string, any>): DocumentFragment | null {
        const tmpl = this as unknown as HTMLTemplateElement;
        let str = tmpl.innerHTML.replace(/\{(.*?)\}/g, (_, k) => data[k.trim()] ?? '');
        const c = document.createElement('div'); c.innerHTML = str;
        const frag = document.createDocumentFragment(); while (c.firstChild) frag.appendChild(c.firstChild!);
        return frag;
    }

    disable(): this { this.setAttribute('disabled', 'disabled'); return this; }
    enable(): this { this.removeAttribute('disabled'); return this; }

    close(): void { console.log('Default close'); }
    open(): void { console.log('Default open'); }
}
