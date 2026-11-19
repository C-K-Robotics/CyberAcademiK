#!/usr/bin/env python3
"""Regenerate the Bayes Filter convergence chart and verify its worked examples.

Dependencies: python -m pip install numpy matplotlib
Run from any directory: python scripts/generate-bayes-filter-figures.py
The chart is deterministic, self-contained SVG with a dark-mode palette.
The photograph is separately attributed in public/bayes-filter/README.md.
"""

from pathlib import Path

import matplotlib

matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np

OUT = Path(__file__).resolve().parents[1] / 'public' / 'bayes-filter'
MEASUREMENTS = [0, 0, 0, 0, 0, 1, 0, 0]
# Rows: reading Open / Closed. Columns: state open / closed.
SENSOR = np.array([[0.9, 0.5], [0.1, 0.5]])
# Columns: previous state. Rows: next state. State order: open / closed.
PUSH = np.array([[1.0, 0.6], [0.0, 0.4]])
NONE = np.eye(2)
EXPECTED = [0.643, 0.764, 0.854, 0.913, 0.950, 0.791, 0.872, 0.924]


def update(prior, reading):
    scores = SENSOR[reading] * prior
    if scores.sum() <= 0:
        raise ValueError('Impossible reading under the model')
    return scores / scores.sum()


def beliefs():
    for model in [SENSOR, PUSH, NONE]:
        np.testing.assert_allclose(model.sum(axis=0), [1, 1])
    prior = np.array([0.5, 0.5])
    history = [prior.copy()]
    for reading in MEASUREMENTS:
        prior = update(prior, reading)
        np.testing.assert_allclose(prior.sum(), 1)
        history.append(prior.copy())
    history = np.array(history)
    np.testing.assert_array_equal(np.round(history[1:, 0], 3), EXPECTED)
    np.testing.assert_allclose(PUSH @ history[0], [0.8, 0.2])
    np.testing.assert_allclose(NONE @ history[0], history[0])
    np.testing.assert_allclose(update(PUSH @ history[0], 0), [0.72 / 0.82, 0.10 / 0.82])
    print('Verified measurement sequence, normalization, push prediction, and push + Open update.')
    return history[:, 0]


def plot(values):
    plt.rcParams.update({
        'font.family': 'DejaVu Sans',
        'font.size': 11,
        'svg.fonttype': 'path',
        'svg.hashsalt': 'cyberacademik-bayes-filter',
    })
    paper, ink, muted, grid = '#eff5f8', '#15232c', '#475e6a', '#cad9df'
    teal, red = '#0a7d8f', '#a93434'
    fig, ax = plt.subplots(figsize=(9, 4.8))
    fig.subplots_adjust(left=0.10, right=0.97, bottom=0.21, top=0.85)
    fig.patch.set_facecolor(paper)
    ax.set_facecolor(paper)
    steps = np.arange(9)
    ax.set_title('Glass door: belief after each camera reading', loc='left',
                 color=ink, fontsize=15, weight='bold', pad=20)
    ax.plot(steps, values, color=teal, linewidth=2.5, marker='o', markersize=6)
    ax.scatter([6], [values[6]], color=red, s=75, zorder=4)
    ax.set(xlim=(-0.3, 8.3), ylim=(0.44, 1.035),
           xticks=steps, yticks=np.arange(0.5, 1.01, 0.1))
    ax.set_xticklabels(['0\nPrior'] + [f'{i}\nOpen' if i != 6 else '6\nClosed' for i in range(1, 9)])
    ax.set_xlabel('Measurement step (door state is assumed fixed)', color=muted, labelpad=10)
    ax.set_ylabel('bel(open)', color=muted)
    ax.tick_params(colors=muted, length=0, pad=7)
    ax.grid(axis='y', color=grid, linewidth=0.8)
    ax.set_axisbelow(True)
    for spine in ax.spines.values():
        spine.set_visible(False)
    for step, value in enumerate(values):
        dy = -21 if step == 6 else 12
        ax.annotate(f'{value:.3f}', (step, value), xytext=(0, dy),
                    textcoords='offset points', ha='center', fontsize=10,
                    color=red if step == 6 else ink)
    ax.annotate('6th reading: Closed\nConfidence dips, then recovers',
                xy=(6, values[6]), xytext=(4.25, 0.59), color=red, fontsize=11,
                arrowprops={'arrowstyle': '->', 'color': red, 'lw': 1.5})
    OUT.mkdir(parents=True, exist_ok=True)
    target = OUT / 'belief-convergence.svg'
    fig.savefig(target, format='svg', metadata={
        'Date': None,
        'Title': 'Glass door belief convergence',
        'Description': 'Initial belief 0.500; eight updates: ' + ', '.join(f'{x:.3f}' for x in values[1:]),
        'Creator': 'CyberAcademiK / Matplotlib',
    })
    plt.close(fig)
    # Figure's existing color-scheme rules let embedded SVGs follow the site theme.
    dark = {paper: '#111c26', ink: '#e6edf3', muted: '#9baebd',
            grid: '#324854', teal: '#34d6e8', red: '#ff9992'}
    css = '@media (prefers-color-scheme: dark){' + ''.join(
        f'[style*="fill: {light}"]{{fill:{shade}!important}}'
        f'[style*="stroke: {light}"]{{stroke:{shade}!important}}'
        for light, shade in dark.items()
    ) + '}'
    svg = target.read_text(encoding='utf-8')
    svg = svg.replace('<defs>', '<style>' + css + '</style>\n <defs>', 1)
    # Matplotlib leaves trailing spaces in multiline path data. Newlines still
    # separate the SVG commands, so trimming is safe and keeps git diffs clean.
    svg = '\n'.join(line.rstrip() for line in svg.splitlines()) + '\n'
    target.write_text(svg, encoding='utf-8')
    print(f'Wrote {target.relative_to(OUT.parents[1])} ({target.stat().st_size:,} bytes)')


if __name__ == '__main__':
    plot(beliefs())
