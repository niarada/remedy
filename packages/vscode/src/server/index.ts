import {
    createConnection,
    createServer,
    createTypeScriptProjectProviderFactory,
    loadTsdkByPath,
} from "@volar/language-server/node";
import { create as createHtmlService } from "volar-service-html";
import { create as createTypeScriptService } from "volar-service-typescript";
import { remedyLanguage, remedyService } from "./language/remedy";

const connection = createConnection();
const server = createServer(connection);

connection.listen();

connection.onInitialize(async (params) => {
    const { typescript, diagnosticMessages } = loadTsdkByPath(
        params.initializationOptions.typescript.tsdk,
        params.locale,
    );
    const result = server.initialize(params, createTypeScriptProjectProviderFactory(typescript, diagnosticMessages), {
        getServicePlugins() {
            return [createHtmlService(), ...createTypeScriptService(typescript), remedyService];
        },
        getLanguagePlugins() {
            return [remedyLanguage];
        },
    });
    return result;
});

connection.onInitialized(server.initialized);

connection.onShutdown(server.shutdown);
