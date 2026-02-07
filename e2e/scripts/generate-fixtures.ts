/**
 * テスト用メディアフィクスチャ生成スクリプト
 * 最小有効 JPEG/MP4 ファイルを生成する
 *
 * 実行: npx tsx e2e/scripts/generate-fixtures.ts
 */

import * as fs from 'fs';
import * as path from 'path';

const BASE_DIR = path.resolve(__dirname, '../fixtures/media');

// 最小有効 JPEG (1x1 pixel, red) - 約 631 bytes
const MINIMAL_JPEG = Buffer.from(
  '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEB' +
  'AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/2wBDAQEBAQEBAQEBAQEBAQEB' +
  'AQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAAR' +
  'CAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAA' +
  'AAAAAAD/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwD' +
  'AQACEQMRAD8AP+A/4D/gP+A=',
  'base64'
);

// 最小有効 MP4 (ftyp + moov box のみ, 0 duration)
function createMinimalMp4(): Buffer {
  const parts: Buffer[] = [];

  // ftyp box
  const ftyp = Buffer.alloc(20);
  ftyp.writeUInt32BE(20, 0); // size
  ftyp.write('ftyp', 4);     // type
  ftyp.write('isom', 8);     // major_brand
  ftyp.writeUInt32BE(0x200, 12); // minor_version
  ftyp.write('isom', 16);    // compatible_brands
  parts.push(ftyp);

  // moov box with minimal content
  const mvhd = createMvhdBox();
  const trak = createTrakBox();
  const moovContent = Buffer.concat([mvhd, trak]);
  const moov = wrapBox('moov', moovContent);
  parts.push(moov);

  // mdat box (empty)
  const mdat = Buffer.alloc(8);
  mdat.writeUInt32BE(8, 0);
  mdat.write('mdat', 4);
  parts.push(mdat);

  return Buffer.concat(parts);
}

function wrapBox(type: string, content: Buffer): Buffer {
  const header = Buffer.alloc(8);
  header.writeUInt32BE(8 + content.length, 0);
  header.write(type, 4);
  return Buffer.concat([header, content]);
}

function createMvhdBox(): Buffer {
  const data = Buffer.alloc(108);
  // version=0, flags=0
  data.writeUInt32BE(0, 0);
  // creation_time, modification_time
  data.writeUInt32BE(0, 4);
  data.writeUInt32BE(0, 8);
  // timescale
  data.writeUInt32BE(1000, 12);
  // duration
  data.writeUInt32BE(0, 16);
  // rate (1.0 = 0x00010000)
  data.writeUInt32BE(0x00010000, 20);
  // volume (1.0 = 0x0100)
  data.writeUInt16BE(0x0100, 24);
  // reserved (10 bytes) + matrix (36 bytes) + pre_defined (24 bytes)
  // matrix: identity
  const matrix = [0x00010000, 0, 0, 0, 0x00010000, 0, 0, 0, 0x40000000];
  let offset = 36;
  for (const v of matrix) {
    data.writeUInt32BE(v, offset);
    offset += 4;
  }
  // next_track_ID
  data.writeUInt32BE(2, 104);
  return wrapBox('mvhd', data);
}

function createTrakBox(): Buffer {
  const tkhd = createTkhdBox();
  const mdia = createMdiaBox();
  return wrapBox('trak', Buffer.concat([tkhd, mdia]));
}

function createTkhdBox(): Buffer {
  const data = Buffer.alloc(84);
  // version=0, flags=3 (track_enabled | track_in_movie)
  data.writeUInt32BE(3, 0);
  // creation_time, modification_time
  data.writeUInt32BE(0, 4);
  data.writeUInt32BE(0, 8);
  // track_ID
  data.writeUInt32BE(1, 12);
  // reserved
  data.writeUInt32BE(0, 16);
  // duration
  data.writeUInt32BE(0, 20);
  // reserved (8 bytes)
  // layer, alternate_group
  // volume (for audio track: 0x0100)
  // matrix
  const matrix = [0x00010000, 0, 0, 0, 0x00010000, 0, 0, 0, 0x40000000];
  let offset = 40;
  for (const v of matrix) {
    data.writeUInt32BE(v, offset);
    offset += 4;
  }
  // width (320.0 = 0x01400000)
  data.writeUInt32BE(320 << 16, 76);
  // height (240.0 = 0x00F00000)
  data.writeUInt32BE(240 << 16, 80);
  return wrapBox('tkhd', data);
}

function createMdiaBox(): Buffer {
  const mdhd = createMdhdBox();
  const hdlr = createHdlrBox();
  const minf = createMinfBox();
  return wrapBox('mdia', Buffer.concat([mdhd, hdlr, minf]));
}

function createMdhdBox(): Buffer {
  const data = Buffer.alloc(24);
  // version=0, flags=0
  data.writeUInt32BE(0, 0);
  // creation_time, modification_time
  data.writeUInt32BE(0, 4);
  data.writeUInt32BE(0, 8);
  // timescale
  data.writeUInt32BE(1000, 12);
  // duration
  data.writeUInt32BE(0, 16);
  // language (und = 0x55C4)
  data.writeUInt16BE(0x55C4, 20);
  // pre_defined
  data.writeUInt16BE(0, 22);
  return wrapBox('mdhd', data);
}

function createHdlrBox(): Buffer {
  const handlerType = 'vide';
  const name = 'VideoHandler\0';
  const data = Buffer.alloc(25 + name.length);
  // version=0, flags=0
  data.writeUInt32BE(0, 0);
  // pre_defined
  data.writeUInt32BE(0, 4);
  // handler_type
  data.write(handlerType, 8);
  // reserved (12 bytes)
  // name
  data.write(name, 24);
  return wrapBox('hdlr', data);
}

function createMinfBox(): Buffer {
  // vmhd (Video Media Header)
  const vmhdData = Buffer.alloc(12);
  vmhdData.writeUInt32BE(1, 0); // version=0, flags=1
  const vmhd = wrapBox('vmhd', vmhdData);

  // dinf > dref
  const drefEntryData = Buffer.alloc(4);
  drefEntryData.writeUInt32BE(1, 0); // flags=1 (self-contained)
  const drefEntry = wrapBox('url ', drefEntryData);
  const drefData = Buffer.concat([
    Buffer.from([0, 0, 0, 0]), // version=0, flags=0
    Buffer.alloc(4), // entry_count
  ]);
  drefData.writeUInt32BE(1, 4); // entry_count = 1
  const dref = wrapBox('dref', Buffer.concat([drefData, drefEntry]));
  const dinf = wrapBox('dinf', dref);

  // stbl (Sample Table) - empty
  const stsd = createStsdBox();
  const stts = createEmptyFullBox('stts');
  const stsc = createEmptyFullBox('stsc');
  const stsz = createStszBox();
  const stco = createEmptyFullBox('stco');
  const stbl = wrapBox('stbl', Buffer.concat([stsd, stts, stsc, stsz, stco]));

  return wrapBox('minf', Buffer.concat([vmhd, dinf, stbl]));
}

function createEmptyFullBox(type: string): Buffer {
  const data = Buffer.alloc(8);
  // version=0, flags=0
  data.writeUInt32BE(0, 0);
  // entry_count = 0
  data.writeUInt32BE(0, 4);
  return wrapBox(type, data);
}

function createStszBox(): Buffer {
  const data = Buffer.alloc(12);
  // version=0, flags=0
  data.writeUInt32BE(0, 0);
  // sample_size (uniform size, 0 = variable)
  data.writeUInt32BE(0, 4);
  // sample_count = 0
  data.writeUInt32BE(0, 8);
  return wrapBox('stsz', data);
}

function createStsdBox(): Buffer {
  // AVC1 visual sample entry (simplified)
  const avc1Data = Buffer.alloc(78);
  // reserved (6 bytes)
  // data_reference_index
  avc1Data.writeUInt16BE(1, 6);
  // pre_defined, reserved...
  // width
  avc1Data.writeUInt16BE(320, 24);
  // height
  avc1Data.writeUInt16BE(240, 26);
  // horizresolution (72 dpi)
  avc1Data.writeUInt32BE(0x00480000, 28);
  // vertresolution (72 dpi)
  avc1Data.writeUInt32BE(0x00480000, 32);
  // reserved
  // frame_count
  avc1Data.writeUInt16BE(1, 40);
  // compressorname (32 bytes) - leave as zeros
  // depth
  avc1Data.writeUInt16BE(0x0018, 74);
  // pre_defined
  avc1Data.writeInt16BE(-1, 76);
  const avc1 = wrapBox('avc1', avc1Data);

  const data = Buffer.alloc(8);
  // version=0, flags=0
  data.writeUInt32BE(0, 0);
  // entry_count = 1
  data.writeUInt32BE(1, 4);
  return wrapBox('stsd', Buffer.concat([data, avc1]));
}

// --- Main ---

function ensureDir(dirPath: string) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function writeFile(filePath: string, data: Buffer) {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, data);
  console.log(`Created: ${path.relative(process.cwd(), filePath)} (${data.length} bytes)`);
}

const mp4 = createMinimalMp4();

// video-1: thumb, 1080p.mp4, 720p.mp4, 3 pictures
writeFile(path.join(BASE_DIR, 'video-1', 'thumb.jpg'), MINIMAL_JPEG);
writeFile(path.join(BASE_DIR, 'video-1', '1080p.mp4'), mp4);
writeFile(path.join(BASE_DIR, 'video-1', '720p.mp4'), mp4);
writeFile(path.join(BASE_DIR, 'video-1', 'pictures', '001.jpg'), MINIMAL_JPEG);
writeFile(path.join(BASE_DIR, 'video-1', 'pictures', '002.jpg'), MINIMAL_JPEG);
writeFile(path.join(BASE_DIR, 'video-1', 'pictures', '003.jpg'), MINIMAL_JPEG);

// video-2: thumb, 720p.mp4, 1 picture
writeFile(path.join(BASE_DIR, 'video-2', 'thumb.jpg'), MINIMAL_JPEG);
writeFile(path.join(BASE_DIR, 'video-2', '720p.mp4'), mp4);
writeFile(path.join(BASE_DIR, 'video-2', 'pictures', '001.jpg'), MINIMAL_JPEG);

// video-3: thumb only
writeFile(path.join(BASE_DIR, 'video-3', 'thumb.jpg'), MINIMAL_JPEG);

console.log('\nAll fixtures generated successfully!');
