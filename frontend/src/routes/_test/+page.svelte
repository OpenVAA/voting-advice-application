<script lang="ts">
  const testA = [1, 2, 3];
  // Test ternary formatting
  const test = testA ? testA.filter((a) => a > 2).map((a) => a * 2) : [];
</script>

Foo {test}
