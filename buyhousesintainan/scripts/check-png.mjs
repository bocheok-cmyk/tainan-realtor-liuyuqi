import fs from "fs";
const buf = fs.readFileSync("public/images/liu-yuqi-headshot.png");
const width = buf.readUInt32BE(16);
const height = buf.readUInt32BE(20);
const bitDepth = buf.readUInt8(24);
const colorType = buf.readUInt8(25);
console.log(JSON.stringify({ width, height, bitDepth, colorType, hasAlpha: colorType === 4 || colorType === 6 }));
