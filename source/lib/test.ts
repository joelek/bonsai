// Contravariant annotation required.
interface LogType<in A> {
	log(value: A): void;
}

function log_type_caller(log_type: LogType<string | undefined>): void {
	log_type.log(undefined);
}

let c1: LogType<string> = console;
// @ts-expect-error
log_type_caller(c1); // This one should generate an error but does not.
let c2: LogType<string | undefined> = console;
log_type_caller(c2);

type LogFunction<A> = (value: A) => void;

function log_function_caller(log_function: LogFunction<string | undefined>): void {
	log_function(undefined);
}

let c3: LogFunction<string> = console.log;
// @ts-expect-error
log_function_caller(c3); // This one generates an error as expected.
let c4: LogFunction<string | undefined> = console.log;
log_function_caller(c4);
