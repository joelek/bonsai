"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Union = exports.UnionOptionCodec = exports.Undefined = exports.UndefinedOptionCodec = exports.Boolean = exports.BooleanOptionCodec = exports.Integer = exports.IntegerOptionCodec = exports.Plain = exports.PlainOptionCodec = exports.OptionCodec = void 0;
class OptionCodec {
    constructor() { }
}
exports.OptionCodec = OptionCodec;
;
class PlainOptionCodec extends OptionCodec {
    constructor() {
        super();
    }
    decode(value) {
        if (typeof value === "undefined") {
            throw new Error(`Expected value to be present!`);
        }
        return value;
    }
    encode(option) {
        return option;
    }
}
exports.PlainOptionCodec = PlainOptionCodec;
;
exports.Plain = new PlainOptionCodec();
class IntegerOptionCodec extends OptionCodec {
    constructor() {
        super();
    }
    decode(value) {
        if (typeof value === "undefined") {
            throw new Error(`Expected value to be present!`);
        }
        if (!/^([0-9]|[1-9][0-9]+)$/.test(value)) {
            throw new Error(`Expected value "${value}" to contain an integer!`);
        }
        return globalThis.Number.parseInt(value);
    }
    encode(option) {
        if (!Number.isInteger(option)) {
            throw new Error(`Expected an integer!`);
        }
        return `${option}`;
    }
}
exports.IntegerOptionCodec = IntegerOptionCodec;
;
exports.Integer = new IntegerOptionCodec();
class BooleanOptionCodec extends OptionCodec {
    constructor() {
        super();
    }
    decode(value) {
        if (typeof value === "undefined") {
            throw new Error(`Expected value to be present!`);
        }
        if (!/^(true|false)$/.test(value)) {
            throw new Error(`Expected value "${value}" to contain a boolean!`);
        }
        return value === "true";
    }
    encode(option) {
        return `${option}`;
    }
}
exports.BooleanOptionCodec = BooleanOptionCodec;
;
exports.Boolean = new BooleanOptionCodec();
class UndefinedOptionCodec extends OptionCodec {
    constructor() {
        super();
    }
    decode(value) {
        if (typeof value !== "undefined") {
            throw new Error(`Expected value to be absent!`);
        }
        return value;
    }
    encode(option) {
        return option;
    }
}
exports.UndefinedOptionCodec = UndefinedOptionCodec;
;
exports.Undefined = new UndefinedOptionCodec();
class UnionOptionCodec extends OptionCodec {
    codecs;
    constructor(...codecs) {
        super();
        this.codecs = codecs;
    }
    decode(value) {
        for (let codec of this.codecs) {
            try {
                return codec.decode(value);
            }
            catch (error) { }
        }
        throw new Error(`Expected option to be decodable!`);
    }
    encode(option) {
        for (let codec of this.codecs) {
            try {
                return codec.encode(option);
            }
            catch (error) { }
        }
        throw new Error(`Expected option to be encodable!`);
    }
}
exports.UnionOptionCodec = UnionOptionCodec;
;
exports.Union = {
    of(...codecs) {
        return new UnionOptionCodec(...codecs);
    }
};
