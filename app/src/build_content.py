import json,re,sys
sys.path.insert(0,'.')
from content import *
idx=json.load(open('../bible/index.json')); names=[b[0] for b in idx]
cache={}
def book(n):
    i=names.index('Psalms' if n=='Psalm' else n)
    if i not in cache: cache[i]=json.load(open(f'../bible/{i:02d}.json'))
    return cache[i]
def ref(r):
    m=re.match(r'^(.+?) (\d+):(\d+)(?:-(\d+))?$',r); b,c,v1,v2=m.group(1),int(m.group(2)),int(m.group(3)),m.group(4)
    v2=int(v2) if v2 else v1
    ch=book(b)['chapters'][c-1]
    return " ".join(ch[v-1] for v in range(v1,v2+1)).strip()
out={"modules":MODULES,"lessons":{},"prompts":GENERAL_PROMPTS,"verses":[]}
for k,L in LESSONS.items():
    L=dict(L); dev=[]
    for b in L['devotional']:
        if 'v' in b: dev.append({"v":ref(b['v']),"r":b['v']})
        else: dev.append(b)
    L['devotional']=dev; L['closing']={"t":ref(L['closing']),"r":L['closing']}
    out['lessons'][k]=L
for r in DAILY_VERSES: out['verses'].append({"t":ref(r),"r":r})
open('../content.js','w').write("window.VEREDA_CONTENT="+json.dumps(out,ensure_ascii=False)+";")
for k,L in out['lessons'].items():
    for b in L['devotional']:
        if 'v' in b: print(b['r'],'|',b['v'][:140])
