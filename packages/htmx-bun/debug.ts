/**
 * This file is just a scratch pad for use with the vscode-bun debugger.
 */

import { TemplateRegister } from "./view/register";

const register = new TemplateRegister("./view/__fixtures__");
await register._present("todo-list");
await register._present("todo-item");
const view = await register._present("index");
const html = await view.render();
console.log(html);
