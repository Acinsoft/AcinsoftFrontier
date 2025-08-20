'use strict';

import AcinsoftApplication from "./Acinsoft";
import AcinsoftComponent, { IComponentConstructor } from "./Component";
import AcinsoftLayout from "./Layout";
import AcinsoftPage from "./Page";
import AcinsoftScope from "./Scope";
import AcinsoftSmartElement from "./Smart";

class AcinsoftBuilder {

    private app: AcinsoftApplication;
    private componentScripts: string[];
    private registeredComponents: IComponentConstructor[] = [];
    private processedElements: WeakSet<HTMLElement> = new WeakSet();

    constructor(componentScripts: string[], app: AcinsoftApplication) {

        this.app = app;
        this.componentScripts = componentScripts;

    }

    async loadComponents() {

        if (this.registeredComponents.length > 0) {
            throw Error("The components are loaded");
        }

        for (const scriptName of this.componentScripts) {
            try {
                const module = await import(`../Components/${scriptName}`);
                const ComponentClass = module.default;
                this.registeredComponents.push(ComponentClass);
            } catch (error) {
                throw Error(`Error al cargar el componente "${scriptName}":`);
            }
        }

    }

    getRootScope(mode: string): AcinsoftScope {

        // Objeto para manejar el componente base
        let baseComponent: AcinsoftScope | null = null;

        // Valido tener un layout
        if (!this.app.layout) {
            throw new Error("Builder requires a layout");
        }

        if (mode === 'page') {
            if (!this.app.layout.page) {
                console.error("Builder requires a page, asigned to layout.");
                baseComponent = this.app.layout;
            }
            else baseComponent = this.app.layout.page;
        }
        else if (mode === 'layout') {
            baseComponent = this.app.layout;
        }

        if (baseComponent == null){
            throw new Error("Build mode not permitted");
        }

        return baseComponent;
    }

    async injectObject(className, element: AcinsoftComponent) {

        try {

            if (!className || typeof className.prototype !== 'object') {
                throw new Error("claseDestino debe ser una clase válida con un prototipo.");
            }

            if (typeof element !== 'object' || element === null) {
                throw new Error("elementoAInyectar debe ser un objeto válido.");
            }

            // Copiar todos los métodos del prototipo
            let availableProps = Object.getOwnPropertyNames(className.prototype);
            const hasBuild = availableProps.filter(prop => prop === 'build').length > 0;
            const hasNewBuild = typeof element.build === 'function';

            availableProps
                .forEach(prop => {
                    const descriptor = Object.getOwnPropertyDescriptor(className.prototype, prop);
                    if (descriptor) {
                        Object.defineProperty(element, prop, descriptor);
                        //element[prop] = descriptor.value;
                    }
                });


            // Llamar al método `build()` si existe en el objeto inyectado
            if (hasBuild && hasNewBuild) {
                element.build()
                //await this.executeAndInjectParams(element.build.bind(element));
            }

            // Las dependencias se llaman despues del build y solo se asignan si no estan definidas
            //this.injectPropertiesDependencies(element);

            if (element.isComponent) {
                element.api = this.app.api;
                element.builder = this.app.builder;
            }


            return element; // Devuelve el objeto inyectado para uso encadenado
        }
        catch (error) {
            console.error(error);
            throw Error('No se logro inyectar el objeto');
        }
    }

    private dependencyCache = new Map<string, any>();

    injectPropertiesDependencies(element: any) {
        const proto = Object.getPrototypeOf(element);
        const propertyNames = Object.getOwnPropertyNames(proto);

        for (let i = 0; i < propertyNames.length; i++) {
            const name = propertyNames[i];

            if (typeof element[name] !== "function") {
                const descriptor = Object.getOwnPropertyDescriptor(proto, name);

                if (!descriptor?.get && !descriptor?.set) {
                    if (element[name] == null) {
                        // Usar cache si ya se resolvió antes
                        if (!this.dependencyCache.has(name)) {
                            this.dependencyCache.set(name, this.getNestedDependency(name));
                        }
                        element[name] = this.dependencyCache.get(name);
                    }
                }
            }
        }
    }


    async executeAndInjectParams(fn: any) {

        // Inyectar dependencias si es necesario
        const paramNames = this.getParameterNames(fn);
        const dependencies: readonly any[] = paramNames.length > 0 ? await this.resolveDependencies(fn) : [];

        // Construyo el componente
        (fn as (...args: any[]) => void)(...dependencies);

    }

    // Esta funcion, solo va a construir los componentes que contiene el base element.
    async buildComponent(element, mode: string): Promise<void> {
        
        // Verifico que no se haya procesado el elemento
        //if (this.processedElements.has(element)) {
        //    return;
        //}

        // Agrego a elementos procesados
        //this.processedElements.add(element);

        // Obtengo el componente base
        const rootComponent = this.getRootScope(mode);

        // Procesar elementos con IDs
        const elementsWithId = element.querySelectorAll('[id]');
        elementsWithId.forEach((element) => {

            // Escalo el elemento a smart
            const smartElement = this.makeSmart(element);
            rootComponent.items[element.id] = smartElement;

            // Registro eventos
            this.registerEvents(element, rootComponent);

        });

        // Procesar elementos con modelo
        const elementsWithModel = element.querySelectorAll('[model]');
        elementsWithModel.forEach((element) => {
            // Escalo el elemento a smart
            const smartElement = this.makeSmart(element);
            if (!rootComponent.modelItems[element.getAttribute('model')]) {
                rootComponent.modelItems[element.getAttribute('model')] = [];
            }
            rootComponent.modelItems[element.getAttribute('model')].push(smartElement);
        });
        
        await this.buildAllComponents(element, mode);
    }

    public async build(element) {

        // Utilizando build, siempre se asignara elemento a pagina mode = page
        const mode = 'page';

        // Construyo el componente
        if (element.isComponent && element.isReady) {
            return;
        }

        for (const componentClass of this.registeredComponents) {
            try {

                const selector = componentClass.selector;

                if (selector && element.matches(selector)) {

                    // Constrúyo el componente
                    const componentElement = this.makeComponent(element);

                    // Inyecto dependencias del componente
                    this.injectObject(componentClass, componentElement);

                    // Construyo los contenidos del componente
                    await this.buildComponent(componentElement, mode);

                    // Elementos asignados con build no se asignan a los mapeos de la pagina
                }
            } catch (error) {
                console.error('Failed building component', element, error);
            }
        }
    }

    public async buildAllComponents(element, mode) {

        const rootComponent = this.getRootScope(mode);

        // Construcción de componentes dinámicos según sus selectores
        const scopeElements: AcinsoftComponent[] = [];
        for (const componentClass of this.registeredComponents) {
            try {
                const selector = componentClass.selector;
                if (selector) {
                    const elements = element.querySelectorAll(selector);
                    for (const element of elements) {

                        // Construyo el componente
                        if (element.isComponent && element.isReady) {
                            console.error(element);
                            throw Error('Cant build already component');
                        }

                        // Constrúyo el componente
                        const componentElement = this.makeComponent(element);

                        // Inyecto dependencias del componente
                        this.injectObject(componentClass, componentElement);

                        // Construyo los contenidos del componente
                        await this.buildComponent(componentElement, mode);

                        // Lo agrego a componentes
                        if (componentElement.id) {
                            rootComponent.components[componentElement.id] = componentElement;
                        }

                        // Inicializo el componente
                        scopeElements.push(componentElement);
                    }
                }
            } catch (error) {
                throw Error('Failed building component');
            }
        }
    }

    public async buildFragment(element) {
        await this.buildAllComponents(element, 'page');
    }

    public async inicializeComponents(scope: AcinsoftScope) {
        const keys = Object.keys(scope.components);
        for (let i = 0; i < keys.length; i++) {
            if (scope.components[keys[i]].autoInit) {
                await scope.components[keys[i]].init();
            }
        }
    }

    private registerEvents(element: HTMLElement, scope: AcinsoftScope): void {


        const eventPrefix = element.id + 'On';
        const props = Object.getOwnPropertyNames(scope);

        props.forEach((prop) => {
            if (typeof scope[prop] === 'function' && prop.startsWith(eventPrefix)) {
                element['on' + prop.substring(eventPrefix.length).toLowerCase()] = (
                    event: Event
                ) => {
                    scope[prop](event, element);
                };
            }
        });
    }

    private getParameterNames(func: Function): string[] {
        if (!func) return [];
        const funcStr = func.toString();
        const paramMatch = funcStr.match(/\(([^)]*)\)/);
        if (paramMatch) {
            return paramMatch[1]
                .split(',')
                .map((param) => param.trim())
                .filter((param) => param);
        }
        return [];
    }

    private async resolveDependencies(func: Function): Promise<any[]> {

        const paramNames = this.getParameterNames(func);
        if (paramNames.length === 0) return [];

        const resolveDependency = async (param: string): Promise<any> => {
            const dependency = this.getNestedDependency(param) || this.findInRegisteredComponents(param);
            return dependency ?? (await this.loadComponentDynamically(param));
        };

        const resolvedDependencies: string[] = [];
        for (const param of paramNames) {
            const dependency = await resolveDependency(param);
            resolvedDependencies.push(dependency);
        }

        return resolvedDependencies;

    }

    private getNestedDependency(name: string): any {
        return (
            this.app?.layout?.page?.[name] ||
            this.app?.layout?.[name] ||
            this.app?.[name] ||
            null
        );
    }

    private findInRegisteredComponents(name: string): any {
        const component = this.registeredComponents.find(
            (comp) => comp.name && comp.name.toLowerCase() === name.toLowerCase()
        );
        return component;
    }

    private async loadComponentDynamically(name: string): Promise<IComponentConstructor | null> {
        try {
            const module = await import(`../components/${name}.js`);
            return module.default;
        } catch (error) {
            console.error(`Error al cargar el componente "${name}":`, error);
            return null;
        }
    }


    makeSmart(element: HTMLElement): AcinsoftSmartElement {

        const anyElement = element as any;

        if (!anyElement.isSmart) {
            this.injectObject(AcinsoftSmartElement, anyElement);
        }

        return anyElement as AcinsoftSmartElement;
    }

    makeComponent(element: HTMLElement): AcinsoftComponent {

        const anyElement = element as any;

        if (!anyElement.isSmart) {
            this.makeSmart(anyElement);
        }

        if (!anyElement.isComponent) {
            this.injectObject(AcinsoftComponent, anyElement);
        }

        return anyElement as AcinsoftComponent;
    }

    makeScope(element: HTMLElement): AcinsoftScope {

        const anyElement = element as any;

        if (!anyElement.isSmart) {
            this.makeSmart(anyElement);
        }

        if (!anyElement.isComponent) {
            this.makeComponent(anyElement);
        }

        if (!anyElement.isScope) {
            this.injectObject(AcinsoftScope, anyElement);
        }

        return anyElement as AcinsoftScope;

    }

    makePage(element: HTMLElement): AcinsoftPage {

        const anyElement = element as any;

        if (!anyElement.isSmart) {
            this.makeSmart(anyElement);
        }

        if (!anyElement.isComponent) {
            this.makeComponent(anyElement);
        }

        if (!anyElement.isScope) {
            this.makeScope(anyElement);
        }

        if (!anyElement.isPage) {
            this.injectObject(AcinsoftPage, anyElement);
        }

        return anyElement as AcinsoftPage;

    }

    makeLayout(element: HTMLElement): AcinsoftLayout {

        const anyElement = element as any;

        if (!anyElement.isSmart) {
            this.makeSmart(anyElement);
        }

        if (!anyElement.isComponent) {
            this.makeComponent(anyElement);
        }

        if (!anyElement.isScope) {
            this.makeScope(anyElement);
        }

        if (!anyElement.isPage) {
            this.injectObject(AcinsoftLayout, anyElement);
        }

        return anyElement as AcinsoftLayout;

    }

}

export default AcinsoftBuilder;
