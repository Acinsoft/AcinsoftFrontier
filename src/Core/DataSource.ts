'use strict';

import AcinsoftComponent from './Component';

interface AcinsoftDatasourceConfig {
    source: string;
    parseData?: (data: unknown) => Record<string, any>[];
    parseRow?: (row: unknown) => Record<string, any> | null;
}

export default class AcinsoftDatasource extends AcinsoftComponent {

    build() { console.log('Build datasource'); }

    //private api: AcinsoftApi = new AcinsoftApi();
    //private config: AcinsoftDatasourceConfig;

    /**
     * Constructor para inicializar la fuente de datos.
     * @param api - La instancia de `AcinsoftApi` para realizar solicitudes.
     * @param config - Configuración opcional para la fuente de datos.
     */
    //constructor() {
    //    super(document.createElement('div'));
    //    this.config = {
    //        source: config.source ?? '',
    //        parseData: config.parseData ?? ((data) => Array.isArray(data) ? data : []),
    //        parseRow: config.parseRow ?? ((row) => (typeof row === 'object' && row !== null ? row : null)),
    //    };
    //}

    /**
     * Inicializa la fuente de datos y carga la información.
     */
    //override build(): void {
    //    if (!this.config.source) {
    //        throw new Error(`No se ha definido 'source' en la configuración para el módulo "${this.element.getAttribute('module-cfg') ?? "desconocido"}"`);
    //    }

    //    this.reload();
    //}

    /**
     * Recarga los datos desde la fuente configurada.
     */
    //async reload(): Promise<void> {
    //    try {
    //        const rawData = await this.api.get(this.config.source);

    //        // Procesa y valida los datos con parseData
    //        const data = this.config.parseData!(rawData.data);
    //        if (!Array.isArray(data)) {
    //            throw new Error(`La función parseData debe devolver un array válido para el módulo "${this.element.getAttribute('module-cfg') ?? "desconocido"}"`);
    //        }

    //        this.clearElementContent();

    //        data.forEach((rowData) => {
    //            const processedRow = this.config.parseRow!(rowData);
    //            if (processedRow === null) return;

    //            const element = this.buildElement(processedRow);
    //            this.element.querySelector('tbody')?.appendChild(element);

    //            this.app.build(element);

    //            (element as any).normalizedFilter = this.normalizeData(processedRow);
    //        });
    //    } catch (error) {
    //        console.error(`Error en la recarga de datos: ${error}`);
    //    }
    //}

    /**
     * Limpia el contenido del contenedor, dependiendo de su tipo.
     */
    private clearElementContent(): void {
        if (this instanceof HTMLTableElement) {
            const tbody = this.querySelector('tbody') || this.createTbody();
            tbody.innerHTML = ''; // Limpia las filas de la tabla
        } else {
            this.innerHTML = ''; // Limpia el contenido de otros elementos
        }
    }

    /**
     * Construye un elemento según el tipo del contenedor.
     */
    private buildElement(processedRow: Record<string, any>): HTMLElement {
        if (this instanceof HTMLTableElement) {
            return this.buildRow(processedRow);
        } else if (this instanceof HTMLSelectElement) {
            return this.buildOption(processedRow);
        } else {
            return this.buildDiv(processedRow);
        }
    }

    /**
     * Construye una fila `<tr>` para una tabla.
     */
    private buildRow(processedRow: Record<string, any>): HTMLTableRowElement {
        //const tr = document.createElement('tr');
        //Object.entries(processedRow).forEach(([_, value]) => {
        //    const td = document.createElement('td');
        //    td.innerHTML = value !== undefined ? String(value) : ''; // Agrega el valor o un string vacío
        //    tr.appendChild(td);
        //});
        //return tr;
        return document.createElement('tr');
    }

    /**
     * Construye una opción `<option>` para un `<select>`.
     */
    private buildOption(processedRow: Record<string, any>): HTMLOptionElement {
        const option = document.createElement('option');
        option.value = processedRow.value ?? ''; // Usa una propiedad "value" del processedRow
        option.innerHTML = processedRow.label ?? processedRow.value ?? ''; // Usa "label" o "value" como texto
        return option;
    }

    /**
     * Construye un `<div>` para otros elementos.
     */
    private buildDiv(processedRow: Record<string, any>): HTMLDivElement {
        //const div = document.createElement('div');
        //div.innerHTML = Object.values(processedRow)
        //    .map(value => (value !== null && value !== undefined ? String(value) : ''))
        //    .join(' | '); // Combina todos los valores en un string
        //return div;
        return document.createElement('div');
    }

    /**
     * Normaliza los datos para búsquedas rápidas.
     */
    private normalizeData(processedRow: Record<string, any>): string {
        //return Object.values(processedRow)
        //    .map(value => (value !== null && value !== undefined ? String(value).toLowerCase() : ''))
        //    .join(' '); // Normaliza y combina los valores en un solo string
        return "TODO";
    }

    /**
     * Crea un `<tbody>` si no existe (para tablas).
     */
    private createTbody(): HTMLTableSectionElement {
        const tbody = document.createElement('tbody');
        this.appendChild(tbody);
        return tbody;
    }
}
