/**
 * Line readers for a `terraform.tfvars`, shared by the guards, the hosted probe and the deployed smoke gate, so that one
 * tfvars line is read the same way by each of them.
 *
 * An assignment is a line `name = value`, with optional leading whitespace and an optional trailing `#` comment. A line
 * that starts with `name =` and does not hold a value of the reader's form is unreadable, never skipped, and a name
 * assigned on more than one line is refused. A commented-out line does not count.
 *
 * Each reader returns the result shape of `scripts/lib/static-settings.mjs`: `{ ok: true, value }`, or
 * `{ ok: false, what }` naming the value and what is wrong with it. The caller adds the file and its own error type.
 *
 * `tfvar_value` of `scripts/lib/cli.sh` reads a quoted string by the same line rules for the shell scripts and workflows.
 *
 * Node built-ins only, no build step: the guards that import it run before anything is built.
 */

/**
 * One quoted string assignment.
 *
 * @param {string} text - The tfvars text.
 * @param {string} name - The variable name, a plain identifier.
 * @returns {{ ok: true, value: string | null } | { ok: false, what: string }} `{ ok: true, value }`, where `value`
 *   is the string or `null` when the text does not assign the name; or `{ ok: false, what }` when the name is assigned
 *   more than once or a line assigning it is not a quoted string with no `"` or `\` in it.
 */
export function readTfvarsString(text, name) {
  return readAssignments(text, name, new RegExp(`^\\s*${name}\\s*=\\s*"([^"\\\\]*)"\\s*(?:#.*)?$`), (m) => m[1]);
}

/**
 * One boolean assignment, with its trailing comment.
 *
 * @param {string} text - The tfvars text.
 * @param {string} name - The variable name, a plain identifier.
 * @returns {{ ok: true, value: boolean | null, comment: string } | { ok: false, what: string }}
 *   `{ ok: true, value, comment }`, where `value` is `true`, `false` or `null` when the text does not assign the name,
 *   and `comment` is the trailing comment's text after `#` and any whitespace, `''` when there is none; or
 *   `{ ok: false, what }` when the name is assigned more than once or a line assigning it is not `true` or `false`.
 */
export function readTfvarsBool(text, name) {
  const read = readAssignments(
    text,
    name,
    new RegExp(`^\\s*${name}\\s*=\\s*(true|false)\\s*(?:#\\s*(.*?))?\\s*$`),
    (m) => ({ value: m[1] === 'true', comment: m[2] ?? '' })
  );
  if (!read.ok) return read;
  return read.value === null ? { ok: true, value: null, comment: '' } : { ok: true, ...read.value };
}

/**
 * Every assignment of one name, each read by `form`.
 *
 * @template T
 * @param {string} text
 * @param {string} name
 * @param {RegExp} form - The whole line of an assignment of the reader's form.
 * @param {(m: RegExpExecArray) => T} value - The value of a line `form` matched.
 * @returns {{ ok: true, value: T | null } | { ok: false, what: string }}
 */
function readAssignments(text, name, form, value) {
  const assigns = new RegExp(`^\\s*${name}\\s*=`);
  const values = [];
  for (const line of text.split('\n')) {
    if (!assigns.test(line)) continue;
    const m = form.exec(line);
    if (!m) return { ok: false, what: `the line '${line.trim()}' is not a ${name} the line read can read` };
    values.push(value(m));
  }
  if (values.length > 1) return { ok: false, what: `${name} is assigned ${values.length} times` };
  return { ok: true, value: values.length === 1 ? values[0] : null };
}
