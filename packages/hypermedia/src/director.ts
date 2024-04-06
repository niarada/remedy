import { error, info, warn, watch } from "@niarada/remedy-common";
import { Context, RemedyFeature } from "@niarada/remedy-runtime";
import { PrintHtmlOptions, htmlTags } from "@niarada/remedy-template";
import { plugin } from "bun";
import { readFileSync } from "node:fs";
import { parse as parsePath } from "node:path";
import { Artifact } from "./artifact";
import { Representation, VariableRepresentation } from "./representation";
import { resolveTag } from "./resolve";
import { Source } from "./source";

/**
 * Manages hypermedia representations and their modules.
 */
export class Director {
    features: Record<string, RemedyFeature> = {};

    /**
     * @param base The base lookup path for representation sources.
     */
    constructor(
        readonly base?: string,
        features: RemedyFeature[] = [],
    ) {
        for (const feature of features) {
            if (feature.extension && feature.source) {
                this.features[feature.extension] = feature;
            }
        }
    }

    private readonly representations: Map<string, Representation> = new Map();

    /**
     * Registers a source with the module system, imports it, and retains a mapping
     * of the resulting representation.
     * @param tag The tag name.
     * @param source The string or source instance.
     */
    async prepare(tag: string, source: Source) {
        if (htmlTags.includes(tag)) {
            warn("director", `tag name '${tag}' is reserved, ignoring`);
            return;
        }
        plugin({
            setup: ({ module }) => {
                module(tag, () => {
                    return {
                        contents: source.code,
                        loader: "tsx",
                    };
                });
            },
        });
        let artifact: Artifact | undefined;
        try {
            artifact = (await import(tag)) as Artifact;
        } catch (err) {
            error("director", `failed to import '${tag}'`);
            console.log(err);
        }
        if (!artifact) {
            return;
        }
        const representation = new Representation(this, tag, artifact, source.path);
        this.representations.set(tag, representation);
    }

    revert(tag: string) {
        info("director", `reverting '${tag}'`);
        this.representations.delete(tag);
    }

    watch() {
        if (!this.base) {
            return;
        }
        const extensionsRe = new RegExp(`\\.(${Object.keys(this.features).join("|")})$`);
        watch(this.base, async (_, path) => {
            if (extensionsRe.test(path ?? "")) {
                const rep = Array.from(this.representations.values()).find((r) => r.path === path);
                if (rep) {
                    this.revert(rep.tag);
                }
            }
        });
    }

    /**
     * Return the representation associated with a given tag name.
     *
     * If the representation is not found, a lookup will be attempted by deriving a
     * path name from the configured base path and tag name.
     *
     * If no base path has been configured, no lookup will be performed, and
     * only manually registered tags can be retrieved.
     *
     * @param tag The tag name.
     * @returns The representation, if found, or undefined.
     */
    async represent(tag: string): Promise<Representation | undefined> {
        if (!this.representations.has(tag) && this.base) {
            const { path, amendedTag, resolvedVariables } = resolveTag(tag, this.base, Object.keys(this.features));
            if (!path) {
                warn("director", `No representation found for '${tag}'`);
                return;
            }
            if (amendedTag) {
                if (!this.representations.has(amendedTag)) {
                    const text = readFileSync(path, "utf8");
                    const shortpath = path.replace(new RegExp(`^${this.base}/`), "");
                    const { ext } = parsePath(shortpath);
                    await this.prepare(amendedTag, this.features[ext.slice(1)].source!(text, shortpath.toString()));
                }
                let representation = this.representations.get(amendedTag);
                if (representation && Object.keys(resolvedVariables).length > 0) {
                    representation = new VariableRepresentation(representation, resolvedVariables);
                }
                return representation;
            }
        }
        return this.representations.get(tag);
    }

    /**
     * A helper to immediately get the presentation, if available.
     * @param tag The tag name.
     * @param context The server context.
     * @param attributes The attributes.
     * @returns
     */
    async present(tag: string, context: Context) {
        return (await this.represent(tag))?.present(context);
    }

    /**
     * A helper to run through the whole render pipeline.
     *
     * @param tag The tag name.
     * @param context The server context.
     * @param attributes The attributes.
     * @param options Options to pass to the printer.
     * @returns The rendered html string.
     */
    async render(tag: string, context: Context, options: Partial<PrintHtmlOptions> = {}): Promise<string | undefined> {
        const rep = await this.represent(tag);
        if (!rep) {
            return;
        }
        const pres = rep.present(context);
        await pres.activate();
        await pres.compose();
        pres.flatten();
        return pres.render(options);
    }
}
