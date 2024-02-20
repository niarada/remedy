import { html, raw } from "htmx-bun";

export default function () {
    return html`
        <input
            autofocus
            hx-get="/todo/list"
            hx-target="next ul"
            class="border"
            type="text"
            name="add"
            hx-on::before-request="this.select()"
        />
    `;
}
