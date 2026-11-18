"""Build the Unstop methodology PDF: python -X utf8 research/build_pdf.py [extra output dir]"""
import pathlib, subprocess, shutil, sys
from markdown_it import MarkdownIt
HERE = pathlib.Path(__file__).resolve().parent
md = MarkdownIt("commonmark", {"html": False}).enable("table")
body = md.render((HERE / "rr-pressure-research.md").read_text(encoding="utf-8"))
css = """
@page { size: A4; margin: 16mm 15mm 18mm 15mm; @bottom-left { content: "Reliable Under Pressure  |  Team IdeaForge"; color:#1226AA; font: 8pt Inter, Arial; } @bottom-right { content: counter(page); color:#1226AA; font: 8pt Inter, Arial; } }
body { font: 10pt/1.5 Inter, Arial, sans-serif; color:#0A0F1F; }
h1 { font: 800 22pt/1.15 Montserrat, Arial; color:#021D45; border-bottom: 4px solid #E50695; padding-bottom: 6px; margin: 0 0 10px; }
h2 { font: 700 14pt Montserrat, Arial; color:#1226AA; margin: 20px 0 6px; page-break-after: avoid; }
p { margin: 6px 0; } ul { margin: 4px 0 4px 18px; padding: 0; }
table { border-collapse: collapse; width: 100%; margin: 8px 0; font-size: 8.5pt; page-break-inside: avoid; }
th { background:#021D45; color:#fff; text-align:left; padding: 4px 6px; } td { padding: 3px 6px; border-bottom: 1px solid #D5D9E6; } tr:nth-child(even) td { background:#F5F6FA; }
img { max-width: 100%; display:block; margin: 6px auto; page-break-inside: avoid; max-height: 80mm; object-fit: contain; }
"""
html = f'<!doctype html><html><head><meta charset="utf-8"><base href="{HERE.as_uri()}/"><title>Reliable Under Pressure</title><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&family=Montserrat:wght@700;800&display=swap" rel="stylesheet"><style>{css}</style></head><body>{body}</body></html>'
(HERE / "rr-pressure-research.html").write_text(html, encoding="utf-8")
pdf = HERE / "rr-pressure-research.pdf"
subprocess.run([r"C:\Program Files\Google\Chrome\Application\chrome.exe", "--headless", "--disable-gpu", "--no-pdf-header-footer", "--virtual-time-budget=8000", f"--print-to-pdf={pdf}", (HERE / "rr-pressure-research.html").as_uri()], check=True)
print("PDF", pdf.stat().st_size)
for d in sys.argv[1:]: shutil.copy(pdf, pathlib.Path(d) / "RR-Pressure-Methodology.pdf"); print("copied to", d)
