'use strict';

// Definimos una interfaz para la estructura de localización
interface ILocale {
    months: Record<string, string>;
    months3: Record<string, string>;
    weekDays: Record<string, string>;
    weekDays3: Record<string, string>;
    weekDays2: Record<string, string>;
}

// Creamos el objeto `AcinsoftLocale` con los valores en español
const AcinsoftLocale: ILocale = {
    months: {
        january: 'Enero', february: 'Febrero', march: 'Marzo',
        april: 'Abril', may: 'Mayo', june: 'Junio',
        july: 'Julio', august: 'Agosto', september: 'Septiembre',
        october: 'Octubre', november: 'Noviembre', december: 'Diciembre'
    },
    months3: {
        january: 'ene', february: 'feb', march: 'mar',
        april: 'abr', may: 'may', june: 'jun',
        july: 'jul', august: 'ago', september: 'sep',
        october: 'oct', november: 'nov', december: 'dic'
    },
    weekDays: {
        sunday: 'Domingo', monday: 'Lunes', tuesday: 'Martes',
        wednesday: 'Miércoles', thursday: 'Jueves', friday: 'Viernes',
        saturday: 'Sábado'
    },
    weekDays3: {
        sunday: 'dom', monday: 'lun', tuesday: 'mar',
        wednesday: 'mie', thursday: 'jue', friday: 'vie',
        saturday: 'sab'
    },
    weekDays2: {
        sunday: 'Do', monday: 'Lu', tuesday: 'Ma',
        wednesday: 'Mi', thursday: 'Ju', friday: 'Vi',
        saturday: 'Sá'
    }
} as const; // 🔹 `as const` asegura que los valores sean inmutables

// Exportamos el objeto para que pueda ser utilizado en otros módulos
export default AcinsoftLocale;
