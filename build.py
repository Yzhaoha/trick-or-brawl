#!/usr/bin/env python3
"""Build the Poki and CrazyGames variants of Trick or Brawl from src/.

Output:  poki/ and crazygames/ (served on GitHub Pages); the Poki build is also copied to the repo root,
         because https://yzhaoha.github.io/trick-or-brawl/ is the playable link given to Poki
         dist/trick-or-brawl-poki.zip, dist/trick-or-brawl-crazygames.zip (index.html at the zip root)
Run:     python3 build.py
"""
import os, shutil, zipfile

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, 'src')
PLATFORMS = ['poki', 'crazygames']


def build(name):
    tpl = open(os.path.join(SRC, 'index.html'), encoding='utf-8').read()
    head = open(os.path.join(SRC, 'platform', name + '.head.html'), encoding='utf-8').read().rstrip('\n')
    wrap = open(os.path.join(SRC, 'platform', name + '.wrapper.js'), encoding='utf-8').read().rstrip('\n')
    for marker in ('<!--@SDK_HEAD-->', '/*@SDK_WRAPPER*/'):
        assert tpl.count(marker) == 1, marker
    html = tpl.replace('<!--@SDK_HEAD-->', head).replace('/*@SDK_WRAPPER*/', wrap)
    out = os.path.join(ROOT, name)
    shutil.rmtree(out, ignore_errors=True)
    shutil.copytree(os.path.join(SRC, 'vendor'), os.path.join(out, 'vendor'))
    open(os.path.join(out, 'index.html'), 'w', encoding='utf-8').write(html)
    os.makedirs(os.path.join(ROOT, 'dist'), exist_ok=True)
    zpath = os.path.join(ROOT, 'dist', f'trick-or-brawl-{name}.zip')
    with zipfile.ZipFile(zpath, 'w', zipfile.ZIP_DEFLATED) as z:
        for d, _, files in os.walk(out):
            for f in sorted(files):
                if f.startswith('.'):
                    continue
                full = os.path.join(d, f)
                z.write(full, os.path.relpath(full, out))
    print(f'{name}: {os.path.getsize(zpath) // 1024} KB -> {os.path.relpath(zpath, ROOT)}')


def root_from(name):
    src = os.path.join(ROOT, name)
    shutil.copyfile(os.path.join(src, 'index.html'), os.path.join(ROOT, 'index.html'))
    shutil.rmtree(os.path.join(ROOT, 'vendor'), ignore_errors=True)
    shutil.copytree(os.path.join(src, 'vendor'), os.path.join(ROOT, 'vendor'))
    print(f'root: {name} build')


if __name__ == '__main__':
    for p in PLATFORMS:
        build(p)
    root_from('poki')
