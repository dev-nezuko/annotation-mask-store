const test = require('node:test');
const assert = require('node:assert/strict');
const {validateSegmentation} = require('../dist/validation/segmentation');
const {computeSegmentationArea} = require('../dist/utils/area');
const app = require('../dist/app').default;

test('RLE sums foreground runs for a complete mask', () => {
  const mask = validateSegmentation({type:'rle',size:[2,3],counts:[1,2,2,1]});
  assert.equal(computeSegmentationArea(mask),3);
});
test('RLE rejects incomplete, oversized and unsafe run totals', () => {
  for(const counts of [[1,2],[0,7],[Number.MAX_SAFE_INTEGER+1]]) {
    assert.throws(()=>validateSegmentation({type:'rle',size:[2,3],counts}));
  }
  assert.throws(()=>validateSegmentation({type:'rle',size:[Number.MAX_SAFE_INTEGER,2],counts:[0]}));
});
test('polygon holes subtract from the outer area', () => {
  const mask=validateSegmentation({type:'polygon',polygons:[{rings:[[[0,0],[4,0],[4,4],[0,4]],[[1,1],[2,1],[2,2],[1,2]]]}]});
  assert.equal(computeSegmentationArea(mask),15);
});
test('polygon rejects nonfinite coordinates and short rings', () => {
  for(const ring of [[[0,0],[1,0]],[[0,0],[Infinity,0],[0,1]]]) {
    assert.throws(()=>validateSegmentation({type:'polygon',polygons:[{rings:[ring]}]}));
  }
});
test('HTTP rejects query operators and invalid pagination before querying MongoDB', async () => {
  const server=app.listen(0,'127.0.0.1');
  await new Promise(resolve=>server.once('listening',resolve));
  const url='http://127.0.0.1:'+server.address().port;
  try {
    for(const query of ['label[$ne]=x','label=a&label=b','page=no','page=0','limit=101','page=9007199254740991&limit=100']) {
      const response=await fetch(url+'/api/annotations?'+query);
      assert.equal(response.status,400,query);
    }
    assert.equal((await fetch(url+'/api/health')).status,200);
  } finally { await new Promise(resolve=>server.close(resolve)); }
});
