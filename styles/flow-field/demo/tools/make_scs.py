"""South China Sea islands, the dashed line and the Diaoyu Islands -> scs.js (drawn by story.js on every map shot).
Run: python3 tools/make_scs.py   (reads raw/ne/chn.geojson; tools/fetch_data.py downloads it)

Sources (also in CREDITS and FACTS.md §9):
- Xisha: 中华人民共和国政府关于中华人民共和国领海基线的声明 (1996-05-15), Xisha base points 1-28, transcribed below.
  https://www.mfa.gov.cn/web/wjb_673085/zzjg_673183/bjhysws_674671/bhsmgb/200904/t20090409_9866755.shtml
- Huangyan Dao: 中华人民共和国政府关于黄岩岛领海基线的声明 (2024-11-10), base points 1-15.
  https://www.mfa.gov.cn/web/zyxw/202411/t20241110_11524120.shtml
- Diaoyu Dao and its affiliated islands: 中华人民共和国政府关于钓鱼岛及其附属岛屿领海基线的声明 (2012-09-10).
  https://www.mfa.gov.cn/web/wjb_673085/zzjg_673183/bjhysws_674671/bhsmgb/201209/t20120910_320427.shtml
- Single islands and reefs with no published base points (Yongxing Dao, Dongsha Dao, Nansha features, the Zhongsha bank,
  group label anchors): Wikidata coordinates (CC0), item ids next to each entry.
- The dashed line, nine dashes: Natural Earth 1:10m "admin_0_boundary_lines_maritime_indicator_chn" (public domain),
  China point-of-view layer. Approximate: China has published no coordinates for the dashes.
- The dash east of Taiwan: no public coordinates in any source we could reach. Placed as an illustration on the median
  between Taiwan's east coast (ETOPO1 coastline in raw/chart.json, 121.48E at 23.4N, 121.87E at 24.6N) and Yonaguni-jima
  (Wikidata Q220701, 24.455N 122.987E), 23.4N-24.6N, about the length of the other dashes. An illustration, as FACTS.md §9 says.
"""
import json, os
D = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
dm = lambda d, m: d + m / 60

# 1996 declaration, Xisha base points (lat deg, min, lon deg, min)
XISHA_BP = [('东岛1', 16, 40.5, 112, 44.2), ('东岛2', 16, 40.1, 112, 44.5), ('东岛3', 16, 39.8, 112, 44.7),
            ('浪花礁1', 16, 4.4, 112, 35.8), ('浪花礁2', 16, 1.9, 112, 32.7), ('浪花礁3', 16, 1.5, 112, 31.8), ('浪花礁4', 16, 1.0, 112, 29.8),
            ('中建岛1', 15, 46.5, 111, 12.6), ('中建岛2', 15, 46.4, 111, 12.1), ('中建岛3', 15, 46.4, 111, 11.8), ('中建岛4', 15, 46.5, 111, 11.6),
            ('中建岛5', 15, 46.7, 111, 11.4), ('中建岛6', 15, 46.9, 111, 11.3), ('中建岛7', 15, 47.2, 111, 11.4),
            ('北礁1', 17, 4.9, 111, 26.9), ('北礁2', 17, 5.4, 111, 26.9), ('北礁3', 17, 5.7, 111, 27.2), ('北礁4', 17, 6.0, 111, 27.8),
            ('北礁5', 17, 6.5, 111, 29.2), ('北礁6', 17, 7.0, 111, 31.0), ('北礁7', 17, 7.1, 111, 31.6), ('北礁8', 17, 6.9, 111, 32.0),
            ('赵述岛1', 16, 59.9, 112, 14.7), ('赵述岛2', 16, 59.7, 112, 15.6), ('赵述岛3', 16, 59.4, 112, 16.6),
            ('北岛', 16, 58.4, 112, 18.3), ('中岛', 16, 57.6, 112, 19.6), ('南岛', 16, 56.9, 112, 20.5)]
# 2024 declaration, Huangyan Dao base points 1-15
HUANGYAN_BP = [(15, 8.1, 117, 50.9), (15, 7.4, 117, 50.8), (15, 7.0, 117, 50.6), (15, 6.6, 117, 50.2), (15, 6.1, 117, 49.5),
               (15, 6.3, 117, 44.2), (15, 7.3, 117, 43.1), (15, 12.7, 117, 42.6), (15, 13.1, 117, 42.8), (15, 13.4, 117, 43.3),
               (15, 13.5, 117, 43.9), (15, 13.5, 117, 44.4), (15, 9.6, 117, 49.7), (15, 9.0, 117, 50.4), (15, 8.5, 117, 50.8)]
# 2012 declaration, Diaoyu Dao and affiliated islands (part I) and Chiwei Yu (part II)
DIAOYU_BP = [('钓鱼岛', 25, 44.1, 123, 27.5), ('钓鱼岛', 25, 44.2, 123, 27.4), ('钓鱼岛', 25, 44.4, 123, 27.4), ('钓鱼岛', 25, 44.7, 123, 27.5),
             ('海豚岛', 25, 55.8, 123, 40.7), ('下虎牙岛', 25, 55.8, 123, 41.1), ('海星岛', 25, 55.6, 123, 41.3), ('黄尾屿', 25, 55.4, 123, 41.4),
             ('海龟岛', 25, 55.3, 123, 41.4), ('长龙岛', 25, 43.2, 123, 33.4), ('南小岛', 25, 43.2, 123, 33.2), ('鲳鱼岛', 25, 44.0, 123, 27.6),
             ('赤尾屿', 25, 55.3, 124, 33.7), ('望赤岛', 25, 55.2, 124, 33.2), ('小赤尾岛', 25, 55.3, 124, 33.3), ('赤背北岛', 25, 55.5, 124, 33.5), ('赤背东岛', 25, 55.5, 124, 33.7)]
# Wikidata (CC0)
WD = {'永兴岛': (112.3375, 16.834167, 'Q393044'), '东沙岛': (116.727539, 20.703572, 'Q11103595'),
      '太平岛': (114.366667, 10.375, 'Q701264'), '中业岛': (114.283333, 11.052222, 'Q2232625'), '渚碧礁': (114.062, 10.9133, 'Q1150068'),
      '永暑礁': (112.966667, 9.616667, 'Q5447293'), '美济礁': (115.533333, 9.916667, 'Q1536891'), '南威岛': (111.92, 8.64472, 'Q3273381'),
      '弹丸礁': (113.841667, 7.372222, 'Q1936216'), '曾母暗沙': (112.348889, 3.973889, 'Q707510')}
GROUP = {'西沙群岛': (112.0, 16.5, 'Q274388'), '南沙群岛': (114.0, 10.0, 'Q215664'), '中沙群岛': (114.5, 16.0, 'Q20050783'),
         '东沙群岛': (116.7275, 20.702222, 'Q698931'), '黄岩岛': (117.766667, 15.183333, 'Q628716')}

islands = []   # [lon, lat, kind]   kind: 0 island, 1 reef
seen = set()
for n, a, b, c, d in XISHA_BP:
    base = n.rstrip('0123456789')
    if base in ('浪花礁', '北礁'): continue          # reefs: drawn as rings below
    if base in seen: continue
    pts = [(dm(c2, d2), dm(a2, b2)) for n2, a2, b2, c2, d2 in XISHA_BP if n2.rstrip('0123456789') == base]
    islands.append([round(sum(p[0] for p in pts) / len(pts), 4), round(sum(p[1] for p in pts) / len(pts), 4), 0]); seen.add(base)
for n, (lo, la, q) in WD.items(): islands.append([lo, la, 1 if n.endswith(('礁', '暗沙')) else 0])
diaoyu = {}
for n, a, b, c, d in DIAOYU_BP: diaoyu.setdefault(n, []).append((dm(c, d), dm(a, b)))
for n, pts in diaoyu.items(): islands.append([round(sum(p[0] for p in pts) / len(pts), 4), round(sum(p[1] for p in pts) / len(pts), 4), 0])
rings = [[[round(dm(c, d), 4), round(dm(a, b), 4)] for a, b, c, d in HUANGYAN_BP]]
for reef in ('浪花礁', '北礁'):
    rings.append([[round(dm(c, d), 4), round(dm(a, b), 4)] for n, a, b, c, d in XISHA_BP if n.rstrip('0123456789') == reef])
G = json.load(open(os.path.join(D, 'raw/ne/chn.geojson')))
dashes = [[[round(x, 4), round(y, 4)] for x, y in f['geometry']['coordinates']] for f in G['features']]
twn = [[121.48 + (122.987 - 121.48) / 2, 23.4], [121.87 + (122.987 - 121.87) / 2, 24.6]]   # illustration only, see above
dashes.append([[round(x, 4), round(y, 4)] for x, y in twn])
groups = {k: [v[0], v[1]] for k, v in GROUP.items()}
groups['曾母暗沙'] = [WD['曾母暗沙'][0], WD['曾母暗沙'][1]]
out = dict(islands=islands, rings=rings, dashes=dashes, groups=groups)
open(os.path.join(D, 'scs.js'), 'w').write('// generated by tools/make_scs.py — sources in that file\nexport const SCS = ' + json.dumps(out, ensure_ascii=False) + ';\n')
print(len(islands), 'islands', len(rings), 'reef rings', len(dashes), 'dashes (last one: east of Taiwan, illustrative)')
