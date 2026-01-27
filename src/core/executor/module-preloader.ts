/**
 * Module Preloader
 * 
 * Extracts classes and exports from virtual files and prepares them
 * to be pre-loaded as globals in the iframe executor.
 */

interface PreloadModuleConfig {
    exports: string[];
    source: string; // The path to the file in VFS
}

interface PreloadConfig {
    modules: Record<string, PreloadModuleConfig>;
    files: Record<string, string>;
}

export function generatePreloadCode(config: PreloadConfig): string {
    const { modules, files } = config;
    let code = '/** [TWE] Pre-loaded POM Classes **/\n';

    Object.entries(modules).forEach(([moduleName, moduleConfig]) => {
        const sourceCode = files[moduleConfig.source];
        if (!sourceCode) {
            console.warn(`[ModulePreloader] Source file not found for ${moduleName}: ${moduleConfig.source}`);
            return;
        }

        // Process the source code to make it browser-ready
        // 1. Remove imports
        let processed = sourceCode.replace(/^import\s+.*?;?$/gm, '');

        // 2. Remove 'export' keyword but keep the class/const
        processed = processed.replace(/^export\s+/gm, '');

        // 3. Remove type annotations (very simple regex approach for POM context)
        // Strip ": string", ": number", etc. from variables and parameters
        // This is naive but usually sufficient for POM challenges
        processed = processed.replace(/:\s*(string|number|boolean|any|Page|Locator|void|unknown)/g, '');

        // Remove "implements X" and "interface X { ... }" (simplified)
        processed = processed.replace(/implements\s+\w+/g, '');

        // 4. Attach to widow
        let globalRegistration = '';
        moduleConfig.exports.forEach(exportName => {
            globalRegistration += `if (typeof ${exportName} !== 'undefined') window.${exportName} = ${exportName};\n`;
        });

        code += `\n/* Module: ${moduleName} (${moduleConfig.source}) */\n`;
        code += `(function() {\n${processed}\n${globalRegistration}\n})();\n`;
    });

    return code;
}
