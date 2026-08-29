import { describe, expect, it } from 'vitest';
import { validateGraph } from '../src/lib/validation';

describe('validation',()=>{
  it('removes duplicate nodes and invalid edges',()=>{
    const graph=validateGraph({course_title:'Test',concepts:[{id:'a',name:'A',description:'A',difficulty:1},{id:'a',name:'A2',description:'A2',difficulty:2},{id:'b',name:'B',description:'B',difficulty:2}],relationships:[{source:'a',target:'b',type:'prerequisite',confidence:.9},{source:'a',target:'b',type:'prerequisite',confidence:.7},{source:'b',target:'x',type:'prerequisite',confidence:.5},{source:'b',target:'b',type:'prerequisite',confidence:.5}]});
    expect(graph.concepts).toHaveLength(2); expect(graph.relationships).toHaveLength(1);
  });
});
