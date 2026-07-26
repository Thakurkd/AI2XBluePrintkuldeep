import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from 'react';
import type { GeneratedCode, JiraSettings, LLMSettings, TestCase, TestPlan, UserStory } from './types';

const STORAGE_KEY = 'test-orchestrator:v1';

interface Persisted {
    jira: JiraSettings;
    llm: LLMSettings;
    stories: UserStory[];
    selectedStoryKeys: string[];
    testPlan: TestPlan | null;
    testCases: TestCase[];
    selectedTestCaseId: string | null;
    generatedCode: Record<string, GeneratedCode>;
}

const EMPTY: Persisted = {
    // Blank Jira/LLM fields mean "use the server's .env" - the token never needs
    // to live in the browser at all.
    jira: { baseUrl: '', email: '', apiToken: '', projectKey: '' },
    llm: { provider: 'groq', model: 'llama-3.3-70b-versatile', apiKey: '' },
    stories: [],
    selectedStoryKeys: [],
    testPlan: null,
    testCases: [],
    selectedTestCaseId: null,
    generatedCode: {},
};

function load(): Persisted {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY;
    } catch {
        return EMPTY;
    }
}

interface Store extends Persisted {
    setJira: (jira: JiraSettings) => void;
    setLLM: (llm: LLMSettings) => void;
    setStories: (stories: UserStory[]) => void;
    toggleStory: (key: string) => void;
    selectAllStories: (selected: boolean) => void;
    setTestPlan: (plan: TestPlan | null) => void;
    addTestCases: (cases: TestCase[]) => void;
    updateTestCase: (id: string, patch: Partial<TestCase>) => void;
    removeTestCase: (id: string) => void;
    clearTestCases: () => void;
    setSelectedTestCase: (id: string | null) => void;
    setGeneratedCode: (code: GeneratedCode) => void;
    selectedStories: UserStory[];
    selectedTestCase: TestCase | null;
    reset: () => void;
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
    const [state, setState] = useState<Persisted>(load);

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    }, [state]);

    const patch = useCallback((update: Partial<Persisted>) => {
        setState((prev) => ({ ...prev, ...update }));
    }, []);

    const value = useMemo<Store>(() => {
        const selectedStories = state.stories.filter((s) => state.selectedStoryKeys.includes(s.key));
        const selectedTestCase =
            state.testCases.find((c) => c.id === state.selectedTestCaseId) ?? null;

        return {
            ...state,
            selectedStories,
            selectedTestCase,
            setJira: (jira) => patch({ jira }),
            setLLM: (llm) => patch({ llm }),

            setStories: (stories) => {
                // Drop selections for stories that are no longer in the result set.
                const keys = new Set(stories.map((s) => s.key));
                setState((prev) => ({
                    ...prev,
                    stories,
                    selectedStoryKeys: prev.selectedStoryKeys.filter((k) => keys.has(k)),
                }));
            },

            toggleStory: (key) =>
                setState((prev) => ({
                    ...prev,
                    selectedStoryKeys: prev.selectedStoryKeys.includes(key)
                        ? prev.selectedStoryKeys.filter((k) => k !== key)
                        : [...prev.selectedStoryKeys, key],
                })),

            selectAllStories: (selected) =>
                setState((prev) => ({
                    ...prev,
                    selectedStoryKeys: selected ? prev.stories.map((s) => s.key) : [],
                })),

            setTestPlan: (testPlan) => patch({ testPlan }),

            addTestCases: (cases) =>
                setState((prev) => {
                    // Regenerating a story replaces its cases rather than duplicating them.
                    const regenerated = new Set(cases.map((c) => c.storyKey));
                    const kept = prev.testCases.filter((c) => !regenerated.has(c.storyKey));
                    return { ...prev, testCases: [...kept, ...cases] };
                }),

            updateTestCase: (id, update) =>
                setState((prev) => ({
                    ...prev,
                    testCases: prev.testCases.map((c) => (c.id === id ? { ...c, ...update } : c)),
                })),

            removeTestCase: (id) =>
                setState((prev) => ({
                    ...prev,
                    testCases: prev.testCases.filter((c) => c.id !== id),
                    selectedTestCaseId: prev.selectedTestCaseId === id ? null : prev.selectedTestCaseId,
                })),

            clearTestCases: () =>
                patch({ testCases: [], generatedCode: {}, selectedTestCaseId: null }),

            setSelectedTestCase: (selectedTestCaseId) => patch({ selectedTestCaseId }),

            setGeneratedCode: (code) =>
                setState((prev) => ({
                    ...prev,
                    generatedCode: { ...prev.generatedCode, [code.testCaseId]: code },
                    testCases: prev.testCases.map((c) =>
                        c.id === code.testCaseId ? { ...c, status: 'Automated' } : c
                    ),
                })),

            reset: () => setState(EMPTY),
        };
    }, [state, patch]);

    return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
    const store = useContext(StoreContext);
    if (!store) throw new Error('useStore must be used inside <StoreProvider>');
    return store;
}
