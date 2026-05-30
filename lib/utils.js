export const RUNS_BRACKETS = ['<160', '160-180', '180-200', '200-220', '220+']

export function abbr(team) {
  if (!team) return ''
  const words = team.trim().split(/\s+/)
  if (words.length >= 2) return (words[0][0] + words[1][0] + (words[2]?.[0] || '')).toUpperCase().slice(0, 3)
  return team.slice(0, 3).toUpperCase()
}

export function teamColor(team) {
  if (!team) return '#8B5CF6'
  const colors = ['#FF8C42', '#10F08C', '#8B5CF6', '#FF3D8A', '#3B82F6', '#EAB308', '#06B6D4', '#EF4444']
  let h = 0
  for (let i = 0; i < team.length; i++) h = (h * 31 + team.charCodeAt(i)) >>> 0
  return colors[h % colors.length]
}

export function formatIST(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const opts = { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Kolkata' }
  return d.toLocaleTimeString('en-IN', opts) + ' IST'
}

export function formatDateIST(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', timeZone: 'Asia/Kolkata' })
}

export function isToday(ts) {
  if (!ts) return false
  const d = new Date(ts)
  const now = new Date()
  const ist = new Date(d.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  const nowIst = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }))
  return ist.getFullYear() === nowIst.getFullYear() && ist.getMonth() === nowIst.getMonth() && ist.getDate() === nowIst.getDate()
}

export function countdown(ts) {
  if (!ts) return ''
  const diff = new Date(ts).getTime() - Date.now()
  if (diff <= 0) return 'Locked'
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  if (h > 24) return `${Math.floor(h / 24)}d ${h % 24}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

export function relativeTime(ts) {
  if (!ts) return ''
  const diff = Date.now() - new Date(ts).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m} min ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  return `${d}d ago`
}

export function initials(name) {
  if (!name) return '?'
  return name.trim()[0].toUpperCase()
}

export function avatarColor(name) {
  return teamColor(name || 'P')
}
