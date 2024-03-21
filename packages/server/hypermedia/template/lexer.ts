import { createToken, Lexer } from "chevrotain";

export const Comment = createToken({ name: "Comment", pattern: /<!--[\s\S]*?-->/ });
export const Text = createToken({ name: "Text", pattern: /[^<{]+/ });

// export const Slash = createToken({ name: "Slash", pattern: /\// });
export const AttributeName = createToken({ name: "AttributeName", pattern: /[a-z][\w\-:]*/ });
export const Equals = createToken({ name: "Equals", pattern: /=/ });
export const WhiteSpace = createToken({ name: "WhiteSpace", pattern: /\s+/ });

export const OpenSingleQuote = createToken({ name: "OpenSingleQuote", pattern: /'/, push_mode: "SingleQuoted" });
export const OpenDoubleQuote = createToken({ name: "OpenDoubleQuote", pattern: /"/, push_mode: "DoubleQuoted" });
export const OpenBacktickQuote = createToken({ name: "OpenBacktickQuote", pattern: /`/, push_mode: "BacktickQuoted" });
export const SingleQuoteText = createToken({ name: "SingleQuoteText", pattern: /[^'{]+/ });
export const DoubleQuoteText = createToken({ name: "DoubleQuoteText", pattern: /[^"{]+/ });
export const BacktickQuoteText = createToken({ name: "BacktickQuoteText", pattern: /([^`\{]+)/ });
export const CloseSingleQuote = createToken({ name: "CloseSingleQuote", pattern: /'/, pop_mode: true });
export const CloseDoubleQuote = createToken({ name: "CloseDoubleQuote", pattern: /"/, pop_mode: true });
export const CloseBacktickQuote = createToken({ name: "CloseBacktickQuote", pattern: /`/, pop_mode: true });

export const OpaqueTagStart = createToken({
    name: "OpaqueTagStart",
    pattern: /<(code|script|style)/,
    push_mode: "OpaqueTagStart",
});

export const OpaqueTagStartClose = createToken({
    name: "OpaqueTagStartClose",
    pattern: />/,
    pop_mode: true,
    push_mode: "OpaqueContent",
});

export const OpaqueTagStartSelfClose = createToken({
    name: "OpaqueTagStartSelfClose",
    pattern: /\/>/,
    pop_mode: true,
});

export const OpaqueText = createToken({
    name: "OpaqueText",
    pattern: /(.|\s|\S)+?(?=<\/(code|script|style)>)/,
});

export const OpaqueTagEnd = createToken({
    name: "OpaqueTagEnd",
    pattern: /<\/(code|script|style)>/,
    pop_mode: true,
});

export const TagStart = createToken({ name: "TagStart", pattern: /<[a-z][\w\-]*/, push_mode: "TagStart" });
export const TagStartClose = createToken({ name: "TagStartClose", pattern: />/, pop_mode: true });
export const TagStartSelfClose = createToken({ name: "TagStartSelfClose", pattern: /\/>/, pop_mode: true });
export const TagEnd = createToken({ name: "TagEnd", pattern: /<\/[a-z][\w\-]*>/ });

export const ExpressionPart = createToken({ name: "ExpressionPart", pattern: Lexer.NA });
export const ExpressionStart = createToken({
    name: "ExpressionStart",
    pattern: /{/,
    push_mode: "Expression",
    categories: [ExpressionPart],
});
export const ExpressionEnd = createToken({
    name: "ExpressionEnd",
    pattern: /}/,
    pop_mode: true,
    categories: [ExpressionPart],
});
// TODO: Need to be able to handle object literals, and nested  brackets
export const ExpressionText = createToken({
    name: "ExpressionText",
    pattern: /[^{}]+/,
    categories: [ExpressionPart],
});

const lexer = new Lexer({
    modes: {
        fragment: [Comment, TagEnd, OpaqueTagStart, TagStart, ExpressionStart, Text],
        TagStart: [
            AttributeName,
            Equals,
            ExpressionStart,
            TagStartClose,
            TagStartSelfClose,
            OpenSingleQuote,
            OpenDoubleQuote,
            OpenBacktickQuote,
            WhiteSpace,
        ],
        OpaqueTagStart: [
            AttributeName,
            Equals,
            ExpressionStart,
            OpaqueTagStartClose,
            OpaqueTagStartSelfClose,
            OpenSingleQuote,
            OpenDoubleQuote,
            OpenBacktickQuote,
            WhiteSpace,
        ],
        OpaqueContent: [OpaqueTagEnd, OpaqueText],
        Expression: [ExpressionStart, ExpressionEnd, ExpressionText],
        SingleQuoted: [ExpressionStart, CloseSingleQuote, SingleQuoteText],
        DoubleQuoted: [ExpressionStart, CloseDoubleQuote, DoubleQuoteText],
        BacktickQuoted: [ExpressionStart, CloseBacktickQuote, BacktickQuoteText],
    },
    defaultMode: "fragment",
});

export function lex(input: string, path?: string) {
    const result = lexer.tokenize(input);
    if (result.errors.length > 0) {
        for (const error of result.errors) {
            console.warn(`Syntax error in '${path}' on line ${error.line}, column ${error.column}:`);
            console.warn(error.message);
        }
    }
    return result;
}
