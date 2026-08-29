import { useState } from 'react';
import {
  ArrowRight, BookOpen, Check, ChevronRight, ExternalLink, FileText, Filter,
  Lightbulb, Loader2, Map, Play, RefreshCw, Search, Sparkles, Target, Upload, Wrench, X, Zap
} from 'lucide-react';
import { DEMO_GRAPH, DEMO_QUESTIONS, DEMO_RESOURCE_PACKS, INITIAL_CONCEPT_STATES } from './lib/demoCourse';
import { analyzeCourse, convertFile, diagnose, discoverResources, evaluate, lesson, retest } from './lib/api';
import { directPrerequisites, masteryStatus, recommendNextPrerequisite, roadmapOrder } from './lib/graph';
import type { AppState, Concept, CourseGraph, Evaluation, ResourceItem, ResourcePack } from './types';

const initialState = (): AppState => ({ screen: 'home', mode: 'demo', course: null, selectedConceptId: null, conceptStates: {}, question: null, evaluation: null, lesson: null, retest: null, retestEvaluation: null, step: 'idle', error: null, isBusy: false });

const TYPE_META: Record<ResourceItem['type'], { label: string; icon: typeof BookOpen }> = {
  free: { label: 'FREE', icon: Sparkles }, paid: { label: 'PAID', icon: Zap }, practice: { label: 'PRACTICE', icon: Target },
  book: { label: 'BOOK', icon: BookOpen }, project: { label: 'PROJECT', icon: Wrench }, video: { label: 'VIDEO', icon: Play }, other: { label: 'MORE', icon: ExternalLink }
};

function App() {
  const [state, setState] = useState<AppState>(initialState());
  const [answer, setAnswer] = useState('');
  const [retestAnswer, setRetestAnswer] = useState('');
  const [fileName, setFileName] = useState('');
  const [resourcePack, setResourcePack] = useState<ResourcePack | null>(null);
  const [resourceBusy, setResourceBusy] = useState(false);

  const graph = state.course?.graph ?? null;
  const selected = graph?.concepts.find((c) => c.id === state.selectedConceptId) ?? null;
  const prereqs = graph && selected ? directPrerequisites(graph, selected.id).map((r) => graph.concepts.find((c) => c.id === r.source)).filter((c): c is Concept => Boolean(c)) : [];
  const gapConcept = graph && state.evaluation ? graph.concepts.find((c) => c.id === state.evaluation?.identified_gap_id) ?? null : null;
  const recommended = graph && selected ? recommendNextPrerequisite(graph, state.conceptStates, selected.id) : null;
  const mastery = selected ? state.conceptStates[selected.id]?.mastery ?? 0.5 : 0.5;
  const order = graph ? roadmapOrder(graph) : [];

  const resetFlow = () => {
    setState((s) => ({ ...initialState(), screen: s.screen })); setAnswer(''); setRetestAnswer(''); setFileName(''); setResourcePack(null);
  };

  const startDemo = () => {
    setResourcePack(DEMO_RESOURCE_PACKS['backpropagation'] ?? null);
    setState({ ...initialState(), screen: 'atlas', mode: 'demo', course: { graph: DEMO_GRAPH }, conceptStates: { ...INITIAL_CONCEPT_STATES }, selectedConceptId: 'backpropagation' });
  };

  const selectConcept = (id: string) => {
    setState((s) => ({ ...s, selectedConceptId: id, step: 'idle', question: null, evaluation: null, lesson: null, retest: null, retestEvaluation: null, error: null }));
    const pack = state.mode === 'demo' ? DEMO_RESOURCE_PACKS[id] ?? null : null;
    setResourcePack(pack);
  };

  const uploadFile = async (file: File) => {
    setState((s) => ({ ...s, isBusy: true, error: null }));
    setResourcePack(null);
    try {
      const sourceText = await convertFile(file);
      const analyzed = await analyzeCourse(sourceText);
      const states = Object.fromEntries(analyzed.concepts.map((c, index) => [c.id, { mastery: Math.max(0.42, 0.65 - index * 0.01), status: 'developing' as const }]));
      setFileName(file.name);
      setState((s) => ({ ...s, screen: 'atlas', mode: 'upload', course: { graph: analyzed, sourceText }, conceptStates: states, selectedConceptId: analyzed.sequence[0] ?? analyzed.concepts[0]?.id ?? null, step: 'idle', isBusy: false }));
    } catch (e) {
      setState((s) => ({ ...s, isBusy: false, error: e instanceof Error ? e.message : 'Could not analyze this syllabus.' }));
    }
  };

  const loadResources = async () => {
    if (!graph || !selected) return;
    if (state.mode === 'demo' && DEMO_RESOURCE_PACKS[selected.id]) { setResourcePack(DEMO_RESOURCE_PACKS[selected.id]); return; }
    setResourceBusy(true); setState((s) => ({ ...s, error: null }));
    try {
      const roadmapContext = order.map((id, i) => `${i + 1}. ${graph.concepts.find((c) => c.id === id)?.name ?? id}`).join('\n');
      const pack = await discoverResources({ concept: selected.name, difficulty: selected.difficulty, roadmap: roadmapContext });
      setResourcePack(pack);
    } catch (e) {
      setState((s) => ({ ...s, error: e instanceof Error ? e.message : 'Could not curate resources right now.' }));
    } finally { setResourceBusy(false); }
  };

  const handleDiagnose = async () => {
    if (!graph || !selected) return;
    setState((s) => ({ ...s, isBusy: true, error: null, step: 'diagnosing', evaluation: null, lesson: null, retest: null, retestEvaluation: null }));
    try {
      const data = state.mode === 'demo' && selected.id === 'backpropagation' ? DEMO_QUESTIONS.backpropagation : await diagnose({ graph, targetConcept: selected, prerequisites: prereqs });
      setState((s) => ({ ...s, question: data, step: 'answering', isBusy: false }));
    } catch (e) { setState((s) => ({ ...s, isBusy: false, step: 'idle', error: e instanceof Error ? e.message : 'Diagnosis failed.' })); }
  };

  const runEvaluation = async (isRetest = false) => {
    if (!graph || !selected) return;
    const q = isRetest ? state.retest : state.question; const response = isRetest ? retestAnswer : answer;
    if (!q || !response.trim()) return;
    setState((s) => ({ ...s, isBusy: true, step: 'evaluating', error: null }));
    try {
      let result: Evaluation;
      if (state.mode === 'demo') result = isRetest ? demoRetestEvaluation(response) : demoEvaluation(response);
      else result = await evaluate({ graph, targetConcept: selected, diagnostic: q, studentAnswer: response, priorMastery: mastery, retest: isRetest, demoMode: false });
      const nextStates = { ...state.conceptStates };
      const gapId = graph.concepts.some((c) => c.id === result.identified_gap_id) ? result.identified_gap_id : q.concept_id;
      const bounded = Math.max(0, Math.min(1, result.mastery_estimate));
      nextStates[gapId] = { mastery: bounded, status: masteryStatus(bounded) };
      if (gapId !== selected.id && isRetest) nextStates[selected.id] = { mastery: Math.max(nextStates[selected.id]?.mastery ?? 0.51, Math.min(0.95, (nextStates[selected.id]?.mastery ?? 0.51) + 0.31)), status: masteryStatus(Math.min(0.95, (nextStates[selected.id]?.mastery ?? 0.51) + 0.31)) };
      setState((s) => ({ ...s, isBusy: false, evaluation: isRetest ? s.evaluation : result, retestEvaluation: isRetest ? result : null, conceptStates: nextStates, step: isRetest ? 'complete' : 'gap' }));
      if (isRetest) setRetestAnswer(''); else setAnswer('');
    } catch (e) { setState((s) => ({ ...s, isBusy: false, step: isRetest ? 'retest' : 'answering', error: e instanceof Error ? e.message : 'Evaluation failed.' })); }
  };

  const openLesson = async () => {
    if (!graph || !selected || !state.evaluation) return;
    setState((s) => ({ ...s, isBusy: true, step: 'lesson', error: null }));
    try {
      const data = state.mode === 'demo' ? {
        title: 'Chain Rule — the missing bridge to backpropagation',
        why_it_matters: 'Backpropagation repeatedly combines local derivatives. The chain rule is the bridge that lets those local changes compose along a path.',
        explanation: 'For y = f(g(x)), the total change comes from two local links: how y changes with g(x), and how g(x) changes with x. Backpropagation applies the same idea repeatedly through a computational graph.',
        worked_example: 'Let z = 3x and y = z². Then dy/dz = 2z and dz/dx = 3. The chain rule gives dy/dx = (dy/dz)(dz/dx). At x = 2, z = 6, so dy/dx = 12 × 3 = 36.',
        analogy: 'Think of a relay: each link changes the signal locally, and the total effect is the product of those local effects.',
        check_question: 'Why do local derivatives multiply when you move through a chain of functions?'
      } : await lesson({ graph, targetConcept: selected, evaluation: state.evaluation });
      setState((s) => ({ ...s, lesson: data, isBusy: false }));
    } catch (e) { setState((s) => ({ ...s, isBusy: false, step: 'gap', error: e instanceof Error ? e.message : 'Could not create the lesson.' })); }
  };

  const runRetest = async () => {
    if (!graph || !selected || !state.evaluation) return;
    setState((s) => ({ ...s, isBusy: true, step: 'retest', error: null }));
    try {
      const data = state.mode === 'demo' ? DEMO_QUESTIONS['chain-rule-retest'] : await retest({ graph, targetConcept: selected, gap: state.evaluation, previousQuestion: state.question });
      setState((s) => ({ ...s, retest: data, isBusy: false }));
    } catch (e) { setState((s) => ({ ...s, isBusy: false, step: 'lesson', error: e instanceof Error ? e.message : 'Retest failed.' })); }
  };

  if (state.screen === 'home') return <Home onDemo={startDemo} onUpload={uploadFile} busy={state.isBusy} error={state.error} />;
  return <Atlas state={state} graph={graph!} order={order} selected={selected} prereqs={prereqs} recommended={recommended} mastery={mastery} gapConcept={gapConcept} fileName={fileName} resourcePack={resourcePack} resourceBusy={resourceBusy} answer={answer} retestAnswer={retestAnswer} setAnswer={setAnswer} setRetestAnswer={setRetestAnswer} onSelect={selectConcept} onResources={loadResources} onDiagnose={handleDiagnose} onEvaluate={() => runEvaluation(false)} onLesson={openLesson} onRetest={runRetest} onRetestEvaluate={() => runEvaluation(true)} onReset={resetFlow} />;
}

function demoEvaluation(response: string): Evaluation {
  const n = response.toLowerCase();
  const understands = n.includes('chain') && (n.includes('multiply') || n.includes('derivative') || n.includes('compose'));
  return understands ? { correct: true, mastery_estimate: 0.87, misconception: 'No major misconception detected.', identified_gap: 'Chain Rule', identified_gap_id: 'chain-rule', explanation: 'Your response connected nested functions to composing local derivatives.', recommended_action: 'Retest with a fresh computational-graph example.' } : { correct: false, mastery_estimate: 0.38, misconception: 'The response does not yet connect composed functions to multiplying local derivatives.', identified_gap: 'Chain Rule', identified_gap_id: 'chain-rule', explanation: 'That gap can block understanding of how backpropagation moves derivatives backward.', recommended_action: 'Learn the Chain Rule, then try a transfer question.' };
}
function demoRetestEvaluation(response: string): Evaluation {
  const n = response.toLowerCase(); const improved = n.includes('multiply') || n.includes('product') || n.includes('chain') || n.includes('local derivative');
  return improved ? { correct: true, mastery_estimate: 0.87, misconception: 'The transfer response correctly composes local derivatives.', identified_gap: 'Chain Rule', identified_gap_id: 'chain-rule', explanation: 'You transferred the idea to a new computational graph instead of repeating the original wording.', recommended_action: 'Retry the original target concept.' } : { correct: false, mastery_estimate: 0.62, misconception: 'The composition of local derivatives is still unclear.', identified_gap: 'Chain Rule', identified_gap_id: 'chain-rule', explanation: 'The retest suggests partial improvement.', recommended_action: 'Review the example and try again.' };
}

function Home({ onDemo, onUpload, busy, error }: { onDemo: () => void; onUpload: (f: File) => void; busy: boolean; error: string | null }) {
  const inputId = 'syllabus-upload-home';
  return <main className="home-page"><div className="home-shell">
    <header className="topbar"><div className="brand"><div className="brand-mark"><Map size={18}/></div><span>ConceptAtlas</span></div><span className="brand-note">AI learning roadmap</span></header>
    <section className="hero">
      <div className="hero-copy"><div className="eyebrow"><span className="eyebrow-dot"/> TURN ANY SYLLABUS INTO A PATH</div><h1>Know <em>what to learn next.</em></h1><p>ConceptAtlas turns a syllabus into a step-by-step learning roadmap, then gives every topic a focused resource pack. When you're stuck, AI helps find the prerequisite worth revisiting.</p><div className="hero-actions"><button className="primary big" onClick={onDemo}><Sparkles size={17}/> Try a demo course <ArrowRight size={17}/></button><label className="secondary big" htmlFor={inputId}><Upload size={17}/> Upload syllabus<input id={inputId} hidden type="file" accept=".pdf,.docx,.pptx,.xlsx,.xls,.csv,.txt,.md,.html,application/pdf" onChange={(e) => e.target.files?.[0] && onUpload(e.target.files[0])} /></label></div>{busy && <div className="busy-inline"><Loader2 className="spin" size={15}/> Turning your syllabus into a roadmap…</div>}{error && <div className="error-banner"><X size={15}/>{error}</div>}</div>
      <div className="hero-preview"><div className="preview-label">WHAT YOU GET</div><div className="mini-roadmap"><div className="mini-course">BIS701 · BIG DATA ANALYTICS <span>LIVE</span></div>{['Fundamentals','Hadoop','MapReduce','Hive','Spark','ML on Big Data'].map((n,i)=><div className={`mini-step ${i===3?'active':''}`} key={n}><span>{String(i+1).padStart(2,'0')}</span><div><strong>{n}</strong><small>{i===3?'Click for a resource pack':'Roadmap step'}</small></div><ChevronRight size={14}/></div>)}</div><div className="preview-foot"><span><FileText size={13}/> PDF → Markdown</span><span><Zap size={13}/> Groq reasoning</span></div></div>
    </section>
    <section className="feature-row"><Feature n="01" title="Map the syllabus" text="Turn units, topics and dependencies into a visual learning path."/><Feature n="02" title="Learn from the best" text="Get free, paid, practice, book, project and video picks per topic."/><Feature n="03" title="Unblock yourself" text="When you are stuck, AI finds the smallest useful prerequisite to revisit."/></section>
  </div></main>;
}
function Feature({ n, title, text }: { n: string; title: string; text: string }) { return <div className="feature"><span>{n}</span><div><strong>{title}</strong><p>{text}</p></div></div>; }

function Atlas({ state, graph, order, selected, prereqs, recommended, mastery, gapConcept, fileName, resourcePack, resourceBusy, answer, retestAnswer, setAnswer, setRetestAnswer, onSelect, onResources, onDiagnose, onEvaluate, onLesson, onRetest, onRetestEvaluate, onReset }: any) {
  const currentIndex = Math.max(0, order.indexOf(selected.id));
  const progress = Math.round(((currentIndex + 1) / order.length) * 100);
  const nextId = order[currentIndex + 1]; const nextConcept = graph.concepts.find((c: Concept) => c.id === nextId);
  return <main className="atlas-page"><header className="atlas-topbar"><div className="brand"><div className="brand-mark"><Map size={18}/></div><span>ConceptAtlas</span></div><div className="course-pill"><FileText size={14}/><span>{graph.course_title}</span><i>{state.mode === 'demo' ? 'DEMO' : 'LIVE'}</i></div><button className="ghost" onClick={onReset}>New course</button></header>
    <div className="atlas-layout">
      <aside className="roadmap-side"><div className="side-heading"><div><span className="section-kicker">LEARNING MAP</span><h2>Your roadmap</h2></div><span className="step-count">{currentIndex + 1}/{order.length}</span></div><div className="progress-track"><span style={{width:`${progress}%`}}/></div><div className="roadmap-list">{order.map((id: string, i: number)=><RoadmapStep key={id} index={i} concept={graph.concepts.find((c: Concept)=>c.id===id)!} state={state} selected={id===selected.id} onClick={()=>onSelect(id)} />)}</div><div className="roadmap-legend"><span><i className="dot strong"/>Strong</span><span><i className="dot developing"/>Developing</span><span><i className="dot weak"/>Needs work</span></div></aside>
      <section className="atlas-main"><div className="atlas-heading"><div><span className="section-kicker">STEP {String(currentIndex+1).padStart(2,'0')} · {state.mode === 'demo' ? 'DEMO COURSE' : fileName || 'UPLOADED SYLLABUS'}</span><h1>{selected.name}</h1><p>{selected.description}</p></div><div className="level-badge">Level {selected.difficulty}<span>of 5</span></div></div><div className="main-grid"><section className="map-card"><div className="card-head"><div><span className="section-kicker">PATH</span><strong>Where this fits</strong></div><span className="map-note"><Filter size={13}/> prerequisites highlighted</span></div><RoadmapTrail graph={graph} order={order} state={state} selected={selected} onSelect={onSelect}/><div className="next-strip"><div><span>UP NEXT</span><strong>{nextConcept?.name ?? 'You reached the end of the roadmap'}</strong></div>{nextConcept && <button className="text-btn" onClick={()=>onSelect(nextConcept.id)}>Continue <ArrowRight size={15}/></button>}</div></section>
      <aside className="detail-column"><div className="mastery-card"><div><span className="section-kicker">YOUR UNDERSTANDING</span><div className="mastery-number">{Math.round(mastery*100)}<small>%</small></div></div><div className={`mastery-ring ${state.conceptStates[selected.id]?.status ?? 'developing'}`}><span>{state.conceptStates[selected.id]?.status ?? 'developing'}</span></div></div>
      <div className="recommend-card">{recommended ? <><div className="recommend-tag"><Lightbulb size={14}/> AI RECOMMENDATION</div><strong>Learn <em>{graph.concepts.find((c:Concept)=>c.id===recommended.source)?.name}</em> next.</strong><p>This prerequisite is the best current unlock based on your estimated understanding and the roadmap dependency.</p><button className="secondary full" onClick={()=>onSelect(recommended.source)}>Open recommendation <ChevronRight size={16}/></button></> : <><div className="recommend-tag"><Check size={14}/> ROADMAP CHECK</div><strong>No direct prerequisite.</strong><p>Start with the target, or use the resource pack below to choose your own entry point.</p></>}</div>
      <div className="resource-card"><div className="card-head"><div><span className="section-kicker">RESOURCE PACK</span><strong>Best ways to learn it</strong></div><button className="icon-btn" onClick={onResources} disabled={resourceBusy}>{resourceBusy ? <Loader2 className="spin" size={15}/> : resourcePack ? <RefreshCw size={15}/> : <Search size={15}/>}</button></div>{resourcePack ? <ResourcePackView pack={resourcePack}/> : <div className="resource-empty"><div className="resource-icons"><Sparkles size={15}/><BookOpen size={15}/><Wrench size={15}/></div><p>Get a focused mix of <strong>free, paid, practice, books, projects and videos</strong> chosen for this topic.</p><button className="primary full" onClick={onResources} disabled={resourceBusy}>{resourceBusy ? <Loader2 className="spin"/> : <Sparkles size={16}/>} Build resource pack</button></div>}</div>
      <div className="stuck-card"><div className="stuck-copy"><span className="section-kicker">STUCK HERE?</span><strong>Find the prerequisite behind the confusion.</strong><p>One short diagnostic. One targeted intervention. No giant chat.</p></div>{state.step==='idle' && <button className="primary full" onClick={onDiagnose}><Target size={16}/> Diagnose my understanding <ArrowRight size={16}/></button>}{(state.step==='diagnosing'||state.step==='evaluating') && <BusyRow text={state.step==='diagnosing'?'Generating a diagnostic…':'Tracing the likely prerequisite…'}/>} {state.step==='answering'&&state.question&&<div className="flow-box"><div className="question-label">DIAGNOSTIC · 1 QUESTION</div><h3>{state.question.question}</h3><textarea value={answer} onChange={(e)=>setAnswer(e.target.value)} placeholder="Explain your reasoning in your own words…"/><button className="primary full" onClick={onEvaluate} disabled={!answer.trim()}>Submit answer <ArrowRight size={16}/></button></div>}{state.step==='gap'&&state.evaluation&&<div className="flow-box"><div className="result-pill"><span/> LIKELY ROOT GAP</div><h3>{gapConcept?.name ?? state.evaluation.identified_gap}</h3><p>{state.evaluation.explanation}</p><div className="mini-callout"><span>Signal</span><strong>{state.evaluation.misconception}</strong></div><button className="primary full" onClick={onLesson}>Teach the missing piece <ArrowRight size={16}/></button></div>}{state.step==='lesson'&&state.lesson&&<LessonBox lesson={state.lesson} onRetest={onRetest}/>} {state.step==='retest'&&state.retest&&<div className="flow-box"><div className="question-label">TRANSFER RETEST</div><h3>{state.retest.question}</h3><textarea value={retestAnswer} onChange={(e)=>setRetestAnswer(e.target.value)} placeholder="Show the idea, not just the answer…"/><button className="primary full" onClick={onRetestEvaluate} disabled={!retestAnswer.trim()}>Submit retest <Check size={16}/></button></div>}{state.step==='complete'&&<div className="flow-box success-box"><div className="result-pill success"><Check size={14}/> GAP REDUCED</div><h3>Ready to retry {selected.name}.</h3><p>These are <strong>AI-estimated learning signals</strong>, not validated mastery measurements.</p><div className="before-after"><div><span>{gapConcept?.name ?? 'Prerequisite'}</span><strong>{Math.round(Math.max(0.38, (state.evaluation?.mastery_estimate ?? 0.38)-0.49)*100)}% → {Math.round((state.retestEvaluation?.mastery_estimate ?? 0.87)*100)}%</strong></div><div><span>{selected.name}</span><strong>{Math.round(Math.max(0.51, mastery-0.31)*100)}% → {Math.round(mastery*100)}%</strong></div></div><button className="text-btn" onClick={()=>onSelect(selected.id)}>Return to roadmap <ArrowRight size={15}/></button></div>}</div></aside></div>{state.error&&<div className="error-banner page-error"><X size={15}/>{state.error}</div>}</section></div></main>;
}

function RoadmapStep({ index, concept, state, selected, onClick }: any) { const mastery=state.conceptStates[concept.id]?.mastery ?? .55; const status=state.conceptStates[concept.id]?.status ?? 'developing'; return <button className={`roadmap-step ${selected?'selected':''}`} onClick={onClick}><span className={`step-num ${status}`}>{mastery>=.78?<Check size={13}/>:String(index+1).padStart(2,'0')}</span><span className="step-copy"><strong>{concept.name}</strong><small>{concept.description}</small></span><span className="step-level">L{concept.difficulty}</span></button>; }
function RoadmapTrail({ graph, order, state, selected, onSelect }: { graph: CourseGraph; order: string[]; state: AppState; selected: Concept; onSelect:(id:string)=>void }) { return <div className="trail">{order.slice(Math.max(0, order.indexOf(selected.id)-2), Math.min(order.length, order.indexOf(selected.id)+4)).map((id,idx,arr)=><div className="trail-item" key={id}><button className={`trail-node ${id===selected.id?'selected':''} ${state.conceptStates[id]?.status??'developing'}`} onClick={()=>onSelect(id)}><span>{id===selected.id?<Target size={16}/>:String(order.indexOf(id)+1).padStart(2,'0')}</span><strong>{graph.concepts.find(c=>c.id===id)?.name}</strong></button>{idx<arr.length-1&&<div className="trail-line"/>}</div>)}</div>; }
function BusyRow({ text }: { text:string }) { return <div className="busy-row"><Loader2 className="spin" size={18}/><span>{text}</span></div>; }
function LessonBox({ lesson:l, onRetest }: any) { return <div className="flow-box lesson-box"><div className="result-pill success"><Sparkles size={13}/> TARGETED LESSON</div><h3>{l.title}</h3><div><span className="question-label">WHY IT MATTERS</span><p>{l.why_it_matters}</p></div><div><span className="question-label">IN 60 SECONDS</span><p>{l.explanation}</p></div><div className="worked"><span>Worked example</span><p>{l.worked_example}</p></div><button className="primary full" onClick={onRetest}><Target size={16}/> Retest me</button></div>; }
function ResourcePackView({ pack }: { pack:ResourcePack }) { const grouped = ['free','paid','practice','book','project','video','other'] as ResourceItem['type'][]; return <div className="resource-pack"><p className="resource-summary">{pack.summary}</p>{grouped.map(type=>{const item=pack.resources.find(r=>r.type===type); if(!item) return null; const meta=TYPE_META[type]; const Icon=meta.icon; return <a className="resource-item" href={item.url} target="_blank" rel="noreferrer" key={type}><div className="resource-icon"><Icon size={15}/></div><div className="resource-body"><span className="resource-type">{meta.label}</span><strong>{item.title}</strong><small>{item.provider} · {item.why}</small></div><ExternalLink size={14}/></a>;})}<div className="resource-note"><Sparkles size={12}/> Demo packs are curated; live uploads use Groq web research and only keep URLs found in the search results.</div></div>; }

export default App;
