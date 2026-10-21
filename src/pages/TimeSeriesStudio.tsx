import { useId, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, ArrowRight, ChartColumn, Search } from 'lucide-react';
import { studioItems } from '../data/studios';
import './TimeSeriesStudio.css';

const summaries = [
  'Smooth a series with a rolling window to reveal the trend.',
  'Weight recent observations more heavily with a single decay factor.',
  'Triple exponential smoothing for level, trend and seasonality together.',
  'Combine autoregression, differencing and moving-average errors.',
  'Spot points that break the expected temporal pattern.',
  'Train a recurrent net in the browser to predict the next values.',
  'Use LSTM memory cells for longer-horizon sequence forecasting.',
  'A lighter gated recurrent forecaster that trains faster than LSTM.',
];
function SeriesArt({ index }: { index: number }) {
  const id = useId().replace(/:/g, '');
  const curve = (offset: number, amp = 18) => Array.from({ length: 31 }, (_, n) => `${n ? 'L' : 'M'}${18+n*9.4},${135-n*1.8+Math.sin(n*.65+offset)*amp}`).join(' ');
  const neural = index > 4;
  return <svg className="ts-art" viewBox="0 0 320 200" aria-hidden="true">
    <defs>
      <linearGradient id={`${id}glass`} x2=".8" y2="1"><stop stopColor="#287bff" stopOpacity=".8"/><stop offset=".5" stopColor="#102e70" stopOpacity=".8"/><stop offset="1" stopColor="#08162e"/></linearGradient>
      <linearGradient id={`${id}area`} x2="0" y2="1"><stop stopColor="#795dff" stopOpacity=".65"/><stop offset="1" stopColor="#514aff" stopOpacity="0"/></linearGradient>
      <filter id={`${id}glow`} x="-50%" y="-80%" width="200%" height="260%"><feGaussianBlur stdDeviation="3"/></filter>
      <pattern id={`${id}grid`} width="23" height="23" patternUnits="userSpaceOnUse"><path d="M23 0H0V23" fill="none" stroke="#3189ff" strokeOpacity=".2" strokeWidth=".6"/></pattern>
    </defs>
    <rect x="12" y="30" width="296" height="155" fill={`url(#${id}grid)`}/>
    <path d="M0 186L320 166M0 198L320 175M25 180L0 200M100 176L78 200M190 171L210 200M270 168L310 200" stroke="#345cff" strokeOpacity=".2"/>
    {Array.from({length: 24},(_,n)=><circle key={n} cx={15+(n*71)%298} cy={25+(n*37)%155} r={n%3?1:1.6} fill="#3ea0ff" opacity=".3"/>)}
    {neural ? <>
      {[20,250].map((x,n)=><g key={x} transform={`translate(${x} 74) rotate(-5)`}><rect width="55" height="65" rx="6" fill={`url(#${id}glass)`} stroke="#3d8bff"/><path d={n?'M7 48L18 34L28 39L39 20L48 28':'M7 48L18 37L28 43L39 23L48 31'} fill="none" stroke={n?'#d48cff':'#42d9ff'} strokeWidth="3"/></g>)}
      {[0,1,2].map(n=><path key={n} d={`M76 ${93+n*15}C108 ${85+n*22} 96 ${65+n*26} 122 ${66+n*26}M216 ${68+n*25}C237 ${68+n*25} 231 ${104+n*7} 250 ${104+n*7}`} fill="none" stroke={['#39cfff','#9061ff','#ffb954'][n]} strokeWidth="3" className="ts-signal"/>)}
      <g transform="translate(120 39) rotate(-4 45 60)"><rect width="99" height="122" rx="10" fill={`url(#${id}glass)`} stroke="#52baff" strokeWidth="1.5"/><path d="M6 4H91" stroke="#9ce7ff" strokeWidth="2"/>
      <text x="50" y="22" textAnchor="middle" fill="white" fontSize="13" fontWeight="700">{['RNN','LSTM','GRU'][index-5]}</text>
      {(index===5?['Hidden State','Recurrent Loop']:index===6?['Forget Gate','Input Gate','Cell State','Output Gate']:['Update Gate','Reset Gate']).map((label,n)=><g key={label}><rect x="9" y={31+n*20} width="82" height="17" rx="4" fill="#163c89" stroke="#4583dc"/><circle cx="17" cy={39+n*20} r="3" fill="#43ddff"/><text x="25" y={42+n*20} fill="#dfedff" fontSize="8">{label}</text></g>)}
      </g>{index===5&&<path d="M142 38C116 3 205 3 192 38" fill="none" stroke="#47d4ff" strokeWidth="3" className="ts-signal"/>}
    </> : index===3 ? <g transform="translate(19 40) rotate(-3 140 70)"><rect width="283" height="130" rx="10" fill="#0c2041" stroke="#244d85"/>{['Observed','Trend','Differencing','Forecast'].map((label,n)=><g key={label}><text x="10" y={24+n*30} fill="#b7c9ee" fontSize="10">{label}</text><path d={`M87 ${20+n*30} ${Array.from({length:22},(_,k)=>`L${90+k*8.5} ${20+n*30-Math.sin(k*(n+1)*.6)*7-k*.18}`).join(' ')}`} fill="none" stroke={['#f1f6ff','#259cff','#995dff','#45e7ef'][n]} strokeWidth="2"/></g>)}</g> : <>
      {index===1&&<path d="M166 107L300 45V140L166 107" fill={`url(#${id}area)`}/>}
      {(index===2?[0,1,2]:[0,1]).map((n)=><g key={n}><path d={curve(n*2, index===2?20:12)} transform={`translate(0 ${n*16-10})`} fill="none" stroke={['#2fd9f3','#a06aff','#ffb64d'][n]} strokeWidth="7" opacity=".4" filter={`url(#${id}glow)`}/><path className="ts-curve" d={curve(n*2,index===2?20:12)} transform={`translate(0 ${n*16-10})`} fill="none" stroke={['#34c8ff','#ba8bff','#ffbd65'][n]} strokeWidth="2.5"/></g>)}
      {index===0&&<><rect x="156" y="58" width="87" height="101" fill="#695bff" fillOpacity=".22" stroke="#a6a2ff" strokeDasharray="4 3"/><text x="155" y="48" fill="#d3e7ff" fontSize="10">Rolling Window</text></>}
      {index===1&&<><path d="M166 38V171" stroke="#b5b5ff" strokeDasharray="4 4"/><text x="185" y="42" fill="#dfdbff" fontSize="11">Forecast</text></>}
      {index===2&&['Trend','Seasonal','Level'].map((label,n)=><g key={label}><rect x="255" y={61+n*27} width="58" height="18" rx="4" fill="#10244c" stroke="#335c9d"/><text x="262" y={73+n*27} fill="#d4e6ff" fontSize="9">{label}</text></g>)}
      {index===4&&<><path d="M130 126L170 50L205 119" fill="none" stroke="#ff78ad" strokeWidth="3"/><circle className="ts-anomaly" cx="170" cy="50" r="19" fill="#ff4587" fillOpacity=".2" stroke="#ff6da3"/><circle cx="170" cy="50" r="6" fill="#ff9dca"/><text x="187" y="29" fill="#ff9bc2" fontSize="10">Anomaly Detected</text></>}
      {Array.from({length:12},(_,n)=><circle key={n} cx={18+n*25} cy={125-n*4+Math.sin(n*1.7)*12} r="2.5" fill="#8be5ff"/>)}
    </>}
  </svg>;
}
export function TimeSeriesStudio() {
  const [query,setQuery]=useState('');
  const items=studioItems('time-series');
  const visible=items.map((item,index)=>({...item,index})).filter(item=>item.label.toLowerCase().includes(query.toLowerCase()));
  return <div className="ts-studio-content">
    <header className="ts-studio-head"><div className="ts-studio-title"><span className="ts-studio-icon"><Activity size={36}/></span><div><h1>Time Series <span>Studio</span></h1><p>Learn forecasting techniques and analyze temporal data with hands-on labs.</p></div></div><div className="ts-lab-total"><ChartColumn size={32}/><div><strong>{items.length} interactive labs</strong><p>Explore the series.<br/>Build your forecasting intuition.</p></div><Activity size={34}/></div></header>
    <label className="ts-search"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Find a time series lab…" aria-label="Search time series labs"/><span>{visible.length} of {items.length} labs</span></label>
    <div className="ts-card-grid">{visible.map(item=><Link className="ts-lab-card" key={item.route} to={item.route} onPointerMove={e=>{const r=e.currentTarget.getBoundingClientRect();e.currentTarget.style.setProperty('--px',`${e.clientX-r.left}px`);e.currentTarget.style.setProperty('--py',`${e.clientY-r.top}px`);}}><span className={`ts-badge ts-badge-${item.badge.toLowerCase().replaceAll(' ','-')}`}><i/>{item.badge}</span><SeriesArt index={item.index}/><div className="ts-card-copy"><h2>{item.label}</h2><p>{summaries[item.index]}</p><footer><span><Activity size={15}/> Time Series</span><b><ArrowRight size={20}/></b></footer></div></Link>)}</div>
    {visible.length===0&&<p className="ts-empty">No labs match “{query}”. Try another search.</p>}
  </div>;
}
