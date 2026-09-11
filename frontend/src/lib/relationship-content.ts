export interface RelationshipContent {
  watermark: string
  title: string
  letter: { title: string; summary: string; toolbar: string; paragraphs: string[] }
  bond: { title: string; lines: string[] }
  startDate: string
  wishesIntro: string
  defaultWishes: string[]
  footer: string
}
