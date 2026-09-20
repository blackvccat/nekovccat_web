// 应用跑在同源 iframe 里，用相对路径直接访问「转发口」——凭据始终留在宿主 Cookie，应用拿不到。
// shell 地址是 /api/visitor/app-proxy/apps/<id>/shell，所以相对路径都落在同一个前缀下：
//   data            → 读全部键值
//   data/<key>      → PUT 写一个键
//   files           → 列出已上传文件
//   files/<name>    → PUT 上传 / GET 下载 / DELETE 删除

const statusNode = document.getElementById('status')

async function loadNote() {
  const response = await fetch('data', { cache: 'no-store' })
  if (!response.ok) return
  const { data } = await response.json()
  document.getElementById('note').value = typeof data.note === 'string' ? data.note : ''
}

async function saveNote() {
  const note = document.getElementById('note').value
  const response = await fetch('data/note', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(note),
  })
  statusNode.textContent = response.ok ? '已保存到服务器' : '保存失败'
}

async function listFiles() {
  const response = await fetch('files', { cache: 'no-store' })
  if (!response.ok) return
  const { files } = await response.json()
  const list = document.getElementById('files')
  list.replaceChildren()
  for (const file of files) {
    const item = document.createElement('li')
    const link = document.createElement('a')
    link.href = `files/${encodeURIComponent(file.name)}`
    link.textContent = `${file.name}（${file.size} 字节）`
    const remove = document.createElement('button')
    remove.type = 'button'
    remove.textContent = '删除'
    remove.addEventListener('click', async () => {
      await fetch(`files/${encodeURIComponent(file.name)}`, { method: 'DELETE' })
      await listFiles()
    })
    item.append(link, remove)
    list.append(item)
  }
}

async function upload(file) {
  const response = await fetch(`files/${encodeURIComponent(file.name)}`, { method: 'PUT', body: file })
  statusNode.textContent = response.ok ? '已上传' : '上传失败'
  await listFiles()
}

document.getElementById('save').addEventListener('click', saveNote)
document.getElementById('upload').addEventListener('change', event => {
  const file = event.target.files && event.target.files[0]
  if (file) upload(file)
})

loadNote()
listFiles()
