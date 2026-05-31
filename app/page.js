'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { RUNS_BRACKETS, abbr, teamColor, formatIST, formatDateIST, countdown, relativeTime, initials, avatarColor } from '@/lib/utils'
import { toast } from 'sonner'
import { Home as HomeIcon, Users, Trophy, User as UserIcon, ChevronLeft, ChevronRight, Check, Plus, Share2, LogOut, Copy, Settings, Send, MessageCircle, Sparkles, Lock, Clock, MapPin, X, Upload, Edit3 } from 'lucide-react'

const MAX_PTS = 80
const WINNER_PTS = 10, BAT_PTS = 20, BOWL_PTS = 20, R1_PTS = 15, R2_PTS = 15

const viewToHash = (v) => { if (v.matchId) return `#${v.name}:${v.matchId}`; if (v.groupId) return `#${v.name}:${v.groupId}`; return `#${v.name}` }
const hashToView = (h) => { const s = (h || '#home').slice(1); const [name, id] = s.split(':'); if (!name) return { name: 'home' }; if (id && (name === 'predict' || name === 'match' || name === 'admin-players' || name === 'admin-result')) return { name, matchId: id }; if (id && name === 'group') return { name, groupId: id }; return { name } }
const tabFromView = (v) => { const m = { home:'home', groups:'groups', leaderboard:'leaderboard', profile:'profile' }; return m[v.name] || null }

function App() {
  const [authReady, setAuthReady] = useState(false)
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const initView = typeof window !== 'undefined' ? hashToView(window.location.hash) : { name: 'home' }
  const [view, setView] = useState(initView)
  const [tab, setTab] = useState(tabFromView(initView) || 'home')
  const [navKey, setNavKey] = useState(0)

  useEffect(() => {
    let unsub
    ;(async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user || null)
      if (session?.user) await loadProfile(session.user.id)
      setAuthReady(true)
      const { data } = supabase.auth.onAuthStateChange(async (_ev, sess) => {
        setUser(sess?.user || null)
        if (sess?.user) await loadProfile(sess.user.id)
        else setProfile(null)
      })
      unsub = data?.subscription
    })()
    return () => { try { unsub?.unsubscribe() } catch {} }
  }, [])

  useEffect(() => {
    const handleHash = () => { const v = hashToView(window.location.hash); setView(v); setNavKey(k => k + 1); const t = tabFromView(v); if (t) setTab(t) }
    window.addEventListener('hashchange', handleHash)
    return () => window.removeEventListener('hashchange', handleHash)
  }, [])

  const loadProfile = async (uid) => { const { data } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle(); if (data) setProfile(data) }
  const refreshProfile = useCallback(async () => { if (user) await loadProfile(user.id) }, [user])
  const navigate = (v) => { setView(v); setNavKey(k => k + 1); window.location.hash = viewToHash(v) }
  const goBack = () => { window.history.back() }
  const goTab = (t) => { const v = { name: t === 'home' ? 'home' : t }; setTab(t); setView(v); setNavKey(k => k + 1); window.location.hash = viewToHash(v) }

  if (!authReady) return <SplashScreen />
  if (!user) return <LoginScreen />
  if (profile && (profile.display_name === 'Player' || !profile.display_name)) return <NameSetup user={user} onDone={refreshProfile} />

  return (
    <div className="pb-20 min-h-screen animate-fade-in">
      {view.name === 'home' && <HomeScreen key={`h-${navKey}`} user={user} navigate={navigate} />}
      {view.name === 'predict' && <PredictScreen key={`p-${navKey}`} matchId={view.matchId} user={user} navigate={navigate} goBack={goBack} />}
      {view.name === 'confirm' && <ConfirmScreen data={view.data} navigate={navigate} />}
      {view.name === 'match' && <MatchDetailScreen key={`md-${navKey}`} matchId={view.matchId} user={user} goBack={goBack} />}
      {view.name === 'groups' && <GroupsScreen key={`g-${navKey}`} user={user} navigate={navigate} />}
      {view.name === 'group' && <GroupDetailScreen key={`gd-${navKey}`} groupId={view.groupId} user={user} navigate={navigate} goBack={goBack} />}
      {view.name === 'create-group' && <CreateGroup user={user} navigate={navigate} goBack={goBack} />}
      {view.name === 'leaderboard' && <LeaderboardScreen key={`lb-${navKey}`} user={user} />}
      {view.name === 'profile' && <ProfileScreen key={`pr-${navKey}`} user={user} profile={profile} refresh={refreshProfile} navigate={navigate} />}
      {view.name === 'admin' && <AdminHome navigate={navigate} goBack={goBack} />}
      {view.name === 'admin-add' && <AdminAddMatch navigate={navigate} goBack={goBack} />}
      {view.name === 'admin-bulk' && <AdminBulkUpload goBack={goBack} />}
      {view.name === 'admin-manage' && <AdminManageMatches key={`am-${navKey}`} navigate={navigate} goBack={goBack} />}
      {view.name === 'admin-players' && <AdminPlayerOptions key={`ap-${navKey}`} matchId={view.matchId} goBack={goBack} />}
      {view.name === 'admin-result' && <AdminEnterResult key={`ar-${navKey}`} matchId={view.matchId} navigate={navigate} goBack={goBack} user={user} />}
      <BottomNav tab={tab} setTab={goTab} />
    </div>
  )
}

const SplashScreen = () => (<div className="min-h-screen flex items-center justify-center"><div className="text-center"><div className="text-3xl font-black bg-gradient-to-r from-[#10F08C] to-[#8B5CF6] bg-clip-text text-transparent">Cric Predictor</div><div className="text-[#8A92A8] mt-2 text-sm">Loading...</div></div></div>)
const TopBar = ({ onBack, title }) => (<div className="flex items-center justify-between mb-4"><button onClick={onBack} className="w-10 h-10 rounded-full bg-[#131829] border border-[#232a44] flex items-center justify-center active:scale-95"><ChevronLeft size={20}/></button><div className="font-bold">{title}</div><div className="w-10"/></div>)
const Header = () => (<div className="flex items-center justify-between mb-4"><div className="text-2xl font-black tracking-tight"><span className="bg-gradient-to-r from-[#10F08C] to-[#8B5CF6] bg-clip-text text-transparent">Cric</span> Predictor</div><div className="w-9 h-9 rounded-full bg-[#1B2138] border border-[#232a44] flex items-center justify-center"><Sparkles size={16} className="text-[#FF8C42]"/></div></div>)
const SectionTitle = ({ children }) => <h2 className="text-sm font-bold text-[#8A92A8] uppercase tracking-wider mb-3">{children}</h2>
const EmptyCard = ({ text }) => <div className="bg-[#131829] border border-[#232a44] rounded-2xl p-5 text-center text-[#8A92A8] text-sm">{text}</div>
const Row = ({ label, value }) => <div className="flex justify-between"><span className="text-[#8A92A8]">{label}</span><span className="font-semibold">{value || '\u2014'}</span></div>
const inputCls = "w-full bg-[#131829] border border-[#232a44] rounded-2xl px-4 py-3 outline-none focus:border-[#10F08C]"
const Field = ({ label, children }) => (<div><label className="text-xs font-bold text-[#8A92A8] uppercase">{label}</label><div className="mt-1">{children}</div></div>)
const Question = ({ num, title, pts, children }) => (<div className="mt-6"><div className="flex items-baseline gap-2 mb-3"><span className="text-xs font-black text-[#10F08C]">Q{num}</span><h3 className="font-bold text-lg">{title}</h3><span className="text-xs font-bold text-[#FF8C42] ml-auto">{pts} pts</span></div>{children}</div>)
const OptionRow = ({ name, selected, onClick }) => (<button onClick={onClick} className={`w-full text-left rounded-2xl px-4 py-3.5 border-2 transition active:scale-[0.98] flex items-center justify-between ${selected ? 'border-[#10F08C] bg-[#10F08C]/10' : 'border-[#232a44] bg-[#131829]'}`}><span className="font-semibold">{name}</span>{selected && <div className="w-6 h-6 rounded-full bg-[#10F08C] flex items-center justify-center"><Check size={14} className="text-[#0A0E1A]"/></div>}</button>)
const Modal = ({ children, onClose, title }) => (<div className="fixed inset-0 bg-black/70 z-50 flex items-end justify-center" onClick={onClose}><div className="w-full max-w-[480px] bg-[#131829] border-t border-[#232a44] rounded-t-3xl p-5 animate-slide-up" onClick={e => e.stopPropagation()}><div className="flex items-center justify-between mb-4"><h3 className="font-bold text-lg">{title}</h3><button onClick={onClose}><X size={20}/></button></div>{children}</div></div>)

const MatchHeader = ({ match }) => {
  const [cd, setCd] = useState(countdown(match?.locks_at))
  useEffect(() => { const t = setInterval(() => setCd(countdown(match?.locks_at)), 30000); return () => clearInterval(t) }, [match?.locks_at])
  if (!match) return null
  return (
    <div className="bg-gradient-to-br from-[#1B2138] to-[#131829] border border-[#232a44] rounded-2xl p-4">
      <div className="flex items-center justify-between"><div className="text-center flex-1"><div className="text-xl font-black" style={{color:teamColor(match.team_a)}}>{abbr(match.team_a)}</div><div className="text-[10px] text-[#8A92A8] truncate">{match.team_a}</div></div><div className="text-xs font-bold text-[#8A92A8]">VS</div><div className="text-center flex-1"><div className="text-xl font-black" style={{color:teamColor(match.team_b)}}>{abbr(match.team_b)}</div><div className="text-[10px] text-[#8A92A8] truncate">{match.team_b}</div></div></div>
      <div className="text-center mt-3 text-xs text-[#8A92A8]"><div className="flex items-center justify-center gap-1.5"><MapPin size={11}/> {match.venue}</div>
        {match.status === 'completed' ? <div className="mt-1 text-[#10F08C] font-semibold">Match Completed</div> : cd !== 'Locked' && <div className="mt-1 text-[#FF8C42] font-semibold">Locks in {cd}</div>}
      </div>
    </div>
  )
}

const BottomNav = ({ tab, setTab }) => {
  const items = [{id:'home',label:'Home',icon:HomeIcon},{id:'groups',label:'Groups',icon:Users},{id:'leaderboard',label:'Ranks',icon:Trophy},{id:'profile',label:'Profile',icon:UserIcon}]
  return (<div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] bg-[#0A0E1A]/90 backdrop-blur border-t border-[#232a44] z-40"><div className="flex items-center justify-around py-2 pb-3">{items.map(it => { const A = tab===it.id; const I = it.icon; return (<button key={it.id} onClick={() => setTab(it.id)} className={`flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition ${A?'text-[#10F08C]':'text-[#8A92A8]'}`}><I size={22} strokeWidth={A?2.5:2}/><span className="text-[10px] font-semibold">{it.label}</span></button>)})}</div></div>)
}

const LoginScreen = () => {
  const [mode, setMode] = useState('signup'); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [loading, setLoading] = useState(false); const [err, setErr] = useState('')
  useEffect(() => { if (typeof window !== 'undefined') { const m = window.location.pathname.match(/^\/join\/([a-zA-Z0-9]+)/); if (m) localStorage.setItem('pending_invite', m[1]) } }, [])
  const handleEmail = async () => { setErr(''); setLoading(true); try { if (mode === 'signup') { const { error } = await supabase.auth.signUp({ email, password }); if (error) throw error; toast.success('Account created!') } else { const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) throw error } } catch (e) { setErr(e.message) } finally { setLoading(false) } }
  const handleGoogle = async () => { setErr(''); const { error } = await supabase.auth.signInWithOAuth({ provider:'google', options:{ redirectTo: window.location.origin } }); if (error) setErr(error.message) }
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 py-10"><div className="w-full max-w-sm animate-slide-up">
      <div className="text-center mb-8"><div className="inline-flex items-center gap-2 text-4xl font-black tracking-tight"><span className="bg-gradient-to-r from-[#10F08C] to-[#8B5CF6] bg-clip-text text-transparent">Cric</span><span>Predictor</span></div><p className="text-[#8A92A8] mt-2 font-medium">Predict. Compete. Brag.</p></div>
      <button onClick={handleGoogle} className="w-full bg-white text-gray-900 font-semibold py-3.5 rounded-2xl flex items-center justify-center gap-3 active:scale-[0.98]"><svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>Continue with Google</button>
      <div className="flex items-center my-5 text-[#8A92A8] text-xs"><div className="flex-1 h-px bg-[#232a44]"/><span className="px-3">or</span><div className="flex-1 h-px bg-[#232a44]"/></div>
      <div className="space-y-3"><input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="Email" className={`${inputCls} py-3.5`}/><input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="Password" className={`${inputCls} py-3.5`}/>
        {err && <div className="text-[#FF3D8A] text-sm font-medium px-1">{err}</div>}
        <button disabled={loading||!email||!password} onClick={handleEmail} className="w-full bg-[#10F08C] text-[#0A0E1A] font-bold py-3.5 rounded-2xl disabled:opacity-40 active:scale-[0.98]">{loading ? '...' : mode==='signup' ? 'Sign Up' : 'Log In'}</button>
        <button onClick={() => { setMode(mode==='signup'?'login':'signup'); setErr('') }} className="w-full text-[#8A92A8] text-sm py-1">{mode==='signup' ? 'Already have an account? Log In' : "Don't have an account? Sign Up"}</button>
      </div>
    </div></div>
  )
}

const NameSetup = ({ user, onDone }) => {
  const [name, setName] = useState(''); const [loading, setLoading] = useState(false)
  const submit = async () => { if (!name.trim()) return; setLoading(true); const { error } = await supabase.from('profiles').update({ display_name: name.trim() }).eq('id', user.id); setLoading(false); if (error) return toast.error(error.message); const code = typeof window !== 'undefined' ? localStorage.getItem('pending_invite') : null; if (code) { const { data: g } = await supabase.from('groups').select('id').eq('invite_code', code).maybeSingle(); if (g) await supabase.from('group_members').insert({ group_id: g.id, user_id: user.id }); localStorage.removeItem('pending_invite') }; await onDone() }
  return (<div className="min-h-screen flex items-center justify-center px-6"><div className="w-full max-w-sm animate-slide-up"><h1 className="text-3xl font-black mb-2">Choose your name</h1><p className="text-[#8A92A8] mb-6">This is how friends will see you on the leaderboard.</p><input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="Your display name" className={inputCls}/><button disabled={!name.trim()||loading} onClick={submit} className="w-full mt-4 bg-[#10F08C] text-[#0A0E1A] font-bold py-3.5 rounded-2xl disabled:opacity-40 active:scale-[0.98]">Let's go</button></div></div>)
}

const HomeScreen = ({ user, navigate }) => {
  const [loading, setLoading] = useState(true); const [todayMatches, setTodayMatches] = useState([]); const [upcoming, setUpcoming] = useState([]); const [recent, setRecent] = useState([]); const [groups, setGroups] = useState([]); const [pmap, setPmap] = useState({}); const [smap, setSmap] = useState({})
  useEffect(() => { (async () => { setLoading(true); try { const now = new Date(); const s = new Date(now); s.setHours(0,0,0,0); const e = new Date(now); e.setHours(23,59,59,999)
    const [t,u,r,p,gr] = await Promise.all([supabase.from('matches').select('*').gte('scheduled_at',s.toISOString()).lte('scheduled_at',e.toISOString()).order('scheduled_at'), supabase.from('matches').select('*').eq('status','upcoming').gt('scheduled_at',e.toISOString()).order('scheduled_at').limit(5), supabase.from('matches').select('*').eq('status','completed').order('scheduled_at',{ascending:false}).limit(3), supabase.from('predictions').select('match_id').eq('user_id',user.id), supabase.from('group_members').select('group_id,groups(id,name,mode,invite_code)').eq('user_id',user.id)])
    setTodayMatches(t.data||[]); setUpcoming(u.data||[]); setRecent(r.data||[]); const pm = {}; (p.data||[]).forEach(x => pm[x.match_id]=true); setPmap(pm); setGroups((gr.data||[]).map(x=>x.groups).filter(Boolean))
    const rids = (r.data||[]).map(x=>x.id); if (rids.length) { const { data: sc } = await supabase.from('scores').select('*').eq('user_id',user.id).in('match_id',rids); const sm = {}; (sc||[]).forEach(x => sm[x.match_id]=x); setSmap(sm) } } catch(err) { console.error('Home load error:', err) } finally { setLoading(false) }
  })() }, [user.id])
  if (loading) return <div className="px-4 pt-6"><div className="h-7 w-40 shimmer rounded-lg mb-6"/><div className="h-44 shimmer rounded-3xl mb-4"/></div>
  return (<div className="px-4 pt-6"><Header/>
    <section className="mt-2"><SectionTitle>Today's Match</SectionTitle>{todayMatches.length===0?<EmptyCard text="No matches scheduled today. Check back tomorrow!"/>:todayMatches.map(m=><TodayMatchCard key={m.id} match={m} predicted={!!pmap[m.id]} navigate={navigate}/>)}</section>
    <section className="mt-7"><SectionTitle>Upcoming</SectionTitle>{upcoming.length===0?<EmptyCard text="No upcoming matches yet."/>:<div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 pb-2">{upcoming.map(m=><UpcomingCard key={m.id} match={m} navigate={navigate} predicted={!!pmap[m.id]}/>)}</div>}</section>
    <section className="mt-7"><SectionTitle>Recent Results</SectionTitle>{recent.length===0?<EmptyCard text="No completed matches yet."/>:recent.map(m=><RecentResultCard key={m.id} match={m} score={smap[m.id]} navigate={navigate}/>)}</section>
    <section className="mt-7"><SectionTitle>Your Groups</SectionTitle><div className="flex gap-3 overflow-x-auto no-scrollbar -mx-4 px-4 pb-2">{groups.map(g=><button key={g.id} onClick={()=>navigate({name:'group',groupId:g.id})} className="shrink-0 bg-gradient-to-br from-[#1B2138] to-[#131829] border border-[#232a44] rounded-2xl px-4 py-3 text-left min-w-[150px] active:scale-[0.98]"><div className="font-bold truncate">{g.name}</div><div className="text-xs text-[#8A92A8] mt-1 capitalize">{g.mode}</div></button>)}<button onClick={()=>navigate({name:'create-group'})} className="shrink-0 border border-dashed border-[#8B5CF6] text-[#8B5CF6] rounded-2xl px-4 py-3 min-w-[150px] font-semibold flex items-center justify-center gap-2 active:scale-[0.98]"><Plus size={16}/> Create Group</button></div></section>
  </div>)
}

const TodayMatchCard = ({ match, predicted, navigate }) => {
  const [cd, setCd] = useState(countdown(match.locks_at)); useEffect(() => { const t = setInterval(() => setCd(countdown(match.locks_at)), 30000); return () => clearInterval(t) }, [match.locks_at])
  const locked = new Date(match.locks_at).getTime() <= Date.now(); const completed = match.status === 'completed'; const ca = teamColor(match.team_a), cb = teamColor(match.team_b)
  return (<div className="relative rounded-3xl overflow-hidden border border-[#232a44] bg-gradient-to-br from-[#1B2138] to-[#131829] p-5 mb-3"><div className="absolute inset-0 opacity-20 pointer-events-none" style={{background:`radial-gradient(circle at 20% 30%, ${ca}40, transparent 50%), radial-gradient(circle at 80% 70%, ${cb}40, transparent 50%)`}}/><div className="relative">
    <div className="flex items-center gap-2 text-[11px] font-semibold text-[#FF8C42] uppercase mb-2"><Clock size={12}/> Today, {formatIST(match.scheduled_at)}</div>
    <div className="flex items-center gap-3 mb-3"><div className="flex-1"><div className="text-3xl font-black" style={{color:ca}}>{abbr(match.team_a)}</div><div className="text-xs text-[#8A92A8] truncate">{match.team_a}</div></div><div className="text-[#8A92A8] font-bold">VS</div><div className="flex-1 text-right"><div className="text-3xl font-black" style={{color:cb}}>{abbr(match.team_b)}</div><div className="text-xs text-[#8A92A8] truncate">{match.team_b}</div></div></div>
    <div className="flex items-center gap-1.5 text-xs text-[#8A92A8] mb-4"><MapPin size={12}/> {match.venue}</div>
    {completed?<button onClick={()=>navigate({name:'match',matchId:match.id})} className="w-full bg-[#10F08C]/10 border border-[#10F08C]/30 text-[#10F08C] font-bold py-3.5 rounded-2xl">View Result</button>
    :predicted?<div className="w-full bg-[#10F08C]/10 border border-[#10F08C]/30 text-[#10F08C] font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2"><Check size={18}/> Prediction Submitted</div>
    :locked?<div className="w-full bg-[#131829] border border-[#232a44] text-[#8A92A8] font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2"><Lock size={16}/> Predictions Locked</div>
    :<button onClick={()=>navigate({name:'predict',matchId:match.id})} className="w-full bg-[#10F08C] text-[#0A0E1A] font-black py-3.5 rounded-2xl active:scale-[0.98] flex items-center justify-center gap-2">Predict Now <ChevronRight size={18}/></button>}
    {!locked && !predicted && !completed && <div className="text-center text-xs text-[#FF8C42] font-semibold mt-2">Locks in {cd}</div>}
  </div></div>)
}

const UpcomingCard = ({ match, navigate, predicted }) => { const locked = new Date(match.locks_at).getTime()<=Date.now(); return (<button onClick={()=>!locked&&navigate({name:'predict',matchId:match.id})} className="shrink-0 w-[180px] bg-[#131829] border border-[#232a44] rounded-2xl p-4 text-left active:scale-[0.98]"><div className="text-xs text-[#FF8C42] font-semibold uppercase">{formatDateIST(match.scheduled_at)} · {formatIST(match.scheduled_at)}</div><div className="mt-2"><div className="font-bold text-base" style={{color:teamColor(match.team_a)}}>{abbr(match.team_a)}</div><div className="text-[10px] text-[#8A92A8] my-0.5">vs</div><div className="font-bold text-base" style={{color:teamColor(match.team_b)}}>{abbr(match.team_b)}</div></div><div className="mt-2 text-[11px] text-[#8A92A8] truncate">{match.venue}</div>{predicted&&<div className="mt-2 text-[10px] text-[#10F08C] font-bold flex items-center gap-1"><Check size={10}/> PREDICTED</div>}</button>) }

const RecentResultCard = ({ match, score, navigate }) => (<button onClick={()=>navigate({name:'match',matchId:match.id})} className="w-full text-left bg-[#131829] border border-[#232a44] rounded-2xl p-4 mb-3 active:scale-[0.98]"><div className="flex items-center justify-between"><div><div className="font-bold"><span style={{color:teamColor(match.team_a)}}>{abbr(match.team_a)}</span> <span className="text-[#8A92A8]">vs</span> <span style={{color:teamColor(match.team_b)}}>{abbr(match.team_b)}</span></div><div className="text-xs text-[#8A92A8] mt-1">{formatDateIST(match.scheduled_at)}</div></div><div className="text-right">{!score?<div className="text-xs text-[#8A92A8]">No prediction</div>:<><div className="text-2xl font-black text-[#10F08C]">{score.total_points}<span className="text-sm text-[#8A92A8]">/{MAX_PTS}</span></div><div className="text-[10px] text-[#8A92A8] uppercase font-semibold">points</div></>}</div></div></button>)

const PredictScreen = ({ matchId, user, navigate, goBack }) => {
  const [match, setMatch] = useState(null); const [batsmen, setBatsmen] = useState([]); const [bowlers, setBowlers] = useState([]); const [existing, setExisting] = useState(null)
  const [winner, setWinner] = useState(null); const [bat, setBat] = useState(null); const [bowl, setBowl] = useState(null); const [r1, setR1] = useState(null); const [r2, setR2] = useState(null)
  const [loading, setLoading] = useState(true); const [submitting, setSubmitting] = useState(false)
  useEffect(() => { (async () => { setLoading(true); try { const [m,o,p] = await Promise.all([supabase.from('matches').select('*').eq('id',matchId).maybeSingle(), supabase.from('player_options').select('*').eq('match_id',matchId).order('sort_order'), supabase.from('predictions').select('*').eq('match_id',matchId).eq('user_id',user.id).maybeSingle()]); setMatch(m.data); setBatsmen((o.data||[]).filter(x=>x.category==='batsman')); setBowlers((o.data||[]).filter(x=>x.category==='bowler')); setExisting(p.data) } catch(err) { console.error('Predict load error:', err) } finally { setLoading(false) } })() }, [matchId, user.id])
  const locked = match && new Date(match.locks_at).getTime() <= Date.now(); const allOk = winner && bat && bowl && r1 && r2
  const submit = async () => { setSubmitting(true); const { error } = await supabase.from('predictions').insert({ user_id:user.id, match_id:matchId, predicted_winner:winner, predicted_batsman_id:bat, predicted_bowler_id:bowl, predicted_first_innings_runs:r1, predicted_second_innings_runs:r2 }); setSubmitting(false); if (error) return toast.error(error.message); navigate({ name:'confirm', data:{ match, winner, batName:batsmen.find(b=>b.id===bat)?.player_name, bowlName:bowlers.find(b=>b.id===bowl)?.player_name, r1, r2 } }) }
  if (loading) return <div className="p-6 text-center text-[#8A92A8]">Loading...</div>
  if (!match) return <div className="p-6 text-center">Match not found.</div>
  if (locked || existing) return (
    <div className="px-4 pt-6"><TopBar onBack={goBack} title="Match"/><MatchHeader match={match}/><div className="bg-[#131829] border border-[#232a44] rounded-2xl p-6 text-center mt-6">{existing?<><Check className="mx-auto text-[#10F08C]" size={28}/><div className="font-bold mt-2">Prediction submitted</div><div className="mt-4 text-left bg-[#1B2138] rounded-2xl p-4 space-y-2 text-sm"><Row label="Winner" value={existing.predicted_winner}/><Row label="Top Batsman" value={batsmen.find(b=>b.id===existing.predicted_batsman_id)?.player_name}/><Row label="Top Bowler" value={bowlers.find(b=>b.id===existing.predicted_bowler_id)?.player_name}/><Row label="1st Innings" value={existing.predicted_first_innings_runs}/><Row label="2nd Innings" value={existing.predicted_second_innings_runs}/></div></>:<><Lock className="mx-auto text-[#FF3D8A]" size={28}/><div className="font-bold mt-2">Predictions locked</div></>}</div><MatchComments matchId={matchId} user={user}/></div>)
  return (
    <div className="px-4 pt-6 pb-40"><TopBar onBack={goBack} title="Make your picks"/><MatchHeader match={match}/>
      <Question title="Who will win?" num={1} pts={WINNER_PTS}><div className="grid grid-cols-2 gap-3">{[match.team_a,match.team_b].map(t=>{const sel=winner===t;return(<button key={t} onClick={()=>setWinner(t)} className={`relative rounded-2xl p-5 border-2 transition active:scale-[0.97] ${sel?'border-[#10F08C] bg-[#10F08C]/10':'border-[#232a44] bg-[#131829] opacity-80'}`}><div className="text-3xl font-black" style={{color:teamColor(t)}}>{abbr(t)}</div><div className="text-xs text-[#8A92A8] mt-1 truncate">{t}</div>{sel&&<div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#10F08C] flex items-center justify-center"><Check size={14} className="text-[#0A0E1A]"/></div>}</button>)})}</div></Question>
      <Question title="Who will score the most runs?" num={2} pts={BAT_PTS}>{batsmen.length===0?<EmptyCard text="Player options not yet added."/>:<div className="space-y-2">{batsmen.map(p=><OptionRow key={p.id} selected={bat===p.id} onClick={()=>setBat(p.id)} name={p.player_name}/>)}</div>}</Question>
      <Question title="Who will take the most wickets?" num={3} pts={BOWL_PTS}>{bowlers.length===0?<EmptyCard text="Player options not yet added."/>:<div className="space-y-2">{bowlers.map(p=><OptionRow key={p.id} selected={bowl===p.id} onClick={()=>setBowl(p.id)} name={p.player_name}/>)}</div>}</Question>
      <Question title="First innings runs?" num={4} pts={R1_PTS}><div className="grid grid-cols-3 gap-2">{RUNS_BRACKETS.map(b=><button key={b} onClick={()=>setR1(b)} className={`rounded-xl py-3 font-bold text-sm border-2 transition ${r1===b?'border-[#FF8C42] bg-[#FF8C42]/10 text-[#FF8C42]':'border-[#232a44] bg-[#131829]'}`}>{b}</button>)}</div></Question>
      <Question title="Second innings runs?" num={5} pts={R2_PTS}><div className="grid grid-cols-3 gap-2">{RUNS_BRACKETS.map(b=><button key={b} onClick={()=>setR2(b)} className={`rounded-xl py-3 font-bold text-sm border-2 transition ${r2===b?'border-[#8B5CF6] bg-[#8B5CF6]/10 text-[#8B5CF6]':'border-[#232a44] bg-[#131829]'}`}>{b}</button>)}</div></Question>
      <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-4 z-50"><button disabled={!allOk||submitting} onClick={submit} className="w-full bg-[#10F08C] text-[#0A0E1A] font-black py-4 rounded-2xl disabled:opacity-30 active:scale-[0.98] shadow-lg shadow-[#10F08C]/20">{submitting?'Submitting...':allOk?'Submit Prediction':`Answer all 5 (${[winner,bat,bowl,r1,r2].filter(Boolean).length}/5)`}</button></div>
    </div>)
}

const ConfirmScreen = ({ data, navigate }) => {
  const { match, winner, batName, bowlName, r1, r2 } = data || {}; const base = typeof window !== 'undefined' ? window.location.origin : ''
  const text = `I just predicted ${winner} to win ${match?.team_a} vs ${match?.team_b}! Think you can beat me? Play here: ${base}`
  return (<div className="px-4 pt-10 text-center"><div className="w-20 h-20 rounded-full bg-[#10F08C] mx-auto flex items-center justify-center animate-pop"><Check size={42} className="text-[#0A0E1A]" strokeWidth={3}/></div><h1 className="text-3xl font-black mt-5">Prediction Submitted!</h1><p className="text-[#8A92A8] mt-1">Good luck. May the cricket gods favor you.</p>
    <div className="bg-[#131829] border border-[#232a44] rounded-2xl p-5 mt-6 text-left space-y-2.5"><Row label={`Winner (${WINNER_PTS}pts)`} value={winner}/><Row label={`Top Run Scorer (${BAT_PTS}pts)`} value={batName}/><Row label={`Most Wickets (${BOWL_PTS}pts)`} value={bowlName}/><Row label={`1st Innings (${R1_PTS}pts)`} value={r1}/><Row label={`2nd Innings (${R2_PTS}pts)`} value={r2}/></div>
    <div className="mt-5 bg-gradient-to-r from-[#FF8C42]/20 to-[#FF3D8A]/20 border border-[#FF8C42]/30 rounded-2xl p-4"><div className="text-xs uppercase tracking-wider text-[#FF8C42] font-bold">Max Points Possible</div><div className="text-4xl font-black mt-1">{MAX_PTS}</div></div>
    <a href={`https://wa.me/?text=${encodeURIComponent(text)}`} target="_blank" rel="noreferrer" className="mt-5 block w-full bg-[#10F08C] text-[#0A0E1A] font-black py-4 rounded-2xl active:scale-[0.98]"><span className="flex items-center justify-center gap-2"><Share2 size={18}/> Share on WhatsApp</span></a>
    <button onClick={()=>navigate({name:'home'})} className="mt-3 w-full border border-[#232a44] py-4 rounded-2xl font-bold active:scale-[0.98]">Back to Home</button>
  </div>)
}

const MatchDetailScreen = ({ matchId, user, goBack }) => {
  const [match, setMatch] = useState(null); const [result, setResult] = useState(null); const [myScore, setMyScore] = useState(null); const [opts, setOpts] = useState([]); const [existing, setExisting] = useState(null)
  useEffect(() => { (async () => { const [m,r,s,o,p] = await Promise.all([supabase.from('matches').select('*').eq('id',matchId).maybeSingle(), supabase.from('results').select('*').eq('match_id',matchId).maybeSingle(), supabase.from('scores').select('*').eq('match_id',matchId).eq('user_id',user.id).maybeSingle(), supabase.from('player_options').select('*').eq('match_id',matchId), supabase.from('predictions').select('*').eq('match_id',matchId).eq('user_id',user.id).maybeSingle()]); setMatch(m.data); setResult(r.data); setMyScore(s.data); setOpts(o.data||[]); setExisting(p.data) })() }, [matchId, user.id])
  if (!match) return <div className="p-6 text-[#8A92A8]">Loading...</div>
  const fn = (id) => opts.find(p => p.id === id)?.player_name
  return (<div className="px-4 pt-6"><TopBar onBack={goBack} title="Match Detail"/><MatchHeader match={match}/>
    {result && <div className="bg-[#131829] border border-[#232a44] rounded-2xl p-4 mt-4 space-y-2"><div className="text-xs uppercase font-bold text-[#10F08C] mb-2">Result</div><Row label="Winner" value={result.winning_team}/><Row label="Top Batsman" value={fn(result.top_batsman_id)}/><Row label="Top Bowler" value={fn(result.top_bowler_id)}/><Row label="1st Innings" value={result.first_innings_runs}/><Row label="2nd Innings" value={result.second_innings_runs}/></div>}
    {existing && <div className="bg-[#131829] border border-[#232a44] rounded-2xl p-4 mt-3 space-y-2"><div className="text-xs uppercase font-bold text-[#8B5CF6] mb-2">Your Picks</div><Row label="Winner" value={existing.predicted_winner}/><Row label="Top Batsman" value={fn(existing.predicted_batsman_id)}/><Row label="Top Bowler" value={fn(existing.predicted_bowler_id)}/><Row label="1st Innings" value={existing.predicted_first_innings_runs}/><Row label="2nd Innings" value={existing.predicted_second_innings_runs}/></div>}
    {myScore && <div className="bg-gradient-to-r from-[#10F08C]/20 to-[#8B5CF6]/20 border border-[#10F08C]/30 rounded-2xl p-4 mt-3 text-center"><div className="text-xs uppercase font-bold text-[#10F08C]">Your Score</div><div className="text-4xl font-black mt-1">{myScore.total_points}<span className="text-lg text-[#8A92A8]">/{MAX_PTS}</span></div></div>}
    <MatchComments matchId={matchId} user={user}/>
  </div>)
}

const MatchComments = ({ matchId, user }) => {
  const [comments, setComments] = useState([]); const [msg, setMsg] = useState(''); const [loading, setLoading] = useState(true)
  const load = useCallback(async () => { setLoading(true); const { data } = await supabase.from('comments').select('id,message,created_at,user_id,profiles(display_name)').eq('match_id',matchId).order('created_at',{ascending:false}).limit(50); setComments(data||[]); setLoading(false) }, [matchId])
  useEffect(() => { load() }, [load])
  const send = async () => { if (!msg.trim()) return; const { error } = await supabase.from('comments').insert({ match_id:matchId, user_id:user.id, message:msg.trim().slice(0,500) }); if (error) return toast.error(error.message); setMsg(''); load() }
  return (<div className="mt-6 mb-4"><div className="flex items-center gap-2 mb-3"><MessageCircle size={16} className="text-[#8B5CF6]"/><h3 className="font-bold">Banter</h3></div>
    <div className="flex gap-2 mb-1"><input value={msg} onChange={e=>setMsg(e.target.value.slice(0,500))} placeholder="Grill your friends..." className="flex-1 bg-[#131829] border border-[#232a44] rounded-2xl px-4 py-2.5 outline-none focus:border-[#8B5CF6] text-sm"/><button onClick={send} disabled={!msg.trim()} className="bg-[#8B5CF6] disabled:opacity-30 rounded-2xl px-4 active:scale-95"><Send size={16}/></button></div>
    <div className="text-[10px] text-[#8A92A8] mb-2 text-right">{msg.length}/500</div>
    {loading?<div className="text-[#8A92A8] text-sm">Loading...</div>:comments.length===0?<div className="text-[#8A92A8] text-sm text-center py-4">No comments yet. Be first.</div>:<div className="space-y-2">{comments.map(c=><div key={c.id} className="bg-[#131829] border border-[#232a44] rounded-2xl p-3 flex gap-3"><div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0" style={{background:avatarColor(c.profiles?.display_name||'P')}}>{initials(c.profiles?.display_name)}</div><div className="flex-1 min-w-0"><div className="flex items-center gap-2"><span className="font-bold text-sm">{c.profiles?.display_name||'Player'}</span><span className="text-[10px] text-[#8A92A8]">{relativeTime(c.created_at)}</span></div><div className="text-sm mt-0.5 break-words">{c.message}</div></div></div>)}</div>}
  </div>)
}

const GroupsScreen = ({ user, navigate }) => {
  const [groups, setGroups] = useState([]); const [loading, setLoading] = useState(true); const [joinCode, setJoinCode] = useState(''); const [joinOpen, setJoinOpen] = useState(false)
  const load = useCallback(async () => { setLoading(true); const { data } = await supabase.from('group_members').select('groups(id,name,mode,invite_code)').eq('user_id',user.id); setGroups((data||[]).map(g=>g.groups).filter(Boolean)); setLoading(false) }, [user.id])
  useEffect(() => { load() }, [load])
  const join = async () => { if (!joinCode.trim()) return; const { data: g } = await supabase.from('groups').select('id').eq('invite_code',joinCode.trim()).maybeSingle(); if (!g) return toast.error('Invalid invite code'); const { error } = await supabase.from('group_members').insert({ group_id:g.id, user_id:user.id }); if (error) { if (String(error.message).includes('duplicate')) toast.message("You're already in this group"); else toast.error(error.message) } else toast.success('Joined!'); setJoinOpen(false); setJoinCode(''); load() }
  return (<div className="px-4 pt-6"><div className="flex items-center justify-between mb-5"><h1 className="text-2xl font-black">Groups</h1><div className="flex gap-2"><button onClick={()=>setJoinOpen(true)} className="bg-[#1B2138] border border-[#232a44] rounded-xl px-3 py-2 text-sm font-semibold active:scale-95">Join</button><button onClick={()=>navigate({name:'create-group'})} className="bg-[#10F08C] text-[#0A0E1A] rounded-xl px-3 py-2 text-sm font-bold active:scale-95 flex items-center gap-1"><Plus size={14}/> Create</button></div></div>
    {loading?<div className="text-[#8A92A8]">Loading...</div>:groups.length===0?<EmptyCard text="No groups yet. Create one or join with an invite code."/>:<div className="space-y-3">{groups.map(g=><button key={g.id} onClick={()=>navigate({name:'group',groupId:g.id})} className="w-full text-left bg-gradient-to-br from-[#1B2138] to-[#131829] border border-[#232a44] rounded-2xl p-4 active:scale-[0.98]"><div className="flex items-center justify-between"><div><div className="font-bold text-lg">{g.name}</div><div className="text-xs text-[#8A92A8] mt-1 capitalize">{g.mode}</div></div><ChevronRight size={20} className="text-[#8A92A8]"/></div></button>)}</div>}
    {joinOpen && <Modal onClose={()=>setJoinOpen(false)} title="Join Group"><input value={joinCode} onChange={e=>setJoinCode(e.target.value)} placeholder="Enter invite code" className="w-full bg-[#0A0E1A] border border-[#232a44] rounded-2xl px-4 py-3 outline-none"/><button onClick={join} className="w-full bg-[#10F08C] text-[#0A0E1A] font-bold py-3 rounded-2xl mt-3">Join</button></Modal>}
  </div>)
}

const CreateGroup = ({ user, navigate, goBack }) => {
  const [name, setName] = useState(''); const [mode, setMode] = useState('casual'); const [created, setCreated] = useState(null); const [loading, setLoading] = useState(false)
  const create = async () => { if (!name.trim()) return; setLoading(true); const { data, error } = await supabase.from('groups').insert({ name:name.trim(), mode, created_by:user.id }).select().single(); if (error) { setLoading(false); return toast.error(error.message) }; await supabase.from('group_members').insert({ group_id:data.id, user_id:user.id }); setCreated(data); setLoading(false) }
  const base = typeof window !== 'undefined' ? window.location.origin : ''; const shareText = created ? `Join my cricket prediction group '${created.name}'! ${base}/join/${created.invite_code}` : ''
  return (<div className="px-4 pt-6"><TopBar onBack={goBack} title="Create Group"/>
    {!created ? <div className="mt-4 space-y-4"><div><label className="text-xs font-bold text-[#8A92A8] uppercase">Group Name</label><input value={name} onChange={e=>setName(e.target.value)} placeholder="The Champions" className={`${inputCls} mt-2`}/></div><div><label className="text-xs font-bold text-[#8A92A8] uppercase">Mode</label><div className="grid grid-cols-2 gap-2 mt-2">{['casual','season'].map(m=><button key={m} onClick={()=>setMode(m)} className={`py-3 rounded-2xl font-bold capitalize border-2 ${mode===m?'border-[#10F08C] bg-[#10F08C]/10 text-[#10F08C]':'border-[#232a44] bg-[#131829]'}`}>{m}</button>)}</div></div><button disabled={!name.trim()||loading} onClick={create} className="w-full bg-[#10F08C] text-[#0A0E1A] font-black py-4 rounded-2xl disabled:opacity-40">Create Group</button></div>
    : <div className="mt-4 text-center"><div className="w-16 h-16 rounded-full bg-[#10F08C] mx-auto flex items-center justify-center animate-pop"><Check size={32} className="text-[#0A0E1A]" strokeWidth={3}/></div><h2 className="text-2xl font-black mt-4">Group Created!</h2><div className="bg-[#131829] border border-[#232a44] rounded-2xl p-4 mt-5"><div className="text-xs text-[#8A92A8] uppercase">Invite Code</div><div className="text-2xl font-mono font-bold tracking-widest mt-1">{created.invite_code}</div></div><button onClick={()=>{navigator.clipboard.writeText(`${base}/join/${created.invite_code}`);toast.success('Link copied!')}} className="w-full mt-4 bg-[#1B2138] border border-[#232a44] py-3 rounded-2xl font-bold flex items-center justify-center gap-2"><Copy size={16}/> Copy Invite Link</button><a href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noreferrer" className="block w-full mt-3 bg-[#10F08C] text-[#0A0E1A] py-3 rounded-2xl font-black text-center"><Share2 size={16} className="inline mr-2"/> Share on WhatsApp</a><button onClick={()=>navigate({name:'group',groupId:created.id})} className="w-full mt-3 border border-[#232a44] py-3 rounded-2xl font-bold">Go to Group</button></div>}
  </div>)
}

const GroupDetailScreen = ({ groupId, user, navigate, goBack }) => {
  const [group, setGroup] = useState(null); const [members, setMembers] = useState([]); const [lb, setLb] = useState([]); const [loading, setLoading] = useState(true)
  useEffect(() => { (async () => { setLoading(true); const [g,m,l] = await Promise.all([supabase.from('groups').select('*').eq('id',groupId).maybeSingle(), supabase.from('group_members').select('user_id,profiles(id,display_name)').eq('group_id',groupId), supabase.from('group_leaderboard').select('*').eq('group_id',groupId).order('rank')]); setGroup(g.data); setMembers(m.data||[]); setLb(l.data||[]); setLoading(false) })() }, [groupId])
  if (loading) return <div className="p-6 text-[#8A92A8]">Loading...</div>
  if (!group) return <div className="p-6">Group not found.</div>
  const base = typeof window !== 'undefined' ? window.location.origin : ''; const invite = `${base}/join/${group.invite_code}`
  return (<div className="px-4 pt-6"><TopBar onBack={goBack} title={group.name}/>
    <div className="bg-gradient-to-br from-[#1B2138] to-[#131829] border border-[#232a44] rounded-2xl p-4"><div className="flex items-center justify-between"><div><div className="text-xs uppercase text-[#8A92A8] font-bold">{group.mode} mode</div><div className="text-xl font-black mt-1">{group.name}</div><div className="text-xs text-[#8A92A8] mt-1">{members.length} members</div></div><button onClick={()=>{navigator.clipboard.writeText(invite);toast.success('Invite link copied!')}} className="bg-[#10F08C] text-[#0A0E1A] font-bold rounded-xl px-3 py-2 text-sm flex items-center gap-1"><Share2 size={14}/> Invite</button></div></div>
    <div className="mt-5"><SectionTitle>Leaderboard</SectionTitle>{lb.length===0?<EmptyCard text="No scores yet."/>:<div className="space-y-2">{lb.map(row=><div key={row.user_id} className={`flex items-center gap-3 rounded-2xl p-3 border ${row.user_id===user.id?'border-[#10F08C] bg-[#10F08C]/10':'border-[#232a44] bg-[#131829]'}`}><div className="text-lg font-black w-7 text-center" style={{color:row.rank===1?'#FF8C42':row.rank===2?'#8B5CF6':row.rank===3?'#FF3D8A':'#8A92A8'}}>{row.rank}</div><div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm" style={{background:avatarColor(row.display_name)}}>{initials(row.display_name)}</div><div className="flex-1 min-w-0"><div className="font-semibold truncate">{row.display_name}</div><div className="text-[10px] text-[#8A92A8]">{row.matches_played} matches</div></div><div className="font-black">{row.total_points}</div></div>)}</div>}</div>
  </div>)
}

const LeaderboardScreen = ({ user }) => {
  const [rows, setRows] = useState([]); const [me, setMe] = useState(null); const [loading, setLoading] = useState(true)
  useEffect(() => { (async () => { setLoading(true); const { data } = await supabase.from('global_leaderboard').select('*').order('rank').limit(50); setRows(data||[]); if (!(data||[]).find(r=>r.user_id===user.id)) { const { data: mine } = await supabase.from('global_leaderboard').select('*').eq('user_id',user.id).maybeSingle(); setMe(mine) } else setMe(null); setLoading(false) })() }, [user.id])
  return (<div className="px-4 pt-6 pb-32"><h1 className="text-2xl font-black mb-1">Leaderboard</h1><p className="text-[#8A92A8] text-sm mb-5">Top 50 predictors globally</p>
    {loading?<div className="text-[#8A92A8]">Loading...</div>:rows.length===0?<EmptyCard text="No scores yet."/>:<div className="space-y-2">{rows.map(row=><div key={row.user_id} className={`flex items-center gap-3 rounded-2xl p-3 border ${row.user_id===user.id?'border-[#10F08C] bg-[#10F08C]/10':'border-[#232a44] bg-[#131829]'}`}><div className="text-lg font-black w-8 text-center" style={{color:row.rank===1?'#FF8C42':row.rank===2?'#8B5CF6':row.rank===3?'#FF3D8A':'#8A92A8'}}>{row.rank}</div><div className="w-10 h-10 rounded-full flex items-center justify-center font-bold" style={{background:avatarColor(row.display_name)}}>{initials(row.display_name)}</div><div className="flex-1 min-w-0"><div className="font-semibold truncate">{row.display_name}</div><div className="text-[10px] text-[#8A92A8]">{row.matches_played} matches</div></div><div className="font-black text-lg">{row.total_points}</div></div>)}</div>}
    {me && <div className="fixed bottom-20 left-1/2 -translate-x-1/2 w-full max-w-[480px] px-4"><div className="bg-[#10F08C] text-[#0A0E1A] rounded-2xl p-3 flex items-center gap-3 shadow-xl"><div className="text-lg font-black w-8 text-center">{me.rank}</div><div className="flex-1 font-bold truncate">{me.display_name} (You)</div><div className="font-black text-lg">{me.total_points}</div></div></div>}
  </div>)
}

const ProfileScreen = ({ user, profile, refresh, navigate }) => {
  const [editing, setEditing] = useState(false); const [name, setName] = useState(profile?.display_name||''); const [stats, setStats] = useState({total:0,matches:0})
  useEffect(() => { (async () => { const { data: sc } = await supabase.from('scores').select('total_points').eq('user_id',user.id); const { count } = await supabase.from('predictions').select('*',{count:'exact',head:true}).eq('user_id',user.id); setStats({ total:(sc||[]).reduce((s,r)=>s+(r.total_points||0),0), matches:count||0 }) })() }, [user.id])
  const saveName = async () => { if (!name.trim()) return; await supabase.from('profiles').update({ display_name:name.trim() }).eq('id',user.id); setEditing(false); await refresh(); toast.success('Name updated') }
  return (<div className="px-4 pt-6"><h1 className="text-2xl font-black mb-5">Profile</h1>
    <div className="bg-gradient-to-br from-[#1B2138] to-[#131829] border border-[#232a44] rounded-2xl p-6 text-center"><div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center text-3xl font-black" style={{background:avatarColor(profile?.display_name)}}>{initials(profile?.display_name)}</div>{editing?<div className="mt-4 flex gap-2"><input value={name} onChange={e=>setName(e.target.value)} className="flex-1 bg-[#0A0E1A] border border-[#232a44] rounded-xl px-3 py-2 outline-none"/><button onClick={saveName} className="bg-[#10F08C] text-[#0A0E1A] rounded-xl px-3 font-bold">Save</button></div>:<button onClick={()=>{setEditing(true);setName(profile?.display_name||'')}} className="mt-3 inline-flex items-center gap-2 text-xl font-bold">{profile?.display_name} <Edit3 size={14} className="text-[#8A92A8]"/></button>}<div className="text-xs text-[#8A92A8] mt-1">{user.email}</div></div>
    <div className="grid grid-cols-2 gap-3 mt-4"><div className="bg-[#131829] border border-[#232a44] rounded-2xl p-4"><div className="text-xs uppercase text-[#8A92A8] font-bold">Total Points</div><div className="text-3xl font-black text-[#10F08C] mt-1">{stats.total}</div></div><div className="bg-[#131829] border border-[#232a44] rounded-2xl p-4"><div className="text-xs uppercase text-[#8A92A8] font-bold">Predicted</div><div className="text-3xl font-black text-[#8B5CF6] mt-1">{stats.matches}</div></div></div>
    {profile?.is_admin && <button onClick={()=>navigate({name:'admin'})} className="w-full mt-4 bg-[#1B2138] border border-[#FF8C42] text-[#FF8C42] rounded-2xl py-3 font-bold flex items-center justify-center gap-2"><Settings size={16}/> Admin Panel</button>}
    <button onClick={async()=>{await supabase.auth.signOut()}} className="w-full mt-3 bg-[#131829] border border-[#232a44] rounded-2xl py-3 font-bold text-[#FF3D8A] flex items-center justify-center gap-2"><LogOut size={16}/> Logout</button>
  </div>)
}

const AdminHome = ({ navigate, goBack }) => (<div className="px-4 pt-6"><TopBar onBack={goBack} title="Admin Panel"/><div className="space-y-3 mt-4">{[{l:'Add Match',v:'admin-add'},{l:'Bulk Upload (CSV)',v:'admin-bulk'},{l:'Manage Matches',v:'admin-manage'}].map(i=><button key={i.v} onClick={()=>navigate({name:i.v})} className="w-full bg-[#131829] border border-[#232a44] rounded-2xl p-4 flex items-center justify-between active:scale-[0.98]"><span className="font-bold">{i.l}</span><ChevronRight size={20} className="text-[#8A92A8]"/></button>)}</div></div>)

const AdminAddMatch = ({ navigate, goBack }) => {
  const [a,setA]=useState(''); const [b,setB]=useState(''); const [venue,setVenue]=useState(''); const [sched,setSched]=useState(''); const [locks,setLocks]=useState(''); const [loading,setLoading]=useState(false)
  const submit = async () => { setLoading(true); const { error } = await supabase.from('matches').insert({ team_a:a, team_b:b, venue, scheduled_at:new Date(sched).toISOString(), locks_at:new Date(locks||sched).toISOString(), status:'upcoming' }); setLoading(false); if (error) return toast.error(error.message); toast.success('Match added'); navigate({name:'admin-manage'}) }
  return (<div className="px-4 pt-6"><TopBar onBack={goBack} title="Add Match"/><div className="space-y-3 mt-4"><Field label="Team A"><input value={a} onChange={e=>setA(e.target.value)} className={inputCls}/></Field><Field label="Team B"><input value={b} onChange={e=>setB(e.target.value)} className={inputCls}/></Field><Field label="Venue"><input value={venue} onChange={e=>setVenue(e.target.value)} className={inputCls}/></Field><Field label="Scheduled At"><input type="datetime-local" value={sched} onChange={e=>{setSched(e.target.value);if(!locks)setLocks(e.target.value)}} className={inputCls}/></Field><Field label="Locks At"><input type="datetime-local" value={locks} onChange={e=>setLocks(e.target.value)} className={inputCls}/></Field><button onClick={submit} disabled={loading||!a||!b||!venue||!sched} className="w-full bg-[#10F08C] text-[#0A0E1A] font-black py-3 rounded-2xl disabled:opacity-40">Add Match</button></div></div>)
}

const AdminBulkUpload = ({ goBack }) => {
  const [rows,setRows]=useState([]); const [status,setStatus]=useState(''); const fileRef = useRef(null)
  const parse = (t) => { const ls = t.trim().split(/\r?\n/); const h = ls[0].split(',').map(x=>x.trim().toLowerCase()); const o = []; for(let i=1;i<ls.length;i++){const c=ls[i].split(',').map(x=>x.trim());const r={};h.forEach((x,j)=>r[x]=c[j]);if(r.team_a&&r.team_b&&r.scheduled_at)o.push(r)};return o }
  const onFile = async (e) => { const f=e.target.files?.[0]; if(!f)return; setRows(parse(await f.text())) }
  const importAll = async () => { let ok=0,fail=0; for(const r of rows){try{const s=new Date(r.scheduled_at).toISOString();const{error}=await supabase.from('matches').insert({team_a:r.team_a,team_b:r.team_b,venue:r.venue||'TBD',scheduled_at:s,locks_at:s,status:'upcoming'});if(error)fail++;else ok++}catch{fail++}};setStatus(`Imported ${ok}. Failed: ${fail}.`);setRows([]) }
  return (<div className="px-4 pt-6"><TopBar onBack={goBack} title="Bulk Upload"/><div className="bg-[#131829] border border-[#232a44] rounded-2xl p-4 mt-4"><div className="text-xs text-[#8A92A8] mb-3">CSV: team_a, team_b, venue, scheduled_at</div><input ref={fileRef} type="file" accept=".csv" onChange={onFile} className="hidden"/><button onClick={()=>fileRef.current?.click()} className="w-full bg-[#1B2138] border-2 border-dashed border-[#8B5CF6] text-[#8B5CF6] py-6 rounded-2xl font-bold flex items-center justify-center gap-2"><Upload size={18}/> Choose CSV</button></div>{rows.length>0&&<><div className="mt-4 space-y-2">{rows.map((r,i)=><div key={i} className="bg-[#131829] border border-[#232a44] rounded-xl p-3 text-sm"><div className="font-bold">{r.team_a} vs {r.team_b}</div><div className="text-xs text-[#8A92A8]">{r.venue} · {r.scheduled_at}</div></div>)}</div><button onClick={importAll} className="w-full mt-4 bg-[#10F08C] text-[#0A0E1A] font-black py-3 rounded-2xl">Import All ({rows.length})</button></>}{status&&<div className="mt-4 text-center text-[#10F08C] font-bold">{status}</div>}</div>)
}

const AdminManageMatches = ({ navigate, goBack }) => {
  const [matches,setMatches]=useState([]); const [loading,setLoading]=useState(true)
  useEffect(() => { (async()=>{setLoading(true);const{data,error}=await supabase.from('matches').select('*').order('scheduled_at',{ascending:false});if(error){console.error(error);toast.error(error.message)};setMatches(data||[]);setLoading(false)})() }, [])
  if(loading) return <div className="px-4 pt-6"><TopBar onBack={goBack} title="Manage Matches"/><div className="text-[#8A92A8] text-center mt-10">Loading...</div></div>
  return (<div className="px-4 pt-6"><TopBar onBack={goBack} title="Manage Matches"/>{matches.length===0?<EmptyCard text="No matches yet."/>:<div className="space-y-3 mt-2">{matches.map(m=><div key={m.id} className="bg-[#131829] border border-[#232a44] rounded-2xl p-4"><div className="font-bold">{m.team_a} vs {m.team_b}</div><div className="text-xs text-[#8A92A8]">{formatDateIST(m.scheduled_at)} {formatIST(m.scheduled_at)} · <span className="capitalize">{m.status}</span></div><div className="flex gap-2 mt-3"><button onClick={()=>navigate({name:'admin-players',matchId:m.id})} className="flex-1 bg-[#1B2138] border border-[#232a44] rounded-xl py-2 text-sm font-semibold">Players</button>{m.status!=='completed'&&<button onClick={()=>navigate({name:'admin-result',matchId:m.id})} className="flex-1 bg-[#10F08C] text-[#0A0E1A] rounded-xl py-2 text-sm font-bold">Result</button>}</div></div>)}</div>}</div>)
}

const AdminPlayerOptions = ({ matchId, goBack }) => {
  const [options,setOptions]=useState([]); const [batNames,setBatNames]=useState(['','','','']); const [bowlNames,setBowlNames]=useState(['','','','']); const [saving,setSaving]=useState(false)
  const load = useCallback(async()=>{const{data}=await supabase.from('player_options').select('*').eq('match_id',matchId).order('sort_order');setOptions(data||[])}, [matchId])
  useEffect(()=>{load()}, [load])
  const saveCategory = async (cat) => {
    const names = cat==='batsman'?batNames:bowlNames; const filled = names.filter(n=>n.trim())
    if(filled.length!==4){toast.error('Enter all 4 player names');return}
    setSaving(true); const rows = filled.map((n,i)=>({match_id:matchId,category:cat,player_name:n.trim(),sort_order:i+1})); rows.push({match_id:matchId,category:cat,player_name:'Others',sort_order:5})
    const{error}=await supabase.from('player_options').insert(rows); setSaving(false)
    if(error){toast.error(error.message);console.error(error);return}
    toast.success('Saved!'); if(cat==='batsman')setBatNames(['','','','']);else setBowlNames(['','','','']); load()
  }
  const remove = async(id)=>{await supabase.from('player_options').delete().eq('id',id);load()}
  const exBat=options.filter(o=>o.category==='batsman'); const exBowl=options.filter(o=>o.category==='bowler')
  return (<div className="px-4 pt-6"><TopBar onBack={goBack} title="Player Options"/>
    <div className="bg-[#131829] border border-[#232a44] rounded-2xl p-4 mt-4"><h3 className="font-bold mb-3">Batsmen</h3>{exBat.length>0?<div className="space-y-2">{exBat.map(o=><div key={o.id} className="flex items-center justify-between bg-[#0A0E1A] rounded-xl px-3 py-2 text-sm"><span>{o.sort_order}. {o.player_name}</span><button onClick={()=>remove(o.id)} className="text-[#FF3D8A]"><X size={14}/></button></div>)}</div>:<>{batNames.map((v,i)=><input key={`b${i}`} value={v} onChange={e=>{const c=[...batNames];c[i]=e.target.value;setBatNames(c)}} placeholder={`Player ${i+1}`} className={`${inputCls} mb-2`}/>)}<div className="text-xs text-[#8A92A8] mb-2">"Others" auto-added as 5th.</div><button onClick={()=>saveCategory('batsman')} disabled={saving} className="w-full bg-[#10F08C] text-[#0A0E1A] py-2 rounded-xl font-bold disabled:opacity-40">Save Batsmen</button></>}</div>
    <div className="bg-[#131829] border border-[#232a44] rounded-2xl p-4 mt-4"><h3 className="font-bold mb-3">Bowlers</h3>{exBowl.length>0?<div className="space-y-2">{exBowl.map(o=><div key={o.id} className="flex items-center justify-between bg-[#0A0E1A] rounded-xl px-3 py-2 text-sm"><span>{o.sort_order}. {o.player_name}</span><button onClick={()=>remove(o.id)} className="text-[#FF3D8A]"><X size={14}/></button></div>)}</div>:<>{bowlNames.map((v,i)=><input key={`w${i}`} value={v} onChange={e=>{const c=[...bowlNames];c[i]=e.target.value;setBowlNames(c)}} placeholder={`Player ${i+1}`} className={`${inputCls} mb-2`}/>)}<div className="text-xs text-[#8A92A8] mb-2">"Others" auto-added as 5th.</div><button onClick={()=>saveCategory('bowler')} disabled={saving} className="w-full bg-[#10F08C] text-[#0A0E1A] py-2 rounded-xl font-bold disabled:opacity-40">Save Bowlers</button></>}</div>
  </div>)
}

const AdminEnterResult = ({ matchId, navigate, goBack, user }) => {
  const [match,setMatch]=useState(null); const [batsmen,setBatsmen]=useState([]); const [bowlers,setBowlers]=useState([])
  const [winner,setWinner]=useState(''); const [bat,setBat]=useState(''); const [bowl,setBowl]=useState(''); const [r1,setR1]=useState(''); const [r2,setR2]=useState('')
  const [count,setCount]=useState(0); const [done,setDone]=useState(false); const [submitting,setSubmitting]=useState(false)
  useEffect(()=>{(async()=>{const[m,o]=await Promise.all([supabase.from('matches').select('*').eq('id',matchId).maybeSingle(),supabase.from('player_options').select('*').eq('match_id',matchId).order('sort_order')]);setMatch(m.data);setBatsmen((o.data||[]).filter(x=>x.category==='batsman'));setBowlers((o.data||[]).filter(x=>x.category==='bowler'))})()}, [matchId])
  const submit = async()=>{if(!winner||!bat||!bowl||!r1||!r2)return toast.error('Fill all fields');setSubmitting(true);const{error}=await supabase.from('results').insert({match_id:matchId,winning_team:winner,top_batsman_id:bat,top_bowler_id:bowl,first_innings_runs:r1,second_innings_runs:r2,entered_by:user.id});if(error){setSubmitting(false);return toast.error(error.message)};await supabase.from('matches').update({status:'completed'}).eq('id',matchId);const{count:c}=await supabase.from('scores').select('*',{count:'exact',head:true}).eq('match_id',matchId);setCount(c||0);setDone(true);setSubmitting(false);toast.success('Result saved!')}
  if(!match)return<div className="p-6 text-[#8A92A8]">Loading...</div>
  if(done)return(<div className="px-4 pt-6"><TopBar onBack={goBack} title="Result Saved"/><div className="text-center py-10"><div className="w-16 h-16 rounded-full bg-[#10F08C] mx-auto flex items-center justify-center animate-pop"><Check size={32} className="text-[#0A0E1A]" strokeWidth={3}/></div><h2 className="text-2xl font-black mt-4">Result Saved</h2><p className="text-[#8A92A8] mt-1">Scores calculated for {count} users.</p><button onClick={()=>navigate({name:'admin-manage'})} className="mt-6 bg-[#10F08C] text-[#0A0E1A] font-bold px-6 py-3 rounded-2xl">Back to matches</button></div></div>)
  return(<div className="px-4 pt-6 pb-10"><TopBar onBack={goBack} title="Enter Result"/><div className="mt-3 text-sm text-[#8A92A8]">{match.team_a} vs {match.team_b}</div><div className="space-y-3 mt-4"><Field label="Winning Team"><select value={winner} onChange={e=>setWinner(e.target.value)} className={inputCls}><option value="">Select</option><option value={match.team_a}>{match.team_a}</option><option value={match.team_b}>{match.team_b}</option></select></Field><Field label="Top Batsman"><select value={bat} onChange={e=>setBat(e.target.value)} className={inputCls}><option value="">Select</option>{batsmen.map(b=><option key={b.id} value={b.id}>{b.player_name}</option>)}</select></Field><Field label="Top Bowler"><select value={bowl} onChange={e=>setBowl(e.target.value)} className={inputCls}><option value="">Select</option>{bowlers.map(b=><option key={b.id} value={b.id}>{b.player_name}</option>)}</select></Field><Field label="1st Innings Runs"><select value={r1} onChange={e=>setR1(e.target.value)} className={inputCls}><option value="">Select</option>{RUNS_BRACKETS.map(b=><option key={b} value={b}>{b}</option>)}</select></Field><Field label="2nd Innings Runs"><select value={r2} onChange={e=>setR2(e.target.value)} className={inputCls}><option value="">Select</option>{RUNS_BRACKETS.map(b=><option key={b} value={b}>{b}</option>)}</select></Field><button onClick={submit} disabled={submitting} className="w-full bg-[#10F08C] text-[#0A0E1A] font-black py-3 rounded-2xl disabled:opacity-40">{submitting?'Saving...':'Submit Result'}</button></div></div>)
}

export default App
