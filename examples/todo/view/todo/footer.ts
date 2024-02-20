import { html } from "htmx-bun";
import { Filter, model, saveModel } from "~/lib/model";

export default function (attrs: { clear?: string, filter?: Filter }) {
    if (attrs.clear) {
        model.items = model.items.filter((item) => !item.done);
        saveModel();
    }

    if (attrs.filter) {
        model.filter = attrs.filter;
        saveModel();
    }

    const remaining = model.items.filter((item) => !item.done).length;

    return html`
        ${attrs.clear && html`
            <todo-toggle-all></todo-toggle-all>
            <todo-list></todo-list>
        `}
        ${attrs.filter && html`
            <todo-list></todo-list>
        `}
        <footer
            id="todo-footer"
            hx-swap-oob="true"
            class="footer"
            style="display: ${model.items.length === 0 ? "none" : "block"};"
        >
            <span class="todo-count">
                <strong>${remaining}</strong>
                item${remaining === 1 ? "" : "s"} left
            </span>
            <ul class="filters">
                <li>
                    <a
                        hx-get="/todo/footer?filter=all"
                        href="#"
                        class="${model.filter === "all" ? "selected" : ""}"
                    >All</a>
                </li>
                <li>
                    <a
                        hx-get="/todo/footer?filter=active"
                        href="#"
                        class="${model.filter === "active" ? "selected" : ""}"
                    >Active</a>
                </li>
                <li>
                    <a
                        hx-get="/todo/footer?filter=completed"
                        href="#"
                        class="${model.filter === "completed" ? "selected" : ""}"
                    >Completed</a>
                </li>
            </ul>
            <button
                hx-get="/todo/footer?clear=true"
                class="clear-completed"
                style="display: ${remaining !== model.items.length ? "block" : "none"};"
            >Clear completed</button>
        </footer>
    `;
}
