/**
 * This file is just a scratch pad for use with the vscode-bun debugger.
 */

import { Source } from "./view/source";

const source = new Source("view/__fixtures__/kitchen.part");
await source.compile();
