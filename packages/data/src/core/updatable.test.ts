import { expect, test, vi } from 'vitest';
import { Updatable } from '../internal';

test('Updatable', () => {
  class MockUpdatable extends Updatable {
    triggerNestedUpdate() {
      this.update(() => {
        this.update(() => {
          this.update(() => {});
        });
      });
    }
  }

  const updatable = new MockUpdatable();
  const handler = vi.fn(() => {});
  const unsubscribe = updatable.subscribe(handler);

  updatable.update(() => {});
  expect(handler, 'Call subscribed handler on update').toHaveBeenCalledTimes(1);
  expect(handler, 'Pass self to handler').toHaveBeenCalledWith(updatable);

  updatable.onUpdate();
  expect(handler, 'Call subscribed handlers on onUpdate').toHaveBeenCalledTimes(2);

  updatable.triggerNestedUpdate();
  expect(handler, 'Nested updates to trigger only one onUpdate').toHaveBeenCalledTimes(3);

  unsubscribe();
  updatable.onUpdate();
  expect(handler, 'Not call unsubscribed handlers').toHaveBeenCalledTimes(3);
});
