import test from 'node:test';
import assert from 'node:assert/strict';
import { validateFields } from '../src/lib/extraction/validation.ts';
import { parseMoney, validateUploads } from '../src/lib/input-validation.ts';
test('formatted currency exports its whole value instead of 1', () => {
  assert.equal(parseMoney('$1,250.50'), 1250.50);
  assert.throws(() => parseMoney('abc'));
  assert.throws(() => parseMoney('-5'));
});
test('invalid numeric fields require review', () => {
  const warnings = validateFields([{fieldName:'total', value:'not a number', confidence:1}]);
  assert.equal(warnings.has('total'), true);
});
test('upload count, size, and content type are bounded before ingestion', () => {
  assert.throws(() => validateUploads([]));
  assert.throws(() => validateUploads([new File(['x'], 'x.html', {type:'text/html'})]));
  assert.throws(() => validateUploads(Array.from({length:4}, () => new File(['%PDF'], 'x.pdf', {type:'application/pdf'}))));
  assert.throws(() => validateUploads([new File([new Uint8Array(3*1024*1024+1)], 'x.pdf', {type:'application/pdf'})]));
  assert.doesNotThrow(() => validateUploads([new File(['%PDF'], 'x.pdf', {type:'application/pdf'})]));
});

test('malformed currency grouping and impossible dates cannot pass live review',()=>{
  assert.throws(()=>parseMoney('12,34.00'));
  const fields=[{fieldName:'vendor',value:'Sample',confidence:1},{fieldName:'invoiceNumber',value:'INV-1',confidence:1},{fieldName:'total',value:'100garbage',confidence:1},{fieldName:'dueDate',value:'2026-02-30',confidence:1}];
  const issues=validateFields(fields);
  assert.ok(issues.has('total'));assert.ok(issues.has('dueDate'));
});
