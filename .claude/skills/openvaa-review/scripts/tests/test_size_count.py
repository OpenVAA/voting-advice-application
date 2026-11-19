"""Exact effective-line counts for the fixtures, plus the diff parser. Run:
python3 -m unittest discover -s .claude/skills/openvaa-review/scripts/tests
"""
import os
import sys
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
from size_count import count_diff, effective_lines  # noqa: E402

EXPECTED = {
    # import, const url, const y, export function, return, closing brace
    "sample.ts": 6,
    # <script>, let, </script>, <button>, <style>, button rule, </style>
    "sample.svelte": 7,
    # create table, id, name, ");", grant
    "sample.sql": 5,
    # set, echo
    "sample.sh": 2,
    # name, on, push, branches
    "sample.yaml": 4,
}


def read(name):
    with open(os.path.join(HERE, "fixtures", name)) as fh:
        return fh.read().splitlines()


class EffectiveLines(unittest.TestCase):
    def test_fixtures(self):
        for name, expected in EXPECTED.items():
            with self.subTest(name=name):
                self.assertEqual(effective_lines(read(name), name), expected)

    def test_unknown_language_counts_every_non_blank_line(self):
        self.assertEqual(effective_lines(["a", "", "# b", "// c"], "notes.txt"), 3)

    def test_doc_continuation_without_opener(self):
        # a hunk that changed only the middle of a doc comment
        self.assertEqual(effective_lines([" * changed wording", " */"], "a.ts"), 0)

    def test_multiplication_line_is_code(self):
        self.assertEqual(effective_lines(["  * factor;"], "a.ts"), 1)


DIFF = """diff --git a/m.sql b/m.sql
index 1..2 100644
--- a/m.sql
+++ b/m.sql
@@ -1,2 +1,2 @@
--- old comment
-select 1;
+-- new comment
+select 2;
diff --git a/gone.ts b/gone.ts
deleted file mode 100644
--- a/gone.ts
+++ /dev/null
@@ -1,2 +0,0 @@
-// bye
-export const z = 1;
"""


class CountDiff(unittest.TestCase):
    def test_removed_sql_comment_is_not_a_header(self):
        self.assertEqual(count_diff(DIFF), {"m.sql": (1, 1), "gone.ts": (0, 1)})


if __name__ == "__main__":
    unittest.main()
