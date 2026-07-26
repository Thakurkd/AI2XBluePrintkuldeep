import { useState } from 'react';
import { useStore } from './store';
import type { ViewId } from './types';
import SettingsView from './components/SettingsView';
import StoriesView from './components/StoriesView';
import TestPlanView from './components/TestPlanView';
import TestCasesView from './components/TestCasesView';
import DashboardView from './components/DashboardView';
import CodeGeneratorView from './components/CodeGeneratorView';

const NAV: { id: ViewId; label: string; icon: string }[] = [
    { id: 'settings', label: 'Settings', icon: '⚙' },
    { id: 'stories', label: 'User Stories', icon: '🎫' },
    { id: 'testPlan', label: 'Test Plan', icon: '📋' },
    { id: 'testCases', label: 'Test Cases', icon: '☰' },
    { id: 'dashboard', label: 'Dashboard', icon: '▦' },
    { id: 'codeGenerator', label: 'Code Generator', icon: '</>' },
];

export default function App() {
    const [view, setView] = useState<ViewId>('stories');
    const [collapsed, setCollapsed] = useState(false);
    const { stories, testCases, selectedStoryKeys } = useStore();

    const counts: Partial<Record<ViewId, number>> = {
        stories: stories.length,
        testCases: testCases.length,
        dashboard: testCases.length,
    };

    return (
        <div className={`app ${collapsed ? 'app-collapsed' : ''}`}>
            <aside className="sidebar">
                <div className="brand">
                    <span className="brand-mark">🚀</span>
                    <span className="brand-name">Test Orchestrator</span>
                </div>

                <nav>
                    {NAV.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            className={`nav-item ${view === item.id ? 'nav-item-active' : ''}`}
                            onClick={() => setView(item.id)}
                            title={item.label}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            <span className="nav-label">{item.label}</span>
                            {counts[item.id] ? <span className="nav-count">{counts[item.id]}</span> : null}
                        </button>
                    ))}
                </nav>

                <div className="sidebar-foot">
                    <span className="sidebar-status">
                        {selectedStoryKeys.length} of {stories.length} stories selected
                    </span>
                    <button
                        type="button"
                        className="collapse-btn"
                        onClick={() => setCollapsed((c) => !c)}
                        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                    >
                        {collapsed ? '›' : '‹'}
                    </button>
                </div>
            </aside>

            <main className="content">
                {view === 'settings' && <SettingsView />}
                {view === 'stories' && <StoriesView onNavigate={setView} />}
                {view === 'testPlan' && <TestPlanView onNavigate={setView} />}
                {view === 'testCases' && <TestCasesView onNavigate={setView} />}
                {view === 'dashboard' && <DashboardView onNavigate={setView} />}
                {view === 'codeGenerator' && <CodeGeneratorView />}
            </main>
        </div>
    );
}
