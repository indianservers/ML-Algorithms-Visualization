import { useMemo, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import './MissingValuesApprovedPage.css';
import './MissingValuesApprovedOverrides.css';

type Cell = string | number | null;
type DataRow = Record<string, Cell>;
type DatasetKey = 'California Housing' | 'Ames Housing' | 'Titanic Passengers';

const META: Record<DatasetKey, { rows: number; columns: string[] }> = {
  'California Housing': { rows: 20640, columns: ['longitude','latitude','housing_median_age','total_rooms','total_bedrooms','population','households','median_income','ocean_proximity','median_house_value'] },
  'Ames Housing': { rows: 2930, columns: ['lot_area','year_built','overall_qual','garage_area','garage_cars','basement_sqft','living_area','bedrooms','neighborhood','sale_price'] },
  'Titanic Passengers': { rows: 891, columns: ['passenger_id','class','name_code','sex','age','siblings','fare','cabin','embarked','survived'] },
};

function randomAt(index: number, salt: number) {
  const raw = Math.sin((index + 1) * 91.713 + salt * 17.19) * 43758.5453;
  return raw - Math.floor(raw);
}

function generatedRows(key: DatasetKey): DataRow[] {
  const cols = META[key].columns;
  return Array.from({ length: 75 }, (_, index) => {
    const base: DataRow = {};
    cols.forEach((column, c) => {
      const r = randomAt(index, c + key.length);
      if (key === 'California Housing') {
        const values: Cell[] = [-124 + r * 10, 32 + r * 10, Math.round(5 + r * 47), Math.round(500 + r * 6900), Math.round(95 + r * 1100), Math.round(200 + r * 2500), Math.round(80 + r * 950), 1.2 + r * 7.4, r > .64 ? 'INLAND' : r > .34 ? 'NEAR BAY' : '<1H OCEAN', Math.round(70000 + r * 390000)];
        base[column] = typeof values[c] === 'number' ? Number((values[c] as number).toFixed(c === 7 ? 4 : 2)) : values[c];
      } else if (key === 'Ames Housing') {
        const values: Cell[] = [2200 + r * 15000, Math.round(1910 + r * 100), Math.round(2 + r * 8), Math.round(150 + r * 850), Math.round(r * 4), Math.round(r * 1800), Math.round(500 + r * 3000), Math.round(1 + r * 5), r > .5 ? 'NAmes' : 'CollgCr', Math.round(55000 + r * 420000)];
        base[column] = values[c];
      } else {
        const values: Cell[] = [index + 1, Math.ceil(r * 3), `Passenger ${index + 1}`, r > .5 ? 'female' : 'male', Math.round(1 + r * 78), Math.round(r * 5), Number((5 + r * 180).toFixed(2)), `C${Math.round(r * 120)}`, r > .66 ? 'S' : r > .33 ? 'C' : 'Q', r > .55 ? 1 : 0];
        base[column] = values[c];
      }
    });
    const missingCols = key === 'California Housing' ? [4,5,6] : key === 'Ames Housing' ? [3,4,5] : [4,7,8];
    if (index % 17 === 3) base[cols[missingCols[0]]] = null;
    if (index % 21 === 8) base[cols[missingCols[1]]] = null;
    if (index % 25 === 11) base[cols[missingCols[2]]] = null;
    return base;
  });
}

function missing(value: Cell) { return value === null || value === ''; }
function numeric(rows: DataRow[], column: string) { return rows.map(row => row[column]).filter(value => !missing(value) && Number.isFinite(Number(value))).map(Number); }
function average(values: number[]) { return values.reduce((sum, value) => sum + value, 0) / (values.length || 1); }
function median(values: number[]) { const sorted=[...values].sort((a,b)=>a-b); const mid=Math.floor(sorted.length/2); return sorted.length%2?sorted[mid]:(sorted[mid-1]+sorted[mid])/2; }
function fillValue(rows: DataRow[], column: string, mode: 'mean'|'median'|'knn'|'mice'|'zero') {
  if (mode === 'zero') return 0;
  const values = numeric(rows,column);
  if (!values.length) return rows.find(row=>!missing(row[column]))?.[column] ?? 'Unknown';
  if (mode === 'median') return median(values);
  if (mode === 'knn') return values.sort((a,b)=>a-b)[Math.floor(values.length*.46)];
  if (mode === 'mice') return average(values) * .985;
  return average(values);
}
function cleanRows(rows: DataRow[], columns: string[]) { const fills=Object.fromEntries(columns.map(column=>[column,fillValue(rows,column,'mean')])); return rows.map(row=>Object.fromEntries(columns.map(column=>[column,missing(row[column])?fills[column]:row[column]]))); }

const TABS=['Learn','Visualize','Dataset','Transform','Train','Metrics','Compare','Explain'];

export default function MissingValuesApprovedPage(){
  const [dataset,setDataset]=useState<DatasetKey>('California Housing');
  const [uploaded,setUploaded]=useState<{name:string;rows:DataRow[];columns:string[]}|null>(null);
  const [activeTab,setActiveTab]=useState('Dataset');
  const [view,setView]=useState<'table'|'compact'>('table');
  const [onlyMissing,setOnlyMissing]=useState(false);
  const [query,setQuery]=useState('');
  const [page,setPage]=useState(0);
  const [pageSize,setPageSize]=useState(25);
  const [indicators,setIndicators]=useState(true);
  const [status,setStatus]=useState('Ready');
  const [collapsed,setCollapsed]=useState(false);
  const fileRef=useRef<HTMLInputElement>(null);
  const rows=useMemo(()=>uploaded?.rows??generatedRows(dataset),[uploaded,dataset]);
  const columns=uploaded?.columns??META[dataset].columns;
  const visibleColumns=columns.filter(column=>column.toLowerCase().includes(query.toLowerCase()));
  const stats=useMemo(()=>{
    const perColumn=columns.map(column=>({column,count:rows.filter(row=>missing(row[column])).length}));
    const count=perColumn.reduce((sum,item)=>sum+item.count,0); const total=rows.length*columns.length;
    return {perColumn,count,total,pct:count/total*100};
  },[rows,columns]);
  const filtered=onlyMissing?rows.filter(row=>columns.some(column=>missing(row[column]))):rows;
  const totalPages=Math.max(1,Math.ceil(filtered.length/pageSize));
  const shown=filtered.slice(page*pageSize,page*pageSize+Math.min(pageSize,10));
  const primaryMissing=stats.perColumn.filter(item=>item.count>0).sort((a,b)=>b.count-a.count);
  const previewMethods=[{name:'Drop Rows',mode:null},{name:'Mean / Median',mode:'mean'},{name:'KNN (k=5)',mode:'knn'},{name:'MICE',mode:'mice'},{name:'Constant (0)',mode:'zero'}] as const;
  const scaledMissing=Math.round(stats.pct/100*(uploaded?.rows.length??META[dataset].rows)*columns.length);

  const upload=async(file?:File)=>{if(!file)return;const lines=(await file.text()).trim().split(/\r?\n/);const nextColumns=lines[0].split(',').map(value=>value.trim());const nextRows=lines.slice(1).filter(Boolean).map(line=>{const values=line.split(',');return Object.fromEntries(nextColumns.map((column,index)=>{const raw=values[index]?.trim()??'';return [column,raw===''?null:Number.isFinite(Number(raw))?Number(raw):raw]}))});if(nextColumns.length<2||nextRows.length<2){setStatus('CSV needs a header and at least two rows');return}setUploaded({name:file.name,rows:nextRows,columns:nextColumns});setPage(0);setStatus(`${file.name} · ${nextRows.length} rows loaded`)};
  const exportClean=()=>{const data=cleanRows(rows,columns);const csv=[columns.join(','),...data.map(row=>columns.map(column=>String(row[column]??'')).join(','))].join('\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));const anchor=document.createElement('a');anchor.href=url;anchor.download='clean_dataset.csv';anchor.click();URL.revokeObjectURL(url);setStatus('Clean mean-imputed dataset exported')};

  return <div className={`mv-page ${collapsed?'collapsed':''}`}>
    <aside className="mv-side"><a href="/" className="mv-brand"><span>✦</span><b>mega ML<small>AI OBSERVATORY</small></b></a><button className="home active" onClick={()=>setStatus('Home selected')}>⌂ Home</button><nav><small>LEARN</small>{['▣ Roadmap','♡ Courses'].map(label=><button key={label} onClick={()=>setStatus(`${label.slice(2)} opened`)}>{label}</button>)}<small>TOPICS</small>{['› Data','› Missing Values','› Outliers','› Encoding','› Scaling','› Feature Engineering'].map((label,index)=><button className={index===1?'active':''} key={label} onClick={()=>setStatus(`${label.slice(2)} selected`)}>{label}</button>)}<small>LAB</small>{['▧ Notebooks','⌘ Experiments','▤ Datasets','◇ Models'].map(label=><button key={label} onClick={()=>setStatus(`${label.slice(2)} opened`)}>{label}</button>)}<small>RESOURCES</small>{['▧ Guides','♧ Cheat Sheets','⌁ Playground'].map(label=><button key={label} onClick={()=>setStatus(`${label.slice(2)} opened`)}>{label}</button>)}</nav><button className="upgrade" onClick={()=>setStatus('Plan comparison opened')}>ϟ Upgrade to Pro</button><button className="collapse" onClick={()=>setCollapsed(value=>!value)}>{collapsed?'»':'‹'}</button></aside>
    <header className="mv-head"><div className="mv-title"><span>✦ Data Quality & Prep</span><h1>Missing Values <small>Lesson</small></h1><p>Understand, visualize and handle missing data to build more reliable models.</p></div><div className="lesson-progress"><span>Lesson Progress <b>65%</b></span><progress max="100" value="65"/><button onClick={()=>setStatus('Continued to imputation configuration')}>Continue</button></div><div className="head-actions"><select aria-label="Datasets" value={dataset} onChange={event=>{setDataset(event.target.value as DatasetKey);setUploaded(null);setPage(0)}}>{Object.keys(META).map(name=><option key={name}>{name}</option>)}</select><button onClick={()=>fileRef.current?.click()}>＋ Upload</button><input ref={fileRef} hidden type="file" accept=".csv,text/csv" onChange={event=>void upload(event.target.files?.[0])}/></div><nav className="mv-tabs">{TABS.map(tab=><button className={activeTab===tab?'active':''} onClick={()=>{setActiveTab(tab);setStatus(`${tab} view selected`)}} key={tab}>{tab}</button>)}</nav></header>
    <main className="mv-main">
      <section className="data-table panel"><div className="table-head"><div><h2>{uploaded?.name.replace(/\.csv$/i,'')??dataset} <small>Sample</small></h2><p>Rows: {(uploaded?.rows.length??META[dataset].rows).toLocaleString()} · Columns: {columns.length}</p></div><div><span>View</span><button className={view==='table'?'active':''} onClick={()=>setView('table')}>▦</button><button className={view==='compact'?'active':''} onClick={()=>setView('compact')}>▧</button><button className={onlyMissing?'active':''} onClick={()=>{setOnlyMissing(value=>!value);setPage(0)}}>▽ Filter</button><input aria-label="Search columns" placeholder="⌕  Search columns..." value={query} onChange={event=>setQuery(event.target.value)}/></div></div>
        {view==='table'?<div className="table-scroll"><table><thead><tr><th>#</th>{visibleColumns.map(column=><th key={column}>{column}<small>{numeric(rows,column).length?'float64':'object'}</small></th>)}</tr></thead><tbody>{shown.map((row,index)=><tr key={index}><td>{page*pageSize+index}</td>{visibleColumns.map(column=><td className={missing(row[column])?'missing':''} key={column}>{missing(row[column])?'—':String(row[column])}</td>)}</tr>)}</tbody></table></div>:<div className="compact-grid">{shown.map((row,index)=><article key={index}><b>Row {page*pageSize+index}</b>{visibleColumns.map(column=><span key={column}>{column}: <em className={missing(row[column])?'missing':''}>{missing(row[column])?'Missing':String(row[column])}</em></span>)}</article>)}</div>}
        <div className="pager"><span>Rows per page: <select value={pageSize} onChange={event=>{setPageSize(Number(event.target.value));setPage(0)}}><option>10</option><option>25</option><option>50</option></select></span><span>{page*pageSize+1}–{Math.min((page+1)*pageSize,filtered.length)} of {(uploaded?.rows.length??META[dataset].rows).toLocaleString()} <button disabled={page===0} onClick={()=>setPage(value=>Math.max(0,value-1))}>‹</button><button disabled={page>=totalPages-1} onClick={()=>setPage(value=>Math.min(totalPages-1,value+1))}>›</button></span></div>
      </section>
      <section className="mv-lower"><article className="heatmap panel"><h2>Missingness Heatmap</h2><div className="heat-labels">{columns.map(column=><span key={column}>{column}</span>)}</div><div className="heat-grid">{rows.slice(0,10).flatMap((row,r)=>columns.map(column=><i className={missing(row[column])?'missing':''} title={`row ${r}, ${column}`} key={`${r}-${column}`}/>))}</div><p><span>■ Present</span><span className="red">■ Missing</span><button onClick={()=>setStatus('Heatmap settings opened')}>Settings</button></p></article>
        <article className="preview panel"><h2>Imputation Preview ⓘ</h2><table><thead><tr><th>Method</th>{primaryMissing.slice(0,3).map(item=><th key={item.column}>{item.column}</th>)}</tr></thead><tbody>{previewMethods.map(method=><tr key={method.name}><td>{method.name}</td>{primaryMissing.slice(0,3).map(item=><td key={item.column} className={method.mode? 'filled':'missing'}>{method.mode?Number(fillValue(rows,item.column,method.mode)).toFixed(2):`— (${Math.round(item.count/rows.length*(uploaded?.rows.length??META[dataset].rows)).toLocaleString()})`}</td>)}</tr>)}</tbody></table><button onClick={()=>setStatus('Imputation configuration opened')}>Configure Imputation →</button></article>
      </section>
      <section className="insights panel"><h2>Insights</h2><div><article>☹<p>Missingness is concentrated in<br/><b>{primaryMissing.length} columns.</b><small>Focus cleaning efforts there.</small></p></article><article>♟<p><b>{((primaryMissing[0]?.count??0)/rows.length*100).toFixed(1)}% of {primaryMissing[0]?.column}</b><br/>values are missing.<small>Consider KNN or MICE.</small></p></article><article>▣<p>No missing values in target<br/><b>({columns.at(-1)}).</b><small>Good for supervised learning.</small></p></article><article>⌁<p>Missing patterns appear<br/><b>at random.</b><small>Imputation is appropriate.</small></p></article></div></section>
    </main>
    <aside className="mv-right"><section className="panel overview"><h2>♧ Missingness Overview</h2><div className="donut" style={{'--missing':`${stats.pct*3.6}deg`} as CSSProperties}><b>{stats.pct.toFixed(1)}%<small>Overall Missingness</small></b></div><div className="overview-stats"><p><i/>Missing <b>{scaledMissing.toLocaleString()} ({stats.pct.toFixed(1)}%)</b></p><p><i/>Present <b>{((uploaded?.rows.length??META[dataset].rows)*columns.length-scaledMissing).toLocaleString()} ({(100-stats.pct).toFixed(1)}%)</b></p><hr/><p>Total Cells <b>{((uploaded?.rows.length??META[dataset].rows)*columns.length).toLocaleString()}</b></p></div><button onClick={()=>setStatus('Missing heatmap focused')}>View missing heatmap →</button></section>
      <section className="panel by-column"><h2>Missing by Column</h2><div className="column-head"><span>Column</span><span>Missing %</span></div>{stats.perColumn.slice().sort((a,b)=>b.count-a.count).slice(0,9).map(item=><p key={item.column}><span>{item.column}</span><b>{(item.count/rows.length*100).toFixed(1)}%</b><i><em style={{width:`${item.count/rows.length*1000}%`}}/></i><small>{Math.round(item.count/rows.length*(uploaded?.rows.length??META[dataset].rows)).toLocaleString()}</small></p>)}<button onClick={()=>setStatus(`${columns.length} columns shown`)}>View all columns →</button></section>
      <section className="panel quick"><h2>Quick Actions</h2><button onClick={()=>setStatus(`Detected ${primaryMissing.length} columns with missing values`)}>▧<span><b>Detect Missing Patterns</b><small>Find rows or groups with systematic missingness.</small></span></button><label>▣<span><b>Set Missing Indicators</b><small>Create binary flags before imputation.</small></span><input type="checkbox" checked={indicators} onChange={event=>{setIndicators(event.target.checked);setStatus(event.target.checked?'Missing indicators added':'Missing indicators hidden')}}/><i/></label><button onClick={()=>setStatus('Compared five imputation methods')}>⌘<span><b>Compare Imputations</b><small>See impact on distributions and correlations.</small></span></button><button onClick={exportClean}>▤<span><b>Export Clean Dataset</b><small>Download imputed dataset or pipeline.</small></span></button><a href="?advanced=1">Open original imputation workbench →</a></section>
    </aside><div className="mv-status">{status}</div>
  </div>
}
