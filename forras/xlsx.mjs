// Minimális .xlsx-író függőség nélkül: munkalapok szöveggel és számmal, félkövér fejléccel, rögzített első sorral.
// Az .xlsx egy zip-fájl néhány XML-lel; a zipet itt rakjuk össze (deflate és CRC32 a Node beépített zlib-jéből).
import { deflateRawSync, crc32 } from 'node:zlib';

const xml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const oszlop = (i) => { let s = ''; for (i += 1; i > 0; i = Math.floor((i - 1) / 26)) s = String.fromCharCode(65 + ((i - 1) % 26)) + s; return s; };

function lapXml(sorok, szelessegek) {
  const cellak = sorok.map((sor, r) => `<row r="${r + 1}">${sor.map((v, c) => {
    if (v === null || v === undefined || v === '') return '';
    const ref = `${oszlop(c)}${r + 1}`, st = r === 0 ? ' s="1"' : '';
    return typeof v === 'number' && Number.isFinite(v) ? `<c r="${ref}"${st}><v>${v}</v></c>` : `<c r="${ref}" t="inlineStr"${st}><is><t xml:space="preserve">${xml(v)}</t></is></c>`;
  }).join('')}</row>`).join('');
  const cols = szelessegek?.length ? `<cols>${szelessegek.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('')}</cols>` : '';
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>${cols}<sheetData>${cellak}</sheetData></worksheet>`;
}

function zip(fajlok) {
  const reszek = [], kozpont = [];
  let eltolas = 0;
  for (const [nev, tartalom] of fajlok) {
    const adat = Buffer.from(tartalom, 'utf8'), tomor = deflateRawSync(adat), n = Buffer.from(nev, 'utf8'), crc = crc32(adat);
    const fej = Buffer.alloc(30);
    fej.writeUInt32LE(0x04034b50, 0); fej.writeUInt16LE(20, 4); fej.writeUInt16LE(0x0800, 6); fej.writeUInt16LE(8, 8);
    fej.writeUInt32LE(0, 10); fej.writeUInt32LE(crc, 14); fej.writeUInt32LE(tomor.length, 18); fej.writeUInt32LE(adat.length, 22); fej.writeUInt16LE(n.length, 26); fej.writeUInt16LE(0, 28);
    reszek.push(fej, n, tomor);
    const k = Buffer.alloc(46);
    k.writeUInt32LE(0x02014b50, 0); k.writeUInt16LE(20, 4); k.writeUInt16LE(20, 6); k.writeUInt16LE(0x0800, 8); k.writeUInt16LE(8, 10);
    k.writeUInt32LE(0, 12); k.writeUInt32LE(crc, 16); k.writeUInt32LE(tomor.length, 20); k.writeUInt32LE(adat.length, 24); k.writeUInt16LE(n.length, 28);
    k.writeUInt32LE(eltolas, 42);
    kozpont.push(k, n);
    eltolas += 30 + n.length + tomor.length;
  }
  const kp = Buffer.concat(kozpont), veg = Buffer.alloc(22);
  veg.writeUInt32LE(0x06054b50, 0); veg.writeUInt16LE(fajlok.length, 8); veg.writeUInt16LE(fajlok.length, 10); veg.writeUInt32LE(kp.length, 12); veg.writeUInt32LE(eltolas, 16);
  return Buffer.concat([...reszek, kp, veg]);
}

/** lapok: [{ nev, sorok: [[fejléc...], [érték...]...], szelessegek?: [szám...] }] → Buffer (.xlsx) */
export function xlsx(lapok) {
  const ns = 'http://schemas.openxmlformats.org';
  return zip([
    ['[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="${ns}/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${lapok.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('')}</Types>`],
    ['_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="${ns}/package/2006/relationships"><Relationship Id="rId1" Type="${ns}/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`],
    ['xl/workbook.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="${ns}/spreadsheetml/2006/main" xmlns:r="${ns}/officeDocument/2006/relationships"><sheets>${lapok.map((l, i) => `<sheet name="${xml(l.nev.slice(0, 31))}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets></workbook>`],
    ['xl/_rels/workbook.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="${ns}/package/2006/relationships">${lapok.map((_, i) => `<Relationship Id="rId${i + 1}" Type="${ns}/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('')}<Relationship Id="rId${lapok.length + 1}" Type="${ns}/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`],
    ['xl/styles.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="${ns}/spreadsheetml/2006/main"><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills><borders count="1"><border/></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="2"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`],
    ...lapok.map((l, i) => [`xl/worksheets/sheet${i + 1}.xml`, lapXml(l.sorok, l.szelessegek)]),
  ]);
}

/** CSV a magyar Excelnek: pontosvessző, tizedesvessző, UTF-8 BOM. */
export function csv(sorok) {
  const cella = (v) => {
    if (v === null || v === undefined) return '';
    if (typeof v === 'number') return String(v).replace('.', ',');
    const s = String(v);
    return /[;"\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return `﻿${sorok.map((s) => s.map(cella).join(';')).join('\r\n')}\r\n`;
}
