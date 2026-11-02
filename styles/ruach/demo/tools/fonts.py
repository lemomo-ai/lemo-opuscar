"""Fetch the three OFL fonts this demo uses into demo/fonts/ (they are not in git): EB Garamond (roman and italic,
variable; covers Greek), Frank Ruhl Libre (Hebrew) and Inter, from the Google Fonts repository. python tools/fonts.py"""
import os, urllib.request
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
F = os.path.join(HERE, 'fonts'); os.makedirs(F, exist_ok=True)
RAW = 'https://github.com/google/fonts/raw/main/ofl/'
def get(url, dst):
    if not os.path.exists(dst): print('fetch', url); urllib.request.urlretrieve(url, dst)
for fam, files in {'ebgaramond': [('EBGaramond%5Bwght%5D.ttf', 'EBGaramond-VF.ttf'), ('EBGaramond-Italic%5Bwght%5D.ttf', 'EBGaramond-Italic-VF.ttf'), ('OFL.txt', 'OFL-EBGaramond.txt')],
                   'frankruhllibre': [('FrankRuhlLibre%5Bwght%5D.ttf', 'FrankRuhlLibre-VF.ttf'), ('OFL.txt', 'OFL-FrankRuhlLibre.txt')],
                   'inter': [('Inter%5Bopsz,wght%5D.ttf', 'Inter-VF.ttf'), ('OFL.txt', 'OFL-Inter.txt')]}.items():
    for src, dst in files: get(RAW + fam + '/' + src, os.path.join(F, dst))
print('fonts ok')
