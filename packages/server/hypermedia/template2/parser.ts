import { CstParser } from "chevrotain";
import {
    BracketedText,
    CloseAngleBracket,
    CloseBracket,
    Comment,
    Equals,
    ExpressionPart,
    Identifier,
    OpenAngleBracket,
    OpenAngleBracketSlash,
    OpenBracket,
    Slash,
    StringLiteral,
    Text,
    WhiteSpace,
    lex,
} from "./lexer";

class TemplateParser<F> extends CstParser {
    lastTagStartWasSelfClosing = false;

    constructor() {
        super(
            [
                BracketedText,
                CloseAngleBracket,
                CloseBracket,
                Comment,
                Equals,
                ExpressionPart,
                Identifier,
                OpenAngleBracket,
                OpenAngleBracketSlash,
                OpenBracket,
                Slash,
                StringLiteral,
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
        this.CONSUME(Identifier);
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
        this.CONSUME(Equals);
        this.OR([{ ALT: () => this.CONSUME(StringLiteral) }, { ALT: () => this.SUBRULE(this.expression) }]);
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
