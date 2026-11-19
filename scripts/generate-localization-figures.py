#!/usr/bin/env python3
"""Regenerate the Intro to Localization SVGs (Python 3 standard library only)."""

from html import escape
from math import atan2, cos, degrees, exp, hypot, log, pi, sin, sqrt
from pathlib import Path
from random import Random

OUT = Path(__file__).resolve().parents[1] / 'public' / 'intro-to-localization'
INK, MUTED, GRID = '#15232c', '#475e6a', '#cad9df'
PAPER, PANEL = '#eff5f8', '#fbfdfe'
TEAL, TEAL_FILL = '#0a7d8f', '#c9edf0'
RED, RED_FILL, BLUE = '#a93434', '#fbdcda', '#265287'
DARK_COLORS = {
    INK: '#e6edf3', MUTED: '#9baebd', GRID: '#324854',
    PAPER: '#111c26', PANEL: '#0c1118',
    TEAL: '#34d6e8', TEAL_FILL: '#163f49',
    RED: '#ff9992', RED_FILL: '#532f34', BLUE: '#9abbff',
}


def text(x, y, label, *, size=19, color=INK, anchor='start', bold=False):
    return (f'<text x="{x}" y="{y}" fill="{color}" font-size="{size}" '
            f'text-anchor="{anchor}" font-weight="{650 if bold else 400}">{escape(label)}</text>')


def rect(x, y, w, h, fill, stroke='none', radius=0):
    return (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{radius}" '
            f'fill="{fill}" stroke="{stroke}"/>')


def path(d, *, stroke=INK, width=2, fill='none', dash=None, arrow=None):
    extra = f' stroke-dasharray="{dash}"' if dash else ''
    extra += f' marker-end="url(#{arrow})"' if arrow else ''
    return (f'<path d="{d}" stroke="{stroke}" stroke-width="{width}" fill="{fill}" '
            f'stroke-linecap="round" stroke-linejoin="round"{extra}/>')


def circle(x, y, radius, fill, *, opacity=1):
    return f'<circle cx="{x:.2f}" cy="{y:.2f}" r="{radius}" fill="{fill}" opacity="{opacity}"/>'


def polyline(points, **style):
    return path('M' + 'L'.join(f'{x:.2f},{y:.2f}' for x, y in points), **style)


def save(name, w, h, title, elements):
    colors = {'teal': TEAL, 'red': RED, 'blue': BLUE}
    markers = ''.join(
        f'<marker id="{key}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" '
        f'markerHeight="5" orient="auto"><path d="M0 0L10 5L0 10Z" fill="{color}"/></marker>'
        for key, color in colors.items()
    )
    dark_css = ''.join(
        f'[{attr}="{light}"]{{{attr}:{dark}}}'
        for light, dark in DARK_COLORS.items() for attr in ('fill', 'stroke')
    )
    svg = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" role="img" '
           'font-family="IBM Plex Sans, DejaVu Sans, sans-serif">',
           f'<title>{escape(title)}</title>',
           f'<style>@media (prefers-color-scheme: dark){{{dark_css}}}</style>',
           f'<defs>{markers}</defs>',
           rect(0, 0, w, h, PAPER), *elements, '</svg>']
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / f'{name}.svg').write_text('\n'.join(svg) + '\n', encoding='utf-8')


def gaussian_pdf():
    mu, sigma = 35, 3
    baseline = 224
    to_x = lambda x: 76 + (x - 23) * 22

    def curve(x):
        pdf = exp(-0.5 * ((x - mu) / sigma) ** 2) / (sigma * sqrt(2 * pi))
        return to_x(x), baseline - 1170 * pdf

    dots = [26.7, 29.6, 31, 32.4, 33.8, 34.1, 35.2, 36.1, 37, 37.4, 38.3, 40.4, 43]
    mean_x, peak = curve(mu)
    lo, hi = mu - sigma, mu + sigma
    l, yl = curve(lo)
    r, yr = curve(hi)
    save('gaussian-pdf', 650, 302, 'Gaussian distance estimate with a one-standard-deviation interval', [
        rect(28, 18, 594, 220, PANEL, GRID, 12),
        text(47, 47, 'Probability density', size=18, color=MUTED),
        polyline([(l, baseline), *(curve(lo + i/16) for i in range(97)), (r, baseline), (l, baseline)],
                 stroke='none', fill=TEAL_FILL),
        path(f'M{l},{yl}V{baseline} M{r},{yr}V{baseline}', stroke=TEAL, dash='4 5'),
        path(f'M{mean_x},{peak:.2f}V{baseline}', stroke=INK, dash='5 5'),
        polyline([curve(23 + i/8) for i in range(193)], stroke=TEAL, width=3.5),
        path(f'M76,{baseline}H604', stroke=MUTED),
        *[circle(to_x(x), baseline - (i % 2) * 6, 4.2, RED) for i, x in enumerate(dots)],
        *[text(to_x(x), 260, label, anchor='middle', size=19) for x, label in
          [(29, '29'), (lo, '32'), (mu, '35'), (hi, '38'), (41, '41')]],
        text(mean_x, 53, 'μ = 35 cm', anchor='middle', bold=True),
        rect(mean_x-40, 174, 80, 26, TEAL_FILL, TEAL, 5),
        text(mean_x, 193, 'μ ± σ', anchor='middle', color=TEAL, bold=True),
        text(608, 284, 'Distance (cm)', anchor='end', color=MUTED),
        circle(53, 281, 4.6, RED), text(67, 287, 'Example readings', color=MUTED),
    ])


def plot_grid(x0, y0, size, limit, ticks):
    scale = size / (2 * limit)

    def xy(x, y):
        return x0 + size/2 + scale*x, y0 + size/2 - scale*y

    grid = [rect(x0, y0, size, size, PANEL, GRID, 4)]
    for tick in ticks:
        x, y = xy(tick, tick)
        grid.extend([
            path(f'M{x},{y0}v{size} M{x0},{y}h{size}', stroke=MUTED if tick == 0 else GRID, width=1),
            text(x, y0+size+22, str(tick), anchor='middle', color=MUTED, size=16),
            text(x0-8, y+5, str(tick), anchor='end', color=MUTED, size=16),
        ])
    return xy, grid


def gaussian_points(var_y, rho, count=260):
    # Identical seed across panels: only the covariance changes, not the random draws.
    rng = Random(8020)
    for _ in range(count):
        a, b = rng.gauss(), rng.gauss()
        yield a, sqrt(var_y) * (rho*a + sqrt(1-rho*rho)*b)


def scatter_comparison(name, title, cases):
    elements = []
    for left, (heading, var_y, rho) in zip((55, 397), cases):
        xy, grid = plot_grid(left, 76, 256, 4, (-4, -2, 0, 2, 4))
        elements.extend([text(left, 28, heading, size=22, bold=True),
                         text(left, 54, f'Var(x): 1 · Var(y): {var_y} · ρ: {rho:g}', size=17, color=MUTED),
                         *grid, text(left-39, 210, 'y', size=17),
                         text(left+128, 379, 'x', size=17, anchor='middle')])
        elements.extend(circle(*xy(x, y), 2.85, TEAL, opacity=.65)
                        for x, y in gaussian_points(var_y, rho) if abs(x) < 4 and abs(y) < 4)
    save(name, 680, 394, title, elements)


def eigen_ellipse():
    var_y, rho = 2, .7
    cov = rho * sqrt(var_y)
    midpoint, gap = (1 + var_y)/2, hypot((1 - var_y)/2, cov)
    roots = sqrt(midpoint+gap), sqrt(midpoint-gap)
    theta = .5 * atan2(2*cov, 1-var_y)
    k997 = sqrt(-2 * log(1 - .997))
    xy, grid = plot_grid(47, 23, 323, 6, (-6, -3, 0, 3, 6))
    cx, cy = xy(0, 0)

    def contour(k, color, dash):
        rx, ry = (k*root*(323/12) for root in roots)
        return (f'<ellipse cx="{cx}" cy="{cy}" rx="{rx:.2f}" ry="{ry:.2f}" fill="none" '
                f'stroke="{color}" stroke-width="3" stroke-dasharray="{dash}" '
                f'transform="rotate({-degrees(theta):.2f} {cx} {cy})"/>')

    def axis(angle, length, color):
        x, y = xy(length*cos(angle), length*sin(angle))
        return path(f'M{cx},{cy}L{x:.2f},{y:.2f}', stroke=color, width=3.25,
                    arrow='blue' if color == BLUE else 'red')

    save('uncertainty-ellipse', 680, 385, 'Correlated position estimates with 98.9% and 99.7% contours', [
        *grid, text(19, 43, 'y', size=17), text(382, 363, 'x', size=17),
        *[circle(*xy(x, y), 2.6, TEAL, opacity=.48) for x, y in gaussian_points(var_y, rho, 320)],
        contour(k997, MUTED, '8 6'), contour(3, TEAL, '1 0'),
        axis(theta, 2.75*roots[0], BLUE), axis(theta + pi/2, 2.75*roots[1], RED),
        circle(cx, cy, 4.5, INK),
        text(411, 54, 'Probability inside', bold=True, size=22),
        path('M412 91h37', stroke=TEAL, width=3), text(462, 97, '3σ → 98.9%'),
        path('M412 132h37', stroke=MUTED, width=3, dash='8 6'), text(462, 138, '3.41σ → 99.7%'),
        text(411, 201, 'Principal directions', bold=True, size=22),
        path('M412 239h37', stroke=BLUE, width=3, arrow='blue'), text(462, 245, 'v₁: more spread'),
        path('M412 280h37', stroke=RED, width=3, arrow='red'), text(462, 286, 'v₂: less spread'),
        circle(430, 323, 4.5, INK), text(462, 329, 'Mean position'),
    ])


def doorway():
    elements = []
    for left, offset, title, color in [(22, 0, 'Centered: fits', TEAL), (352, 16, '8 cm right: clips', RED)]:
        center, actual = left+153, left+153+offset
        a, b = center-70, center+70  # 2 px per cm: 140 px doorway, 120 px robot.
        elements.extend([
            rect(left, 22, 306, 302, PANEL, GRID, 12),
            text(center, 53, title, anchor='middle', size=23, bold=True, color=color),
            text(center, 90, '70 cm opening', anchor='middle', size=19),
            path(f'M{a},98v16 M{a},106H{b} M{b},98v16', stroke=MUTED),
            path(f'M{center},117V248', stroke=MUTED, width=1.5, dash='6 5'),
            rect(left+1, 140, a-left-1, 23, MUTED), rect(b, 140, left+305-b, 23, MUTED),
            rect(actual-60, 127, 120, 86, TEAL_FILL if not offset else RED_FILL, color, 4),
            text(actual, 197, '60 cm', anchor='middle', bold=True, color=color),
            path(f'M{actual},171V144', stroke=color, arrow='red' if offset else 'teal'),
        ])
        if offset:
            elements.extend([
                rect(b, 140, actual+60-b, 23, RED),
                path(f'M{b+3},150L{b+33},182V236H{center+92}', stroke=RED, width=1.6),
                text(center, 268, '3 cm overlaps the jamb', anchor='middle', color=RED, size=19),
            ])
        else:
            elements.extend([
                path(f'M{a},209l-9,24 M{b},209l9,24', stroke=TEAL, width=1.6),
                text(center, 268, '5 cm clear on each side', anchor='middle', color=TEAL, size=19),
            ])
        elements.append(text(center, 303, 'Top view · travel is upward', anchor='middle', color=MUTED, size=16))
    save('doorway-clearance', 680, 346, 'The same 60 cm robot centered and offset in a 70 cm doorway', elements)


def particles():
    pdf = [(42 + 264*i/100, 202 - 117*exp(-.5*((i-50)/16)**2)) for i in range(101)]
    rng = Random(33)
    dots = []
    for cx, strength in [(433, .52), (574, 1)]:
        for _ in range(22):
            x, y = rng.gauss(), rng.gauss()
            x, y = max(-2.0, min(x, 2.0)), max(-2.0, min(y, 2.0))
            radius = round(2.5 + 6*strength*exp(-.35*(x*x+y*y)), 2)
            dots.append((cx+x*21, 151+y*20, radius))
    save('gaussian-vs-particles', 680, 290, 'A parametric bell curve and two clusters of weighted pose particles', [
        rect(22, 20, 306, 248, PANEL, GRID, 12), rect(352, 20, 306, 248, PANEL, GRID, 12),
        text(175, 54, 'Parametric Gaussian', anchor='middle', size=23, bold=True),
        text(505, 54, 'Weighted particles', anchor='middle', size=23, bold=True),
        polyline([*pdf, (306, 202), (42, 202)], stroke='none', fill=TEAL_FILL),
        polyline(pdf, stroke=TEAL, width=3), path('M42 202H306 M174 85V202', stroke=MUTED, dash='4 5'),
        text(175, 244, 'One center and spread', anchor='middle', color=MUTED),
        rect(374, 85, 262, 122, PAPER, GRID, 5),
        path('M374 92H636 M374 196H636', stroke=GRID),
        *[circle(x, y, r, TEAL, opacity=.68) for x, y, r in dots],
        text(505, 244, 'Larger dot = more weight', anchor='middle', color=MUTED),
    ])


if __name__ == '__main__':
    doorway()
    particles()
    gaussian_pdf()
    scatter_comparison('gaussian-uncorrelated', 'Uncorrelated Gaussian scatter plots',
                       [('Equal spread', 1, 0), ('More vertical spread', 2, 0)])
    scatter_comparison('gaussian-correlated', 'Correlated Gaussian scatter plots',
                       [('Moderate correlation', 2, .5), ('Stronger correlation', 2, .7)])
    eigen_ellipse()
