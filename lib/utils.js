export const RUNS_BRACKETS = ['<160','160-180','180-200','200-220','220+']

const TEAM_COLORS = { CSK:'#FDB913', MI:'#004BA0', RCB:'#EC1C24', KKR:'#3A225D', DC:'#004C93', PBKS:'#DD1F2D', RR:'#EA1A85', SRH:'#F7A721', GT:'#1C1C2B', LSG:'#ACE5F3' }
const TEAM_ABBRS = { 'Chennai Super Kings':'CSK','Mumbai Indians':'MI','Royal Challengers Bengaluru':'RCB','Royal Challengers Bangalore':'RCB','Kolkata Knight Riders':'KKR','Delhi Capitals':'DC','Punjab Kings':'PBKS','Rajasthan Royals':'RR','Sunrisers Hyderabad':'SRH','Gujarat Titans':'GT','Lucknow Super Giants':'LSG' }
export const abbr = (t) => TEAM_ABBRS[t] || t?.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,3) || '???'
export const teamColor = (t) => { const a = TEAM_ABBRS[t]; return (a && TEAM_COLORS[a]) || '#8A92A8' }

export const formatIST = (d) => { try { return new Date(d).toLocaleTimeString('en-IN',{ hour:'numeric', minute:'2-digit', hour12:true, timeZone:'Asia/Kolkata' }) } catch { return '' } }
export const formatDateIST = (d) => { try { return new Date(d).toLocaleDateString('en-IN',{ day:'numeric', month:'short', timeZone:'Asia/Kolkata' }) } catch { return '' } }

export const countdown = (lockTime) => {
  if (!lockTime) return 'Locked'
  const diff = new Date(lockTime).getTime() - Date.now()
  if (diff <= 0) return 'Locked'
  const d = Math.floor(diff/86400000), h = Math.floor((diff%86400000)/3600000), m = Math.floor((diff%3600000)/60000)
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

export const relativeTime = (d) => {
  const diff = Date.now() - new Date(d).getTime()
  const m = Math.floor(diff/60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m/60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h/24)}d ago`
}

export const initials = (n) => (n || 'P').split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2)
export const avatarColor = (n) => { const colors = ['#10F08C','#8B5CF6','#FF8C42','#FF3D8A','#3B82F6','#F59E0B','#EF4444','#06B6D4']; let h = 0; const s = n || 'P'; for(let i=0;i<s.length;i++) h = s.charCodeAt(i)+((h<<5)-h); return colors[Math.abs(h)%colors.length] }
