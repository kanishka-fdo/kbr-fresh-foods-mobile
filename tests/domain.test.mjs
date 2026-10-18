import test from 'node:test';
import assert from 'node:assert/strict';
import { canAccess, mergeCart, validQuantity } from '../src/lib/domain.mjs';
test('management and delivery routes respect account roles', () => {
  for (const role of ['customer', 'wholesale', 'driver']) assert.equal(canAccess(role, 'inventory'), false);
  for (const role of ['staff', 'admin']) assert.equal(canAccess(role, 'inventory'), true);
  assert.equal(canAccess('staff', 'users'), false);
  assert.equal(canAccess('admin', 'users'), true);
  assert.equal(canAccess('driver', 'deliveries'), true);
  assert.equal(canAccess('customer', 'deliveries'), false);
  assert.equal(canAccess('wholesale', 'checkout'), false);
  assert.equal(canAccess(undefined, 'users'), false);
});
test('guest cart merges without exceeding current account stock or mutating inputs', () => {
  const account = [{ product: 'a', quantity: 3, stockQuantity: 5 }];
  const guest = [{ product: 'a', quantity: 4, stockQuantity: 10 }, { product: 'b', quantity: 3, stockQuantity: 2 }];
  assert.deepEqual(mergeCart(account, guest), [{ product: 'a', quantity: 5, stockQuantity: 5 }, { product: 'b', quantity: 2, stockQuantity: 2 }]);
  assert.equal(account[0].quantity, 3); assert.equal(guest[1].quantity, 3);
});
test('quantity rejects zero, negative, nonfinite, excess stock and wholesale quantities below minimum', () => {
  for (const value of [0, -1, NaN, Infinity, 21]) assert.equal(validQuantity(value, 20), false);
  assert.equal(validQuantity(19, 40, 20), false);
  assert.equal(validQuantity(20, 40, 20), true);
  assert.equal(validQuantity(0.5, 10, 0.1), true);
});
