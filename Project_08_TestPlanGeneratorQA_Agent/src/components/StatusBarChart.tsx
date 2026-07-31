/**
 * Test Results Overview — counts of test cases by status.
 *
 * Form: these are *states*, not series, so the status palette applies rather than
 * a categorical one, and bars sit in lifecycle order rather than sorted by size
 * (a value-ramp on nominal categories would double-encode length as hue).
 *
 * Colour was validated, not eyeballed. The validator's finding that matters:
 * Passed (good green) against Failed (critical red) is ΔE 4.1 under deuteranopia
 * — a red/green pair a deuteranope cannot separate. Hue therefore carries none of
 * the meaning here: every bar has a text label, a distinct shape glyph, a value at
 * the tip, and a table-view twin. That is the documented mitigation for status
 * colours, which never travel without an icon and a label.
 */
import { useState } from 'react';
import type { TestCaseStatus } from '../types';
import { TEST_CASE_STATUSES } from '../types';

/** Status palette from the design system — fixed, never themed. */
export const STATUS_STYLE: Record<TestCaseStatus, { colorVar: string; glyph: string; label: string }> = {
    Draft: { colorVar: 'var(--status-neutral)', glyph: '○', label: 'Draft' },
    Ready: { colorVar: 'var(--status-info)', glyph: '◇', label: 'Ready' },
    InProgress: { colorVar: 'var(--status-warning)', glyph: '◐', label: 'In progress' },
    Passed: { colorVar: 'var(--status-good)', glyph: '✓', label: 'Passed' },
    Failed: { colorVar: 'var(--status-critical)', glyph: '✕', label: 'Failed' },
    Blocked: { colorVar: 'var(--status-serious)', glyph: '▲', label: 'Blocked' },
    Skipped: { colorVar: 'var(--status-neutral)', glyph: '–', label: 'Skipped' },
};

/** Bar with a 4px rounded data-end and a square baseline end. */
function barPath(x: number, y: number, width: number, height: number, radius = 4): string {
    const r = Math.min(radius, width);
    if (width <= 0) return '';
    return [
        `M ${x} ${y}`,
        `H ${x + width - r}`,
        `A ${r} ${r} 0 0 1 ${x + width} ${y + r}`,
        `V ${y + height - r}`,
        `A ${r} ${r} 0 0 1 ${x + width - r} ${y + height}`,
        `H ${x}`,
        'Z',
    ].join(' ');
}

/**
 * Axis ticks at whole-number intervals.
 *
 * Dividing the range into a fixed number of intervals and rounding each label is
 * wrong: for a max of 5 it produced 0, 1, 3, 4, 5 — the labels had been rounded
 * from 1.25 / 2.5 / 3.75, so each one sat next to a gridline it did not belong to.
 * Pick a whole-number step first, then derive the labels from it.
 */
function ticks(max: number): number[] {
    const target = 4; // aim for about four intervals
    const rough = Math.max(1, max) / target;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rough)));
    const candidate = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((s) => s >= rough) ?? magnitude * 10;

    // Test-case counts are integers, so a fractional tick can never be a real value.
    const step = Math.max(1, Math.round(candidate));
    const top = Math.max(step, Math.ceil(max / step) * step);

    const out: number[] = [];
    for (let value = 0; value <= top; value += step) out.push(value);
    return out;
}

const ROW = 30;
const BAR = 18;
const LABEL_WIDTH = 104;
const VALUE_WIDTH = 44;
const AXIS_BAND = 26;

export default function StatusBarChart({
    byStatus,
    total,
}: {
    byStatus: Record<TestCaseStatus, number>;
    total: number;
}) {
    const [showTable, setShowTable] = useState(false);

    // Statuses nobody has used are noise; keep Passed/Failed always so the chart
    // does not silently change shape as cases move through the lifecycle.
    const always: TestCaseStatus[] = ['Passed', 'Failed'];
    const rows = TEST_CASE_STATUSES.filter((s) => (byStatus[s] ?? 0) > 0 || always.includes(s));

    const max = Math.max(...rows.map((s) => byStatus[s] ?? 0), 1);
    const axis = ticks(max);
    const axisMax = axis[axis.length - 1] || 1;

    const plotWidth = 420;
    const height = rows.length * ROW + AXIS_BAND;
    const width = LABEL_WIDTH + plotWidth + VALUE_WIDTH;
    const scale = (value: number) => (value / axisMax) * plotWidth;

    if (!total) {
        return (
            <div className="empty-state">
                <p className="empty-title">No test cases yet</p>
                <p className="empty-hint">Generate a plan from a work item and its cases appear here.</p>
            </div>
        );
    }

    return (
        <figure className="chart">
            <figcaption className="chart-head">
                <div>
                    <h3>Test results overview</h3>
                    <p>{total} test cases by status, in lifecycle order</p>
                </div>
                <button type="button" className="btn btn-ghost btn-small" onClick={() => setShowTable((v) => !v)}>
                    {showTable ? 'Show chart' : 'Show table'}
                </button>
            </figcaption>

            {showTable ? (
                <table className="data-table">
                    <thead>
                        <tr>
                            <th scope="col">Status</th>
                            <th scope="col">Cases</th>
                            <th scope="col">Share</th>
                        </tr>
                    </thead>
                    <tbody>
                        {TEST_CASE_STATUSES.map((status) => (
                            <tr key={status}>
                                <th scope="row">
                                    <span aria-hidden="true" className="glyph">
                                        {STATUS_STYLE[status].glyph}
                                    </span>{' '}
                                    {STATUS_STYLE[status].label}
                                </th>
                                <td className="num">{byStatus[status] ?? 0}</td>
                                <td className="num">
                                    {total ? `${Math.round(((byStatus[status] ?? 0) / total) * 100)}%` : '—'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : (
                <svg
                    viewBox={`0 0 ${width} ${height}`}
                    width="100%"
                    height={height}
                    role="img"
                    aria-label={`Test cases by status: ${rows
                        .map((s) => `${STATUS_STYLE[s].label} ${byStatus[s] ?? 0}`)
                        .join(', ')}`}
                >
                    {/* Gridlines: solid hairlines, one step off the surface. */}
                    {axis.map((value) => (
                        <line
                            key={value}
                            x1={LABEL_WIDTH + scale(value)}
                            x2={LABEL_WIDTH + scale(value)}
                            y1={0}
                            y2={rows.length * ROW}
                            className="chart-grid"
                        />
                    ))}

                    {rows.map((status, i) => {
                        const count = byStatus[status] ?? 0;
                        const y = i * ROW + (ROW - BAR) / 2;
                        const style = STATUS_STYLE[status];
                        return (
                            <g key={status}>
                                <title>{`${style.label}: ${count} of ${total} cases`}</title>
                                {/* Glyph + label carry identity, so hue never has to. */}
                                <text x={0} y={i * ROW + ROW / 2} className="chart-label" dominantBaseline="middle">
                                    <tspan className="chart-glyph">{style.glyph}</tspan>
                                    <tspan dx="8">{style.label}</tspan>
                                </text>
                                {count > 0 && (
                                    <path d={barPath(LABEL_WIDTH, y, scale(count), BAR)} fill={style.colorVar} />
                                )}
                                <text
                                    x={LABEL_WIDTH + scale(count) + 10}
                                    y={i * ROW + ROW / 2}
                                    className="chart-value"
                                    dominantBaseline="middle"
                                >
                                    {count}
                                </text>
                            </g>
                        );
                    })}

                    {/* Baseline and ticks */}
                    <line
                        x1={LABEL_WIDTH}
                        x2={LABEL_WIDTH + plotWidth}
                        y1={rows.length * ROW}
                        y2={rows.length * ROW}
                        className="chart-axis"
                    />
                    {axis.map((value) => (
                        <text
                            key={value}
                            x={LABEL_WIDTH + scale(value)}
                            y={rows.length * ROW + 16}
                            className="chart-tick"
                            textAnchor="middle"
                        >
                            {value}
                        </text>
                    ))}
                </svg>
            )}
        </figure>
    );
}
