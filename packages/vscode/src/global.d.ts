/// <reference types="node" />
// import { URL } from "url";
declare global {
    type Cookie = Record<string, unknown>;
    /**
     * A context encapsulates information about a request context for a view, and provides utilities
     * for manipulating it.
     */
    declare class Context {
        #private;
        constructor(request: Request);
        loadForm(): Promise<void>;
        get request(): Request;
        set response(response: Response | undefined);
        get response(): Response | undefined;
        get url(): URL;
        get cookie(): Cookie;
        get form(): Record<string, string>;
        set flash(message: string);
        get flash(): string | undefined;
        redirect(href: string): void;
        /**
         * Facilitates the htmx oob (out-of-band) feature. (https://htmx.org/docs/#oob_swaps)
         * The partial specified should have an id defined on its root element, and include the
         * attribute `hx-swap-oob="true"`.
         * @param tag The partial tag to include in the response.
         * @param attributes Attributes to pass to the tag.
         */
        oob(tag: string, attributes: Record<string, unknown> = {}): void;
        get oobs(): Oob[];
        /**
         * Cancels the rendering of the current view only, returning empty content.  However, Oobs, if
         * specified, will still be included in the response.
         */
        cancelRender(): void;
        get renderCanceled(): boolean;
    }
    /**
     * Represents an Oob (Out-of-band) element.
     */
    interface Oob {
        tag: string;
        attributes: Record<string, unknown>;
    }
}

export type {};
