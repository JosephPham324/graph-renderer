import pako from 'pako';

/**
 * Encode PlantUML text for the public server URL.
 * Algorithm: UTF-8 → raw Deflate → PlantUML's custom Base64 encoding.
 *
 * @param {string} text - The PlantUML source text
 * @returns {string} - Full URL to the SVG image on the PlantUML server
 */
export function encodePlantUML(text) {
  const data = new TextEncoder().encode(text);
  const deflated = pako.deflateRaw(data, { level: 9 });
  const encoded = encode64(deflated);
  return `https://www.plantuml.com/plantuml/svg/${encoded}`;
}

/**
 * PlantUML uses a custom Base64 alphabet:
 * 0-9 → '0'-'9'
 * 10-35 → 'A'-'Z'
 * 36-61 → 'a'-'z'
 * 62 → '-'
 * 63 → '_'
 */
function encode6bit(b) {
  if (b < 10) return String.fromCharCode(48 + b);       // '0'-'9'
  b -= 10;
  if (b < 26) return String.fromCharCode(65 + b);       // 'A'-'Z'
  b -= 26;
  if (b < 26) return String.fromCharCode(97 + b);       // 'a'-'z'
  b -= 26;
  if (b === 0) return '-';
  if (b === 1) return '_';
  return '?';
}

function append3bytes(b1, b2, b3) {
  const c1 = b1 >> 2;
  const c2 = ((b1 & 0x3) << 4) | (b2 >> 4);
  const c3 = ((b2 & 0xF) << 2) | (b3 >> 6);
  const c4 = b3 & 0x3F;
  return encode6bit(c1 & 0x3F)
    + encode6bit(c2 & 0x3F)
    + encode6bit(c3 & 0x3F)
    + encode6bit(c4 & 0x3F);
}

function encode64(data) {
  let r = '';
  const len = data.length;
  for (let i = 0; i < len; i += 3) {
    if (i + 2 === len) {
      r += append3bytes(data[i], data[i + 1], 0);
    } else if (i + 1 === len) {
      r += append3bytes(data[i], 0, 0);
    } else {
      r += append3bytes(data[i], data[i + 1], data[i + 2]);
    }
  }
  return r;
}
