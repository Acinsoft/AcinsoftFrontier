'use strict';

class AcinsoftModule {
    /**
     * Método de inicialización del módulo.
     * Puede ser sobrescrito por las clases que extiendan de este módulo.
     */
    async init(): Promise<void> {
        console.log('Preparando el módulo');
    }
}

export default AcinsoftModule;
