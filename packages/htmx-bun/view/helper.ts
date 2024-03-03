export class Helper {
    #oobs: Oob[] = [];
    #renderCanceled = false;

    // constructor() {}

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
