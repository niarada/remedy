import { CstParser } from "chevrotain";
import {
    AttributeName,
    BacktickQuoteText,
    CloseBacktickQuote,
    CloseDoubleQuote,
    CloseSingleQuote,
    Comment,
    DoubleQuoteText,
    Equals,
    ExpressionEnd,
    ExpressionPart,
    ExpressionStart,
    ExpressionText,
    OpaqueTagEnd,
    OpaqueTagStart,
    OpaqueTagStartClose,
    OpaqueTagStartSelfClose,
    OpaqueText,
    OpenBacktickQuote,
    OpenDoubleQuote,
    OpenSingleQuote,
    SingleQuoteText,
    TagEnd,
    TagStart,
    TagStartClose,
    TagStartSelfClose,
    Text,
    WhiteSpace,
    lex,
} from "./lexer";
import { htmlVoidTags } from "./tags";

class TemplateParser<F> extends CstParser {
    constructor() {
        super(
            [
                AttributeName,
                BacktickQuoteText,
                TagStartClose,
                CloseBacktickQuote,
                CloseDoubleQuote,
                CloseSingleQuote,
                Comment,
                DoubleQuoteText,
                Equals,
                ExpressionText,
                ExpressionEnd,
                ExpressionPart,
                ExpressionStart,
                OpaqueText,
                OpaqueTagEnd,
                OpaqueTagStart,
                OpenBacktickQuote,
                OpenDoubleQuote,
                OpenSingleQuote,
                SingleQuoteText,
                TagEnd,
                TagStart,
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
                { ALT: () => this.SUBRULE(this.opaque) },
                { ALT: () => this.SUBRULE(this.element) },
                { ALT: () => this.SUBRULE(this.expression) },
                { ALT: () => this.SUBRULE(this.text) },
            ]);
        });
    });

    private opaque = this.RULE("opaque", () => {
        const tagStart = this.CONSUME(OpaqueTagStart);
        const tag = tagStart.image.slice(1);
        this.MANY(() => {
            this.SUBRULE(this.attribute);
        });
        this.OPTION(() => {
            this.CONSUME(WhiteSpace);
        });
        const tagStartClose = this.OR([
            { ALT: () => this.CONSUME(OpaqueTagStartSelfClose) },
            { ALT: () => this.CONSUME(OpaqueTagStartClose) },
        ]);
        if (!(htmlVoidTags.includes(tag) || tagStartClose.image === "/>")) {
            this.OPTION1(() => {
                this.CONSUME(OpaqueText);
            });
            this.CONSUME(OpaqueTagEnd);
        }
    });

    private element = this.RULE("element", () => {
        const tagStart = this.CONSUME(TagStart);
        const tag = tagStart.image.slice(1);
        this.MANY(() => {
            this.SUBRULE(this.attribute);
        });
        this.OPTION(() => {
            this.CONSUME(WhiteSpace);
        });
        const tagStartClose = this.OR([
            { ALT: () => this.CONSUME(TagStartSelfClose) },
            { ALT: () => this.CONSUME(TagStartClose) },
        ]);
        if (!(htmlVoidTags.includes(tag) || tagStartClose.image === "/>")) {
            this.OPTION1(() => {
                this.SUBRULE(this.fragment);
            });
            this.CONSUME(TagEnd);
        }
    });

    private attribute = this.RULE("attribute", () => {
        this.CONSUME(WhiteSpace);
        this.CONSUME(AttributeName);
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
        const token = this.CONSUME(Text);
    });
}

export const parser = new TemplateParser();

export function parse(source: string, path?: string) {
    const { tokens } = lex(source, path);
    parser.input = tokens;
    return { document: parser.document(), errors: parser.errors };
}
