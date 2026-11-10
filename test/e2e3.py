import sys, base64, json, zlib, struct
sys.path.insert(0, '/home/claude/llenc/test')
from shot import OUT, HTML
from playwright.sync_api import sync_playwright

SVG = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
<circle cx="60" cy="60" r="50" fill="#c8ff2e"/><path d="M30 60 L55 85 L95 35" fill="none" stroke="#0b0d0c" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/></svg>'''

def main():
    errs = []
    res = {}
    with sync_playwright() as p:
        b = p.chromium.launch()
        ctx = b.new_context(viewport={'width': 1440, 'height': 900}, accept_downloads=True)
        pg = ctx.new_page()
        pg.on('pageerror', lambda e: errs.append(f'[pageerror] {e} :: {e.stack}'))
        pg.on('console', lambda m: errs.append(f'[{m.type}] {m.text}') if m.type == 'error' else None)
        pg.add_init_script('window.showSaveFilePicker = undefined; window.showOpenFilePicker = undefined;')
        pg.goto('file://' + HTML)
        pg.wait_for_timeout(600)
        pg.click('text=Crea el document'); pg.wait_for_timeout(300)
        st = pg.locator('#stage').bounding_box(); x0, y0 = st['x'], st['y']
        def drag(a, b2, mods=None, steps=8):
            if mods: pg.keyboard.down(mods)
            pg.mouse.move(x0 + a[0], y0 + a[1]); pg.mouse.down(); pg.mouse.move(x0 + b2[0], y0 + b2[1], steps=steps); pg.mouse.up()
            if mods: pg.keyboard.up(mods)
        # SVG importat
        pg.evaluate("(t) => { window.__svg = new File([t], 'logo.svg', {type:'image/svg+xml'}); }", SVG)
        pg.evaluate("() => GL.io.importFiles([window.__svg])")
        pg.wait_for_timeout(300)
        res['svgimport'] = pg.evaluate("() => { const o = GL.store.obj(GL.app.sel[0]); return {type:o.type, kids: GL.store.children(o.id).map(k=>k.type)} }")
        # guia des del regle superior
        rt = pg.locator('#rulerTop').bounding_box()
        pg.mouse.move(rt['x'] + 300, rt['y'] + 10); pg.mouse.down(); pg.mouse.move(rt['x'] + 300, rt['y'] + 300, steps=6); pg.mouse.up()
        res['guides'] = pg.evaluate("() => GL.app.page().guides")
        # rectangle i arrossegament amb guies intel·ligents
        pg.keyboard.press('r'); drag((380, 500), (480, 580))
        rid = pg.evaluate("() => GL.app.sel[0]")
        pg.mouse.move(x0 + 430, y0 + 540); pg.mouse.down(); pg.mouse.move(x0 + 520, y0 + 545, steps=10)
        pg.screenshot(path=OUT + 'snapping.png')
        pg.mouse.up()
        # Alt+arrossega duplica
        n0 = pg.evaluate("() => Object.keys(GL.store.doc.objs).length")
        pg.keyboard.down('Alt'); pg.mouse.move(x0 + 520, y0 + 545); pg.mouse.down(); pg.mouse.move(x0 + 620, y0 + 620, steps=8); pg.mouse.up(); pg.keyboard.up('Alt')
        res['altdup'] = pg.evaluate("() => Object.keys(GL.store.doc.objs).length") - n0
        # desplaçament amb teclat (agrupat a l'historial)
        before = pg.evaluate("() => GL.store.undoStack.length")
        for _ in range(5): pg.keyboard.press('ArrowRight')
        res['nudgeUndo'] = pg.evaluate("() => GL.store.undoStack.length") - before
        # mida de lletra del text via panell
        pg.keyboard.press('t'); pg.mouse.click(x0 + 400, y0 + 680); pg.keyboard.type('Títol'); pg.keyboard.press('Escape')
        fs = pg.locator('.p-sec:has-text("Text") .fld:has(.fl[data-tip="Mida (px)"]) input')
        fs.click(); fs.fill('48'); fs.press('Enter')
        res['fontsize'] = pg.evaluate("() => { const o = GL.store.obj(GL.app.sel[0]); return [o.fs, Math.round(o.h)] }")
        pg.screenshot(path=OUT + 'textprops.png')
        # reordenació de capes per arrossegament
        rows = pg.locator('.ly-row')
        first = rows.nth(0).bounding_box(); last = rows.nth(rows.count() - 1).bounding_box()
        order0 = pg.evaluate("() => GL.store.children(GL.app.pageId).map(o=>o.id)")
        pg.mouse.move(first['x'] + 60, first['y'] + 14); pg.mouse.down(); pg.mouse.move(last['x'] + 60, last['y'] + 24, steps=10); pg.mouse.up()
        order1 = pg.evaluate("() => GL.store.children(GL.app.pageId).map(o=>o.id)")
        res['layerdrag'] = order1[0] == order0[-1]
        # zoom amb roda + ctrl
        z0 = pg.evaluate("() => GL.app.z")
        pg.mouse.move(x0 + 500, y0 + 400); pg.keyboard.down('Control'); pg.mouse.wheel(0, -300); pg.keyboard.up('Control')
        pg.wait_for_timeout(100)
        res['zoom'] = pg.evaluate("() => GL.app.z") > z0
        pg.keyboard.press('Shift+1')
        # exporta PNG
        pg.keyboard.press('Control+Shift+e')
        pg.wait_for_timeout(200)
        with pg.expect_download() as dl:
            pg.click('.dlg-f .btn.primary')
        d = dl.value; path = OUT + 'exp.png'; d.save_as(path)
        data = open(path, 'rb').read()
        w, h = struct.unpack('>II', data[16:24])
        res['png'] = (data[:8] == b'\x89PNG\r\n\x1a\n', w, h, d.suggested_filename)
        # exporta PNG editable i torna'l a obrir
        pg.keyboard.press('Control+Shift+e'); pg.wait_for_timeout(200)
        pg.click('.dlg label:has-text("Editable") input')
        with pg.expect_download() as dl:
            pg.click('.dlg-f .btn.primary')
        d = dl.value; path2 = OUT + 'exp_ed.png'; d.save_as(path2)
        b64 = base64.b64encode(open(path2, 'rb').read()).decode()
        nobj = pg.evaluate("() => Object.keys(GL.store.doc.objs).length")
        res['reopen'] = pg.evaluate("async (b) => { const u = Uint8Array.from(atob(b), c => c.charCodeAt(0)); const d = await GL.io.fromPNG(u); return d && Object.keys(d.doc.objs).length }", b64) == nobj
        # exporta SVG
        pg.keyboard.press('Control+Shift+e'); pg.wait_for_timeout(200)
        pg.click('.fmt:has-text("SVG")')
        with pg.expect_download() as dl:
            pg.click('.dlg-f .btn.primary')
        d = dl.value; p3 = OUT + 'exp.svg'; d.save_as(p3)
        svgt = open(p3).read()
        res['svg'] = (svgt.startswith('<svg'), 'mm"' in svgt[:300], len(svgt))
        # desa .llenc
        with pg.expect_download() as dl:
            pg.keyboard.press('Control+s')
        d = dl.value; p4 = OUT + 'doc.llenc'; d.save_as(p4)
        j = json.load(open(p4))
        res['llenc'] = (j['format'], j['version'], len(j['doc']['objs']), d.suggested_filename)
        res['saveState'] = pg.evaluate("() => document.querySelector('#saveState').className")
        # vista prèvia en PNG exportat
        b.close()
    print(json.dumps(res, ensure_ascii=False, indent=1))
    print('\n'.join(errs) or 'sense errors')

main()
