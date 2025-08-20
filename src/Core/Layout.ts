'use strict';

import AcinsoftApplication from "./Acinsoft";
import { ApiResponse } from "./Api";
import AcinsoftPage from "./Page";
import AcinsoftScope from "./Scope";
import AcinsoftSmartElement from "./Smart";
import AcinsoftFormat from "./Format";

export default class AcinsoftLayout extends AcinsoftScope {

    // Autoinject
    app!: AcinsoftApplication;

    // Propiedades
    page?: AcinsoftPage;
    modulesPath!: string;
    isSPAMode!: boolean;
    isLayout!: boolean;
    idBussy!: boolean;
    format!: AcinsoftFormat;
    currentPage!: string;

    build() {

        this.format = new AcinsoftFormat();
        this.isLayout = true;
        this.isSPAMode = false;
        if (document.location.pathname != '/') {
            this.modulesPath = document.location.pathname.substring(0, 36) + '/Scripts';
        }
        else {
            this.modulesPath = '';
        }

    }

    onClick() {
    }

    enableSPAMode(): void {
        this.isSPAMode = true;
    }

    setPageModulesPath(path: string): void {
        this.modulesPath = path;
    }

    setModalContainer(id: string): void {
        if (this.modal) {
            throw new Error(`Ya está definido el contenedor para los modales "${id}".`);
        }

        //this.modal = document.getElementById(id)!;
        //if (!this.modal) {
        //    throw new Error(`No se encontró un elemento con el id "${id}".`);
        //}

        (this.modal as any).baseComponent = this;
        //this.modal = new AcinsoftModal(this.modalcontainer);
    }

    errorPage(path: string, code: any): string {
        return `
            <div class="panel">
                <div class="panel-header">
                    <h2>¡Error al cargar la página!</h2>
                </div>
                <div class="panel-body">
                    <p>Ocurrió un error al intentar cargar <strong>${path}</strong>.</p>
                    <p>Código de error: <strong>${code}</strong></p>
                </div>
            </div>
        `;
    }

    async onChangedPage() {
    }

    //find(selector: string): NodeListOf<Element> {
    //    return this.getDomElement().querySelectorAll(selector);
    //}

    async openPage(path: string, skipPushState: boolean = false): Promise<void> {

        if (!this.isSPAMode || this.idBussy) return;
        this.idBussy = true;

        try {

            if (!path.startsWith('/')) {
                throw new Error(`La ruta debe iniciar con "/": ${path}`);
            }

            const acceptClose = this.page === undefined || await this.page?.close() === true;
            if (!acceptClose) {
                console.info('La página actual evitó ser cerrada.');
                return;
            }

            await this.run(
                this.page?.fadeOut(),
                //this.items.pagetitle.fadeOut(),
                //this.items.breadcrumb.fadeOut()
            );

            this.page?.remove();
            this.page = undefined;

            //this.items.breadcrumb.innerHTML = '';
            //this.items.pagetitle.innerHTML = '';

            const pageRender = document.createElement('div');
            this.items.page.innerHTML = '';
            this.items.page.appendChild(pageRender);

            if (!skipPushState && document.location.pathname !== path) {
                window.history.pushState({ path }, '', path);
            }

            this.currentPage = path;

            let pageResult: ApiResponse;

            try {
                pageResult = await this.api.makeRequest<ApiResponse>({
                    method: 'GET',
                    endpoint: path.substring(1),
                    accept: 'acinsoft/page',
                });
            } catch {
                console.error('No se logro conectar con el servicio');
                pageResult = { success: false, code: 0 };
            }

            // Obtengo el contenedor de la pagina
            let modulePath: string;

            const script = pageResult.headers?.['app-script'];

            // Escalo a pagina
            this.page = await this.builder.makePage(pageRender);

            // Verifico que la pagina no sea nula
            if (this.page == null) {
                throw new Error('The page canot load correctly.');
            }

            // Asigno la app
            this.page.app = this.app;

            // Limpio la pagina actual
            this.page.innerHTML = '';

            if (pageResult?.success) {
                this.page.innerHTML = pageResult?.data;
            }
            else
            {
                this.page.insertAdjacentHTML('beforeend', this.errorPage(document.location.pathname, pageResult.code));
            }

            // Si tenemos script, inyecto dependencias de la pagina
            if (script) {

                // Construyo la url
                modulePath = script.endsWith('/') ? `${script}index` : script;
                const finalModulePath = `/Frontend${modulePath}`;

                // Obtengo el nombre de la clase
                const module = await import(finalModulePath);
                const LayoutClass = module.default;

                this.builder.injectObject(LayoutClass, this.page);

            }

            // Limpio los modales
            const pagemodals = document.getElementById('pagemodals') as HTMLElement;
            pagemodals.innerHTML = '';

            // Construyo los contenidos de la pagina
            await this.builder.buildComponent(this.page, 'page');

            // Inicializo los componentes
            await this.builder.inicializeComponents(this.page);

            this.page.notifier = this.notifier;

            // Ejecuto el inicializador del layout
            this.page.preInit();
            this.page.init();

            await this.run(
                //pagebreadcrumb ? this.items.breadcrumb.fadeIn() : null,
                //pagetitle ? this.items.pagetitle.fadeIn() : null,
                (this.page as any).fadeIn()
            );
            this.idBussy = false;
            await this.onChangedPage();

        }
        catch(error) {
            console.error('FAIL: ', error);
        }
        finally {
            this.idBussy = false;
        }
    }

    addScript(url: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src="${url}"]`)) {
                resolve();
                return;
            }

            const script = document.createElement('script');
            script.src = url;
            script.async = true;
            script.defer = true;

            script.onload = () => resolve();
            script.onerror = () => reject(new Error(`Error al cargar el script: ${url}`));

            document.head.appendChild(script);
        });
    }

}

