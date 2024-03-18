import { createToken, Lexer } from "chevrotain";

export const Comment = createToken({ name: "Comment", pattern: /<!--[\s\S]*?-->/ });
export const Slash = createToken({ name: "Slash", pattern: /\// });
export const Identifier = createToken({ name: "Identifier", pattern: /[a-z][\w\-:]*/ });
export const Equals = createToken({ name: "Equals", pattern: /=/ });
export const WhiteSpace = createToken({ name: "WhiteSpace", pattern: /\s+/ });
export const Text = createToken({ name: "Text", pattern: /[^<{]+/ });

export const OpenSingleQuote = createToken({ name: "OpenSingleQuote", pattern: /'/, push_mode: "SingleQuoted" });
export const OpenDoubleQuote = createToken({ name: "OpenDoubleQuote", pattern: /"/, push_mode: "DoubleQuoted" });
export const OpenBacktickQuote = createToken({ name: "OpenBacktickQuote", pattern: /`/, push_mode: "BacktickQuoted" });
export const SingleQuoteText = createToken({ name: "SingleQuoteText", pattern: /[^'{]+/ });
export const DoubleQuoteText = createToken({ name: "DoubleQuoteText", pattern: /[^"{]+/ });
export const BacktickQuoteText = createToken({ name: "BacktickQuoteText", pattern: /([^`\{]+)/ });
export const CloseSingleQuote = createToken({ name: "CloseSingleQuote", pattern: /'/, pop_mode: true });
export const CloseDoubleQuote = createToken({ name: "CloseDoubleQuote", pattern: /"/, pop_mode: true });
export const CloseBacktickQuote = createToken({ name: "CloseBacktickQuote", pattern: /`/, pop_mode: true });

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
        TagStart: [
            Identifier,
            Equals,
            OpenBracket,
            Slash,
            CloseAngleBracket,
            OpenSingleQuote,
            OpenDoubleQuote,
            OpenBacktickQuote,
            WhiteSpace,
        ],
        TagEnd: [Identifier, CloseAngleBracket],
        Bracketed: [OpenBracket, CloseBracket, BracketedText],
        SingleQuoted: [OpenBracket, CloseSingleQuote, SingleQuoteText],
        DoubleQuoted: [OpenBracket, CloseDoubleQuote, DoubleQuoteText],
        BacktickQuoted: [OpenBracket, CloseBacktickQuote, BacktickQuoteText],
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
