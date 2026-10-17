import sharp from 'sharp';
const [,, src, out, l, t, w, h] = process.argv;
await sharp(src).extract({ left: +l, top: +t, width: +w, height: +h }).jpeg({ quality: 92, mozjpeg: true }).toFile(out);
console.log('ok', out);
