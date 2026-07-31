/**
 * The workspace. Persisted to localStorage (gemini.md §0 Q4), so a half-finished
 * run survives a refresh. Documented limit: plans are private to this browser.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import defaultTemplate from '../templates/test_plan.md?raw';
import type {
    JiraSettings,
    LLMProvider,
    LLMSettings,
    PlanMeta,
    ServerConfig,
    Template,
    TestCase,
    TestCaseStatus,
    TestPlan,
} from './types';

const KEY = 'testplan-agent:workspace:v1';

export const BUILT_IN_TEMPLATE_ID = 'builtin:test_plan';

interface Workspace {
    jira: JiraSettings;
    llm: LLMSettings;
    meta: PlanMeta;
    templates: Template[];
    activeTemplateId: string;
    plans: TestPlan[];
    /** Set only by a successful Test Connection — never by a save. */
    verified: { jira?: { at: string; as: string }; llm?: { at: string; as: string } };
    /** Whether the server's non-secret settings have been copied in once. */
    hydrated?: boolean;
}

const EMPTY: Workspace = {
    jira: { baseUrl: '', email: '', apiToken: '', projectKey: '' },
    llm: { provider: 'groq', model: '', apiKey: '' },
    meta: { author: '', version: '1.0', environment: 'QA', browser: 'Chrome', baseUrl: '' },
    templates: [],
    activeTemplateId: BUILT_IN_TEMPLATE_ID,
    plans: [],
    verified: {},
};

function builtInTemplate(): Template {
    return {
        id: BUILT_IN_TEMPLATE_ID,
        name: 'Company test plan (15 sections)',
        body: defaultTemplate,
        builtIn: true,
        updatedAt: new Date().toISOString(),
    };
}

function load(): Workspace {
    try {
        const raw = localStorage.getItem(KEY);
        const saved: Partial<Workspace> = raw ? JSON.parse(raw) : {};
        const templates = saved.templates?.length ? saved.templates : [builtInTemplate()];

        // The built-in template ships with the app, so a newer app version must
        // win over the copy sitting in a user's browser from a previous release.
        const withFreshBuiltIn = templates.map((t) =>
            t.id === BUILT_IN_TEMPLATE_ID ? { ...builtInTemplate(), name: t.name } : t
        );

        return {
            ...EMPTY,
            ...saved,
            jira: { ...EMPTY.jira, ...saved.jira },
            llm: { ...EMPTY.llm, ...saved.llm },
            meta: { ...EMPTY.meta, ...saved.meta },
            templates: withFreshBuiltIn,
            plans: saved.plans ?? [],
            verified: saved.verified ?? {},
        };
    } catch {
        return { ...EMPTY, templates: [builtInTemplate()] };
    }
}

interface StoreValue extends Workspace {
    setJira: (value: JiraSettings) => void;
    setLLM: (value: LLMSettings) => void;
    setMeta: (value: PlanMeta) => void;
    setActiveTemplateId: (id: string) => void;
    fillFromServer: (config: ServerConfig) => void;
    saveTemplate: (template: Template) => void;
    deleteTemplate: (id: string) => void;
    activeTemplate: Template;
    savePlan: (plan: TestPlan) => void;
    deletePlan: (id: string) => void;
    setCaseStatus: (planId: string, caseId: string, status: TestCaseStatus) => void;
    markVerified: (which: 'jira' | 'llm', as: string) => void;
    reset: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
    const [workspace, setWorkspace] = useState<Workspace>(load);

    useEffect(() => {
        try {
            localStorage.setItem(KEY, JSON.stringify(workspace));
        } catch (error) {
            // Quota is the realistic failure: many plans with full markdown. Say so
            // rather than failing silently and losing the next save too.
            console.error('Could not persist the workspace — local storage may be full.', error);
        }
    }, [workspace]);

    const patch = useCallback((changes: Partial<Workspace>) => {
        setWorkspace((current) => ({ ...current, ...changes }));
    }, []);

    const value = useMemo<StoreValue>(() => {
        const activeTemplate =
            workspace.templates.find((t) => t.id === workspace.activeTemplateId) ??
            workspace.templates[0] ??
            builtInTemplate();

        return {
            ...workspace,
            activeTemplate,
            setJira: (jira) => patch({ jira }),
            setLLM: (llm) => patch({ llm }),
            setMeta: (meta) => patch({ meta }),
            setActiveTemplateId: (activeTemplateId) => patch({ activeTemplateId }),

            /**
             * Copy the server's non-secret settings into the form fields once, so
             * Connections and Settings show what the app is actually pointed at
             * instead of blank boxes that silently fall back to `.env`.
             *
             * Only ever fills a field that is empty, and never touches a token or
             * an API key — those stay server-side (invariant 2), which is why
             * their placeholders read "using server token".
             */
            fillFromServer: (config) =>
                setWorkspace((current) => {
                    if (current.hydrated) return current;
                    return {
                        ...current,
                        hydrated: true,
                        jira: {
                            ...current.jira,
                            baseUrl: current.jira.baseUrl || config.jira.baseUrl,
                            email: current.jira.email || config.jira.email,
                            projectKey: current.jira.projectKey || config.jira.projectKey,
                        },
                        llm: {
                            ...current.llm,
                            provider: (config.llm.provider as LLMProvider) || current.llm.provider,
                            model: current.llm.model || config.llm.model,
                        },
                    };
                }),

            saveTemplate: (template) =>
                setWorkspace((current) => {
                    const exists = current.templates.some((t) => t.id === template.id);
                    return {
                        ...current,
                        templates: exists
                            ? current.templates.map((t) => (t.id === template.id ? template : t))
                            : [...current.templates, template],
                    };
                }),

            deleteTemplate: (id) =>
                setWorkspace((current) => {
                    if (id === BUILT_IN_TEMPLATE_ID) return current;
                    const templates = current.templates.filter((t) => t.id !== id);
                    return {
                        ...current,
                        templates,
                        activeTemplateId:
                            current.activeTemplateId === id ? BUILT_IN_TEMPLATE_ID : current.activeTemplateId,
                    };
                }),

            savePlan: (plan) =>
                setWorkspace((current) => {
                    const exists = current.plans.some((p) => p.id === plan.id);
                    return {
                        ...current,
                        plans: exists
                            ? current.plans.map((p) => (p.id === plan.id ? plan : p))
                            : [plan, ...current.plans],
                    };
                }),

            deletePlan: (id) =>
                setWorkspace((current) => ({ ...current, plans: current.plans.filter((p) => p.id !== id) })),

            setCaseStatus: (planId, caseId, status) =>
                setWorkspace((current) => ({
                    ...current,
                    plans: current.plans.map((plan) =>
                        plan.id !== planId
                            ? plan
                            : {
                                  ...plan,
                                  updatedAt: new Date().toISOString(),
                                  testCases: plan.testCases.map((c: TestCase) =>
                                      c.id === caseId ? { ...c, status } : c
                                  ),
                              }
                    ),
                })),

            markVerified: (which, as) =>
                setWorkspace((current) => ({
                    ...current,
                    verified: { ...current.verified, [which]: { at: new Date().toISOString(), as } },
                })),

            reset: () => setWorkspace({ ...EMPTY, templates: [builtInTemplate()] }),
        };
    }, [workspace, patch]);

    return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
    const value = useContext(StoreContext);
    if (!value) throw new Error('useStore must be used inside StoreProvider');
    return value;
}
