/**
 * This file is just a scratch pad for use with the vscode-bun debugger.
 */

import { TemplateRegister } from "./view/register";

const register = new TemplateRegister("./view/__fixtures__");
await register.initialize();
const view = register.get("root").present();
const html = await view.render();
console.log(html);
