"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function log_type_caller(log_type) {
    log_type.log(undefined);
}
let c1 = console;
// @ts-expect-error
log_type_caller(c1); // This one should generate an error but does not.
let c2 = console;
log_type_caller(c2);
function log_function_caller(log_function) {
    log_function(undefined);
}
let c3 = console.log;
// @ts-expect-error
log_function_caller(c3); // This one generates an error as expected.
let c4 = console.log;
log_function_caller(c4);
// är det bara primitves? nej
// kan vara pga event recordet i abstract state
function something(state) {
    state.update(5);
}
let k1;
let k2;
// @ts-expect-error
something(k1);
// @ts-expect-error
something(k2);
/*

State<number> is assignable to State<string | number> but shouldn't be
State<string> is assignable to State<string | number> but shouldn't be
State<boolean | number> is not assignable to State<string | number>

*/
