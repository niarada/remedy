${toc}

# Context

Your partials have access to a `$context` object that provides information about the request, and let's you manipulate the response.

It looks like this:

```ts
interface Context<Attributes> {
    readonly attributes: Attributes;
    readonly request: Request;
    readonly url: URL;
    readonly cookie: Record<string, string>;
    readonly form: Record<string, string>;

    response?: Response;
    flash: string;

    redirect(href: string, status?: number);
    status(status: number, message?: string);
    oob(tag: string, attributes: Record<string, unknown> = {});
    cancelRender();
}
```

## attributes

Any attributes passed in via tag, or variable path part.

### request

A standard [request](https://developer.mozilla.org/en-US/docs/Web/API/Request) object.

### url

The parsed [URL](https://developer.mozilla.org/en-US/docs/Web/API/URL) object.


### cookie

An object that you may freely set/get properties on.  It will be passed back and forth to the client.
Make sure to set `COOKIE_SECRET` in your environment if you want the cookie encrypted.

### form

An object populated by both form submission fields and query string parameters.

### response(=)

May be set to an instance of [Response](https://developer.mozilla.org/en-US/docs/Web/API/Response) to more directly control the response.  The template, if any, will be ignored if this is set.

### flash(=)

Shortcut to place a flash message in the cookie, or to read it from the cookie.  If read, it will be deleted from the cookie.

### redirect(href, status?)

Shortcut to redirect.  If `status` is not specified, it defaults to 302.

### status(status, message?)

Shortcut to set the status code and message.  This creates a response, so templating will be bypassed.  If `message` is not specified, it defaults the standard message for the code.

### oob(tag, attributes)

Renders an [out-of-band](https://htmx.org/docs/#oob_swaps) partial to the response.

### cancelRender

Cancels rendering the template for the current partial.  It will, however, still render any out-of-bands that have been specified.
