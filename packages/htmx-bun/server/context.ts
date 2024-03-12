import { getReasonPhrase } from "http-status-codes";
import { URL } from "node:url";
import { AttributeTypes, Attributes } from "~/hypermedia";
import { Cookie, readCookie, writeCookie } from "./cookie";

/**
 * Information shared by any contexts created for this particular request.
 */
interface ContextFootball {
    request: Request;
    response?: Response;
    url: URL;
    cookie: Cookie;
    form: Record<string, string>;
    oobs: Oob[];
    renderCanceled: boolean;
}

/**
 * A context encapsulates information about a request context for a view, and provides utilities
 * for manipulating it.
 */
export class Context<A extends Attributes = Attributes> {
    private readonly football: ContextFootball;
    #attributes: A;

    constructor(
        requestOrFootball: Request | ContextFootball,
        attributes: A = {} as A,
    ) {
        if (requestOrFootball instanceof Request) {
            this.football = {
                request: requestOrFootball,
                url: new URL(requestOrFootball.url),
                cookie: readCookie(requestOrFootball),
                form: {},
                oobs: [],
                renderCanceled: false,
            };
        } else {
            this.football = requestOrFootball;
        }
        this.#attributes = attributes;
    }

    withAttributes(attributes: Attributes): Context {
        return new Context(this.football, attributes);
    }

    coerceAttributes(types: AttributeTypes) {
        this.#attributes = coerceAttributes(this.#attributes, types);
    }

    get attributes() {
        return this.#attributes;
    }

    async loadForm() {
        this.football.url.searchParams.forEach((value, name) => {
            this.form[name] = value;
        });
        if (!["POST", "PUT", "PATCH"].includes(this.football.request.method)) {
            return;
        }
        if (
            ![
                "application/x-www-form-urlencoded",
                "multipart/form-data",
            ].includes(this.football.request.headers.get("Content-Type") ?? "")
        ) {
            return;
        }
        Object.assign(
            this.form,
            Object.fromEntries(
                Array.from(await this.football.request.formData()).filter(
                    ([key, value]) => typeof value === "string",
                ),
            ),
        );
    }

    get request() {
        return this.football.request;
    }

    set response(response: Response | undefined) {
        if (response) {
            writeCookie(response, this.football.cookie);
        }
        this.football.response = response;
    }

    get response() {
        return this.football.response;
    }

    get url() {
        return this.football.url;
    }

    get cookie() {
        return this.football.cookie;
    }

    get form() {
        return this.football.form;
    }

    set flash(message: string) {
        this.football.cookie.flash = message;
    }

    get flash(): string | undefined {
        const message = this.football.cookie.flash as string | undefined;
        delete this.football.cookie.flash;
        return message;
    }

    redirect(href: string) {
        this.response = new Response(null, {
            status: 302,
            headers: { Location: href },
        });
    }

    status(status: number, message?: string) {
        this.response = new Response(null, {
            status,
            statusText: message ?? getReasonPhrase(status),
        });
    }

    /**
     * Facilitates the htmx oob (out-of-band) feature. (https://htmx.org/docs/#oob_swaps)
     * The partial specified should have an id defined on its root element, and include the
     * attribute `hx-swap-oob="true"`.
     * @param tag The partial tag to include in the response.
     * @param attributes Attributes to pass to the tag.
     */
    oob(tag: string, attributes: Record<string, unknown> = {}) {
        this.football.oobs.push({ tag, attributes });
    }

    get oobs() {
        return this.football.oobs;
    }

    /**
     * Cancels the rendering of the current view only, returning empty content.  However, Oobs, if
     * specified, will still be included in the response.
     */
    cancelRender() {
        this.football.renderCanceled = true;
    }

    get renderCanceled() {
        return this.football.renderCanceled;
    }
}

/**
 * Represents an Oob (Out-of-band) element.
 */
interface Oob {
    tag: string;
    attributes: Record<string, unknown>;
}

export function coerceAttributes<A extends Attributes = Attributes>(
    attributes: A,
    types: AttributeTypes,
) {
    const coerced: Record<string, unknown> = structuredClone(attributes);
    for (const [key, type] of Object.entries(types)) {
        if (type === "number") {
            coerced[key] = Number(attributes[key]);
        } else if (type === "boolean") {
            coerced[key] = Boolean(attributes[key]);
        }
    }
    return coerced as A;
}
