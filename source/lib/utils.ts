export function getOrderedIndex<A>(array: Array<A>, collator: (value: A) => number): number {
	function recursive(offset: number, length: number): number {
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
		} else {
			return recursive(pivot + 1, length - (pivot + 1) - offset);
		}
	};
	return recursive(0, array.length);
};
