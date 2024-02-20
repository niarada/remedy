import { html } from "htmx-bun";
import { model, saveModel } from "~/lib/model";


export default async function (attrs: { id: string; toggle?: string, destroy?: string, edit?: string, text?: string }) {
    const id = Number(attrs.id);
    const item = model.items.find((it) => it.id === id);
    if (!item) {
        return;
    }
    if (attrs.toggle) {
        item.done = !item.done;
        await saveModel();
        return html`<todo-footer></todo-footer>`;
    }
    if (attrs.destroy) {
        model.items = model.items.filter((it) => it.id !== id);
        await saveModel();
        return html`<todo-footer></todo-footer>`;
    }
    if (attrs.text) {
        item.text = attrs.text;
        await saveModel();
    }
    return html`
        <li
            hx-trigger="dblclick"
            hx-get="/todo/item?id=${id}&edit=true"
            hx-on::after-request="this.querySelector('input.edit').focus();this.querySelector('input.edit').setSelectionRange(999,999)"
            class="${attrs.edit ? "editing" : ""}"
        >
            <div class="view">
                <input
                    hx-get="/todo/item?id=${id}&toggle=true"
                    hx-swap="none"
                    class="toggle"
                    type="checkbox"
                    autocomplete="off"
                    ${item.done ? "checked" : ""}
                />
                <label>${item.text}</label>
                <button
                    hx-get="/todo/item?id=${id}&destroy=true"
                    hx-target="closest li"
                    hx-swap="delete"
                    class="destroy"></button>
            </div>
            <input
                hx-get="/todo/item?id=${id}"
                hx-target="closest li"
                hx-swap="outerHTML"
                hx-on:blur="this.parentElement.classList.remove('editing'); this.remove();"
                class="edit"
                name="text"
                value="${item.text}"
            >
        </li>
    `
}
