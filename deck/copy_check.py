# ===== VOLTEDGE COPY CHECK v1 =====
"""Write deck/slide-copy.md (every text node on every slide, read from the offline mock) and check it for dashes, '?', '!',
banned words, absent words, 'Rs' before a digit and invented-name candidates. Run after gen.py pre:
python -X utf8 polygenesis-dtu/deck/copy_check.py"""
import io, re, json, subprocess, pathlib, importlib.util
DECK = pathlib.Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("gen", DECK / "gen.py"); G = importlib.util.module_from_spec(spec); spec.loader.exec_module(G)
BANW = ["here's", "let's", "bottom line", "delve", "game-changer", "unlock", "it's not just", "make no mistake", "landscape", "robust", "seamless",
        "holistic", "tapestry", "paradigm", "navigate", "revolutioni", "cutting-edge", "leverage", "empower", "transformative", "journey", "synergy",
        "world-class", "best-in-class", "next-gen", "reimagine", "supercharge", "harness", "crucial", "pivotal", "furthermore", "moreover",
        "in today's", "ever-evolving", "imagine", "testament", "elevate", "what if", "picture this", "dive into", "groundbreaking",
        "state-of-the-art", "plethora", "myriad", "underscore", "showcase", "foster", "bolster", "spearhead", "nuanced", "intricate",
        "meticulous", "realm", "fast-paced", "in conclusion", "it is important to note"]
ABSENT = ["SwiftKart", "Dream Forge", "BeyondTech", "Eurogrip", "Dream11", "Satoshi", "HarvestBox", "Tikau", "DOBAARA", "Arthik", "Setu",
          "PRAMAAN", "SwasthyaGrid", "Gursimran", "Anuj", "TODO", "TBD", "Lorem", "Insert", "xyz", "undefined", "NaN"]
ALLOW = {"Team IdeaForge", "Delhi Technological University", "Ramjas College", "University of Delhi", "Ather Energy", "Ather Grid", "Battery Smart",
         "Sun Mobility", "Tata Power", "Hero Vida", "Hero MotoCorp", "Kinetic Green", "Bajaj Auto", "Ola Electric", "Reliance General", "Flipkart Minutes",
         "Tamil Nadu", "West Bengal", "Uttar Pradesh", "Battery Waste", "Outlook Business", "Autocar Pro", "Wave", "Eight70", "Delivery", "Electric"}
m = G.rd("mock_figma.js"); G.derive(); out = ["# Slide copy: every text node on every slide, read from the offline mock", ""]; bad = []
for n in range(1, G.NS + 1):
    dump = "const __s=await figma.getNodeByIdAsync('S%d'); console.log('@@T'+JSON.stringify(__s.findAll(q=>q.type==='TEXT').map(t=>t.characters)));" % n
    code = G.compose(n, "S%d" % n).replace("return {results,warnings};", dump + "\nreturn {results,warnings};")
    r = subprocess.run(["node", "-"], input=m.replace("EXACT_FLAG", "true").replace("CODE_JSON", json.dumps(code)), capture_output=True, text=True, encoding="utf-8")
    tl = [l for l in r.stdout.splitlines() if l.startswith("@@T")]; texts = json.loads(tl[0][3:]) if tl else ["(no output)"]
    out += ["## S%d" % n, ""] + ["%d. %s" % (i + 1, x.replace("\n", " / ")) for i, x in enumerate(texts)] + [""]
    for x in texts:
        low = x.lower()
        if re.search("[\u2014\u2013]", x): bad.append((n, "dash", x[:60]))
        if "?" in x or "!" in x: bad.append((n, "question or exclamation", x[:60]))
        if re.search(r"\bRs\.? ?\d", x): bad.append((n, "Rs", x[:60]))
        bad += [(n, "banned " + b, x[:60]) for b in BANW if b in low]
        bad += [(n, "absent " + a, x[:60]) for a in ABSENT if a in x]
io.open(DECK / "slide-copy.md", "w", encoding="utf-8", newline="\n").write("\n".join(out) + "\n")
t = "\n".join(out); cands = sorted(set(re.findall(r"\b(?:[A-Z][a-z]+\s){1,3}[A-Z][a-z]+\b", t)) - ALLOW)
print("copy issues", len(bad)); [print("  ", b) for b in bad]
print("name candidates to review (each must be a real organisation, a case term or a plain phrase)", len(cands)); [print("  ", c) for c in cands]
