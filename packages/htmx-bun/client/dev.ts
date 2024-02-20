import * as Htmx from "htmx.org";

declare global {
    var htmx: typeof Htmx;
}

new EventSource("/_dev_stream").addEventListener("refresh", (event) => {
    location.reload();
});

window.addEventListener("load", () => {
    htmx.logger = function (el, event, data) {
        if (console) {
            console.log(event, el, data);
        }
    };
});
