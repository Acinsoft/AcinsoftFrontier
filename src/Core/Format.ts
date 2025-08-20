'use strict';

import AcinsoftLocale from "./Locale";
import AcinsoftSmartElement from "./Smart";

export default class AcinsoftFormat {

    paddLeft(d: number | string, l: number = 2, c: string = '0'): string {
        const str = String(d);
        return str.length < l ? c.repeat(l - str.length) + str : str;
    }

    createId(): string {
        const s = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        return Array.from({ length: 8 }, () => s[this.rand(0, s.length - 1)]).join('');
    }

    rand(min: number, max: number): number {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    extractParams(dataStr: string): string[] {
        if (!dataStr) return [];

        const regex = /{[^}]*}|[^,]+/g;
        const matches: string[] = dataStr.match(regex) ?? [];

        return matches.map(match =>
            match.startsWith('{') && match.endsWith('}')
                ? match.slice(1, -1)
                : match
        );
    }

    escape(value: string): string {
        return value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    replaceParams(dataStr: string, params: string[]): string {
        if (!dataStr || !params || params.length === 0) return "";
        let counter = 0;
        return dataStr.replace(/{[^}]+}/g, () => params[counter++] ?? "");
    }

    replaceParamsWithObject(path: string, paramsObject: Record<string, string>): string {
        return path.replace(/{([^}]+)}/g, (_, match) => paramsObject[match] ?? `{${match}}`);
    }

    createParams(object: Record<string, any>): string {
        return Object.entries(object)
            .map(([key, value]) =>
                `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
            )
            .join("&");
    }

    parseParams(queryString: string): Record<string, any> {
        return queryString
            .split("&") // Divide el string en pares clave=valor
            .map(param => param.split("=")) // Separa clave y valor
            .reduce((acc, [key, value]) => {
                acc[decodeURIComponent(key)] = decodeURIComponent(value);
                return acc;
            }, {} as Record<string, any>);
    }

    diasDeLaSemana(cadena: string): string {
        if (!cadena) return '';

        const dias: Record<string, string> = {
            '1': 'Lun', '2': 'Mar', '3': 'Mié', '4': 'Jue',
            '5': 'Vie', '6': 'Sáb', '7': 'Dom'
        };

        return [...cadena]
            .filter(dia => dias[dia])
            .map((dia, index) => (index > 0 ? ', ' : '') + dias[dia])
            .join('');
    }


    normalizeFilter(data: string): string {
        return data.normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[^\w\s]/gi, "")
            .replace(/\s+/g, " ")
            .trim()
            .toLowerCase();
    }

    // 🏷️ Evaluación de contraseñas
    passwordRate(password: string): { Score: number; Strength: number } {
        if (!password) return { Score: 0, Strength: -1 };

        let rate = 0;
        let num = 0, min = 0, may = 0, sym = 0;
        let realSafeLength = new Set(password).size;

        for (const c of password) {
            if (this.isDigit(c)) num++;
            else if (this.isLower(c)) min++;
            else if (this.isUpper(c)) may++;
            else sym++;
        }

        const types = [num, min, may, sym].filter(v => v > 0).length;
        rate = types * password.length;
        rate += realSafeLength / 2;

        return {
            Score: rate,
            Strength: rate > 90 ? 5 : rate > 80 ? 4 : rate > 50 ? 3 : rate > 20 ? 2 : rate >= 0 ? 1 : -1
        };
    }


    // 🏷️ Generación de contraseña segura
    getPassword(length: number = 12): string {
        const chars = {
            numbers: "0123456789",
            mayus: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
            minus: "abcdefghijklmnopqrstuvwxyz",
            special: "!()-_$'/&%#"
        };

        let password = Object.values(chars).map(set => set[this.secureRandom(set.length)]).join('');
        while (password.length < length) {
            const randomType = Object.values(chars)[this.secureRandom(4)];
            password += randomType[this.secureRandom(randomType.length)];
        }
        return this.shuffleString(password);
    }

    // 🔐 Generación de número aleatorio seguro
    secureRandom(max: number): number {
        if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
            return crypto.getRandomValues(new Uint32Array(1))[0] % max;
        }
        return Math.floor(Math.random() * max);
    }

    // 🔀 Mezcla de caracteres en una cadena
    shuffleString(str: string): string {
        return [...str].sort(() => Math.random() - 0.5).join('');
    }

    toCapacitySize(amount: number, fromunit: string = 'bytes'): string {
        if (isNaN(amount)) return "0 bytes";

        const units = ['bytes', 'kb', 'mb', 'gb', 'tb'];
        const factor = 1000;

        let fromIndex = units.indexOf(fromunit.toLowerCase());
        if (fromIndex === -1) fromIndex = 0;

        amount *= Math.pow(factor, fromIndex);

        for (let i = 0; i < units.length; i++) {
            if (amount < factor || i === units.length - 1) {
                return this.money(amount) + ' ' + units[i];
            }
            amount /= factor;
        }
        return `${amount} bytes`;
    }

    asNumber(mynum: number | string): string {
        let numStr = String(mynum);
        if (isNaN(Number(numStr))) return "0";

        let isNegative = numStr.startsWith('-');
        if (isNegative) numStr = numStr.substring(1);

        let reversed = numStr.split('').reverse();
        let formatted = reversed.reduce((acc, char, i) => acc + (i > 0 && i % 3 === 0 ? ',' : '') + char, '');
        return (isNegative ? '-' : '') + formatted.split('').reverse().join('');
    }


    asDecimal(number: number | string): string {
        let numStr = String(number);
        let parts = numStr.split('.');

        if (parts.length === 1) {
            parts.push('00');
        } else {
            parts[1] = parts[1].padEnd(2, '0').substring(0, 2);
        }

        return `${parts[0]}.${parts[1]}`;
    }
    money(number: number): string {
        const numStr = this.asDecimal(number);
        const parts = numStr.split('.');
        return `${this.asNumber(parts[0])}.${parts[1]}`;
    }

    createSafeLink(text) {
        text = text.replaceAll(' ', '-');
        text = this.normalizeFilter(text);
        return text;
    }

    slug(input: string): string {
        // Normaliza el texto para descomponer los caracteres acentuados
        // y remueve las marcas diacríticas.
        const normalized = input.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

        // Elimina todos los caracteres que no sean letras, números o espacios.
        const cleaned = normalized.replace(/[^A-Za-z0-9\s]/g, '');

        // Quita espacios al inicio y final, reemplaza los espacios internos
        // por guiones y convierte el resultado a minúsculas.
        const slug = cleaned.trim().replace(/\s+/g, '-').toLowerCase();

        return slug;
    }

    getdate(date) { return new Date(date); }

    shortDateFromRaw(datetime: string | null, removetime: boolean): string {
        if (!datetime) return '';

        // Separar fecha y hora con "T" o espacio
        let parts = datetime.includes('T') ? datetime.split('T') : datetime.split(' ');
        if (parts.length !== 2) return '';

        const dateParts = parts[0].split('-').map(Number); // Convertir a números
        const timeParts = parts[1].split(':').map(Number); // Convertir a números

        if (dateParts.length !== 3) return '';

        // Llamar a `shortDate`, con o sin tiempo según `removetime`
        return removetime
            ? this.shortDate(dateParts[0], dateParts[1], dateParts[2])
            : this.shortDate(dateParts[0], dateParts[1], dateParts[2], timeParts[0], timeParts[1]);
    }


    niceDateFromRaw(datetime, removetime = false) {
        if (!removetime) {
            if (datetime == null) return '';
            datetime = datetime.split('T');
            if (datetime.length != 2) datetime = datetime.split(' ');
            var date = datetime[0].split('-');
            var time = datetime[1].split(':');
            return this.niceDate(date[0], date[1], date[2], time[0], time[1]);
        }
        else {
            if (datetime == null) return '';
            datetime = datetime.split('T');
            if (datetime.length != 2) datetime = datetime.split(' ');
            var date = datetime[0].split('-');
            var time = datetime[1].split(':');
            return this.niceDate(date[0], date[1], date[2]);
        }
    }

    getHourMinute(datetime) {
        if (datetime == null) return '';
        datetime = datetime.split('T');
        if (datetime.length != 2) datetime = datetime.split(' ');
        var date = datetime[0].split('-');
        var time = datetime[1].split(':');
        return time[0] + ':' + time[1];
    }

    niceDateFromDate(date) {
        if (date == null) return '';
        return this.niceDate(date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes());
    }

    niceDate(year: number, month: number, day?: number, hour?: number, minute?: number): string {

        if (!year || !month) return '';

        const monthNames = Object.values(AcinsoftLocale.months);
        const weekDayNames = Object.values(AcinsoftLocale.weekDays);

        if (!day) return `${monthNames[month - 1]}, ${year}`;

        const minday = new Date(year, month - 1, day).getDay();
        const weekDay = weekDayNames[minday];

        if (hour === undefined || minute === undefined) {
            return `${weekDay} ${day} de ${monthNames[month - 1]} de ${year}`;
        }

        return `${weekDay} ${day} de ${monthNames[month - 1]} de ${year}, ${this.paddLeft(hour)}:${this.paddLeft(minute)} Hrs.`;
    }

    niceDateFromString(date) {

        var date = date.split('-');

        if (date.length != 3) {
            date.push(null);
        }

        return this.niceDate(date[0], date[1], date[2]);

    }

    niceOnlyDateFromDate(date) {
        if (date == null) return '';
        return this.niceDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
    }

    niceOnlyTimeFromDate(date) {
        if (date == null) return '';
        return this.paddLeft(date.getHours()) + ':' +
            this.paddLeft(date.getMinutes());
    }

    dateToString(date) {
        date = new Date(date);
        return date.getFullYear() + '-' + this.paddLeft(date.getMonth() + 1) + '-' + this.paddLeft(date.getDate()) + 'T' +
            this.paddLeft(date.getHours()) + ':' + this.paddLeft(date.getMinutes());
    }

    dateToLog(date) {
        date = new Date(date);
        return date.getFullYear() + this.paddLeft(date.getMonth() + 1) + this.paddLeft(date.getDate()) +
            this.paddLeft(date.getHours()) + this.paddLeft(date.getMinutes());
    }

    parseLogDate(dateStr) {
        let year = parseInt(dateStr.slice(0, 4));
        let month = parseInt(dateStr.slice(4, 6)) - 1;
        let day = parseInt(dateStr.slice(6, 8));
        let hours = parseInt(dateStr.slice(8, 10));
        let minutes = parseInt(dateStr.slice(10, 12));
        return new Date(year, month, day, hours, minutes);
    }

    shortDate(year: number, month: number, day: number, hour?: number, minute?: number): string {
        if (!year || month < 1 || month > 12 || day < 1 || day > 31) {
            return '';
        }

        const monthNamesAb = Object.values(AcinsoftLocale.months3);

        // Si no hay hora ni minuto, retornar solo la fecha
        if (hour === undefined || minute === undefined) {
            return `${monthNamesAb[month - 1]} ${day}, ${year}`;
        }

        return `${monthNamesAb[month - 1]} ${day}, ${year}. ${this.paddLeft(hour)}:${this.paddLeft(minute)} Hrs.`;
    }

    // 🔠 Métodos de Validación
    isLetter(str: string): boolean {
        return /^[a-zA-Z]$/.test(str);
    }

    isLower(str: string): boolean {
        return /^[a-z]$/.test(str);
    }

    isUpper(str: string): boolean {
        return /^[A-Z]$/.test(str);
    }

    isDigit(str: string): boolean {
        return /^[0-9]$/.test(str);
    }

    isLetterOrDigit(str: string): boolean {
        return /^[a-zA-Z0-9]$/.test(str);
    }

    isSymbol(str: string): boolean {
        return /^[^a-zA-Z0-9]$/.test(str);
    }

    // 📷 Validación de imágenes y dominios
    isImage(ext: string): boolean {
        return ['png', 'jpg', 'jpeg', 'gif'].includes(ext.toLowerCase());
    }

    isFQDN(fqdn: string): boolean {
        return /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}(\.[a-zA-Z0-9-]{1,61})+$/.test(fqdn);
    }

    isIPv4(ip: string): boolean {
        return /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(\d+\.){2}\d+$/.test(ip);
    }

    isIPv6(ip: string): boolean {
        return /^([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}$/.test(ip);
    }

    getSelectText(select, value?: string): string | null {
        var option = this.getSelectOption(select, value);
        return option?.innerHTML;
    }

    getSelectOption(
        select: any,
        value?: string
    ): any {
        // usa el valor pasado o, si es undefined, el valor actual del select
        const valToFind = value ?? select.value;

        // recorremos las opciones para evitar problemas de inyección en el selector
        for (const option of Array.from(select.options)) {
            if ((option as any).value === valToFind) {
                return option;
            }
        }

        return null;
    }

    escapeHTML(text: string): string {
        const div = document.createElement("div");
        div.textContent = text;
        return div.innerText;
    }

    parseCSVRow(row: string): string[] {
        const result: string[] = [];
        let field = '';
        let inQuotes = false;

        for (let i = 0; i < row.length; i++) {
            const char = row[i];

            if (char === '"') {
                if (inQuotes && row[i + 1] === '"') { // Manejo de comillas escapadas
                    field += '"';
                    i++; // Saltar la siguiente comilla ya procesada
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                result.push(field.trim());
                field = '';
            } else {
                field += char;
            }
        }
        // Agregar el último campo
        result.push(field.trim());
        return result;
    }

    generateGUID(): string {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
            const r = Math.random() * 16 | 0,
                v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }


    validateForm(form: HTMLFormElement) {
        let isValid = true;
        const formValues: { [key: string]: string } = {};

        // Seleccionamos todos los elementos con el atributo data-type
        const fields = form.querySelectorAll('[data-type]');

        fields.forEach(field => {
            // Se castea a HTMLInputElement o HTMLSelectElement para tener acceso a las propiedades de validación.
            const inputField = field as HTMLInputElement | HTMLSelectElement;
            const fieldType = inputField.getAttribute('data-type');
            const value = inputField.value.trim();

            // Validación requerida
            if (inputField.hasAttribute('required') && value === '') {
                inputField.setCustomValidity('Este campo es requerido.');
                inputField.reportValidity();
                isValid = false;
            } else {
                inputField.setCustomValidity('');
            }

            // Validación personalizada según data-type
            switch (fieldType) {
                case 'number':
                    if (value && isNaN(Number(value))) {
                        inputField.setCustomValidity('Ingrese un número válido.');
                        inputField.reportValidity();
                        isValid = false;
                    } else {
                        inputField.setCustomValidity('');
                    }
                    break;
                case 'decimal':
                    if (value && isNaN(Number(value))) {
                        inputField.setCustomValidity('Ingrese un número decimal válido.');
                        inputField.reportValidity();
                        isValid = false;
                    } else {
                        inputField.setCustomValidity('');
                    }
                    break;
                case 'date':
                    if (value) {
                        const date = new Date(value);
                        if (isNaN(date.getTime())) {
                            inputField.setCustomValidity('Ingrese una fecha válida.');
                            inputField.reportValidity();
                            isValid = false;
                        } else {
                            inputField.setCustomValidity('');
                        }
                    }
                    break;
                case 'email':
                    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                        inputField.setCustomValidity('Ingrese un correo electrónico válido.');
                        inputField.reportValidity();
                        isValid = false;
                    } else {
                        inputField.setCustomValidity('');
                    }
                    break;
                case 'phone':
                    if (value && !/^(?:\d{10}|\d{12})$/.test(value)) {
                        inputField.setCustomValidity('Ingrese un número de teléfono válido de 10 o 12 dígitos.');
                        inputField.reportValidity();
                        isValid = false;
                    } else {
                        inputField.setCustomValidity('');
                    }
                    break;
                // Puedes agregar más casos según tus necesidades.
                default:
                    break;
            }

            // Almacena el valor del campo
            formValues[inputField.name] = value;
        });

        return { isValid, formValues };
    }


}



