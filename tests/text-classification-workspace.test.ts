import { describe, expect, it } from 'vitest';
import { validateExamples } from '../src/pages/algorithms/shared/textClassificationWorkspace';
import { stratifiedSplit, trainMultinomialNB, predictMultinomialNB } from '../src/lib/nlp/naiveBayesText';
describe('text classification training safety', () => {
  it('rejects missing, duplicate, conflicting and too-small classes', () => {
    const result = validateExamples([{text:'',label:''},{text:'hello',label:'a'},{text:'hello',label:'b'}],{});
    expect(result.errors.join(' ')).toContain('conflicting');
    expect(result.errors.join(' ')).toContain('required');
    expect(result.errors.join(' ')).toContain('at least two');
  });
  it('retains every class in training and testing and keeps test vocabulary out', () => {
    const rows=[{text:'apple red',label:'fruit'},{text:'pear green',label:'fruit'},{text:'blue car',label:'vehicle'},{text:'yellow truck',label:'vehicle'}];
    const {train,test}=stratifiedSplit(rows,7,.5);
    expect(new Set(train.map(r=>r.label)).size).toBe(2);
    const model=trainMultinomialNB(train);
    expect(model.vocabulary).toEqual([...new Set(train.flatMap(r=>r.text.split(' ')))].sort());
    expect(test.length).toBe(2);
    expect(predictMultinomialNB('quasar zephyr',model).tokens).toHaveLength(0);
  });
});
