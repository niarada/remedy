import * as Htmx from "htmx.org";

console.info("htmx-bun dev mode");

declare global {
    // biome-ignore lint:
    var htmx: typeof Htmx;
}

new EventSource("/_dev_stream").addEventListener("refresh", (event) => {
    location.reload();
});

window.addEventListener("load", () => {
    htmx.logger = (el, event, data) => {
        if (console) {
            console.log(event, el, data);
        }
    };
});
