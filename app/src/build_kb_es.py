import json, re, importlib.util
spec=importlib.util.spec_from_file_location("src","/home/claude/tools/kb_es_src.py"); src=importlib.util.module_from_spec(spec); spec.loader.exec_module(src)
APP='/home/claude/bibloslifeapp/app/bible'
en=json.load(open(APP+'/index.json')); es=json.load(open(APP+'/rv/index.json')); cache={}
def look(ref):
    m=re.match(r'^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$',ref); name=m.group(1).replace('Psalm','Psalms') if m.group(1)=='Psalm' else m.group(1)
    bi=[b[0] for b in en].index(name); ch=int(m.group(2)); v1=int(m.group(3)); v2=int(m.group(4) or v1)
    if bi not in cache: cache[bi]=json.load(open(f'{APP}/rv/{bi:02d}.json'))
    vs=cache[bi]['chapters'][ch-1][v1-1:v2]; assert len(vs)==v2-v1+1
    t=' '.join(vs).strip(); t=re.sub(r'\s+',' ',t)
    nm=es[bi][0]; nm='Salmo' if nm=='Salmos' else nm
    return f'«{t}» ({nm} {ch}:{v1}{"-"+str(v2) if m.group(4) else ""})'
sub=lambda s: re.sub(r'⟦(.+?)⟧', lambda m: look(m.group(1)), s)
topics=[]
for t in src.T:
    o={"id":t["id"],"kw":t["kw"],"answers":[sub(a) for a in t["answers"]]}
    if "prayer" in t: o["prayer"]=t["prayer"]
    if "priority" in t: o["priority"]=t["priority"]
    topics.append(o)
out='// VEREDA — Spanish prepared answers (generated from tools/kb_es_src.py). Scripture: Reina-Valera 1909 (public domain).\nimport type { Topic } from "./kb.ts";\n\n'
out+='export const TOPICS_ES: Topic[] = '+json.dumps(topics,ensure_ascii=False,indent=1)+';\n\n'
out+='export const PRAY_KW_ES = '+json.dumps(src.PRAY_KW,ensure_ascii=False)+';\n'
out+='export const YES_KW_ES = '+json.dumps(src.YES_KW,ensure_ascii=False)+';\n'
out+='export const GENERIC_PRAYER_ES = '+json.dumps(src.GENERIC_PRAYER,ensure_ascii=False)+';\n'
out+='export const FALLBACK_ES = '+json.dumps([sub(x) for x in src.FALLBACK],ensure_ascii=False)+';\n'
open('/home/claude/bibloslifeapp/supabase/functions/spiritual-chat/kb_es.ts','w').write(out)
print('ok', len(out)); print(topics[1]['answers'][0][:400])
