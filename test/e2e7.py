# GitHub: sincronització, historial i comparació amb API simulada
import sys, json, re, urllib.parse
sys.path.insert(0, '/home/claude/llenc/test')
from shot import OUT, HTML
from playwright.sync_api import sync_playwright

files = {}; n = [0]
CORS = {'access-control-allow-origin': '*', 'access-control-allow-headers': '*', 'access-control-allow-methods': '*'}

def handler(route, req):
    if req.method == 'OPTIONS':
        return route.fulfill(status=204, headers=CORS)
    u = urllib.parse.urlparse(req.url); q = urllib.parse.parse_qs(u.query); p = urllib.parse.unquote(u.path)
    def J(st, body): route.fulfill(status=st, headers=dict(CORS, **{'content-type': 'application/json'}), body=json.dumps(body))
    if p == '/user': return J(200, {'login': 'ana', 'name': 'Ana'})
    if p == '/repos/o/r': return J(200, {'permissions': {'push': True}})
    m = re.match(r'/repos/o/r/commits$', p)
    if m:
        path = q['path'][0]
        return J(200, [{'sha': e['sha'], 'commit': {'message': e['msg'], 'author': {'name': 'Ana', 'date': e['date']}}, 'author': {'login': 'ana', 'avatar_url': ''}} for e in reversed(files.get(path, []))])
    m = re.match(r'/repos/o/r/contents/(.*)$', p)
    if m:
        path = m.group(1)
        if req.method == 'PUT':
            b = json.loads(req.post_data); import base64
            v = files.setdefault(path, []); cur = v[-1] if v else None
            if (cur and cur['sha'] != b.get('sha')) or (not cur and b.get('sha')): return J(409, {'message': 'conflict'})
            n[0] += 1; e = {'sha': 's%d' % n[0], 'text': base64.b64decode(b['content']).decode(), 'msg': b['message'], 'date': '2026-11-10T%02d:00:00Z' % (n[0] % 24)}
            v.append(e); return J(201, {'content': {'sha': e['sha']}})
        if path in files:
            v = files[path]; ref = q.get('ref', [None])[0]
            e = next((x for x in v if x['sha'] == ref), v[-1])
            return route.fulfill(status=200, headers=dict(CORS, **{'content-type': 'text/plain'}), body=e['text'])
        pre = path + '/'; names = {}
        for k, v in files.items():
            if k.startswith(pre):
                rest = k[len(pre):]; nm = rest.split('/')[0]
                names.setdefault(nm, {'name': nm, 'type': 'dir' if '/' in rest else 'file', 'sha': 'd' if '/' in rest else v[-1]['sha']})
        if names: return J(200, list(names.values()))
    return J(404, {'message': 'Not Found'})

errs = []
with sync_playwright() as pw:
    b = pw.chromium.launch(); ctx = b.new_context(viewport={'width': 1440, 'height': 900})
    pg = ctx.new_page()
    pg.on('pageerror', lambda e: errs.append(f'[pageerror] {e}'))
    pg.on('console', lambda m: errs.append(f'[{m.type}] {m.text}') if m.type == 'error' and 'Failed to load resource' not in m.text else None)
    pg.route('https://api.github.com/**', handler)
    pg.goto('file://' + HTML); pg.wait_for_timeout(600)
    pg.click('text=Crea el document'); pg.wait_for_timeout(300)
    st = pg.locator('#stage').bounding_box(); x0, y0 = st['x'], st['y']
    def drag(a, c):
        pg.mouse.move(x0 + a[0], y0 + a[1]); pg.mouse.down(); pg.mouse.move(x0 + c[0], y0 + c[1], steps=6); pg.mouse.up()
    pg.keyboard.press('r'); drag((400, 200), (560, 300))
    # configuració
    pg.evaluate("() => GL.Cmd.run('gh.config')"); pg.wait_for_timeout(200)
    inputs = pg.locator('.dlg input')
    inputs.nth(0).fill('tok'); inputs.nth(1).fill('o/r')
    pg.screenshot(path=OUT + 'gh_config.png')
    pg.click('.dlg-f .btn >> text=Desa'); pg.wait_for_timeout(500)
    print('cfg', pg.evaluate("() => [GL.gh.cfg.repo, GL.gh.cfg.user && GL.gh.cfg.user.login]"))
    # sincronitza (vincula)
    pg.evaluate("() => GL.Cmd.run('gh.sync')"); pg.wait_for_timeout(200)
    pg.screenshot(path=OUT + 'gh_link.png')
    pg.click('.dlg-f .btn.primary'); pg.wait_for_timeout(200)
    pg.fill('.dlg input', 'primera versió'); pg.click('.dlg-f .btn.primary'); pg.wait_for_timeout(900)
    print('files', sorted(files.keys()))
    print('btn', pg.evaluate("() => document.querySelector('#ghBtn').className"))
    # canvi i segona versió
    pg.keyboard.press('o'); drag((600, 200), (720, 320)); pg.keyboard.press('Escape')
    pg.wait_for_timeout(600)
    print('btn pend', pg.evaluate("() => document.querySelector('#ghBtn').className"))
    pg.screenshot(path=OUT + 'gh_pending.png')
    pg.evaluate("() => GL.Cmd.run('gh.sync')"); pg.wait_for_timeout(200)
    pg.fill('.dlg input', 'afegeix el·lipse'); pg.click('.dlg-f .btn.primary'); pg.wait_for_timeout(900)
    print('btn ok', pg.evaluate("() => document.querySelector('#ghBtn').className"))
    # historial
    pg.evaluate("() => GL.Cmd.run('gh.history')"); pg.wait_for_timeout(600)
    pg.screenshot(path=OUT + 'gh_history.png')
    rows = pg.locator('.gh-hist .pack-row'); print('versions', rows.count())
    rows.nth(1).locator('text=Vista prèvia').click(); pg.wait_for_timeout(500)
    pg.screenshot(path=OUT + 'gh_preview.png')
    pg.keyboard.press('Escape'); pg.wait_for_timeout(150)
    rows.nth(0).locator('input[type=checkbox]').check(); rows.nth(1).locator('input[type=checkbox]').check()
    pg.click('text=Compara seleccionades'); pg.wait_for_timeout(600)
    pg.screenshot(path=OUT + 'gh_compare.png')
    print('diff', pg.locator('.gh-d').all_inner_texts())
    pg.keyboard.press('Escape'); pg.wait_for_timeout(150)
    # restaura la primera versió
    rows.nth(1).locator('text=Restaura').click(); pg.wait_for_timeout(200)
    pg.locator('.dlg-f .btn.primary').last.click(); pg.wait_for_timeout(500)
    print('objs després de restaurar', pg.evaluate("() => Object.keys(GL.store.doc.objs).length"))
    pg.keyboard.press('Escape'); pg.wait_for_timeout(100)
    pg.screenshot(path=OUT + 'gh_restored.png')
    # menú del botó
    pg.keyboard.press('Escape')
    pg.click('#ghBtn'); pg.wait_for_timeout(200)
    pg.screenshot(path=OUT + 'gh_menu.png', clip={'x': 0, 'y': 0, 'width': 900, 'height': 300})
    b.close()
print('\n'.join(errs) or 'sense errors')
