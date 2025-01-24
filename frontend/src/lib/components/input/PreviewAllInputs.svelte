<script lang="ts">
  import { Input } from '.';

  function onChange(value: unknown) {
    console.info('New value:', value);
  }

  export let info: string | undefined = undefined;
  export let locked = false;
</script>

<div class="mb-[10rem] flex w-[30rem] flex-col gap-md">
  <Input type="text" label="Text" placeholder="This is a placeholder" {onChange} {locked} {info} />

  <Input
    type="text-multilingual"
    label="Text-ml"
    value={{ fi: 'Text in Finnish', en: 'Text in English', foo: 'Foo' }}
    {onChange}
    {locked}
    {info} />

  <Input type="textarea" label="Textarea" placeholder="This is a placeholder" {onChange} {locked} {info} />

  <Input
    type="textarea-multilingual"
    label="Textarea-ml"
    value={{ fi: 'Text in Finnish', en: 'Text in English', foo: 'Foo' }}
    {onChange}
    {locked}
    {info} />

  <Input type="textarea-multilingual" label="Textarea-ml (empty)" value={null} {onChange} {locked} {info} />

  <Input type="number" label="Number" value={123} {onChange} {locked} {info} />

  <Input type="number" label="Number (empty)" value={undefined} {onChange} {locked} {info} />

  <Input type="date" label="Date" value="2024-10-13" {onChange} {locked} {info} />

  <Input type="boolean" label="Boolean" value={true} {onChange} {locked} {info} />

  <Input type="image" label="Image" value={{ url: '/images/hero.png', alt: 'Alt text' }} {onChange} {locked} {info} />

  <Input type="image" label="Image (empty)" value={null} {onChange} {locked} {info} />

  <Input
    type="select"
    label="Select"
    value="c1"
    options={[
      { id: 'c1', label: 'Option 1' },
      { id: 'c2', label: 'Option 2' },
      { id: 'c3', label: 'Option 3' }
    ]}
    {onChange}
    {locked}
    {info} />

  <Input
    type="select"
    label="Select (none sel.)"
    options={[
      { id: 'c1', label: 'Option 1' },
      { id: 'c2', label: 'Option 2' },
      { id: 'c3', label: 'Option 3' }
    ]}
    {onChange}
    {locked}
    {info} />

  <Input
    type="select-multiple"
    label="Select-multi"
    value={['c2', 'c3', 'c1']}
    options={[
      { id: 'c1', label: 'Option 1' },
      { id: 'c2', label: 'Option 2' },
      { id: 'c3', label: 'Option 3' }
    ]}
    {onChange}
    {locked}
    {info} />

  <Input
    type="select-multiple"
    label="Select-multi (none sel.)"
    value={[]}
    options={[
      { id: 'c1', label: 'Option 1' },
      { id: 'c2', label: 'Option 2' },
      { id: 'c3', label: 'Option 3' }
    ]}
    {onChange}
    {locked}
    {info} />

  <Input
    type="select-multiple"
    label="Select-multi (ordered)"
    ordered
    value={['c3', 'c1']}
    options={[
      { id: 'c1', label: 'Option 1' },
      { id: 'c2', label: 'Option 2' },
      { id: 'c3', label: 'Option 3' }
    ]}
    {onChange}
    {locked}
    {info} />
</div>
