"""Genera las paletas de la «paleta sorpresa» (window.PALETTES en index.html). Uso: python tools/paletas/generar.py
Misma luminosidad en OKLCH y distinto tono; ajusta al gamut sRGB y comprueba el contraste WCAG de cada combinación."""
import json, math

def oklch_to_srgb(L, C, h):
    a, b = C * math.cos(math.radians(h)), C * math.sin(math.radians(h))
    l_ = L + 0.3963377774 * a + 0.2158037573 * b
    m_ = L - 0.1055613458 * a - 0.0638541728 * b
    s_ = L - 0.0894841775 * a - 1.2914855480 * b
    l, m, s = l_ ** 3, m_ ** 3, s_ ** 3
    r = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s
    g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s
    bl = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s
    return r, g, bl

def in_gamut(rgb):
    return all(-1e-4 <= c <= 1 + 1e-4 for c in rgb)

def to_hex(L, C, h):
    # Reduce el croma hasta que el color quepa en sRGB (mantiene luminosidad y tono)
    while C > 0 and not in_gamut(oklch_to_srgb(L, C, h)):
        C -= 0.002
    rgb = oklch_to_srgb(L, max(C, 0), h)
    def enc(c):
        c = min(max(c, 0), 1)
        return round(255 * (12.92 * c if c <= 0.0031308 else 1.055 * c ** (1 / 2.4) - 0.055))
    return '#%02X%02X%02X' % tuple(enc(c) for c in rgb)

def lum(hx):
    c = [int(hx[i:i + 2], 16) / 255 for i in (1, 3, 5)]
    c = [x / 12.92 if x <= 0.03928 else ((x + 0.055) / 1.055) ** 2.4 for x in c]
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]

def cr(a, b):
    la, lb = lum(a), lum(b)
    return (max(la, lb) + 0.05) / (min(la, lb) + 0.05)

# Colores fijos de la web (no cambian con la paleta)
INK_L, MUTED_L = '#16171D', '#5A5E6D'
INK_D, MUTED_D = '#ECEDF3', '#A1A6B6'
PACKET_TXT_L, PACKET_TXT_D = '#FFFFFF', '#0E0B26'

NAMES = {0: 'rosa', 20: 'coral', 45: 'naranja', 75: 'ámbar', 105: 'lima', 140: 'verde', 158: 'menta',
         175: 'turquesa', 192: 'petróleo', 210: 'cielo', 232: 'zafiro', 250: 'azul', 280: 'índigo',
         305: 'violeta', 322: 'magenta', 340: 'frambuesa'}
out, report = [], []
for h, name in NAMES.items():
    light = {
        '--bg': to_hex(0.962, 0.014, h), '--surface': to_hex(0.995, 0.004, h), '--line': to_hex(0.885, 0.022, h),
        '--accent': to_hex(0.52, 0.17, h), '--accent-soft': to_hex(0.925, 0.045, h), '--accent-ink': '#FFFFFF',
    }
    dark = {
        '--bg': to_hex(0.18, 0.016, h), '--surface': to_hex(0.225, 0.02, h), '--line': to_hex(0.31, 0.024, h),
        '--accent': to_hex(0.76, 0.13, h), '--accent-soft': to_hex(0.31, 0.06, h), '--accent-ink': to_hex(0.16, 0.03, h),
    }
    checks = {
        'L texto/bg': cr(INK_L, light['--bg']), 'L muted/bg': cr(MUTED_L, light['--bg']),
        'L muted/surface': cr(MUTED_L, light['--surface']), 'L ink/accent-soft': cr(INK_L, light['--accent-soft']),
        'L acento/bg': cr(light['--accent'], light['--bg']), 'L paquete': cr(PACKET_TXT_L, light['--accent']),
        'D texto/bg': cr(INK_D, dark['--bg']), 'D muted/bg': cr(MUTED_D, dark['--bg']),
        'D muted/surface': cr(MUTED_D, dark['--surface']), 'D ink/accent-soft': cr(INK_D, dark['--accent-soft']),
        'D acento/bg': cr(dark['--accent'], dark['--bg']), 'D paquete': cr(PACKET_TXT_D, dark['--accent']),
    }
    need = {k: (3 if 'acento/bg' in k else 4.5) for k in checks}
    fails = [f'{k} {v:.2f}' for k, v in checks.items() if v < need[k]]
    worst = min(checks.items(), key=lambda kv: kv[1] / need[kv[0]])
    report.append(f"{name:10} h={h:3}  acento {light['--accent']} / {dark['--accent']}  peor: {worst[0]} {worst[1]:.2f}  {'OK' if not fails else 'FALLA: ' + ', '.join(fails)}")
    if not fails:
        out.append({'name': name, 'light': light, 'dark': dark})

print('\n'.join(report))
print(f'\n{len(out)} de {len(NAMES)} paletas aprobadas')
json.dump(out, open(__file__.replace('generar.py', 'paletas.json'), 'w', encoding='utf8'), ensure_ascii=False, indent=1)
