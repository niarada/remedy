export class UnknownError {
    readonly _tag = "UnknownError";

    constructor(readonly source: Error) {}
}

export class AddressInUseError {
    readonly _tag = "AddressInUseError";

    constructor(readonly port: number) {}
}
