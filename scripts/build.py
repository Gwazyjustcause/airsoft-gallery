"""Build the static gallery from image folders; no third-party dependencies."""
from pathlib import Path
from datetime import datetime
from zoneinfo import ZoneInfo
from urllib.parse import quote
import re, json, shutil, calendar
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'dist'
EXT={'.jpg','.jpeg','.png','.webp','.avif'}

def build():
    now=datetime.now(ZoneInfo('Europe/Lisbon'))
    if OUT.exists(): shutil.rmtree(OUT)
    OUT.mkdir()
    for name in ('index.html','style.css','app.js'): shutil.copy2(ROOT/name,OUT/name)
    albums=[]
    folders={p.parent for p in ROOT.rglob('*') if p.is_file() and p.suffix.lower() in EXT and not any(s.startswith('.') or s in ('dist','node_modules','scripts') for s in p.relative_to(ROOT).parts)}
    for folder in sorted(folders):
        relative=folder.relative_to(ROOT)
        photos=sorted((p for p in folder.iterdir() if p.is_file() and p.suffix.lower() in EXT),key=lambda p:p.name.lower())
        meta_path=folder/'album.json'
        meta=json.loads(meta_path.read_text('utf-8')) if meta_path.exists() else {}
        match=re.search(r'(20\d{2})[-_.](\d{2})[-_.](\d{2})',folder.name)
        date=meta.get('date', '-'.join(match.groups()) if match else None)
        if date: datetime.strptime(date,'%Y-%m-%d')
        year=int(date[:4]) if date else next((int(p) for p in relative.parts if re.fullmatch(r'20\d{2}',p)),now.year)
        deadline=datetime(year+1,2,calendar.monthrange(year+1,2)[1],23,59,59,tzinfo=ZoneInfo('Europe/Lisbon'))
        if now>deadline or year>now.year: continue
        title=meta.get('title') or (folder.name[match.end():].strip(' -_') if match else folder.name).replace('_',' ')
        items=[]
        for p in photos:
            dest=OUT/p.relative_to(ROOT);dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(p,dest)
            items.append({'src':quote(p.relative_to(ROOT).as_posix(),safe='/'),'name':p.name})
        cover=next((p['src'] for p in items if p['name']==meta.get('cover')),items[0]['src'])
        albums.append({'id':relative.as_posix(),'title':title or 'Jogo de airsoft','location':meta.get('location',''),'date':date,'year':year,'cover':cover,'photos':items})
    (OUT/'albums.json').write_text(json.dumps(albums,ensure_ascii=False,indent=2),'utf-8')
    size=sum(p.stat().st_size for p in OUT.rglob('*') if p.is_file())
    print(f'{len(albums)} álbuns · {sum(len(a["photos"]) for a in albums)} fotografias · {size/1e6:.1f} MB')
    if size>950_000_000: print('AVISO: a galeria aproxima-se do limite de 1 GB do GitHub Pages.')
    if size>1_000_000_000: raise SystemExit('A galeria ultrapassa 1 GB. Remove álbuns ou reduz o tamanho das imagens.')
if __name__=='__main__':build()
