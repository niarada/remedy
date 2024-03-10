import { URL } from "url";
import { Cookie, readCookie, writeCookie } from "./cookie";

/**
 * A context encapsulates information about a request context for a view, and provides utilities
 * for manipulating it.
 */
export class Context {
    #request: Request;
    #response?: Response;
    #url: URL;
    #cookie: Cookie;
    #form: Record<string, string> = {};
    #oobs: Oob[] = [];
    #renderCanceled = false;

    constructor(request: Request) {
        this.#request = request;
        this.#url = new URL(request.url);
        this.#cookie = readCookie(request);
    }

    async loadForm() {
        this.url.searchParams.forEach((value, name) => {
            this.form[name] = value;
        });
        if (!["POST", "PUT", "PATCH"].includes(this.#request.method)) {
            return;
        }
        if (
            ![
                "application/x-www-form-urlencoded",
                "multipart/form-data",
            ].includes(this.#request.headers.get("Content-Type") ?? "")
        ) {
            return;
        }
        Object.assign(
            this.form,
            Object.fromEntries(
                Array.from(await this.#request.formData()).filter(
                    ([key, value]) => typeof value === "string",
                ),
            ),
        );
    }

    get request() {
        return this.#request;
    }

    set response(response: Response | undefined) {
        if (response) {
            writeCookie(response, this.#cookie);
        }
        this.#response = response;
    }

    get response() {
        return this.#response;
    }

    get url() {
        return this.#url;
    }

    get cookie() {
        return this.#cookie;
    }

    get form() {
        return this.#form;
    }

    set flash(message: string) {
        this.#cookie.flash = message;
    }

    get flash(): string | undefined {
        return this.#cookie.message as string | undefined;
    }

    redirect(href: string) {
        this.response = new Response(null, {
            status: 302,
            headers: { Location: href },
        });
    }

    /**
     * Facilitates the htmx oob (out-of-band) feature. (https://htmx.org/docs/#oob_swaps)
     * The partial specified should have an id defined on its root element, and include the
     * attribute `hx-swap-oob="true"`.
     * @param tag The partial tag to include in the response.
     * @param attributes Attributes to pass to the tag.
     */
    oob(tag: string, attributes: Record<string, unknown>) {
        this.#oobs.push({ tag, attributes });
    }

    get oobs() {
        return this.#oobs;
    }

    /**
     * Cancels the rendering of the current view only, returning empty content.  However, Oobs, if
     * specified, will still be included in the response.
     */
    cancelRender() {
        this.#renderCanceled = true;
    }

    get renderCanceled() {
        return this.#renderCanceled;
    }
}

/**
 * Represents an Oob (Out-of-band) element.
 */
interface Oob {
    tag: string;
    attributes: Record<string, unknown>;
}
