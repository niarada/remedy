import { createToken, Lexer } from "chevrotain";

export const Comment = createToken({ name: "Comment", pattern: /<!--[\s\S]*?-->/ });
export const Slash = createToken({ name: "Slash", pattern: /\// });
export const Identifier = createToken({ name: "Identifier", pattern: /[a-z][\w\-:]*/ });
export const Equals = createToken({ name: "Equals", pattern: /=/ });
export const WhiteSpace = createToken({ name: "WhiteSpace", pattern: /\s+/ });
export const StringLiteral = createToken({ name: "StringLiteral", pattern: /"([^"]*)"|'([^']*)'/ });
export const Text = createToken({ name: "Text", pattern: /[^<]+/ });

export const OpenAngleBracket = createToken({ name: "OpenAngleBracket", pattern: /</, push_mode: "TagStart" });

export const OpenAngleBracketSlash = createToken({
    name: "OpenAngleBracketSlash",
    pattern: /<\//,
    push_mode: "TagEnd",
});

export const CloseAngleBracket = createToken({ name: "CloseAngleBracket", pattern: />/, pop_mode: true });

export const ExpressionPart = createToken({ name: "ExpressionPart", pattern: Lexer.NA });
export const OpenBracket = createToken({
    name: "OpenBracket",
    pattern: /{/,
    push_mode: "Bracketed",
    categories: [ExpressionPart],
});
export const CloseBracket = createToken({
    name: "CloseBracket",
    pattern: /}/,
    pop_mode: true,
    categories: [ExpressionPart],
});
export const BracketedText = createToken({
    name: "BracketedText",
    pattern: /[^{}]+/,
    categories: [ExpressionPart],
});

const lexer = new Lexer({
    modes: {
        fragment: [Comment, OpenAngleBracketSlash, OpenAngleBracket, OpenBracket, Text],
        TagStart: [WhiteSpace, Identifier, Equals, StringLiteral, OpenBracket, Slash, CloseAngleBracket],
        TagEnd: [Identifier, CloseAngleBracket],
        Bracketed: [OpenBracket, CloseBracket, BracketedText],
    },
    defaultMode: "fragment",
});

export function lex(inputText: string) {
    const result = lexer.tokenize(inputText);
    if (result.errors.length > 0) {
        throw new Error(result.errors[0].message);
    }
    return result;
}
