import { html } from "htmx-bun";
import { model, saveModel } from "~/lib/model";

export default async function (attrs: { toggle?: string }) {
    const checked = (model.items.filter((it) => it.done).length === model.items.length);
    if (attrs.toggle) {
        for (const item of model.items) {
            item.done = !checked;
        }
        await saveModel();
        return html`
            <todo-list></todo-list>
            <todo-footer></todo-footer>
        `
    }
    return html`
        <div id="toggle-all-container" hx-swap-oob="true" class="toggle-all-container">
            <input
                id="toggle-all"
                class="toggle-all"
                type="checkbox"
                autocomplete="off"
                ${checked && "checked"}
            >
            <label
                hx-get="/todo/toggle-all?toggle=true"
                hx-swap="none"
                class="toggle-all-label"
                for="toggle-all"
            >Mark all as complete</label>
        </div>
    `
}
