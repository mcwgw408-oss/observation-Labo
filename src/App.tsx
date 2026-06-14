import {
  BookOpen,
  CalendarDays,
  FlaskConical,
  Lightbulb,
  MessageCircle,
  Plus,
  Search,
  Sparkles,
  Tags,
} from 'lucide-react';
import { FormEvent, useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'hasshin-kansatsu-labo-entries';

const categories = ['発信', '交流', '記事', 'note', 'Substack', 'Threads', 'X', 'AI', 'その他'] as const;

type Category = (typeof categories)[number];

type Entry = {
  id: string;
  date: string;
  title: string;
  categories: Category[];
  trigger: string;
  event: string;
  surprise: string;
  hypothesis: string;
  insight: string;
  nextAction: string;
  fun: string;
  createdAt: string;
};

type View = 'dashboard' | 'list' | 'new' | 'detail';

const today = new Date().toISOString().slice(0, 10);

const sampleEntries: Entry[] = [
  {
    id: 'sample-1',
    date: today,
    title: '通販番組の記事が想像より読まれた',
    categories: ['発信', '記事', 'note'],
    trigger: '数字を見た',
    event: '通販番組について書いた記事が4000ビューに届いていた。',
    surprise: '自分では軽く書いたテーマほど、読者には入口として機能していた。',
    hypothesis: '身近な題材で、読者が自分の体験と重ねやすかったのかもしれない。',
    insight: '深い考察だけでなく、日常の違和感を丁寧に拾う記事にも価値がある。',
    nextAction: '身近な題材から始めて、最後に自分の仮説を添える構成を試す。',
    fun: '想像と結果がまったく違って、観察対象としてかなり面白かった。',
    createdAt: new Date().toISOString(),
  },
];

const emptyEntry = (): Entry => ({
  id: crypto.randomUUID(),
  date: today,
  title: '',
  categories: ['発信'],
  trigger: '',
  event: '',
  surprise: '',
  hypothesis: '',
  insight: '',
  nextAction: '',
  fun: '',
  createdAt: new Date().toISOString(),
});

function App() {
  const [entries, setEntries] = useState<Entry[]>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : sampleEntries;
  });
  const [view, setView] = useState<View>('dashboard');
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState<Entry>(() => emptyEntry());
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries]);

  const sortedEntries = useMemo(
    () => [...entries].sort((a, b) => `${b.date}-${b.createdAt}`.localeCompare(`${a.date}-${a.createdAt}`)),
    [entries],
  );

  const filteredEntries = useMemo(() => {
    const word = query.trim().toLowerCase();
    if (!word) return sortedEntries;
    return sortedEntries.filter((entry) =>
      [entry.title, entry.categories.join(' '), entry.hypothesis, entry.insight].some((item) =>
        item.toLowerCase().includes(word),
      ),
    );
  }, [query, sortedEntries]);

  const selectedEntry = entries.find((entry) => entry.id === selectedId) ?? sortedEntries[0];

  const stats = useMemo(() => {
    const counts = categories.map((category) => ({
      category,
      count: entries.filter((entry) => entry.categories.includes(category)).length,
    }));
    const used = counts.filter((item) => item.count > 0).sort((a, b) => b.count - a.count);
    return {
      counts,
      top: used.slice(0, 3),
      recentInsights: sortedEntries.filter((entry) => entry.insight).slice(0, 5),
      recentHypotheses: sortedEntries.filter((entry) => entry.hypothesis).slice(0, 5),
    };
  }, [entries, sortedEntries]);

  const saveEntry = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.title.trim()) return;
    const entry = { ...draft, createdAt: new Date().toISOString() };
    setEntries((current) => [entry, ...current]);
    setDraft(emptyEntry());
    setSelectedId(entry.id);
    setView('detail');
  };

  const openDetail = (id: string) => {
    setSelectedId(id);
    setView('detail');
  };

  const toggleCategory = (category: Category) => {
    setDraft((current) => {
      const exists = current.categories.includes(category);
      const next = exists ? current.categories.filter((item) => item !== category) : [...current.categories, category];
      return { ...current, categories: next.length ? next : ['その他'] };
    });
  };

  return (
    <main className="app-shell">
      <aside className="side-panel">
        <div className="brand">
          <div className="brand-mark">
            <FlaskConical size={24} aria-hidden="true" />
          </div>
          <div>
            <p>交流ログLabo</p>
            <h1>発信観察Labo</h1>
          </div>
        </div>
        <nav className="nav-tabs" aria-label="画面切り替え">
          <button className={view === 'dashboard' ? 'active' : ''} onClick={() => setView('dashboard')}>
            <Sparkles size={18} aria-hidden="true" />
            ダッシュボード
          </button>
          <button className={view === 'list' ? 'active' : ''} onClick={() => setView('list')}>
            <BookOpen size={18} aria-hidden="true" />
            観察一覧
          </button>
          <button className={view === 'new' ? 'active' : ''} onClick={() => setView('new')}>
            <Plus size={18} aria-hidden="true" />
            新規記録
          </button>
        </nav>
        <section className="lab-note">
          <p>数字の正解探しより、「なぜ？」「発見」「仮説」「面白かったこと」を残す場所。</p>
        </section>
      </aside>

      <section className="workspace">
        {view === 'dashboard' && (
          <Dashboard stats={stats} total={entries.length} openDetail={openDetail} />
        )}
        {view === 'list' && (
          <ListView entries={filteredEntries} query={query} setQuery={setQuery} openDetail={openDetail} />
        )}
        {view === 'new' && (
          <EntryForm draft={draft} setDraft={setDraft} saveEntry={saveEntry} toggleCategory={toggleCategory} />
        )}
        {view === 'detail' && selectedEntry && <DetailView entry={selectedEntry} />}
      </section>
    </main>
  );
}

function Dashboard({
  stats,
  total,
  openDetail,
}: {
  stats: {
    counts: { category: Category; count: number }[];
    top: { category: Category; count: number }[];
    recentInsights: Entry[];
    recentHypotheses: Entry[];
  };
  total: number;
  openDetail: (id: string) => void;
}) {
  return (
    <div className="view-stack">
      <header className="page-header">
        <p>Observation Dashboard</p>
        <h2>発信活動を、研究ノートとして眺める</h2>
      </header>
      <div className="stat-grid">
        <article className="metric-card">
          <CalendarDays size={22} aria-hidden="true" />
          <span>登録件数</span>
          <strong>{total}</strong>
        </article>
        <article className="metric-card">
          <Tags size={22} aria-hidden="true" />
          <span>よく使うカテゴリ</span>
          <strong>{stats.top.map((item) => item.category).join(' / ') || 'まだなし'}</strong>
        </article>
      </div>
      <section className="board-section">
        <h3>カテゴリ別件数</h3>
        <div className="category-bars">
          {stats.counts.map((item) => (
            <div className="bar-row" key={item.category}>
              <span>{item.category}</span>
              <div>
                <i style={{ width: `${Math.max(8, item.count * 18)}%` }} />
              </div>
              <b>{item.count}</b>
            </div>
          ))}
        </div>
      </section>
      <div className="two-column">
        <RecentList title="最近の気づき" entries={stats.recentInsights} field="insight" openDetail={openDetail} />
        <RecentList title="最近の仮説" entries={stats.recentHypotheses} field="hypothesis" openDetail={openDetail} />
      </div>
    </div>
  );
}

function RecentList({
  title,
  entries,
  field,
  openDetail,
}: {
  title: string;
  entries: Entry[];
  field: 'insight' | 'hypothesis';
  openDetail: (id: string) => void;
}) {
  return (
    <section className="board-section">
      <h3>{title}</h3>
      <div className="note-list">
        {entries.map((entry) => (
          <button key={entry.id} onClick={() => openDetail(entry.id)}>
            <span>{entry.date}</span>
            <strong>{entry.title}</strong>
            <p>{entry[field]}</p>
          </button>
        ))}
        {!entries.length && <p className="empty-text">まだ記録がありません。</p>}
      </div>
    </section>
  );
}

function ListView({
  entries,
  query,
  setQuery,
  openDetail,
}: {
  entries: Entry[];
  query: string;
  setQuery: (query: string) => void;
  openDetail: (id: string) => void;
}) {
  return (
    <div className="view-stack">
      <header className="page-header">
        <p>Observation Logs</p>
        <h2>観察一覧</h2>
      </header>
      <label className="search-box">
        <Search size={18} aria-hidden="true" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="タイトル、カテゴリ、仮説、気づきで検索"
        />
      </label>
      <div className="entry-table" role="list">
        {entries.map((entry) => (
          <button key={entry.id} className="entry-row" onClick={() => openDetail(entry.id)} role="listitem">
            <time>{entry.date}</time>
            <div>
              <strong>{entry.title}</strong>
              <p>{entry.categories.join(' / ')}</p>
            </div>
            <p>{entry.surprise || '驚いたことは未記入'}</p>
            <p>{entry.hypothesis || '仮説は未記入'}</p>
          </button>
        ))}
        {!entries.length && <p className="empty-text">該当する観察ログがありません。</p>}
      </div>
    </div>
  );
}

function EntryForm({
  draft,
  setDraft,
  saveEntry,
  toggleCategory,
}: {
  draft: Entry;
  setDraft: (entry: Entry | ((entry: Entry) => Entry)) => void;
  saveEntry: (event: FormEvent<HTMLFormElement>) => void;
  toggleCategory: (category: Category) => void;
}) {
  const update = (key: keyof Entry, value: string) => setDraft((current) => ({ ...current, [key]: value }));

  return (
    <form className="view-stack form-view" onSubmit={saveEntry}>
      <header className="page-header">
        <p>New Observation</p>
        <h2>出来事から仮説を残す</h2>
      </header>
      <div className="form-grid">
        <label>
          日付
          <input type="date" value={draft.date} onChange={(event) => update('date', event.target.value)} />
        </label>
        <label>
          タイトル
          <input value={draft.title} onChange={(event) => update('title', event.target.value)} required />
        </label>
      </div>
      <section className="field-group">
        <h3>カテゴリ</h3>
        <div className="chip-grid">
          {categories.map((category) => (
            <button
              type="button"
              key={category}
              className={draft.categories.includes(category) ? 'chip selected' : 'chip'}
              onClick={() => toggleCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </section>
      <div className="form-grid">
        <TextArea label="きっかけ" value={draft.trigger} onChange={(value) => update('trigger', value)} />
        <TextArea label="出来事" value={draft.event} onChange={(value) => update('event', value)} />
        <TextArea label="驚いたこと" value={draft.surprise} onChange={(value) => update('surprise', value)} />
        <TextArea label="なぜだと思う？" value={draft.hypothesis} onChange={(value) => update('hypothesis', value)} />
        <TextArea label="気づき" value={draft.insight} onChange={(value) => update('insight', value)} />
        <TextArea label="次に試したいこと" value={draft.nextAction} onChange={(value) => update('nextAction', value)} />
      </div>
      <TextArea label="面白かったこと" value={draft.fun} onChange={(value) => update('fun', value)} />
      <button className="primary-action" type="submit">
        <Lightbulb size={18} aria-hidden="true" />
        観察ログを保存
      </button>
    </form>
  );
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label>
      {label}
      <textarea value={value} onChange={(event) => onChange(event.target.value)} rows={4} />
    </label>
  );
}

function DetailView({ entry }: { entry: Entry }) {
  const items = [
    ['きっかけ', entry.trigger],
    ['出来事', entry.event],
    ['驚いたこと', entry.surprise],
    ['なぜだと思う？', entry.hypothesis],
    ['気づき', entry.insight],
    ['次に試したいこと', entry.nextAction],
    ['面白かったこと', entry.fun],
  ];

  return (
    <article className="view-stack detail-view">
      <header className="page-header">
        <p>{entry.date}</p>
        <h2>{entry.title}</h2>
      </header>
      <div className="detail-tags">
        {entry.categories.map((category) => (
          <span key={category}>{category}</span>
        ))}
      </div>
      {items.map(([label, value]) => (
        <section className="detail-section" key={label}>
          <h3>
            <MessageCircle size={18} aria-hidden="true" />
            {label}
          </h3>
          <p>{value || '未記入'}</p>
        </section>
      ))}
    </article>
  );
}

export default App;
