import { html } from "htmx-bun";
import { model } from "~/lib/model";

export default async function () {
    const items = model.items.filter((item) => (
        model.filter === "all" || (model.filter === "active" && !item.done) || (model.filter === "completed" && item.done)
    )).map(
        (item) => html`<todo-item id="${item.id}"></todo-item>`
    );
    return html`
        <ul id="todo-list" hx-swap-oob="true" class="todo-list">
            ${items}
        </ul>
    `;
}
