import { CstParser } from "chevrotain";
import {
    BacktickQuoteText,
    BracketedText,
    CloseAngleBracket,
    CloseBacktickQuote,
    CloseBracket,
    CloseDoubleQuote,
    CloseSingleQuote,
    Comment,
    DoubleQuoteText,
    Equals,
    ExpressionPart,
    Identifier,
    OpenAngleBracket,
    OpenAngleBracketSlash,
    OpenBacktickQuote,
    OpenBracket,
    OpenDoubleQuote,
    OpenSingleQuote,
    SingleQuoteText,
    Slash,
    Text,
    WhiteSpace,
    lex,
} from "./lexer";
import { htmlVoidTags } from "./tags";

class TemplateParser<F> extends CstParser {
    lastTagStartWasSelfClosing = false;

    constructor() {
        super(
            [
                BacktickQuoteText,
                BracketedText,
                CloseAngleBracket,
                CloseBacktickQuote,
                CloseBracket,
                CloseDoubleQuote,
                CloseSingleQuote,
                Comment,
                DoubleQuoteText,
                Equals,
                ExpressionPart,
                Identifier,
                OpenAngleBracket,
                OpenAngleBracketSlash,
                OpenBacktickQuote,
                OpenBracket,
                OpenDoubleQuote,
                OpenSingleQuote,
                SingleQuoteText,
                Slash,
                Text,
                WhiteSpace,
            ],
            { nodeLocationTracking: "full" },
        );
        this.performSelfAnalysis();
    }

    public document = this.RULE("document", () => {
        this.OPTION(() => {
            this.SUBRULE(this.fragment);
        });
    });

    private fragment = this.RULE("fragment", () => {
        this.AT_LEAST_ONE(() => {
            this.OR([
                { ALT: () => this.SUBRULE(this.comment) },
                { ALT: () => this.SUBRULE(this.element) },
                { ALT: () => this.SUBRULE(this.text) },
                { ALT: () => this.SUBRULE(this.expression) },
            ]);
        });
    });

    private element = this.RULE("element", () => {
        this.SUBRULE(this.tagStart);
        if (!this.lastTagStartWasSelfClosing) {
            this.OPTION(() => {
                this.SUBRULE(this.fragment);
            });
        }
        this.OPTION1(() => this.SUBRULE(this.tagEnd));
    });

    private tagStart = this.RULE("tagStart", () => {
        this.lastTagStartWasSelfClosing = false;
        this.CONSUME(OpenAngleBracket);
        const identifier = this.CONSUME(Identifier);
        if (htmlVoidTags.includes(identifier.image)) {
            this.lastTagStartWasSelfClosing = true;
        }
        this.MANY(() => {
            this.SUBRULE(this.attribute);
        });
        this.OPTION(() => {
            this.CONSUME(WhiteSpace);
        });
        this.OPTION1(() => {
            this.CONSUME(Slash);
            this.lastTagStartWasSelfClosing = true;
        });
        this.CONSUME(CloseAngleBracket);
    });

    private tagEnd = this.RULE("tagEnd", () => {
        this.CONSUME(OpenAngleBracketSlash);
        this.CONSUME(Identifier);
        this.CONSUME(CloseAngleBracket);
    });

    private attribute = this.RULE("attribute", () => {
        this.CONSUME(WhiteSpace);
        this.CONSUME(Identifier);
        this.OPTION(() => {
            this.CONSUME(Equals);
            this.SUBRULE(this.attributeValue);
        });
    });

    private attributeValue = this.RULE("attributeValue", () => {
        this.OR([
            { ALT: () => this.SUBRULE(this.expression) },
            {
                ALT: () => {
                    this.CONSUME(OpenSingleQuote);
                    this.MANY(() => {
                        this.OR1([
                            { ALT: () => this.CONSUME(SingleQuoteText) },
                            { ALT: () => this.SUBRULE1(this.expression) },
                        ]);
                    });
                    this.CONSUME(CloseSingleQuote);
                },
            },
            {
                ALT: () => {
                    this.CONSUME(OpenDoubleQuote);
                    this.MANY1(() => {
                        this.OR2([
                            { ALT: () => this.CONSUME(DoubleQuoteText) },
                            { ALT: () => this.SUBRULE2(this.expression) },
                        ]);
                    });
                    this.CONSUME(CloseDoubleQuote);
                },
            },
            {
                ALT: () => {
                    this.CONSUME(OpenBacktickQuote);
                    this.MANY2(() => {
                        this.OR3([
                            { ALT: () => this.CONSUME(BacktickQuoteText) },
                            { ALT: () => this.SUBRULE3(this.expression) },
                        ]);
                    });
                    this.CONSUME(CloseBacktickQuote);
                },
            },
        ]);
    });

    private expression = this.RULE("expression", () => {
        this.AT_LEAST_ONE(() => {
            this.CONSUME(ExpressionPart);
        });
    });

    private comment = this.RULE("comment", () => {
        this.CONSUME(Comment);
    });

    private text = this.RULE("text", () => {
        this.CONSUME(Text);
    });
}

export const parser = new TemplateParser();

export function parse(source: string) {
    const { tokens } = lex(source);
    parser.input = tokens;
    return { document: parser.document(), errors: parser.errors };
}
