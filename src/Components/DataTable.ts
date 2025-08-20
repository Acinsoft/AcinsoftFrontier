'use strict';

import AcinsoftComponent, { IConfigurable } from "../Core/Component";
import AcinsoftSmartElement from "../Core/Smart";

interface IDataTableResponse {
    columns: string[];
    data: any[][];
    recordsTotal: number;
    recordsFiltered: number;
}

interface IAcinsoftDataTableConfig {
    source?: string;
    columns?: { display: string; key: string; isPKey?: boolean; class?: string }[];
    parseRow?: (tr: HTMLTableRowElement, data: Record<string, any>) => Record<string, any>;
    filter?: (data: any[][]) => any[][];
    pagination?: boolean;
    rowsPerPage?: number;
    sortable?: boolean;
    onRowClick?: (tr: HTMLTableRowElement, data: any[]) => void;
}

export default class AcinsoftDataTable extends AcinsoftComponent implements IConfigurable<IAcinsoftDataTableConfig> {

    static selector: string = '.datatable';
    config!: IAcinsoftDataTableConfig;
    tbody!: HTMLTableSectionElement;
    dtcontainer!: AcinsoftSmartElement;
    columns!: string[];
    tableRows!: Map<number, HTMLTableRowElement>;

    build() {
        this.autoInit = false;
        this.tableRows = new Map();
    }

    async init() {

        if (!this.config) {
            console.error("Config no está inicializado correctamente");
            return this;
        }

        const table = this as unknown as HTMLTableElement;

        // 1. Crear el contenedor
        this.dtcontainer = this.builder.makeSmart(document.createElement('div'));
        this.dtcontainer.classList.add('dt-container');

        // 2. Insertar el contenedor justo antes de la tabla
        table.parentNode?.insertBefore(this.dtcontainer, table);

        // 3. Mover la tabla dentro del contenedor
        this.dtcontainer.appendChild(table);

        // Asegurar <thead> y <tbody>
        let thead = table.querySelector('thead') || document.createElement('thead');
        let tbody = table.querySelector('tbody') || document.createElement('tbody');

        table.prepend(thead);
        table.appendChild(tbody);
        this.tbody = tbody;

        if (!this.config.parseRow) {
            this.config.parseRow = (tr, row) => { return row; };
        }

        // Crear encabezados si se definen en la configuración
        this.createTableHeaders(thead);

        // Cargar datos si hay fuente
        if (this.config.source) {
            await this.reload();
        }

        // Manejo de clics en filas
        this.tbody.addEventListener('click', (event) => {
            const target = event.target as HTMLElement;
            if (target.tagName === 'TD') {
                const row = target.closest('tr') as HTMLTableRowElement;
                if (!row) return;

                const rowIndex = Array.from(this.tbody.children).indexOf(row);
                if (rowIndex === -1) return;

                const rowData = this.tableRows.get(rowIndex)?.dataset;
                if (this.config.onRowClick && rowData) {
                    console.log(rowData);
                }
            }
        });

        return this;
    }

    /**
     * Descarga los datos del servidor y actualiza la tabla.
     */
    async reload() {
        if (!this.config.source) return;

        this.dtcontainer.loading();

        try {
            const response = await this.api.get<IDataTableResponse>(this.config.source);
            if (response.success && response.data) {
                this.columns = response.data.columns;
                this.populateTable(response.data);
            }
        } catch (error) {
            console.error("Error al obtener datos desde el source:", error);
        }

        this.dtcontainer.ready();

    }

    /**
     * Crea los encabezados de la tabla usando la configuración de columnas.
     */
    private createTableHeaders(thead: HTMLTableSectionElement) {
        thead.innerHTML = ''; // Limpiar encabezados
        const tr = document.createElement('tr');

        if (this.config.columns) {
            this.config.columns.forEach(column => {
                const th = document.createElement('th');
                th.textContent = column.display;
                if (column.class) {
                    th.className = column.class;
                }
                tr.appendChild(th);
            });
        } else if (this.columns) {
            this.columns.forEach(columnName => {
                const th = document.createElement('th');
                th.textContent = columnName;
                tr.appendChild(th);
            });
        }

        thead.appendChild(tr);
    }

    /**
     * Llena la tabla con los datos obtenidos desde el backend.
     */
    private populateTable(response: IDataTableResponse) {
        const fragment = document.createDocumentFragment(); // Mejora rendimiento
        this.tableRows.clear();

        if (response.data.length) {
            response.data.forEach((rowData, index) => {
                const tr = document.createElement('tr');

                // Convertir `rowData` (array) en un objeto con claves usando `data.columns`
                const rowObject = Object.fromEntries(response.columns.map((col, i) => [col, rowData[i]]));

                // Si existe `parseRow`, procesamos el objeto
                const processedRow = this.config.parseRow ? this.config.parseRow(tr, rowObject) || rowObject : rowObject;

                if (this.config.columns) {
                    this.config.columns.forEach(column => {
                        const td = document.createElement('td');

                        // Obtener el valor basado en el `key` de la configuración
                        const value = processedRow[column.key];

                        // Si el valor es un nodo (HTMLElement, DocumentFragment, etc.), lo agregamos con appendChild
                        if (value instanceof Node) {
                            td.appendChild(value);
                        } else {
                            td.innerHTML = value !== undefined ? value : '';
                        }

                        if (column.class) {
                            td.className = column.class;
                        }

                        tr.appendChild(td);
                    });
                } else {
                    // Si no hay `config.columns`, usar el orden de `data.columns`
                    response.columns.forEach(column => {
                        const td = document.createElement('td');
                        td.innerHTML = processedRow[column] !== undefined ? processedRow[column] : '';
                        tr.appendChild(td);
                    });
                }

                this.tableRows.set(index, tr);
                fragment.appendChild(tr);
            });
        }
        else {
            const tr = document.createElement('tr');
            const td = document.createElement('td');
            td.innerHTML = 'No hay datos disponibles';
            td.colSpan = response.columns.length;
            tr.appendChild(td);
            fragment.appendChild(tr);
        }


        this.tbody.replaceChildren(fragment); // Inserta todo de una vez
    }
}
