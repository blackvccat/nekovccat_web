import assert from 'node:assert/strict'
import test from 'node:test'
import { NOTES_MAX, createNoteId, noteLabel, restoreSavedNotes, type SavedNote } from '../src/lib/desktop-notes'

const note = (over: Partial<SavedNote> = {}): SavedNote => ({ id: 'note-1', title: '标题', body: '正文', updatedAt: 1_700_000_000_000, ...over })

test('保存列表只信任自己写进去的形状，坏数据整条丢掉', () => {
  const result = restoreSavedNotes([
    null, 'x', 3, [], {}, { id: 'note-1' }, { id: 'note-1', body: 5 },
    { id: 'note-empty', body: '   \n  ' },
    { id: 'note-1', body: '好的一条', title: 7, updatedAt: 'yesterday' },
    { id: 'note-1', body: '重复的 id' },
    { id: 'note-2', body: '第二条', title: '标题', updatedAt: 1_700_000_000_001 },
  ])
  assert.deepEqual(result.map(item => item.id), ['note-1', 'note-2'])
  assert.equal(result[0].body, '好的一条')
  assert.equal(result[0].title, '', '标题不是字符串就当没写')
  assert.equal(result[0].updatedAt, 0, '时间不可信时置 0，界面上显示「时间未知」')
  assert.equal(result[1].updatedAt, 1_700_000_000_001)
})

test('条数、长度与换行都收得住', () => {
  const many = restoreSavedNotes(Array.from({ length: 100 }, (_, index) => ({ id: `note-${index}`, body: `第 ${index} 条` })))
  assert.equal(many.length, NOTES_MAX)
  const long = restoreSavedNotes([{ id: 'note-long', body: 'a'.repeat(30000), title: '标'.repeat(99) }])
  assert.equal(long[0].body.length, 20000)
  assert.equal(Array.from(long[0].title).length, 60)
  const messy = restoreSavedNotes([{ id: 'note-messy', body: '第一行\r\n第二行\u0000\u0007尾巴' }])
  assert.equal(messy[0].body, '第一行\n第二行尾巴')
  assert.deepEqual(restoreSavedNotes(null), [])
  assert.deepEqual(restoreSavedNotes({ notes: [] }), [])
})

test('列表里显示的名字优先用标题，其次正文第一行', () => {
  assert.equal(noteLabel(note({ title: '  晚上的想法  ' })), '晚上的想法')
  assert.equal(noteLabel(note({ title: '   ', body: '\n\n  第一行有字  \n第二行' })), '第一行有字')
  assert.equal(noteLabel(note({ title: '', body: '🎵'.repeat(60) })), '🎵'.repeat(40))
  assert.equal(noteLabel(note({ title: '', body: '\n\n  ' })), '无标题')
})

test('每一条便签的 id 都不一样', () => {
  const ids = new Set(Array.from({ length: 50 }, () => createNoteId()))
  assert.equal(ids.size, 50)
  for (const id of ids) assert.match(id, /^note-[A-Za-z0-9-]+$/)
})
