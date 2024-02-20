import { html } from "htmx-bun";
import { model, saveModel } from "~/lib/model";

export default async function ({ text }: { text?: string }) {
    if (text) {
        const id = model.items.reduce((id, it) => Math.max(id, it.id), 0) + 1;
        model.items.push({ id, text, done: false });
        await saveModel();
        return html`
            <todo-list></todo-list>
            <todo-footer></todo-footer>
        `
    }
    return html`
        <input
            hx-get="/todo/add"
            hx-swap="none"
            hx-on::before-request="this.value = ''"
            class="new-todo"
            placeholder="What needs to be done?"
            autofocus
            autocomplete="off"
            name="text"
            value=""
        >
    `;
}
