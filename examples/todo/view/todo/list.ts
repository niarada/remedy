import { html } from "htmx-bun";
import { model, saveModel } from "~/lib/model";

export default async function ({ text }: { text?: string }) {
	if (text) {
		model.items.push({ text, done: false });
		await saveModel();
	}
	const items = model.items.map(
		(item, i) => html`
            <li>
                <div class="view">
                    <todo-item-tick id="${i}"></todo-item-tick>
                    <label>${item.text}</label>
                    <button class="destroy"></button>
                </div>
            </li>
        `,
	);
	return html`<ul class="todo-list">
        ${items}
    </ul>`;
}
