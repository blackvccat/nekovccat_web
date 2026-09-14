import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import { readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = fileURLToPath(new URL('../', import.meta.url))
const require = createRequire(path.join(root, 'frontend/package.json'))
const sharp = require('sharp')
const directory = path.join(root, 'frontend/public/images')
const source = await readFile(path.join(directory, '9.png'))
const original = await sharp(source).metadata()
if (!original.width || original.width !== original.height * 2) throw new Error('Expected a 2:1 equirectangular panorama')

async function save(name, pipeline) {
  const buffer = await pipeline.toBuffer()
  const hash = createHash('sha256').update(buffer).digest('hex').slice(0, 12)
  const filename = `panorama-${name}-${hash}.webp`
  await writeFile(path.join(directory, filename), buffer)
  const { width, height } = await sharp(buffer).metadata()
  return { src: `/images/${filename}`, width, height, bytes: buffer.length }
}

// Sample the initial Three.js camera's -Z view, avoiding a distorted flat panorama poster.
const { data, info } = await sharp(source).removeAlpha().raw().toBuffer({ resolveWithObject: true })
const width = 1280
const height = 720
const poster = Buffer.alloc(width * height * 3)
const halfFov = Math.tan(75 * Math.PI / 360)
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const dx = (2 * (x + 0.5) / width - 1) * (width / height) * halfFov
    const dy = (1 - 2 * (y + 0.5) / height) * halfFov
    const distance = Math.hypot(dx, dy, 1)
    const u = ((Math.atan2(-1, -dx) / (2 * Math.PI)) + 1) % 1
    const v = Math.acos(dy / distance) / Math.PI
    const sx = u * info.width - 0.5
    const sy = Math.max(0, Math.min(info.height - 1, v * info.height - 0.5))
    const left = (Math.floor(sx) + info.width) % info.width
    const top = Math.floor(sy)
    const fx = sx - Math.floor(sx)
    const fy = sy - top
    const right = (left + 1) % info.width
    const bottom = Math.min(info.height - 1, top + 1)
    for (let channel = 0; channel < 3; channel++) {
      const pixel = (px, py) => data[(py * info.width + px) * info.channels + channel]
      poster[(y * width + x) * 3 + channel] = Math.round(
        (pixel(left, top) * (1 - fx) + pixel(right, top) * fx) * (1 - fy) +
        (pixel(left, bottom) * (1 - fx) + pixel(right, bottom) * fx) * fy,
      )
    }
  }
}

const assets = {
  preview: await save('preview', sharp(poster, { raw: { width, height, channels: 3 } }).webp({ quality: 82, effort: 6 })),
  mobile: await save('mobile', sharp(source).resize(2048, 1024).webp({ quality: 84, effort: 6 })),
  desktop: await save('desktop', sharp(source).resize(4096, 2048).webp({ quality: 86, effort: 6 })),
}
// The server page imports this manifest, so regenerating assets updates every URL together.
await writeFile(path.join(directory, 'panorama-assets.json'), `${JSON.stringify(assets, null, 2)}\n`)
console.log(JSON.stringify({ original: { bytes: source.length, width: original.width, height: original.height }, assets }, null, 2))
