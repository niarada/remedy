import { html } from "htmx-bun";
import { model, saveModel } from "~/lib/model";

export default async function (attrs: { id: string; toggle?: string }) {
	const id = Number(attrs.id);
	const item = model.items[id];
	if (attrs.toggle) {
		item.done = !item.done;
		await saveModel();
	}
	return html`
		<input
			class="toggle"
			type="checkbox"
			hx-swap="none"
			hx-get="/todo/item/tick?id=${id}&toggle=true"
			autocomplete="off"
			${item.done ? "checked" : ""}
		/>
	`;
}
