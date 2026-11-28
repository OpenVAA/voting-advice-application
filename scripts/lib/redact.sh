# shellcheck shell=bash
#
# redact.sh -- Removes credentials from a tool's output before it is printed. Sourced, never run.

# Prints a tool's output without credentials. A line that names a secret, in any letter case, a `_KEY` variable or a `password=` assignment is dropped whole, because a tool's status line also carries values with no recognisable shape (the JWT secret, the S3 secret, a connection string's password); so is a line that holds an address with a user part. Anything shaped like a JWT or a Supabase API key is removed from the lines that remain. The word `password` without `=` drops nothing: psql's commonest error is "password authentication failed", and it holds no password.
#
# $1 = file. With no argument, standard input is read.
print_redacted() {
  sed -E \
    -e '/[Ss][Ee][Cc][Rr][Ee][Tt]|_KEY|[Pp][Aa][Ss][Ss][Ww][Oo][Rr][Dd]=/s/.*/<a line naming a key, a secret or a password value was removed>/' \
    -e '/:\/\/[^[:space:]]*@/s/.*/<a line holding an address with a user part was removed>/' \
    -e 's/eyJ[A-Za-z0-9_-]{10,}(\.[A-Za-z0-9_-]+)*/<redacted>/g' \
    -e 's/sb_(secret|publishable)_[A-Za-z0-9_-]+/<redacted>/g' \
    "$@"
}
