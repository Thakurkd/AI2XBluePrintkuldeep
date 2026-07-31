import { useEffect, useState } from 'react';
import { api } from './api';
import { useStore } from './store';
import ConnectionsView from './components/ConnectionsView';
import DashboardView from './components/DashboardView';
import GenerateView from './components/GenerateView';
import PlanViewer from './components/PlanViewer';
import PlansView from './components/PlansView';
import SettingsView from './components/SettingsView';
import TemplatesView from './components/TemplatesView';

type View = 'dashboard' | 'generate' | 'plans' | 'templates' | 'connections' | 'settings' | 'plan';

const NAV: { id: View; label: string }[] = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'generate', label: 'Generate' },
    { id: 'plans', label: 'Plans' },
    { id: 'templates', label: 'Templates' },
    { id: 'connections', label: 'Connections' },
    { id: 'settings', label: 'Settings' },
];

export default function App() {
    const { plans, templates, verified, fillFromServer } = useStore();
    const [view, setView] = useState<View>('dashboard');
    const [openPlanId, setOpenPlanId] = useState<string | null>(null);

    // Show what the app is pointed at rather than empty boxes. Failure is silent
    // on purpose: each view already reports an unreachable API in its own words.
    useEffect(() => {
        api.serverConfig().then(fillFromServer).catch(() => {});
    }, [fillFromServer]);

    function openPlan(id: string) {
        setOpenPlanId(id);
        setView('plan');
    }

    const counts: Partial<Record<View, number>> = {
        plans: plans.length,
        templates: templates.length,
    };

    return (
        <div className="app">
            <nav className="sidebar" aria-label="Main">
                <div className="brand">
                    <span className="brand-name">QA Plan Agent</span>
                    <span className="brand-tag">v0.1</span>
                </div>

                {NAV.map((item) => (
                    <button
                        key={item.id}
                        type="button"
                        className="nav-item"
                        aria-current={view === item.id ? 'page' : undefined}
                        onClick={() => setView(item.id)}
                    >
                        <span>{item.label}</span>
                        {counts[item.id] !== undefined && <span className="nav-count">{counts[item.id]}</span>}
                    </button>
                ))}

                {/*
                  A live wire indicator, so nobody starts a generation that was
                  going to fail at step one. Never colour alone — the dot has a
                  text label beside it.
                */}
                <div className="sidebar-foot">
                    <span className={`wire ${verified.jira ? 'wire-ok' : ''}`}>
                        <span className="wire-dot" aria-hidden="true" />
                        Jira {verified.jira ? 'verified' : 'not tested'}
                    </span>
                    <span className={`wire ${verified.llm ? 'wire-ok' : ''}`}>
                        <span className="wire-dot" aria-hidden="true" />
                        Model {verified.llm ? 'verified' : 'not tested'}
                    </span>
                </div>
            </nav>

            <main className="main">
                {view === 'dashboard' && (
                    <DashboardView onOpenPlan={openPlan} onGenerate={() => setView('generate')} />
                )}
                {view === 'generate' && <GenerateView onOpenPlan={openPlan} />}
                {view === 'plans' && (
                    <PlansView onOpenPlan={openPlan} onGenerate={() => setView('generate')} />
                )}
                {view === 'templates' && <TemplatesView />}
                {view === 'connections' && <ConnectionsView />}
                {view === 'settings' && <SettingsView />}
                {view === 'plan' && openPlanId && (
                    <PlanViewer planId={openPlanId} onBack={() => setView('plans')} />
                )}
            </main>
        </div>
    );
}
