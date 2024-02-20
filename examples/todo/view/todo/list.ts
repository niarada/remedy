import { html, raw } from "htmx-bun";
import { model } from "~/lib/model";

export default async function ({ add }: { add?: string }) {
    if (add) {
        model.items.push(add);
    }
    return html`<ul hx-get="/todo/list">
        ${model.items.map((item) => html`<li>${item}</li>`)}
    </ul>`;
}
