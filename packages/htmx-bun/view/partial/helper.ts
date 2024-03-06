/**
 * A Helper is injected into partials to help them control various aspects of the request.
 */
export class Helper {
    #oobs: Oob[] = [];
    #renderCanceled = false;

    oob(tag: string, attributes: Record<string, unknown>) {
        this.#oobs.push({ tag, attributes });
    }

    get oobs() {
        return this.#oobs;
    }

    cancelRender() {
        this.#renderCanceled = true;
    }

    get renderCanceled() {
        return this.#renderCanceled;
    }
}

interface Oob {
    tag: string;
    attributes: Record<string, unknown>;
}
