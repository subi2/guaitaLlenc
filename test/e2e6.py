import sys
sys.path.insert(0, '/home/claude/llenc/test')
from shot import run, OUT
PACK = open('/home/claude/llenc/packs/arquitectura.llencpack.json').read()
def s(pg):
    pg.evaluate("async (t) => { await GL.packs.install(JSON.parse(t), true); }", PACK)
    html = pg.evaluate("""() => GL.catalog.templates().filter(t => t.src === 'Arquitectura i enginyeria').map(t => `<div><div class=t style="aspect-ratio:${t.w}/${t.h}">${t.thumb().replace(/width="[^"]*" height="[^"]*"/, '')}</div><span>${t.name.split(' · ').pop()}</span></div>`).join('')""")
    pg.set_content('<style>body{margin:0;background:#ccc;display:grid;grid-template-columns:repeat(8,1fr);gap:6px;padding:6px;font:10px sans-serif;align-items:end}.t{background:#fff;box-shadow:0 1px 3px #0005}svg{width:100%;height:100%;display:block}</style>' + html)
    pg.wait_for_timeout(1500)
    h = pg.evaluate('document.body.scrollHeight')
    for i in range(0, h, 900): pg.screenshot(path=OUT + f'arq{i//900}.png', clip={'x':0,'y':i,'width':1440,'height':min(900,h-i)}, full_page=True)
    print(h)
print('\n'.join(run([s])) or 'sense errors')
