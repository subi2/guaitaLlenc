# Prova visual ràpida: obre l'app, executa passos i desa captures
import sys, json, asyncio
from playwright.sync_api import sync_playwright

HTML = '/home/claude/llenc/dist/guaitaLlenc-v0.13.0.html'
OUT = '/tmp/claude-0/-home-claude/62c1dd17-dba0-5b5c-a827-496c12ec5967/scratchpad/'

def run(steps, w=1440, h=900):
    errs = []
    with sync_playwright() as p:
        b = p.chromium.launch()
        pg = b.new_page(viewport={'width': w, 'height': h}, device_scale_factor=1)
        pg.on('console', lambda m: errs.append(f'[{m.type}] {m.text}') if m.type in ('error', 'warning') else None)
        pg.on('pageerror', lambda e: errs.append(f'[pageerror] {e} :: {e.stack}'))
        pg.goto('file://' + HTML)
        pg.wait_for_timeout(700)
        for s in steps:
            s(pg)
        b.close()
    return errs

if __name__ == '__main__':
    def s1(pg):
        pg.screenshot(path=OUT + 'start.png')
    print('\n'.join(run([s1])) or 'sense errors')
