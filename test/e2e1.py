import sys
sys.path.insert(0, '/home/claude/llenc/test')
from shot import run, OUT

def steps():
    def create(pg):
        pg.click('text=Crea el document')
        pg.wait_for_timeout(300)
        pg.keyboard.press('Escape')
        pg.screenshot(path=OUT + 'empty.png')
    def draw(pg):
        st = pg.locator('#stage').bounding_box()
        x0, y0 = st['x'], st['y']
        pg.keyboard.press('r')
        pg.mouse.move(x0 + 400, y0 + 200); pg.mouse.down(); pg.mouse.move(x0 + 520, y0 + 280, steps=6); pg.mouse.move(x0 + 600, y0 + 330, steps=6); pg.mouse.up()
        pg.keyboard.press('o')
        pg.mouse.move(x0 + 650, y0 + 200); pg.mouse.down(); pg.mouse.move(x0 + 760, y0 + 320, steps=8); pg.mouse.up()
        pg.keyboard.press('y')
        pg.mouse.move(x0 + 420, y0 + 400); pg.mouse.down(); pg.mouse.move(x0 + 540, y0 + 520, steps=8); pg.mouse.up()
        pg.keyboard.press('Shift+Y')
        pg.mouse.move(x0 + 600, y0 + 400); pg.mouse.down(); pg.mouse.move(x0 + 720, y0 + 520, steps=8); pg.mouse.up()
        pg.keyboard.press('Shift+L')
        pg.mouse.move(x0 + 420, y0 + 580); pg.mouse.down(); pg.mouse.move(x0 + 720, y0 + 620, steps=8); pg.mouse.up()
        pg.keyboard.press('t')
        pg.mouse.click(x0 + 430, y0 + 680)
        pg.keyboard.type('Hola guaitaLlenç')
        pg.keyboard.press('Escape')
        pg.wait_for_timeout(200)
        pg.screenshot(path=OUT + 'shapes.png')
        # selecciona el rectangle
        pg.mouse.click(x0 + 500, y0 + 260)
        pg.wait_for_timeout(200)
        pg.screenshot(path=OUT + 'selrect.png')
        info = pg.evaluate("() => ({ n: Object.keys(GL.store.doc.objs).length, sel: GL.app.sel.length, types: Object.values(GL.store.doc.objs).map(o=>o.type) })")
        print(info)
    return [create, draw]

print('\n'.join(run(steps())) or 'sense errors')
