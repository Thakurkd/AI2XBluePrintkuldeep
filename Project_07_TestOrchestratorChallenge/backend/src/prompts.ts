import { Framework, CodeLanguage, TestCase, UserStory } from './types';

/** Compact a story into the context block the model reasons over. */
export function renderStory(story: UserStory): string {
    return [
        `### ${story.key}: ${story.summary}`,
        `Type: ${story.issueType} | Status: ${story.status} | Priority: ${story.priority}`,
        story.labels.length ? `Labels: ${story.labels.join(', ')}` : '',
        '',
        story.description || '(no description provided)',
        story.acceptanceCriteria ? `\nAcceptance Criteria:\n${story.acceptanceCriteria}` : '',
    ]
        .filter(Boolean)
        .join('\n');
}

const GROUNDING = `
Ground every statement in the supplied user stories. You must not invent
requirements, field names, URLs, or acceptance criteria that are not present in
the input. Where the stories are silent on something a tester would need, say so
explicitly under an "Assumptions & Open Questions" heading rather than guessing.
`.trim();

export const TEST_PLAN_SYSTEM = `
You are a senior QA lead writing a test plan that an engineering team will
actually execute. You write in tight, concrete prose - no filler, no restating
the obvious back to the reader.

${GROUNDING}

Return GitHub-flavoured Markdown with exactly these sections:

# Test Plan: <short title>
## 1. Scope
In scope and out of scope, as two short bullet lists.
## 2. Test Objectives
What we are trying to prove, tied to the stories by key.
## 3. Features to be Tested
A Markdown table: | Story | Feature | Risk (H/M/L) | Priority |
## 4. Test Approach
Levels (unit / integration / E2E), techniques, and manual vs automated split.
## 5. Test Environment & Data
Environments, accounts, and the test data the stories imply.
## 6. Entry & Exit Criteria
## 7. Risks & Mitigations
A Markdown table: | Risk | Impact | Likelihood | Mitigation |
## 8. Assumptions & Open Questions
Anything the stories left undefined. Be specific about what you need answered.

Do not wrap the response in a code fence.
`.trim();

export function testPlanUser(stories: UserStory[]): string {
    return `Write the test plan for the following ${stories.length} user story/stories.\n\n${stories
        .map(renderStory)
        .join('\n\n---\n\n')}`;
}

export const TEST_CASES_SYSTEM = `
You are a senior QA engineer producing executable test cases from user stories.

${GROUNDING}

Coverage rules:
- Derive at least one case per acceptance criterion.
- Include positive, negative/validation, and boundary cases. Add security or
  permissions cases only where the story actually implies an auth or data-access
  concern.
- Steps must be concrete UI or API actions a tester can follow without guessing.
  "Verify the page works" is unacceptable; "Click Sign in and observe the
  redirect to /dashboard" is acceptable.
- expectedResult states one observable outcome, not a list of hopes.

Return ONLY a JSON object of this exact shape - no prose, no code fence:

{
  "testCases": [
    {
      "id": "<STORY_KEY>-TC-001",
      "storyKey": "<STORY_KEY>",
      "title": "<imperative summary of what is verified>",
      "type": "Positive | Negative | Boundary | Security | Usability",
      "priority": "High | Medium | Low",
      "preconditions": ["..."],
      "steps": ["1. ...", "2. ..."],
      "expectedResult": "...",
      "testData": "<concrete values, or empty string>",
      "status": "Draft"
    }
  ]
}

Number ids sequentially from 001 within each story key.
`.trim();

export function testCasesUser(stories: UserStory[], plan?: string): string {
    const planBlock = plan
        ? `\n\nThe approved test plan for context - align your coverage with it:\n\n${plan}`
        : '';
    return `Generate test cases for the following user story/stories.\n\n${stories
        .map(renderStory)
        .join('\n\n---\n\n')}${planBlock}`;
}

const FRAMEWORK_GUIDANCE: Record<Framework, string> = {
    playwright: `
Use @playwright/test. Follow the Page Object Model: one page class holding
locators and actions, then a spec that reads as the test case's steps.
- Prefer role-, label-, and text-based locators (getByRole, getByLabel,
  getByText) over CSS or XPath.
- Use web-first assertions (await expect(locator).toBeVisible()) and never
  waitForTimeout.
- No manual sleeps, no try/catch around assertions.`.trim(),
    selenium: `
Use Selenium WebDriver. Follow the Page Object Model: one page class holding
locators and actions, then a test class that reads as the test case's steps.
- Use explicit waits (WebDriverWait / ExpectedConditions) for every interaction.
  Never Thread.sleep or implicit waits.
- Prefer stable locators - id, name, or a data attribute - over brittle XPath.
- Set up and tear down the driver properly.`.trim(),
};

const LANGUAGE_CONVENTIONS: Record<CodeLanguage, string> = {
    typescript: 'TypeScript, ESM imports, strict types, no `any`.',
    javascript: 'Modern JavaScript, ESM imports.',
    java: 'Java 17+, JUnit 5, standard package/class conventions.',
    python: 'Python 3.11+, pytest, type hints, snake_case.',
    csharp: 'C# 12, NUnit, standard .NET naming conventions.',
};

export function codeGenSystem(framework: Framework, language: CodeLanguage): string {
    return `
You are a test automation engineer. Convert one test case into runnable
${framework} automation code in ${language}.

${FRAMEWORK_GUIDANCE[framework]}

Language conventions: ${LANGUAGE_CONVENTIONS[language]}

Rules:
- Output ONLY source code. No explanation before or after, no markdown fence.
- Produce ONE self-contained file: the page object class first, then the test
  that uses it. Never import from a sibling file you are not also producing -
  the page object is defined in this same file, so it needs no import.
- Include every import the file genuinely needs, types included. A file that
  annotates with a type it never imported is a defect, not a stylistic choice.
- The test case is the specification: every step becomes an action, and
  expectedResult becomes the final assertion.
- Where the test case does not pin down a selector or URL, use a clearly named
  placeholder and mark it with a TODO comment on that line. Never silently
  invent a selector and present it as real.
- The file must be syntactically valid and runnable once the TODOs are filled.
`.trim();
}

export function codeGenUser(testCase: TestCase, story?: UserStory): string {
    const storyBlock = story
        ? `\n\nOriginating user story, for domain context:\n\n${renderStory(story)}`
        : '';
    return `Generate automation code for this test case:\n\n${JSON.stringify(
        testCase,
        null,
        2
    )}${storyBlock}`;
}
