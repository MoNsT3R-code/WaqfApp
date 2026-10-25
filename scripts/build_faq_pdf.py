"""Build docs/WaqfApp-FAQ.pdf from the Markdown knowledge base in docs/faq.

The same Markdown files feed the RAG agent (server/agent/knowledge.ts), so the
PDF and the assistant always agree. Run with: npm run faq:pdf
"""

import re
import sys
from datetime import date
from pathlib import Path
from xml.sax.saxutils import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm
from reportlab.platypus import (
    BaseDocTemplate, Frame, NextPageTemplate, PageBreak, PageTemplate,
    Paragraph, Spacer, KeepTogether,
)
from reportlab.platypus.tableofcontents import TableOfContents

ROOT = Path(__file__).resolve().parent.parent
FAQ_DIR = ROOT / "docs" / "faq"
OUT = ROOT / "docs" / "WaqfApp-FAQ.pdf"

ACCENT = colors.HexColor("#0E7C86")
INK = colors.HexColor("#1F2328")
MUTED = colors.HexColor("#5B6470")

styles = {
    "cover_title": ParagraphStyle("cover_title", fontName="Helvetica-Bold", fontSize=34, leading=40, textColor=INK, alignment=TA_CENTER),
    "cover_sub": ParagraphStyle("cover_sub", fontName="Helvetica", fontSize=15, leading=21, textColor=ACCENT, alignment=TA_CENTER),
    "cover_note": ParagraphStyle("cover_note", fontName="Helvetica", fontSize=10.5, leading=15, textColor=MUTED, alignment=TA_CENTER),
    "toc_title": ParagraphStyle("toc_title", fontName="Helvetica-Bold", fontSize=20, leading=26, textColor=INK, spaceAfter=14),
    "section": ParagraphStyle("section", fontName="Helvetica-Bold", fontSize=20, leading=26, textColor=ACCENT, spaceAfter=16),
    "question": ParagraphStyle("question", fontName="Helvetica-Bold", fontSize=11.5, leading=16, textColor=INK, spaceBefore=12, spaceAfter=4),
    "answer": ParagraphStyle("answer", fontName="Helvetica", fontSize=11, leading=16.5, textColor=INK, spaceAfter=6),
}
toc_levels = [
    ParagraphStyle("toc1", fontName="Helvetica", fontSize=11, leading=17, leftIndent=0, textColor=INK),
]


def parse_faq():
    """Yield (section, [(question, [paragraphs])]) in file order."""
    sections = []
    for path in sorted(FAQ_DIR.glob("*.md")):
        question = None
        for line in path.read_text(encoding="utf-8").splitlines():
            if line.startswith("# "):
                sections.append((line[2:].strip(), []))
                question = None
            elif line.startswith("## "):
                question = (line[3:].strip(), [])
                sections[-1][1].append(question)
            elif line.strip() and question is not None:
                question[1].append(line.strip())
    return sections


def inline(text):
    """Escape for reportlab and render "quoted" UI names in italics-free plain text."""
    return re.sub(r"\s+", " ", escape(text))


class FAQDoc(BaseDocTemplate):
    def __init__(self, filename):
        super().__init__(filename, pagesize=A4, leftMargin=2.3 * cm, rightMargin=2.3 * cm,
                         topMargin=2.2 * cm, bottomMargin=2.2 * cm,
                         title="WaqfApp Frequently Asked Questions", author="WaqfApp Foundation")
        frame = Frame(self.leftMargin, self.bottomMargin, self.width, self.height, id="body")
        self.addPageTemplates([
            PageTemplate(id="cover", frames=[frame]),
            PageTemplate(id="body", frames=[frame], onPage=self._decorate),
        ])

    def _decorate(self, canvas, doc):
        canvas.saveState()
        canvas.setFont("Helvetica", 8.5)
        canvas.setFillColor(MUTED)
        canvas.drawString(self.leftMargin, 1.3 * cm, "WaqfApp - Frequently Asked Questions")
        canvas.drawRightString(A4[0] - self.rightMargin, 1.3 * cm, f"Page {doc.page}")
        canvas.setStrokeColor(colors.HexColor("#D0D7DE"))
        canvas.line(self.leftMargin, 1.7 * cm, A4[0] - self.rightMargin, 1.7 * cm)
        canvas.restoreState()

    def afterFlowable(self, flowable):
        if isinstance(flowable, Paragraph) and flowable.style.name == "section":
            text = flowable.getPlainText()
            key = f"sec-{self.seq.nextf('section')}"
            self.canv.bookmarkPage(key)
            self.canv.addOutlineEntry(text, key, level=0)
            self.notify("TOCEntry", (0, text, self.page, key))


def build():
    sections = parse_faq()
    total_q = sum(len(qs) for _, qs in sections)

    story = [
        Spacer(1, 6 * cm),
        Paragraph("WaqfApp", styles["cover_title"]),
        Spacer(1, 0.4 * cm),
        Paragraph("Frequently Asked Questions", styles["cover_sub"]),
        Spacer(1, 1.2 * cm),
        Paragraph(f"{total_q} questions and answers across {len(sections)} sections", styles["cover_note"]),
        Paragraph("Covering payments, travel, Waqf and giving, the assistants, security and development", styles["cover_note"]),
        Spacer(1, 5 * cm),
        Paragraph(f"WaqfApp Foundation &middot; {date.today():%B %Y}", styles["cover_note"]),
        NextPageTemplate("body"),
        PageBreak(),
        Paragraph("Contents", styles["toc_title"]),
    ]
    toc = TableOfContents()
    toc.levelStyles = toc_levels
    story.append(toc)

    for title, questions in sections:
        story.append(PageBreak())
        story.append(Paragraph(inline(title), styles["section"]))
        for q, paragraphs in questions:
            block = [Paragraph(inline(q), styles["question"])]
            block += [Paragraph(inline(p), styles["answer"]) for p in paragraphs]
            story.append(KeepTogether(block))

    doc = FAQDoc(str(OUT))
    doc.multiBuild(story)
    print(f"Wrote {OUT.relative_to(ROOT)}: {doc.page} pages, {total_q} questions, {len(sections)} sections")


if __name__ == "__main__":
    sys.exit(build())
