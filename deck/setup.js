// Creates (or finds) exactly ten slides, names them, checks fonts. Safe to rerun: it never makes a second set.
let grid = figma.currentPage.children.find(c => c.type === "SLIDE_GRID");
if (grid === undefined) { figma.createSlide(); grid = figma.currentPage.children.find(c => c.type === "SLIDE_GRID"); }
const all = () => grid.children.flatMap(r => r.children);
let guard = 0; while (all().length < 10 && guard++ < 14) figma.createSlide();
const names = ["01 Cover", "02 Summary", "03 The Problem", "04 Where to Play", "05 The Network", "06 The Warranty", "07 The Economics", "08 The Roadmap", "09 Appendix", "10 Thank You"];
const slides = all(); slides.slice(0, 10).forEach((s, i) => { s.name = names[i]; });
const fonts = await figma.listAvailableFontsAsync();
const need = [["Poppins", "Bold"], ["Poppins", "ExtraBold"], ["Inter", "Semi Bold"], ["Inter", "Bold"]];
return { count: slides.length, ids: slides.slice(0, 10).map(s => s.id), extra: slides.slice(10).map(s => ({ id: s.id, children: s.children.length })),
  fontsOk: need.map(n => fonts.some(f => f.fontName.family === n[0] && f.fontName.style === n[1])) };
