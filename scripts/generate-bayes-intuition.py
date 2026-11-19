#!/usr/bin/env python3
"""Generate six original Bayes-filter intuition visuals in public/bayes-filter/.

Run: python scripts/generate-bayes-intuition.py
Authoring dependencies: numpy, matplotlib. No website runtime dependencies.
SVG diagrams use the same embedded light/dark palette as the existing figures.
"""

from html import escape
from pathlib import Path

import matplotlib

matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np

OUT = Path(__file__).resolve().parents[1] / 'public' / 'bayes-filter'
PAPER, PANEL, INK, MUTED, GRID = '#eff5f8', '#fbfdfe', '#15232c', '#475e6a', '#cad9df'
TEAL, TFILL, PURPLE, PFILL = '#0a7d8f', '#c9edf0', '#6b46c1', '#e8dff8'
RED, RFILL, GOLD = '#a93434', '#fbdcda', '#b07c08'
DARK = {PAPER: '#111c26', PANEL: '#0c1118', INK: '#e6edf3', MUTED: '#9baebd',
        GRID: '#324854', TEAL: '#34d6e8', TFILL: '#163f49', PURPLE: '#a78bfa',
        PFILL: '#30234a', RED: '#ff9992', RFILL: '#532f34', GOLD: '#fbbf24'}


def text(x, y, label, size=20, color=INK, anchor='start', bold=False):
    return (f'<text x="{x}" y="{y}" fill="{color}" font-size="{size}" '
            f'text-anchor="{anchor}" font-weight="{650 if bold else 400}">{escape(label)}</text>')


def rect(x, y, w, h, fill=PANEL, stroke=GRID, radius=12):
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{radius}" fill="{fill}" stroke="{stroke}"/>'


def path(d, stroke=MUTED, width=2, fill='none', arrow=False, dash=False):
    extra = ' marker-end="url(#arrow)"' if arrow else ''
    extra += ' stroke-dasharray="6 5"' if dash else ''
    return f'<path d="{d}" fill="{fill}" stroke="{stroke}" stroke-width="{width}" stroke-linejoin="round"{extra}/>'


def circle(x, y, r, fill, stroke=GRID):
    return f'<circle cx="{x}" cy="{y}" r="{r}" fill="{fill}" stroke="{stroke}" stroke-width="2"/>'


def save(name, height, title, description, items):
    css = '@media (prefers-color-scheme: dark){' + ''.join(
        f'[{attr}="{light}"]{{{attr}:{dark}}}'
        for light, dark in DARK.items() for attr in ['fill', 'stroke']
    ) + '}'
    svg = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 840 {height}" '
           'role="img" aria-labelledby="title desc" font-family="IBM Plex Sans, DejaVu Sans, sans-serif">',
           f'<title id="title">{escape(title)}</title><desc id="desc">{escape(description)}</desc>',
           f'<style>{css}</style>', '<defs>',
           f'<marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10Z" fill="{MUTED}"/></marker>',
           '</defs>', rect(0, 0, 840, height, PAPER, 'none', 0), *items, '</svg>']
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / f'{name}.svg').write_text('\n'.join(svg) + '\n', encoding='utf-8')


def plane(x, y, fire=False):
    # Top-down jet: one nacelle on each wing, both visible.
    items = [f'<g transform="translate({x} {y})">',
             path('M-120 -11 L-30 -11 L-65 -95 L-42 -95 L35 -12 L98 -10 Q145 0 98 10 L35 12 L-42 95 L-65 95 L-30 11 L-120 11 L-146 48 L-162 48 L-147 0 L-162 -48 L-146 -48 Z',
                  TEAL, 2.5, TFILL),
             path('M96 -7 L112 0 L96 7', TEAL, 2),
             *[circle(px, 0, 2.5, TEAL, TEAL) for px in range(-95, 75, 16)]]
    for ey in [-52, 52]:
        items.append(rect(-34, ey - 9, 52, 18, PANEL, TEAL, 8))
        if fire:
            items += [path(f'M-36 {ey-8} L-60 {ey-19} L-55 {ey-5} L-87 {ey} L-58 {ey+8} L-66 {ey+19} L-36 {ey+8} Z', RED, 2, GOLD),
                      path(f'M-85 {ey} Q-108 {ey-24} -125 {ey} T-167 {ey}', MUTED, 6),
                      path(f'M-96 {ey+10} Q-120 {ey+26} -145 {ey+7}', MUTED, 4)]
    return items + ['</g>']


def airplane():
    items = [text(28, 36, 'Same airplane. New evidence.', 25, bold=True),
             rect(20, 58, 390, 340), rect(430, 58, 390, 340),
             text(42, 91, '1 · Peaceful cruise', 22, TEAL, bold=True),
             text(452, 91, '2 · Both engines on fire', 22, RED, bold=True)]
    # Friendly clouds, then the same silhouette in both panels.
    for shift in [0, 410]:
        for cx, cy in [(80, 145), (335, 125)]:
            items += [circle(cx + shift, cy, 16, PAPER, PAPER),
                      circle(cx + shift + 20, cy - 5, 22, PAPER, PAPER),
                      circle(cx + shift + 42, cy, 16, PAPER, PAPER)]
    items += plane(225, 220) + plane(635, 220, True)
    items += [text(215, 345, '“Odds of a crash: ~1 in 11,000,000”', 19, anchor='middle'),
              text(625, 337, 'Odds of a crash given both fires?', 19, anchor='middle'),
              text(625, 367, 'Much higher — different evidence!', 19, RED, 'middle', True),
              text(420, 430, 'Quoted baseline is illustrative, not a current risk estimate.', 18, MUTED, 'middle'),
              text(420, 457, 'No numerical risk is assigned to the fire scenario. See the source caveat below.', 17, MUTED, 'middle')]
    save('airplane-conditional', 480, 'Conditional probability: new evidence changes the odds',
         'Two panels show the same jet cruising, then with fire and smoke from both engines. The quoted one-in-eleven-million baseline is only a hook; the conditional risk is not quantified.', items)


def universe():
    items = [text(25, 35, 'Before: all possible outcomes', 23, bold=True),
             text(455, 35, 'Given Z: keep only Z', 23, bold=True),
             rect(20, 60, 365, 265), text(37, 88, 'Sample space Ω', 18, MUTED),
             '<defs><clipPath id="left-z"><circle cx="245" cy="198" r="85"/></clipPath>',
             '<clipPath id="right-z"><circle cx="635" cy="195" r="110"/></clipPath></defs>',
             circle(150, 198, 85, PAPER, PURPLE), circle(245, 198, 85, TFILL, TEAL),
             f'<g clip-path="url(#left-z)">{circle(150, 198, 85, PFILL, PURPLE)}</g>',
             text(105, 205, 'X', 25, PURPLE, bold=True), text(282, 205, 'Z', 25, TEAL, bold=True),
             text(193, 194, 'X ∩ Z', 17, PURPLE, 'middle', True),
             path('M397 194 H447', arrow=True),
             circle(635, 195, 110, TFILL, TEAL),
             f'<g clip-path="url(#right-z)">{circle(512, 195, 110, PFILL, PURPLE)}</g>',
             text(557, 199, 'X ∩ Z', 19, PURPLE, 'middle', True),
             text(674, 185, 'Z is now', 19, TEAL, 'middle', True),
             text(674, 213, 'the universe', 18, TEAL, 'middle'),
             text(202, 360, 'Joint P(x, z): overlap / whole box', 19, anchor='middle'),
             text(630, 360, 'Conditional P(x ∣ z): overlap / Z', 19, anchor='middle'),
             text(420, 400, 'P(x ∣ z) = P(x, z) / P(z)', 25, anchor='middle', bold=True),
             text(420, 432, 'Dividing by P(z) makes the remaining universe total 1.', 19, MUTED, 'middle'),
             text(420, 462, 'Schematic areas for intuition; not the glass-door probabilities.', 17, MUTED, 'middle')]
    save('shrinking-universe', 485, 'Conditioning shrinks the universe to observation Z',
         'Left: events X and Z overlap inside the sample space. Right: only Z remains, enlarged, with the same relative overlap. Conditional probability divides the joint probability by P(Z). Areas are schematic.', items)


def markov():
    items = [text(28, 36, 'The present summarizes the past', 25, bold=True)]
    # Controls are indexed by their departure state, not arrival state.
    for i, label in enumerate(['uₜ₋₂', 'uₜ₋₁', 'uₜ']):
        cx = 200 + i * 220
        items += [f'<g opacity="{0.4 if i == 0 else 1}">',
                  rect(cx - 48, 66, 96, 46, TFILL if i == 1 else PANEL, TEAL if i == 1 else GRID),
                  text(cx, 97, label, 25, TEAL if i == 1 else MUTED, 'middle', True),
                  path(f'M{cx} 114 L{cx+83} 177', arrow=True), '</g>']
    for i, label in enumerate(['xₜ₋₂', 'xₜ₋₁', 'xₜ', 'xₜ₊₁']):
        cx = 90 + i * 220
        items += [f'<g opacity="{0.4 if i == 0 else 1}">']
        if i < 3:
            items.append(path(f'M{cx+44} 208 H{cx+175}', arrow=True))
        items += [circle(cx, 208, 44, TFILL if i == 1 else PFILL if i == 2 else PANEL,
                         TEAL if i == 1 else PURPLE if i == 2 else GRID),
                  text(cx, 216, label, 25, TEAL if i == 1 else PURPLE if i == 2 else MUTED, 'middle', True),
                  path(f'M{cx} 253 V289', arrow=True),
                  rect(cx - 48, 292, 96, 46, PFILL if i == 2 else PANEL, PURPLE if i == 2 else GRID),
                  text(cx, 323, ['zₜ₋₂', 'zₜ₋₁', 'zₜ', 'zₜ₊₁'][i], 24, PURPLE if i == 2 else MUTED, 'middle', True), '</g>']
    items += [text(420, 380, 'Predict xₜ from xₜ₋₁ and uₜ₋₁; then use measurement zₜ.', 21, anchor='middle', bold=True),
              text(420, 413, 'uₜ starts at xₜ and leads toward xₜ₊₁ — not backward into xₜ.', 19, MUTED, 'middle'),
              text(420, 449, 'The filter carries bel(xₜ₋₁), because the true state is still unknown.', 19, MUTED, 'middle')]
    save('markov-timeline', 475, 'Markov state, action, and sensor timeline',
         'States x t-2 through x t+1 form a chain. Controls act from their same-index state toward the next state; sensors depend on their same-index state. Older history is faded; x t-1, u t-1, and z t are highlighted for estimating x t. The filter carries a belief over the unknown previous state.', items)


def normalization():
    scores = np.array([0.45, 0.25])
    posterior = scores / scores.sum()
    np.testing.assert_allclose(posterior, [9 / 14, 5 / 14])
    items = [text(28, 36, 'η stretches both scores by the same factor', 25, bold=True),
             text(180, 86, 'Before η', 23, anchor='middle', bold=True),
             text(650, 86, 'After η', 23, anchor='middle', bold=True),
             path('M65 120 H790', dash=True), text(28, 126, '1.0', 18, MUTED),
             text(420, 171, '× η ≈ 1.429', 22, TEAL, 'middle', True),
             path('M315 210 H510', arrow=True)]
    for cx, vals in [(180, scores), (650, posterior)]:
        bottom = 330
        for val, fill, stroke in zip(vals, [TFILL, PFILL], [TEAL, PURPLE]):
            h = float(val) * 210
            items += [rect(cx - 60, bottom - h, 120, h, fill, stroke, 0),
                      text(cx, bottom - h / 2 + 7, f'{val:.3f}', 22, stroke, 'middle', True)]
            bottom -= h
        items += [text(cx, 360, f'Total = {vals.sum():.2f}', 21, anchor='middle', bold=True)]
    items += [rect(227, 390, 18, 18, TFILL, TEAL, 0), text(255, 406, 'Open', 19, TEAL),
              rect(457, 390, 18, 18, PFILL, PURPLE, 0), text(485, 406, 'Closed', 19, PURPLE),
              text(420, 446, '0.45 : 0.25 = 9 : 5. Normalizing keeps that ratio.', 20, MUTED, 'middle'),
              text(420, 477, 'Same relative evidence. New total: 100%.', 20, MUTED, 'middle')]
    save('normalization', 500, 'Normalization rescales scores without changing their ratio',
         'Two stacked bars share a vertical scale. Before eta, open 0.45 and closed 0.25 total 0.70 below the dashed 1.0 line. Multiplying both by 1/0.70 gives open 0.643 and closed 0.357 totaling 1. The ratio remains 9 to 5.', items)


def elementwise():
    items = [text(28, 36, 'Pick one sensor row. Match the states. Multiply.', 25, bold=True),
             text(265, 80, 'Measurement model', 21, anchor='middle', bold=True),
             text(250, 113, 'true: open', 18, TEAL, 'middle'), text(400, 113, 'true: closed', 18, PURPLE, 'middle'),
             text(26, 157, 'z = Open →', 20, TEAL, bold=True), text(26, 211, 'z = Closed', 20, MUTED),
             rect(175, 126, 300, 54, TFILL, TEAL, 4), rect(175, 180, 300, 54, PANEL, GRID, 4),
             path('M325 126 V234', GRID),
             text(250, 161, '0.9', 25, TEAL, 'middle', True), text(400, 161, '0.5', 25, TEAL, 'middle', True),
             text(250, 215, '0.1', 25, MUTED, 'middle'), text(400, 215, '0.5', 25, MUTED, 'middle'),
             text(675, 80, 'Prior column', 21, anchor='middle', bold=True),
             path('M641 121 H630 V231 H641 M709 121 H720 V231 H709', INK),
             text(674, 157, '0.5', 24, TEAL, 'middle', True), text(674, 211, '0.5', 24, PURPLE, 'middle', True),
             text(733, 157, 'open', 17, TEAL), text(733, 211, 'closed', 17, PURPLE),
             text(420, 273, 'measurement_model[0] * belief', 23, anchor='middle', bold=True),
             text(420, 306, 'Pair the same state — no adding across states here.', 19, MUTED, 'middle'),
             rect(55, 333, 350, 122, TFILL, TEAL), rect(435, 333, 350, 122, PFILL, PURPLE),
             text(230, 368, 'Open score', 21, TEAL, 'middle', True),
             text(230, 413, '0.9 × 0.5 = 0.45', 27, TEAL, 'middle', True),
             text(610, 368, 'Closed score', 21, PURPLE, 'middle', True),
             text(610, 413, '0.5 × 0.5 = 0.25', 27, PURPLE, 'middle', True),
             text(420, 491, 'Reading Closed instead? Select row 1: [0.1, 0.5].', 20, MUTED, 'middle'),
             text(420, 523, 'NumPy * is element-wise here; @ would be matrix multiplication.', 19, MUTED, 'middle')]
    save('elementwise-update', 548, 'Element-wise sensor update selects one likelihood row',
         'The Open row [0.9, 0.5] is highlighted in a two-by-two measurement grid. A prior column [0.5, 0.5] has the same state order. Matching open entries produce 0.45, and matching closed entries produce 0.25. The unused Closed row is [0.1, 0.5]. This is not a matrix product.', items)


def comparison():
    plt.rcParams.update({'font.family': 'DejaVu Sans', 'font.size': 11,
                         'svg.fonttype': 'path', 'svg.hashsalt': 'bayes-intuition'})
    prior = np.array([0.5, 0.5])
    sensor_open = np.array([0.9, 0.5])
    predicted = np.array([[1.0, 0.6], [0.0, 0.4]]) @ prior
    scores_a, scores_b = sensor_open * prior, sensor_open * predicted
    a = [prior[0], prior[0], (scores_a / scores_a.sum())[0]]
    b = [prior[0], predicted[0], (scores_b / scores_b.sum())[0]]
    np.testing.assert_allclose(a, [0.5, 0.5, 9 / 14])
    np.testing.assert_allclose(b, [0.5, 0.8, 36 / 41])
    fig, ax = plt.subplots(figsize=(9, 5.2))
    fig.subplots_adjust(left=0.10, right=0.97, bottom=0.19, top=0.73)
    fig.patch.set_facecolor(PAPER)
    ax.set_facecolor(PAPER)
    x = np.arange(3)
    for shift, vals, color, label in [(-0.19, a, TEAL, 'A · Measure only (no action)'),
                                       (0.19, b, PURPLE, 'B · Push + measure')]:
        bars = ax.bar(x + shift, vals, width=0.34, color=color, label=label, zorder=3)
        ax.bar_label(bars, labels=[f'{v:.3f}' for v in vals], padding=7, color=INK, fontsize=12)
    ax.set_ylim(0, 1.08)
    ax.set_xticks(x, ['Initial prior\nbel(x₀)', 'Prediction\nnone / push u₀', 'After Open reading z₁\nbel(x₁)'])
    ax.set_yticks(np.arange(0, 1.01, 0.2))
    ax.set_ylabel('Probability door is open', color=MUTED)
    ax.tick_params(colors=MUTED, length=0, pad=8)
    ax.grid(axis='y', color=GRID)
    ax.set_axisbelow(True)
    for spine in ax.spines.values():
        spine.set_visible(False)
    fig.text(0.10, 0.94, 'Same camera. Different prior after the action.', color=INK, fontsize=15, weight='bold')
    handles, labels = ax.get_legend_handles_labels()
    fig.legend(handles, labels, loc='upper left', bbox_to_anchor=(0.09, 0.90),
               frameon=False, labelcolor=INK, fontsize=11)
    OUT.mkdir(parents=True, exist_ok=True)
    target = OUT / 'action-comparison.svg'
    fig.savefig(target, metadata={'Date': None, 'Title': 'Measure only versus push then measure',
                                 'Description': 'Measure only: 0.500, 0.500 (no action), 0.643. Push and measure: 0.500, 0.800, 0.878.'})
    plt.close(fig)
    css = '@media (prefers-color-scheme: dark){' + ''.join(
        f'[style*="fill: {light}"]{{fill:{dark}!important}}'
        f'[style*="stroke: {light}"]{{stroke:{dark}!important}}'
        for light, dark in DARK.items()
    ) + '}'
    svg = target.read_text(encoding='utf-8').replace('<defs>', f'<style>{css}</style><defs>', 1)
    target.write_text('\n'.join(line.rstrip() for line in svg.splitlines()) + '\n', encoding='utf-8')


if __name__ == '__main__':
    airplane()
    universe()
    markov()
    normalization()
    elementwise()
    comparison()
    print('Generated six theme-aware intuition visuals; verified normalization and both comparison tracks.')
