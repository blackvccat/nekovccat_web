import { redirect } from 'next/navigation'

export default function LegacyPage() {
  redirect('/my-world?app=explorer&tab=contact')
}
