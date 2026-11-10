import sys
sys.path.insert(0, '/home/claude/llenc/test')
from shot import run, OUT
def s(pg):
    pg.click('.st-seg button >> text=Plantilles'); pg.wait_for_timeout(400)
    pg.screenshot(path=OUT + 'start_tpl.png')
    pg.click('.tpl-card > span >> text=Pòster clàssic'); pg.wait_for_timeout(500)
    pg.screenshot(path=OUT + 'tpl_doc.png')
    pg.keyboard.press('b'); pg.wait_for_timeout(300)
    pg.screenshot(path=OUT + 'lib_tpl.png')
    pg.click('.lib-tabs button >> text=Imatges'); pg.wait_for_timeout(200)
    pg.screenshot(path=OUT + 'lib_sym.png')
    pg.click('.sym[data-tip="Nord"]'); pg.wait_for_timeout(300)
    pg.click('.lib-tabs button >> text=Estils'); pg.wait_for_timeout(200)
    pg.click('.pal >> text=Terracota'); pg.wait_for_timeout(300)
    pg.screenshot(path=OUT + 'lib_sty.png')
    # selecciona el títol per veure estil i color enllaçats
    tid = pg.evaluate("() => Object.values(GL.store.doc.objs).find(o => o.type==='text' && o.ts).id")
    pg.evaluate(f"() => GL.app.select(['{tid}'])"); pg.wait_for_timeout(200)
    pg.keyboard.press('b')
    pg.screenshot(path=OUT + 'props_ts.png')
    print(pg.evaluate("() => [GL.store.pagesSorted().length, Object.keys(GL.store.doc.objs).length]"))
print('\n'.join(run([s])) or 'sense errors')
