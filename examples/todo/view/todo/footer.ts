import { html } from "htmx-bun";
import { model } from "~/lib/model";

export default function () {
	const left = model.items.filter((item) => !item.done).length;
	return html`
        <footer class="footer" style="display: block;">
            <span class="todo-count">
                <strong>${left}</strong>
                item${left === 1 ? "" : "s"} left
            </span>
            <ul class="filters">
                <li>
                    <a href="#/" class="selected">All</a>
                </li>
                <li>
                    <a href="#/active">Active</a>
                </li>
                <li>
                    <a href="#/completed">Completed</a>
                </li>
            </ul>
            <button class="clear-completed" style="display: none;"></button>
        </footer>
    `;
}
