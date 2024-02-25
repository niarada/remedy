import {
    createConnection,
    createServer,
    createTypeScriptProjectProvider,
} from "@volar/language-server/node";
import { create as createHtmlService } from "volar-service-html";
import { create as createTypeScriptService } from "volar-service-typescript";
import { montanaLanguage, montanaService } from "./language/montana";

const connection = createConnection();
const server = createServer(connection);

connection.listen();

connection.onInitialize((params) => {
    return server.initialize(params, createTypeScriptProjectProvider, {
        getLanguagePlugins() {
            return [montanaLanguage];
        },
        getServicePlugins() {
            return [
                createHtmlService(),
                createTypeScriptService(server.modules.typescript),
                montanaService,
            ];
        },
    });
});

connection.onInitialized(server.initialized);

connection.onShutdown(server.shutdown);
