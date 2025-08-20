'use strict';

import AcinsoftApi from "./Api";
import AcinsoftBuilder from "./Builder";
import AcinsoftEvents from "./Events";
import AcinsoftLayout from "./Layout";
import AcinsoftNotifications from "./Notifications";

// Defino el objeto para la configuracion de la aplciacion base
export interface IAcinsoftConfig {
    api: {
        host: string;
    };
    components: string[];
}

// La aplicacion se encarga de inicializar todos los componentes singleton
export default class AcinsoftApplication {

    public config: IAcinsoftConfig;

    public layout!: AcinsoftLayout;
    public builder: AcinsoftBuilder;
    public events: AcinsoftEvents;
    public api: AcinsoftApi;

    static async run(config: IAcinsoftConfig): Promise<AcinsoftApplication> {
        const app = new AcinsoftApplication(config);
        await app.start();
        return app;
    }

    private constructor(config: IAcinsoftConfig) {

        this.config = config;
        this.builder = new AcinsoftBuilder(this.config.components || [], this);
        this.events = new AcinsoftEvents(this);
        this.api = new AcinsoftApi(this.config.api, this);

    }

    private async start() {

        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initializeApplication());
        } else {
            this.initializeApplication();
        }

    }

    private initializeApplication = async () => {

        try {
            
            // Cargo los componentes a utilizar
            await this.builder.loadComponents();

            // Inicializo los eventos
            this.events.initializeEvents();

            // Extraigo el nombre de el layout a ejecutar definida en el body
            const layoutElement = document.documentElement;
            const layoutName = layoutElement.getAttribute('app');
            if (!layoutName) {
                throw new Error('No layout name found in the body attribute "app".');
            }
            
            // Cargo el modulo del layout
            const module = await import(`/Frontend/${layoutName}`);
            const LayoutClass = module.default;

            // Escalo a layout
            this.layout = await this.builder.makeLayout(layoutElement);

            // Verifico que el layout no se anulo
            if (this.layout == null) {
                throw new Error('The layout canot load correctly.');
            }
            
            // Inyecto dependencias del layout
            //console.log('Inyecto elementos del layout');
            this.builder.injectObject(LayoutClass, this.layout);

            // Construyo los contenidos del layout
            //console.log('Construyo los elementos que contiene el layout');
            await this.builder.buildComponent(this.layout, 'layout');

            // Inicializo los componentes
            await this.builder.inicializeComponents(this.layout);

            // Asigno la app
            this.layout.app = this;

            // Habilito las notificaciones
            this.layout.notifier = new AcinsoftNotifications(this);

            // Ejecuto el inicializador del layout
            //console.log('Construyendo el layout');
            this.layout.init();

        } catch (error) {
            console.error('Error al inicializar la aplicación:', error);
        }

    };
}

