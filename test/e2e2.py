import sys, base64
sys.path.insert(0, '/home/claude/llenc/test')
from shot import run, OUT

PNG = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==')

def S(pg, name, clip=None):
    pg.wait_for_timeout(150)
    pg.screenshot(path=OUT + name + '.png', clip=clip)

def ev(pg, js):
    return pg.evaluate(js)

def steps():
    out = {}
    def setup(pg):
        pg.click('text=Crea el document'); pg.wait_for_timeout(300)
        st = pg.locator('#stage').bounding_box()
        out['x0'], out['y0'] = st['x'], st['y']
    def drag(pg, a, b, mods=None, steps=8):
        x0, y0 = out['x0'], out['y0']
        if mods: pg.keyboard.down(mods)
        pg.mouse.move(x0 + a[0], y0 + a[1]); pg.mouse.down(); pg.mouse.move(x0 + b[0], y0 + b[1], steps=steps); pg.mouse.up()
        if mods: pg.keyboard.up(mods)
    def t_text(pg):
        x0, y0 = out['x0'], out['y0']
        pg.keyboard.press('t')
        drag(pg, (380, 150), (700, 160))
        pg.keyboard.type('Disseny de làmina amb text que fa salts de línia automàtics')
        S(pg, 'text_edit')
        pg.keyboard.press('Escape')
        S(pg, 'text_done')
        o = ev(pg, "() => { const o = Object.values(GL.store.doc.objs).find(o=>o.type==='text'); return {w:o.w,h:o.h,auto:o.auto,text:o.text} }")
        print('text', o)
        # canvia la mida de lletra des del panell
        out['textId'] = ev(pg, "() => Object.values(GL.store.doc.objs).find(o=>o.type==='text').id")
    def t_resize_rotate(pg):
        x0, y0 = out['x0'], out['y0']
        pg.keyboard.press('r')
        drag(pg, (400, 300), (560, 420))
        rid = ev(pg, "() => GL.app.sel[0]")
        h = ev(pg, "() => GL.app.handles().map(h => ({k:h.k,i:h.i,x:h.s.x,y:h.s.y}))")
        br = [q for q in h if q['k'] == 'r' and q['i'] == 4][0]
        drag(pg, (br['x'], br['y']), (br['x'] + 60, br['y'] + 30))
        o1 = ev(pg, f"() => GL.store.obj('{rid}')")
        print('resize', round(o1['w'], 1), round(o1['h'], 1))
        h = ev(pg, "() => GL.app.handles().map(h => ({k:h.k,i:h.i,x:h.s.x,y:h.s.y}))")
        rt = [q for q in h if q['k'] == 'rot' and q['i'] == 2][0]
        drag(pg, (rt['x'], rt['y']), (rt['x'] - 40, rt['y'] + 60), mods='Shift')
        o2 = ev(pg, f"() => GL.store.obj('{rid}')")
        print('rot', o2['rot'])
        S(pg, 'rotated')
        out['rid'] = rid
    def t_multi_group(pg):
        x0, y0 = out['x0'], out['y0']
        pg.keyboard.press('o')
        drag(pg, (650, 300), (760, 400))
        # marquee seleccionant tot
        pg.keyboard.press('Escape')
        drag(pg, (330, 100), (820, 480))
        n = ev(pg, "() => GL.app.sel.length")
        print('marquee sel', n)
        S(pg, 'multisel')
        pg.keyboard.press('Control+g')
        print('group', ev(pg, "() => GL.store.obj(GL.app.sel[0]).type"))
        pg.keyboard.press('Control+z')
        print('undo group ->', ev(pg, "() => Object.values(GL.store.doc.objs).filter(o=>o.type==='group').length"))
    def t_menus(pg):
        pg.click('.mb-item >> text=Objecte')
        S(pg, 'menu_obj')
        pg.hover('.mi >> text=Transforma')
        pg.wait_for_timeout(150)
        S(pg, 'menu_sub')
        pg.keyboard.press('Escape'); pg.keyboard.press('Escape')
        pg.keyboard.press('Control+k')
        pg.keyboard.type('agru')
        S(pg, 'palette')
        pg.keyboard.press('Escape')
    def t_color(pg):
        x0, y0 = out['x0'], out['y0']
        rid = out['rid']
        ev(pg, f"() => GL.app.select(['{rid}'])")
        pg.wait_for_timeout(100)
        pg.locator('.p-sec:has-text("Emplenament") .swatch').first.click()
        S(pg, 'picker')
        pg.click('.cp-tabs button >> text=Lineal')
        S(pg, 'picker_grad')
        pg.mouse.click(10, 880)
        print('fill', ev(pg, f"() => GL.store.obj('{rid}').fill.t"))
    def t_image(pg):
        ev(pg, "() => { const b = atob('" + base64.b64encode(PNG).decode() + "'); const u = new Uint8Array(b.length); for (let i=0;i<b.length;i++) u[i]=b.charCodeAt(i); window.__f = new File([u], 'punt.png', {type:'image/png'}); }")
        ev(pg, "() => GL.io.importFiles([window.__f])")
        pg.wait_for_timeout(300)
        o = ev(pg, "() => { const o = GL.store.obj(GL.app.sel[0]); return o && {type:o.type,w:o.w,h:o.h} }")
        print('image', o)
        pg.keyboard.press('Enter')
        S(pg, 'crop')
        pg.keyboard.press('Escape')
    def t_pages(pg):
        pg.keyboard.press('Control+Shift+n')
        pg.wait_for_timeout(200)
        pg.keyboard.press('r')
        drag(pg, (450, 300), (650, 500))
        S(pg, 'page2')
        pg.click('#viewSeg button >> text=Totes')
        pg.wait_for_timeout(200)
        S(pg, 'allpages')
        pg.click('#viewSeg button >> text=Pàgina')
    def t_export(pg):
        pg.keyboard.press('Control+Shift+e')
        S(pg, 'export')
        pg.keyboard.press('Escape')
    def t_context(pg):
        x0, y0 = out['x0'], out['y0']
        pg.mouse.click(x0 + 550, y0 + 400, button='right')
        S(pg, 'context')
        pg.keyboard.press('Escape')
    def t_nodes(pg):
        x0, y0 = out['x0'], out['y0']
        pg.keyboard.press('p')
        pts = [(420, 200), (520, 160), (620, 260), (560, 360)]
        for i, p in enumerate(pts):
            if i == 1:
                pg.mouse.move(x0 + p[0], y0 + p[1]); pg.mouse.down(); pg.mouse.move(x0 + p[0] + 40, y0 + p[1] - 10, steps=4); pg.mouse.up()
            else:
                pg.mouse.click(x0 + p[0], y0 + p[1])
        pg.mouse.click(x0 + 420, y0 + 200)
        o = ev(pg, "() => { const o = GL.store.obj(GL.app.sel[0]); return o && {type:o.type, n:o.sp[0].n.length, c:o.sp[0].c} }")
        print('pen', o)
        pg.keyboard.press('Enter')
        S(pg, 'nodes')
        pg.keyboard.press('Escape')
    return [setup, t_text, t_resize_rotate, t_multi_group, t_menus, t_color, t_image, t_nodes, t_context, t_pages, t_export]

errs = run(steps())
print('\n'.join(errs) or 'sense errors')
