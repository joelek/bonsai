"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOrderedIndex = void 0;
function getOrderedIndex(array, collator) {
    function recursive(offset, length) {
        if (length <= 0) {
            return offset;
        }
        let pivot = offset + (length >> 1);
        let outcome = collator(array[pivot]);
        if (outcome === 0) {
            return pivot;
        }
        if (outcome < 0) {
            return recursive(offset, pivot - offset);
        }
        else {
            return recursive(pivot + 1, length - (pivot + 1) - offset);
        }
    }
    ;
    return recursive(0, array.length);
}
exports.getOrderedIndex = getOrderedIndex;
;
