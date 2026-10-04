import assert from 'node:assert/strict';
import {inflateSync} from 'node:zlib';
export function crc32(bytes){
  let crc=0xffffffff;for(const byte of bytes){crc^=byte;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0)}return (crc^0xffffffff)>>>0;
}
/** Validate actual native PNG bytes: complete chunks/CRC, header and full deflated raster scanlines. */
export function inspectPNG(bytes){
  assert.ok(Buffer.isBuffer(bytes));assert.ok(bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),'PNG signature');
  let offset=8,header,idat=false,ended=false;const compressed=[];
  while(offset<bytes.length){
    assert.ok(offset+12<=bytes.length,'Truncated PNG chunk');const length=bytes.readUInt32BE(offset),end=offset+12+length;
    assert.ok(end<=bytes.length,'Truncated PNG payload');const type=bytes.toString('ascii',offset+4,offset+8),data=bytes.subarray(offset+8,end-4);
    assert.equal(crc32(bytes.subarray(offset+4,end-4)),bytes.readUInt32BE(end-4),'PNG chunk CRC');
    if(offset===8)assert.equal(type,'IHDR','First PNG chunk must be IHDR');
    if(type==='IHDR'){
      assert.ok(!header&&length===13,'PNG IHDR');const width=data.readUInt32BE(0),height=data.readUInt32BE(4);
      assert.ok(width>0&&width<=10000&&height>0&&height<=60000,'PNG raster bounds');
      assert.equal(data[8],8,'Native PNG must use 8-bit pixels');assert.ok([2,6].includes(data[9]),'Native PNG RGB/RGBA');
      assert.deepEqual([...data.subarray(10)],[0,0,0],'PNG compression/filter/interlace');header={width,height,bitDepth:8,colorType:data[9],channels:data[9]===2?3:4};
    }else if(type==='IDAT'){assert.ok(header&&!ended);idat=true;compressed.push(data)}
    else if(type==='IEND'){assert.ok(header&&idat&&length===0,'PNG IEND');ended=true;assert.equal(end,bytes.length,'Trailing PNG bytes')}
    else assert.ok(!['PLTE'].includes(type)||!idat,'PNG chunk order');
    offset=end;
  }
  assert.ok(header&&idat&&ended,'Incomplete PNG');const stride=header.width*header.channels+1,expected=stride*header.height;
  const raster=inflateSync(Buffer.concat(compressed),{maxOutputLength:expected+1});assert.equal(raster.length,expected,'PNG full raster size');
  for(let row=0;row<header.height;row++)assert.ok(raster[row*stride]<=4,'PNG scanline filter');
  return {...header,inflatedScanlineBytes:raster.length,completeRaster:true};
}
