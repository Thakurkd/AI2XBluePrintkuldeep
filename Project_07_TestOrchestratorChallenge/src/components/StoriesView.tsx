import { useState } from 'react';
import { api } from '../api';
import { useStore } from '../store';
import type { ViewId } from '../types';
import { Badge, Banner, EmptyState, PageHeader, Panel, Spinner } from './ui';

export default function StoriesView({ onNavigate }: { onNavigate: (view: ViewId) => void }) {
    const { jira, stories, setStories, selectedStoryKeys, toggleStory, selectAllStories } = useStore();
    const [projectKey, setProjectKey] = useState(jira.projectKey);
    const [jql, setJql] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [expanded, setExpanded] = useState<string | null>(null);

    async function fetchStories() {
        setBusy(true);
        setError(null);
        try {
            const { stories: fetched } = await api.fetchStories(jira, {
                projectKey: projectKey.trim() || undefined,
                jql: jql.trim() || undefined,
                maxResults: 50,
            });
            setStories(fetched);
            if (!fetched.length) setError('That query matched no issues.');
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setBusy(false);
        }
    }

    const allSelected = stories.length > 0 && selectedStoryKeys.length === stories.length;

    return (
        <>
            <PageHeader
                title="User Stories"
                subtitle="Pull requirements straight from Jira, then pick the ones to orchestrate."
                actions={
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => onNavigate('testPlan')}
                        disabled={!selectedStoryKeys.length}
                    >
                        Next: Test Plan →
                    </button>
                }
            />

            <Panel title="Fetch from Jira">
                <div className="form-row">
                    <label className="field field-inline">
                        <span className="field-label">Project or issue key</span>
                        <input
                            value={projectKey}
                            placeholder="SCRUM"
                            onChange={(e) => setProjectKey(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchStories()}
                        />
                        <span className="field-hint">SCRUM, or a single issue like SCRUM-5.</span>
                    </label>
                    <label className="field field-inline field-grow">
                        <span className="field-label">Search (optional — overrides the key)</span>
                        <input
                            value={jql}
                            placeholder="SCRUM-5, SCRUM-3   or   project = SCRUM AND status != Done"
                            onChange={(e) => setJql(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && fetchStories()}
                        />
                        <span className="field-hint">Issue keys or full JQL — both work.</span>
                    </label>
                    <button type="button" className="btn btn-primary" onClick={fetchStories} disabled={busy}>
                        {busy ? 'Fetching…' : 'Fetch stories'}
                    </button>
                </div>

                {error && <Banner kind="error">{error}</Banner>}
                {busy && <Spinner label="Querying Jira…" />}
            </Panel>

            {stories.length > 0 && (
                <Panel
                    title={`${stories.length} stories · ${selectedStoryKeys.length} selected`}
                    actions={
                        <button
                            type="button"
                            className="btn btn-ghost"
                            onClick={() => selectAllStories(!allSelected)}
                        >
                            {allSelected ? 'Deselect all' : 'Select all'}
                        </button>
                    }
                >
                    <ul className="story-list">
                        {stories.map((story) => {
                            const selected = selectedStoryKeys.includes(story.key);
                            const open = expanded === story.key;
                            return (
                                <li key={story.key} className={`story-card ${selected ? 'story-selected' : ''}`}>
                                    <div className="story-head">
                                        <input
                                            type="checkbox"
                                            checked={selected}
                                            onChange={() => toggleStory(story.key)}
                                            aria-label={`Select ${story.key}`}
                                        />
                                        <div className="story-title">
                                            <div className="story-meta">
                                                <code className="story-key">{story.key}</code>
                                                <Badge tone={story.issueType}>{story.issueType}</Badge>
                                                <Badge tone={story.priority}>{story.priority}</Badge>
                                                <span className="muted">{story.status}</span>
                                                {story.acceptanceCriteria && (
                                                    <Badge tone="ac">has AC</Badge>
                                                )}
                                            </div>
                                            <p className="story-summary">{story.summary}</p>
                                        </div>
                                        <div className="story-actions">
                                            <a
                                                href={story.url}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="btn btn-ghost"
                                            >
                                                Jira ↗
                                            </a>
                                            <button
                                                type="button"
                                                className="btn btn-ghost"
                                                onClick={() => setExpanded(open ? null : story.key)}
                                            >
                                                {open ? 'Hide' : 'Details'}
                                            </button>
                                        </div>
                                    </div>

                                    {open && (
                                        <div className="story-detail">
                                            <h4>Description</h4>
                                            <pre>{story.description || '(none)'}</pre>
                                            {story.acceptanceCriteria && (
                                                <>
                                                    <h4>Acceptance criteria</h4>
                                                    <pre>{story.acceptanceCriteria}</pre>
                                                </>
                                            )}
                                        </div>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                </Panel>
            )}

            {!stories.length && !busy && (
                <EmptyState
                    title="No stories loaded"
                    hint="Enter a project key (or JQL) above and fetch. Configure your Jira site in Settings first."
                />
            )}
        </>
    );
}
