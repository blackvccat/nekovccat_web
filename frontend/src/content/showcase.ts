export type ShowcaseKind = 'video' | 'image'

export interface ShowcasePiece {
  id: string
  /** 主站展厅里的编号，例如 N° 01 */
  num: string
  title: string
  desc: string
  /** 主站展厅的调性标注，例如 ratio 3:2 · 纯五度 */
  ratio: string
  kind: ShowcaseKind
  /** 相对主站根目录的媒体路径 */
  src: string
  poster?: string
  thumbnail: string
  width: number
  height: number
}

export const SHOWCASE_ORIGIN = 'https://example.com'

/** 主站「共鸣」展厅的完整入口，更多作品都在那里。 */
export const SHOWCASE_URL = `${SHOWCASE_ORIGIN}/index.html#/showcase`

/**
 * 主站「共鸣 · RESONANCE 10²–10⁴ Hz」展厅中挑选出来的一部分画框。
 * 标题、简介与调性标注与主站展厅保持一致，缩略图已转存为本地 WebP。
 */
export const SHOWCASE_GALLERY: ShowcasePiece[] = [
  {
    id: 'blood', num: 'N° 01', kind: 'video',
    title: '维克多. 崔《Группа крови》片段',
    desc: '在迷乱与眩晕中对维克多. 崔《Группа крови》片段进行了简陋的翻弹',
    ratio: 'ratio 3:2 · 纯五度',
    src: 'assets/obj/blood.mp4', poster: 'assets/img/blood.png',
    thumbnail: '/images/showcase/blood.webp', width: 800, height: 510,
  },
  {
    id: 'cat', num: 'N° 02', kind: 'image',
    title: '猫咪逐帧行走动画',
    desc: '针对特定图像序列中猫咪运动姿态进行了优化，确保左后腿在身体纵深阴影中拥有自然的运动弧度与视觉层次。',
    ratio: 'ratio 4:3 · 纯四度',
    src: 'assets/img/showcase-cat.gif',
    thumbnail: '/images/showcase/showcase-cat.webp', width: 800, height: 364,
  },
  {
    id: 'dr', num: 'N° 03', kind: 'video',
    title: 'Major Kong — 如何学会停止恐惧并爱上炸弹',
    desc: '这枚大家伙不是灾难，它是工业文明最完美的硬件故障。',
    ratio: 'ratio 4:3 · 纯四度',
    src: 'assets/obj/dr.mp4', poster: 'assets/img/dr.png',
    thumbnail: '/images/showcase/dr.webp', width: 800, height: 473,
  },
  {
    id: 'merry', num: 'N° 04', kind: 'video',
    title: '坂本龙一《Merry Christmas Mr.Lawrence》',
    desc: '完成了5 分 20秒的翻弹，对坂本龙一《Merry Christmas Mr.Lawrence》进行了拙劣简陋的模仿',
    ratio: 'ratio 3:2 · 纯五度',
    src: 'assets/obj/merry.mp4', poster: 'assets/img/merry.png',
    thumbnail: '/images/showcase/merry.webp', width: 800, height: 417,
  },
  {
    id: 'uee', num: 'N° 05', kind: 'video',
    title: 'STAR CITIZEN — UEE NAVY',
    desc: '当受到召唤时，你会回应吗?',
    ratio: 'ratio 4:3 · 纯四度',
    src: 'assets/obj/uee.mp4', poster: 'assets/img/uee.png',
    thumbnail: '/images/showcase/uee.webp', width: 800, height: 450,
  },
  {
    id: 'opus', num: 'N° 06', kind: 'video',
    title: '海鸥演奏 坂本龙一《Opus》',
    desc: '拙劣简陋的翻弹，此刻我只是远洋港口集装箱码头上的一只海鸥，站在栏杆上眺望远方的海平面，想着等会去哪儿整点薯条。',
    ratio: 'ratio 3:2 · 纯五度',
    src: 'assets/obj/opus.mp4', poster: 'assets/img/opus.png',
    thumbnail: '/images/showcase/opus.webp', width: 800, height: 423,
  },
  {
    id: 'sea', num: 'N° 07', kind: 'video',
    title: '海鸥的黄昏行鸥记录仪',
    desc: '人类真是一种充满仪式感的荒谬生物，他们跨越几百公里脱掉鞋子踩在湿漉漉的泥沙里，就为了盯着那抹正在死去的、毫无实用价值的粉红色晚霞。',
    ratio: 'ratio 2:1 · 八度',
    src: 'assets/obj/sea.mp4', poster: 'assets/img/sea.png',
    thumbnail: '/images/showcase/sea.webp', width: 800, height: 424,
  },
  {
    id: 'vertigo', num: 'N° 08', kind: 'video',
    title: '海鸥与Vertigo',
    desc: '世界正在天旋地转，所有的霓虹灯都在我眼里融化成了一锅沸腾的浓汤，人类的悲欢五花八门，而挨饿的眩晕，全是碳水的重影。',
    ratio: 'ratio 2:1 · 八度',
    src: 'assets/obj/vertigo.mp4', poster: 'assets/img/vertigo.png',
    thumbnail: '/images/showcase/vertigo.webp', width: 800, height: 427,
  },
]

/** 与主站展厅每一条目相同的播放页地址。 */
export function showcaseLink(piece: ShowcasePiece) {
  const params = [
    `type=${piece.kind}`,
    `src=${encodeURIComponent(piece.src)}`,
    ...(piece.poster ? [`poster=${encodeURIComponent(piece.poster)}`] : []),
    `title=${encodeURIComponent(piece.title)}`,
    `desc=${encodeURIComponent(piece.desc)}`,
  ]
  return `${SHOWCASE_ORIGIN}/player.html?${params.join('&')}`
}
