'use client';

import { useEffect, useMemo, useState } from 'react';
import { Focus, Maximize2, Network, RotateCcw, Search, X } from 'lucide-react';
import { apiClient, type DependencyGraph as GraphData } from '@/lib/api-client';

type Layout = 'force' | 'hierarchical';
type Point = { x: number; y: number };
const statuses: Record<string, string> = { draft: 'Draft', active: 'Active', deprecated: 'Deprecated', sunset: 'Sunset' };

export function DependencyGraph({ projectId }: { projectId: string }) {
  const [data, setData] = useState<GraphData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [apiId, setApiId] = useState('all');
  const [relationship, setRelationship] = useState('all');
  const [lifecycle, setLifecycle] = useState('all');
  const [layout, setLayout] = useState<Layout>('force');
  const [focus, setFocus] = useState(false);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    let mounted = true;
    void apiClient.dependencies.graph(projectId).then((result) => {
      if (!mounted) return;
      if (result.success && result.data) setData(result.data);
      else setError(result.error?.message || 'Could not load the dependency graph.');
      setLoading(false);
    });
    return () => { mounted = false; };
  }, [projectId]);

  const visible = useMemo(() => {
    if (!data) return { nodes: [], edges: [] };
    let nodes = data.nodes.filter((node) => (lifecycle === 'all' || node.lifecycle === lifecycle) && node.name.toLowerCase().includes(search.toLowerCase()));
    let edges = data.edges.filter((edge) => relationship === 'all' || edge.relationship.toLowerCase() === relationship);
    const anchor = apiId !== 'all' ? apiId : focus ? selectedNode : null;
    if (anchor) {
      const neighborhood = new Set([anchor]);
      data.edges.forEach((edge) => { if (edge.sourceApiId === anchor) neighborhood.add(edge.targetApiId); if (edge.targetApiId === anchor) neighborhood.add(edge.sourceApiId); });
      nodes = nodes.filter((node) => neighborhood.has(node.id));
      edges = edges.filter((edge) => neighborhood.has(edge.sourceApiId) && neighborhood.has(edge.targetApiId));
    }
    const ids = new Set(nodes.map((node) => node.id));
    return { nodes, edges: edges.filter((edge) => ids.has(edge.sourceApiId) && ids.has(edge.targetApiId)) };
  }, [data, search, apiId, relationship, lifecycle, focus, selectedNode]);

  const positions = useMemo(() => {
    const map = new Map<string, Point>();
    const width = 1500; const height = 800;
    visible.nodes.forEach((node, index) => {
      if (layout === 'hierarchical') {
        const level = visible.edges.some((edge) => edge.targetApiId === node.id) ? 1 : 0;
        const same = visible.nodes.filter((item) => (visible.edges.some((edge) => edge.targetApiId === item.id) ? 1 : 0) === level);
        map.set(node.id, { x: level ? 1080 : 360, y: 100 + (same.indexOf(node) + 1) * (height - 140) / (same.length + 1) });
      } else {
        const angle = index * 2.39996; const radius = Math.min(330, 110 + visible.nodes.length * 24);
        map.set(node.id, { x: width / 2 + Math.cos(angle) * radius, y: height / 2 + Math.sin(angle) * radius });
      }
    });
    return map;
  }, [visible, layout]);

  const selected = data?.nodes.find((node) => node.id === selectedNode);
  const edge = data?.edges.find((item) => item.id === selectedEdge);
  const connected = selectedNode ? new Set(visible.edges.filter((item) => item.sourceApiId === selectedNode || item.targetApiId === selectedNode).flatMap((item) => [item.sourceApiId, item.targetApiId])) : null;
  if (loading) return <div className="data-state" role="status">Loading dependency graph…</div>;
  if (error) return <div className="data-alert" role="alert">{error}</div>;
  if (!data) return null;

  return <section className="workspace-page dependency-graph-page">
    <div className="section-title-row graph-page-heading"><div><p className="page-kicker">Dependency intelligence</p><h2>Dependency graph</h2><p>Choose an API to isolate its immediate dependency neighborhood.</p></div><Network size={20}/></div>
    <div className="graph-toolbar"><label className="graph-search"><Search size={15}/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search APIs" /></label><label>View API<select value={apiId} onChange={(event) => { setApiId(event.target.value); setSelectedNode(event.target.value === 'all' ? null : event.target.value); }}><option value="all">All APIs</option>{data.nodes.map((node) => <option key={node.id} value={node.id}>{node.name}</option>)}</select></label><label>Relationship<select value={relationship} onChange={(event) => setRelationship(event.target.value)}><option value="all">All types</option>{Array.from(new Set(data.edges.map((item) => item.relationship))).map((item) => <option key={item} value={item.toLowerCase()}>{item}</option>)}</select></label><label>Lifecycle<select value={lifecycle} onChange={(event) => setLifecycle(event.target.value)}><option value="all">All statuses</option>{Object.entries(statuses).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>Layout<select value={layout} onChange={(event) => setLayout(event.target.value as Layout)}><option value="force">Force-directed</option><option value="hierarchical">Hierarchical</option></select></label><button className={focus ? 'graph-tool active' : 'graph-tool'} onClick={() => setFocus(!focus)}><Focus size={14}/> Focus</button><button className="graph-tool" onClick={() => { setApiId('all'); setSelectedNode(null); setSelectedEdge(null); setZoom(1); }}><RotateCcw size={14}/> Reset</button><button className="graph-tool" onClick={() => setZoom(1)}><Maximize2 size={14}/> Fit</button></div>
    <div className="graph-layout"><div className="graph-canvas-wrap"><div className="graph-canvas" style={{ transform: `scale(${zoom})` }} onWheel={(event) => { event.preventDefault(); setZoom((current) => Math.min(1.35, Math.max(.75, current + (event.deltaY < 0 ? .08 : -.08)))); }}><svg viewBox="0 0 1500 800" role="img" aria-label="Interactive directed API dependency graph"><defs><marker id="dependency-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 z" fill="#ff6b2c" /></marker></defs>{visible.edges.map((item, index) => { const source = positions.get(item.sourceApiId); const target = positions.get(item.targetApiId); if (!source || !target) return null; const offset = (index % 5 - 2) * 34; const mx = (source.x + target.x) / 2 + offset; const my = (source.y + target.y) / 2 - offset; const active = !selectedNode || (connected?.has(item.sourceApiId) && connected?.has(item.targetApiId)); return <g key={item.id} className={`graph-svg-edge ${active ? '' : 'dimmed'} ${selectedEdge === item.id ? 'selected' : ''}`} onClick={() => { setSelectedEdge(item.id); setSelectedNode(null); }}><path d={`M ${source.x} ${source.y} Q ${mx} ${my} ${target.x} ${target.y}`} markerEnd="url(#dependency-arrow)"/><text x={mx} y={my - 6}>{item.relationship}</text></g>; })}{visible.nodes.map((node) => { const position = positions.get(node.id)!; const active = !selectedNode || connected?.has(node.id); return <g key={node.id} className={`graph-svg-node ${node.lifecycle} ${active ? '' : 'dimmed'} ${selectedNode === node.id ? 'selected' : ''}`} transform={`translate(${position.x - 78},${position.y - 34})`} onClick={() => { setSelectedNode(node.id); setSelectedEdge(null); }}><rect width="156" height="68" rx="8"/><text className="node-name" x="12" y="22">{node.name.length > 20 ? `${node.name.slice(0, 19)}…` : node.name}</text><text x="12" y="40">{node.latestVersion ? `v${node.latestVersion}` : 'No version'} · {node.protocol}</text><text x="12" y="56">{node.endpointCount} endpoints · {statuses[node.lifecycle]}</text></g>; })}</svg></div><div className="graph-legend"><span><i className="legend-dot active"/>Active</span><span><i className="legend-dot draft"/>Draft</span><span><i className="legend-dot deprecated"/>Deprecated</span><span><i className="legend-line"/>Directed relationship</span></div></div><aside className="graph-side-panel">{selected ? <NodePanel node={selected} data={data} onClose={() => setSelectedNode(null)}/> : edge ? <EdgePanel edge={edge} data={data} onClose={() => setSelectedEdge(null)}/> : <div className="graph-empty-panel"><Network size={22}/><b>Select an API or relationship</b><p>Choose an API above or click a node/edge to inspect it.</p></div>}</aside></div>
    <div className="graph-analytics"><Metric label="APIs" value={data.summary.nodeCount}/><Metric label="Dependencies" value={data.summary.edgeCount}/><Metric label="Isolated APIs" value={data.summary.isolatedApiCount}/><Metric label="Most connected" value={data.summary.highestOutgoing[0]?.name || 'None'}/></div>
    {!visible.nodes.length && <div className="empty-state"><Network size={22}/><b>No APIs match the current view</b><p>Clear the search or select All APIs.</p></div>}
  </section>;
}

function Metric({ label, value }: { label: string; value: string | number }) { return <div><span>{label}</span><b>{value}</b></div>; }
function NodePanel({ node, data, onClose }: { node: GraphData['nodes'][number]; data: GraphData; onClose: () => void }) { const incoming = data.edges.filter((edge) => edge.targetApiId === node.id); const outgoing = data.edges.filter((edge) => edge.sourceApiId === node.id); return <div className="graph-detail"><button className="graph-close" onClick={onClose} aria-label="Close API details"><X size={15}/></button><p className="page-kicker">API node</p><h3>{node.name}</h3><p>{node.description || 'No API description recorded.'}</p><div className="graph-detail-stats"><span><b>{node.latestVersion || '—'}</b> latest</span><span><b>{node.versionCount}</b> versions</span><span><b>{node.endpointCount}</b> endpoints</span></div><small>Status · {statuses[node.lifecycle]} · {node.protocol}</small><h4>Outgoing dependencies <em>{outgoing.length}</em></h4>{outgoing.map((item) => <p className="graph-detail-row" key={item.id}>→ {data.nodes.find((candidate) => candidate.id === item.targetApiId)?.name} <small>{item.relationship}</small></p>)}<h4>Incoming dependencies <em>{incoming.length}</em></h4>{incoming.map((item) => <p className="graph-detail-row" key={item.id}>← {data.nodes.find((candidate) => candidate.id === item.sourceApiId)?.name} <small>{item.relationship}</small></p>)}</div>; }
function EdgePanel({ edge, data, onClose }: { edge: GraphData['edges'][number]; data: GraphData; onClose: () => void }) { return <div className="graph-detail"><button className="graph-close" onClick={onClose} aria-label="Close relationship details"><X size={15}/></button><p className="page-kicker">Relationship</p><h3>{edge.relationship}</h3><p>{data.nodes.find((node) => node.id === edge.sourceApiId)?.name} → {data.nodes.find((node) => node.id === edge.targetApiId)?.name}</p><dl><dt>Source version</dt><dd>{edge.sourceVersion || 'Not recorded'}</dd><dt>Target version</dt><dd>{edge.targetVersion || 'Not recorded'}</dd><dt>Review status</dt><dd>{edge.reviewStatus}</dd><dt>Created</dt><dd>{new Date(edge.createdAt).toLocaleString()}</dd></dl>{edge.description && <p>{edge.description}</p>}{edge.evidence && <small>Evidence: {edge.evidence}</small>}</div>; }
