from __future__ import annotations

import re
from pathlib import Path
from typing import Iterable, Sequence

from docx import Document
from docx.enum.section import WD_ORIENT, WD_SECTION
from docx.enum.style import WD_STYLE_TYPE
from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT, WD_TABLE_ALIGNMENT
from docx.enum.text import (
    WD_ALIGN_PARAGRAPH,
    WD_BREAK,
    WD_LINE_SPACING,
    WD_TAB_ALIGNMENT,
    WD_TAB_LEADER,
)
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Inches, Pt, RGBColor


ROOT = Path(__file__).resolve().parents[1]
DOC_DIR = ROOT / "documentation"
FIG_DIR = DOC_DIR / "figures"
OUTPUT_DOCX = DOC_DIR / "FINAL_PROJECT_REPORT_SUPERVISOR_CORRECTED.docx"

FONT_NAME = "Times New Roman"
BODY_SIZE = Pt(12)
TABLE_SIZE = Pt(11)
CAPTION_SIZE = Pt(12)
CODE_SIZE = Pt(8.5)
NAVY = "17365D"
LIGHT_BLUE = "D9EAF7"
LIGHT_GREY = "F2F2F2"

STYLE_PRELIM = "Preliminary Heading"
STYLE_CAPTION_TABLE = "Report Table Caption"
STYLE_CAPTION_FIGURE = "Report Figure Caption"
STYLE_CODE_CAPTION = "Report Code Caption"
STYLE_REFERENCE = "Report Reference"


def set_run_font(
    run,
    *,
    size=BODY_SIZE,
    bold: bool | None = None,
    italic: bool | None = None,
    color: str | None = None,
    name: str = FONT_NAME,
) -> None:
    run.font.name = name
    run._element.rPr.rFonts.set(qn("w:eastAsia"), name)
    run.font.size = size
    if bold is not None:
        run.bold = bold
    if italic is not None:
        run.italic = italic
    if color:
        run.font.color.rgb = RGBColor.from_string(color)


def set_cell_shading(cell, fill: str) -> None:
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = tc_pr.find(qn("w:shd"))
    if shd is None:
        shd = OxmlElement("w:shd")
        tc_pr.append(shd)
    shd.set(qn("w:fill"), fill)


def set_cell_margins(cell, top=55, start=65, bottom=55, end=65) -> None:
    tc = cell._tc
    tc_pr = tc.get_or_add_tcPr()
    tc_mar = tc_pr.first_child_found_in("w:tcMar")
    if tc_mar is None:
        tc_mar = OxmlElement("w:tcMar")
        tc_pr.append(tc_mar)
    for margin, value in (("top", top), ("start", start), ("bottom", bottom), ("end", end)):
        node = tc_mar.find(qn(f"w:{margin}"))
        if node is None:
            node = OxmlElement(f"w:{margin}")
            tc_mar.append(node)
        node.set(qn("w:w"), str(value))
        node.set(qn("w:type"), "dxa")


def prevent_row_split(row) -> None:
    tr_pr = row._tr.get_or_add_trPr()
    if tr_pr.find(qn("w:cantSplit")) is None:
        tr_pr.append(OxmlElement("w:cantSplit"))


def set_repeat_table_header(row) -> None:
    tr_pr = row._tr.get_or_add_trPr()
    tbl_header = OxmlElement("w:tblHeader")
    tbl_header.set(qn("w:val"), "true")
    tr_pr.append(tbl_header)


def set_paragraph_keep(paragraph, *, keep_next=False, keep_lines=False) -> None:
    paragraph.paragraph_format.keep_with_next = keep_next
    paragraph.paragraph_format.keep_together = keep_lines


def configure_section(section, *, landscape: bool = False) -> None:
    if landscape:
        section.orientation = WD_ORIENT.LANDSCAPE
        section.page_width = Cm(29.7)
        section.page_height = Cm(21.0)
    else:
        section.orientation = WD_ORIENT.PORTRAIT
        section.page_width = Cm(21.0)
        section.page_height = Cm(29.7)
    section.top_margin = Inches(1.0)
    section.bottom_margin = Inches(1.0)
    section.left_margin = Inches(1.25)
    section.right_margin = Inches(1.0)
    section.header_distance = Inches(0.45)
    section.footer_distance = Inches(0.5)


def set_page_number_format(section, *, fmt: str, start: int) -> None:
    sect_pr = section._sectPr
    pg_num = sect_pr.find(qn("w:pgNumType"))
    if pg_num is None:
        pg_num = OxmlElement("w:pgNumType")
        sect_pr.append(pg_num)
    pg_num.set(qn("w:fmt"), fmt)
    pg_num.set(qn("w:start"), str(start))


def add_field(paragraph, instruction: str, placeholder: str = "") -> None:
    run = paragraph.add_run()
    fld_begin = OxmlElement("w:fldChar")
    fld_begin.set(qn("w:fldCharType"), "begin")
    instr = OxmlElement("w:instrText")
    instr.set(qn("xml:space"), "preserve")
    instr.text = f" {instruction} "
    fld_sep = OxmlElement("w:fldChar")
    fld_sep.set(qn("w:fldCharType"), "separate")
    text_node = OxmlElement("w:t")
    text_node.text = placeholder
    fld_end = OxmlElement("w:fldChar")
    fld_end.set(qn("w:fldCharType"), "end")
    run._r.extend((fld_begin, instr, fld_sep, text_node, fld_end))
    set_run_font(run)


def add_page_number(section) -> None:
    section.footer.is_linked_to_previous = False
    footer = section.footer
    paragraph = footer.paragraphs[0]
    paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    paragraph.paragraph_format.space_after = Pt(0)
    paragraph.paragraph_format.line_spacing = 1.0
    add_field(paragraph, "PAGE", "1")


def add_update_fields_setting(doc: Document) -> None:
    settings = doc.settings._element
    update = settings.find(qn("w:updateFields"))
    if update is None:
        update = OxmlElement("w:updateFields")
        settings.append(update)
    update.set(qn("w:val"), "true")


def define_styles(doc: Document) -> None:
    styles = doc.styles
    normal = styles["Normal"]
    normal.font.name = FONT_NAME
    normal._element.rPr.rFonts.set(qn("w:eastAsia"), FONT_NAME)
    normal.font.size = BODY_SIZE
    normal.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    normal.paragraph_format.line_spacing_rule = WD_LINE_SPACING.DOUBLE
    normal.paragraph_format.space_before = Pt(0)
    normal.paragraph_format.space_after = Pt(0)
    normal.paragraph_format.widow_control = True

    for index, size in ((1, Pt(12)), (2, Pt(12)), (3, Pt(12))):
        style = styles[f"Heading {index}"]
        style.font.name = FONT_NAME
        style._element.rPr.rFonts.set(qn("w:eastAsia"), FONT_NAME)
        style.font.size = size
        style.font.bold = True
        style.font.italic = False
        style.font.color.rgb = RGBColor(0, 0, 0)
        style.paragraph_format.alignment = (
            WD_ALIGN_PARAGRAPH.CENTER if index == 1 else WD_ALIGN_PARAGRAPH.LEFT
        )
        style.paragraph_format.line_spacing = 1.0
        style.paragraph_format.space_before = Pt(12 if index > 1 else 0)
        style.paragraph_format.space_after = Pt(24 if index == 1 else 6)
        style.paragraph_format.keep_with_next = True
        style.paragraph_format.keep_together = True
        if index == 1:
            style.paragraph_format.page_break_before = True

    if STYLE_PRELIM not in styles:
        style = styles.add_style(STYLE_PRELIM, WD_STYLE_TYPE.PARAGRAPH)
    else:
        style = styles[STYLE_PRELIM]
    style.font.name = FONT_NAME
    style._element.rPr.rFonts.set(qn("w:eastAsia"), FONT_NAME)
    style.font.size = Pt(14)
    style.font.bold = True
    style.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
    style.paragraph_format.line_spacing = 1.0
    style.paragraph_format.space_before = Pt(0)
    style.paragraph_format.space_after = Pt(12)
    style.paragraph_format.keep_with_next = True

    for style_name in (STYLE_CAPTION_TABLE, STYLE_CAPTION_FIGURE, STYLE_CODE_CAPTION):
        if style_name not in styles:
            style = styles.add_style(style_name, WD_STYLE_TYPE.PARAGRAPH)
        else:
            style = styles[style_name]
        style.font.name = FONT_NAME
        style._element.rPr.rFonts.set(qn("w:eastAsia"), FONT_NAME)
        style.font.size = CAPTION_SIZE
        style.font.bold = False
        style.font.italic = False
        style.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER
        style.paragraph_format.line_spacing = 1.0
        style.paragraph_format.space_before = Pt(4)
        style.paragraph_format.space_after = Pt(4)
        style.paragraph_format.keep_with_next = style_name == STYLE_CAPTION_TABLE
        style.paragraph_format.keep_together = True

    if STYLE_REFERENCE not in styles:
        style = styles.add_style(STYLE_REFERENCE, WD_STYLE_TYPE.PARAGRAPH)
    else:
        style = styles[STYLE_REFERENCE]
    style.font.name = FONT_NAME
    style._element.rPr.rFonts.set(qn("w:eastAsia"), FONT_NAME)
    style.font.size = BODY_SIZE
    style.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    style.paragraph_format.line_spacing_rule = WD_LINE_SPACING.DOUBLE
    style.paragraph_format.space_before = Pt(0)
    style.paragraph_format.space_after = Pt(0)
    style.paragraph_format.left_indent = Inches(0.5)
    style.paragraph_format.first_line_indent = Inches(-0.5)


def add_body(doc: Document, text: str, *, align=WD_ALIGN_PARAGRAPH.JUSTIFY) -> None:
    paragraph = doc.add_paragraph(style="Normal")
    paragraph.alignment = align
    set_run_font(paragraph.add_run(text))


def add_heading(doc: Document, text: str, *, level: int = 2) -> None:
    paragraph = doc.add_paragraph(style=f"Heading {level}")
    opening_match = re.match(r"^(\d+\.0)\s+(.+)$", text) if level == 2 else None
    if opening_match:
        number, title = opening_match.groups()
        paragraph.alignment = WD_ALIGN_PARAGRAPH.LEFT
        paragraph.paragraph_format.tab_stops.add_tab_stop(
            Inches(3.01), WD_TAB_ALIGNMENT.CENTER, WD_TAB_LEADER.SPACES
        )
        set_run_font(paragraph.add_run(number), size=Pt(12), bold=True)
        set_run_font(paragraph.add_run("\t" + title.upper()), size=Pt(12), bold=True)
    else:
        paragraph.alignment = WD_ALIGN_PARAGRAPH.LEFT
        set_run_font(paragraph.add_run(text), size=Pt(12), bold=True)


def add_chapter_title(doc: Document, chapter: str, title: str) -> None:
    paragraph = doc.add_paragraph(style="Heading 1")
    paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run = paragraph.add_run(chapter)
    set_run_font(run, size=Pt(12), bold=True)
    if title != "INTRODUCTION":
        run.add_break()
        run.add_break()
        set_run_font(paragraph.add_run(title), size=Pt(12), bold=True)


def add_prelim_heading(doc: Document, text: str) -> None:
    paragraph = doc.add_paragraph(style=STYLE_PRELIM)
    set_run_font(paragraph.add_run(text), size=Pt(14), bold=True)


def add_table_caption(doc: Document, text: str) -> None:
    paragraph = doc.add_paragraph(style=STYLE_CAPTION_TABLE)
    set_run_font(paragraph.add_run(text), size=CAPTION_SIZE)


def add_figure_caption(doc: Document, text: str) -> None:
    paragraph = doc.add_paragraph(style=STYLE_CAPTION_FIGURE)
    set_run_font(paragraph.add_run(text), size=CAPTION_SIZE)


def add_code_caption(doc: Document, text: str) -> None:
    paragraph = doc.add_paragraph(style=STYLE_CODE_CAPTION)
    set_run_font(paragraph.add_run(text), size=CAPTION_SIZE)


def add_table(
    doc: Document,
    headers: Sequence[str],
    rows: Sequence[Sequence[str]],
    *,
    widths: Sequence[float] | None = None,
    alignments: Sequence[int] | None = None,
    font_size=TABLE_SIZE,
) -> None:
    table = doc.add_table(rows=1, cols=len(headers))
    table.style = "Table Grid"
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = False
    header_row = table.rows[0]
    set_repeat_table_header(header_row)
    prevent_row_split(header_row)
    for col_index, value in enumerate(headers):
        cell = header_row.cells[col_index]
        cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
        set_cell_margins(cell)
        if widths:
            cell.width = Inches(widths[col_index])
        paragraph = cell.paragraphs[0]
        paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
        paragraph.paragraph_format.line_spacing = 1.0
        paragraph.paragraph_format.space_after = Pt(0)
        set_run_font(paragraph.add_run(value), size=font_size, bold=True, color="000000")

    for row_values in rows:
        row = table.add_row()
        prevent_row_split(row)
        for col_index, value in enumerate(row_values):
            cell = row.cells[col_index]
            cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
            set_cell_margins(cell)
            if widths:
                cell.width = Inches(widths[col_index])
            paragraph = cell.paragraphs[0]
            paragraph.alignment = alignments[col_index] if alignments else WD_ALIGN_PARAGRAPH.LEFT
            paragraph.paragraph_format.line_spacing = 1.0
            paragraph.paragraph_format.space_after = Pt(0)
            set_run_font(paragraph.add_run(str(value)), size=font_size)
    spacer = doc.add_paragraph()
    spacer.paragraph_format.line_spacing = 1.0
    spacer.paragraph_format.space_after = Pt(0)


def add_figure(doc: Document, filename: str, caption: str, *, width: float = 5.85) -> None:
    path = FIG_DIR / filename
    if not path.exists():
        raise FileNotFoundError(f"Required figure is missing: {path}")
    paragraph = doc.add_paragraph()
    paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
    paragraph.paragraph_format.line_spacing = 1.0
    paragraph.paragraph_format.space_after = Pt(0)
    set_paragraph_keep(paragraph, keep_next=True, keep_lines=True)
    run = paragraph.add_run()
    picture = run.add_picture(str(path), width=Inches(width))
    picture._inline.docPr.set("title", caption.split(":", 1)[0])
    picture._inline.docPr.set("descr", caption)
    add_figure_caption(doc, caption)


def add_equation(doc: Document, text: str, number: str | None = None) -> None:
    paragraph = doc.add_paragraph()
    paragraph.alignment = WD_ALIGN_PARAGRAPH.LEFT
    paragraph.paragraph_format.line_spacing = 1.25
    paragraph.paragraph_format.space_before = Pt(6)
    paragraph.paragraph_format.space_after = Pt(6)
    paragraph.paragraph_format.tab_stops.add_tab_stop(
        Inches(3.01), WD_TAB_ALIGNMENT.CENTER, WD_TAB_LEADER.SPACES
    )
    paragraph.paragraph_format.tab_stops.add_tab_stop(
        Inches(6.02), WD_TAB_ALIGNMENT.RIGHT, WD_TAB_LEADER.SPACES
    )
    set_paragraph_keep(paragraph, keep_lines=True)
    set_run_font(paragraph.add_run("\t" + text), size=BODY_SIZE)
    if number:
        set_run_font(paragraph.add_run("\t(" + number + ")"), size=BODY_SIZE)


def add_listing(doc: Document, caption: str, code: str) -> None:
    # Long source-code boxes were intentionally omitted from the report.
    # The same program operations are explained in plain language and in the flowchart.
    return


def add_numbered_recommendation(doc: Document, number: int, text: str) -> None:
    paragraph = doc.add_paragraph(style="Normal")
    paragraph.paragraph_format.left_indent = Inches(0.25)
    paragraph.paragraph_format.first_line_indent = Inches(-0.25)
    set_run_font(paragraph.add_run(f"{number}. "), bold=True)
    set_run_font(paragraph.add_run(text))


def add_signature_block(doc: Document, labels: Sequence[str]) -> None:
    for label in labels:
        paragraph = doc.add_paragraph()
        paragraph.alignment = WD_ALIGN_PARAGRAPH.LEFT
        paragraph.paragraph_format.line_spacing = 1.5
        paragraph.paragraph_format.space_before = Pt(6)
        paragraph.paragraph_format.space_after = Pt(0)
        set_run_font(paragraph.add_run(f"{label}: "), bold=True)
        set_run_font(paragraph.add_run("________________________________________"))


def add_front_matter(doc: Document) -> None:
    title_lines = (
        ("FEDERAL UNIVERSITY OF TECHNOLOGY, MINNA", 14),
        ("SCHOOL OF ELECTRICAL ENGINEERING AND TECHNOLOGY", 12),
        ("DEPARTMENT OF MECHATRONICS ENGINEERING", 12),
        ("", 12),
        ("PROJECT REPORT", 14),
        ("BACHELOR OF ENGINEERING (B.ENG.) IN MECHATRONICS ENGINEERING", 12),
        ("", 12),
        ("TITLE:", 12),
        ("DESIGN AND IMPLEMENTATION OF A WEB-BASED VIRTUAL LABORATORY FOR ENGINEERING LEARNING MANAGEMENT SYSTEM", 14),
        ("", 12),
        ("BY", 12),
        ("ELLA VICTOR ADAKOLE", 14),
        ("2021/1/80065ET", 12),
        ("", 12),
        ("SUPERVISOR:", 12),
        ("ENGR. DR. J. A. BALA", 12),
        ("CO-SUPERVISOR:", 12),
        ("ENGR. DR. T. A. FOLORUNSO", 12),
        ("", 12),
        ("APRIL, 2026", 12),
    )
    for text, size in title_lines:
        paragraph = doc.add_paragraph()
        paragraph.alignment = WD_ALIGN_PARAGRAPH.CENTER
        paragraph.paragraph_format.line_spacing = 1.0
        paragraph.paragraph_format.space_before = Pt(0)
        paragraph.paragraph_format.space_after = Pt(4 if text else 6)
        set_run_font(paragraph.add_run(text), size=Pt(size), bold=bool(text))

    prelim = doc.add_section(WD_SECTION.NEW_PAGE)
    configure_section(prelim)
    prelim.footer.is_linked_to_previous = False
    set_page_number_format(prelim, fmt="lowerRoman", start=2)
    add_page_number(prelim)

    add_prelim_heading(doc, "DECLARATION")
    add_body(
        doc,
        "I, Ella Victor Adakole, with matriculation number 2021/1/80065ET, declare that this project report entitled “Design and Implementation of a Web-Based Virtual Laboratory for Engineering Learning Management System” is my original work carried out under the supervision of Engr. Dr. J. A. Bala and Engr. Dr. T. A. Folorunso in the Department of Mechatronics Engineering, Federal University of Technology, Minna. The work has not been submitted, either wholly or partly, for the award of a degree in this or any other institution. All sources consulted have been duly acknowledged.",
    )
    add_signature_block(doc, ("Student’s Name", "Matriculation Number", "Signature", "Date"))

    doc.add_page_break()
    add_prelim_heading(doc, "CERTIFICATION")
    add_body(
        doc,
        "This is to certify that the project entitled “Design and Implementation of a Web-Based Virtual Laboratory for Engineering Learning Management System” was carried out by Ella Victor Adakole, matriculation number 2021/1/80065ET, in the Department of Mechatronics Engineering, Federal University of Technology, Minna, and has been submitted in partial fulfilment of the requirements for the award of the Bachelor of Engineering (B.Eng.) degree in Mechatronics Engineering.",
    )
    add_signature_block(
        doc,
        (
            "Supervisor’s Name, Signature and Date",
            "Co-supervisor’s Name, Signature and Date",
            "Head of Department’s Name, Signature and Date",
            "External Examiner’s Name, Signature and Date",
        ),
    )

    doc.add_page_break()
    add_prelim_heading(doc, "DEDICATION")
    add_body(
        doc,
        "This work is dedicated to God Almighty, whose grace sustained me throughout this project, and to my family for their constant encouragement, patience and support.",
    )

    doc.add_page_break()
    add_prelim_heading(doc, "ACKNOWLEDGEMENTS")
    acknowledgements = (
        "I give all glory to God Almighty for the strength, wisdom and opportunity to complete this project.",
        "I sincerely appreciate my supervisor, Engr. Dr. J. A. Bala, and my co-supervisor, Engr. Dr. T. A. Folorunso, for their guidance, corrections and encouragement throughout the development of the system and preparation of this report.",
        "My gratitude also goes to the Head of Department and the lecturers and staff of the Department of Mechatronics Engineering, Federal University of Technology, Minna, for the knowledge and support provided during my undergraduate programme.",
        "I am deeply grateful to my parents and family for their sacrifices, prayers and confidence in me. Their support made the demanding stages of this work easier to complete.",
        "I appreciate my coursemates, friends and colleagues who offered useful suggestions, tested ideas and encouraged me during the project.",
        "Finally, I acknowledge the researchers, authors and software communities whose published work and technical documentation provided the foundation for the study.",
    )
    for paragraph in acknowledgements:
        add_body(doc, paragraph)

    doc.add_page_break()
    add_prelim_heading(doc, "ABSTRACT")
    abstract = (
        "Engineering laboratory work connects mathematical theory with observable system behaviour, but physical equipment, scheduled access and maintenance requirements can restrict how often students repeat an experiment. This project addressed the need for a complementary browser-based laboratory that could be delivered through an Engineering Learning Management System without requiring student-side installation.",
        "A standalone virtual laboratory was designed and implemented around a six-degree-of-freedom quadrotor experiment. The application was developed with React and TypeScript using Vite, while Three.js through React Three Fiber provided three-dimensional visualisation, Zustand coordinated simulation state and uPlot displayed live response data. Four PID loops regulate altitude, roll, pitch and yaw. A plus-configuration motor mixer, actuator limits, rigid-body equations and fixed-step fourth-order Runge–Kutta integration at 0.002 s produce the simulated response. Guided activities, gain presets, disturbances, response metrics and a payload mission were included. The separately developed Next.js LMS is intended to host the deployed laboratory through an iframe; live institutional embedding remained pending at the time of evaluation.",
        "Technical evaluation covered the production build, functional controls, deterministic controller trials, browser layouts and a local iframe. Five altitude presets produced distinct response patterns. A custom setting of Kp = 10.0, Ki = 0.20 and Kd = 5.0 achieved 1.94% overshoot, 1.292 s settling time and 0.0218 m absolute final sampled error for a 2.40 m command. Roll, pitch and yaw tracking were also verified, while wind, payload and motor-degradation tests made plant and actuator effects observable. Edge was checked at three viewport sizes, Chrome at 1280 × 800, and the application loaded successfully in a 984 px local iframe.",
        "The results show that the developed software functions as a repeatable virtual control-engineering experiment and is technically ready for final deployment and iframe integration. The evidence is limited to software and simulation tests: no physical-sensor model, hardware validation or participant-based learning study was completed. The laboratory should therefore complement physical practical work, and educational effectiveness should be assessed after live LMS deployment and correction of the identified learning-activity mismatches.",
    )
    for paragraph in abstract:
        add_body(doc, paragraph)

    doc.add_page_break()
    add_prelim_heading(doc, "TABLE OF CONTENTS")
    toc = doc.add_paragraph()
    toc.paragraph_format.line_spacing = 1.15
    add_field(toc, 'TOC \\o "1-3" \\h \\z \\u', "Right-click and update this field in Microsoft Word.")

    doc.add_page_break()
    add_prelim_heading(doc, "LIST OF TABLES")
    lot = doc.add_paragraph()
    lot.paragraph_format.line_spacing = 1.15
    add_field(lot, f'TOC \\t "{STYLE_CAPTION_TABLE},1" \\h \\z', "Right-click and update this field in Microsoft Word.")

    doc.add_page_break()
    add_prelim_heading(doc, "LIST OF FIGURES")
    lof = doc.add_paragraph()
    lof.paragraph_format.line_spacing = 1.15
    add_field(lof, f'TOC \\t "{STYLE_CAPTION_FIGURE},1" \\h \\z', "Right-click and update this field in Microsoft Word.")

    doc.add_page_break()
    add_prelim_heading(doc, "LIST OF ABBREVIATIONS")
    abbreviations = (
        ("3D", "Three-Dimensional"),
        ("CSS", "Cascading Style Sheets"),
        ("HTML", "Hypertext Markup Language"),
        ("LMS", "Learning Management System"),
        ("PID", "Proportional–Integral–Derivative"),
        ("RK4", "Fourth-Order Runge–Kutta"),
        ("STEM", "Science, Technology, Engineering and Mathematics"),
        ("UAV", "Unmanned Aerial Vehicle"),
        ("UI", "User Interface"),
        ("VR", "Virtual Reality"),
        ("WebGL", "Web Graphics Library"),
    )
    for acronym, meaning in abbreviations:
        paragraph = doc.add_paragraph(style="Normal")
        paragraph.alignment = WD_ALIGN_PARAGRAPH.LEFT
        paragraph.paragraph_format.line_spacing = 1.5
        paragraph.paragraph_format.tab_stops.add_tab_stop(Inches(1.25))
        set_run_font(paragraph.add_run(acronym), bold=True)
        set_run_font(paragraph.add_run("\t– " + meaning))


def add_chapter_one(doc: Document) -> None:
    add_chapter_title(doc, "CHAPTER ONE", "INTRODUCTION")

    add_heading(doc, "1.0 Introduction")

    add_heading(doc, "1.1 Background of the Study")
    add_body(
        doc,
        "Engineering education requires students to connect scientific principles with the behaviour of real systems. Li and Liang (2024) explain that experimental engineering education supports abilities such as problem-solving, design and troubleshooting, while Kurtz et al. (2025) distinguish the authentic direct experience of hands-on work from virtual and remote laboratory access. A lecture can introduce a dynamic model or controller equation, but an experiment allows the learner to change a condition, observe the response and decide whether theory accounts for what occurred.",
    )
    add_body(
        doc,
        "Conventional laboratories remain essential because they expose students to equipment, measurement uncertainty and safe operating procedures. However, access is normally tied to a location, timetable and finite set of apparatus. Li and Liang (2024) conclude that virtual laboratories cannot completely replace hands-on laboratories and recommend combining virtual and physical experiences; Kurtz et al. (2025) likewise distinguish physical, remote and virtual forms of laboratory access. A physical session provides contact with real hardware, whereas a virtual session can offer repeatability, rapid parameter changes and access outside the scheduled period.",
    )
    add_body(
        doc,
        "Recent Nigerian e-learning research gives the project a local context without supporting an unqualified nationwide laboratory claim. Idika et al. (2024) examine university lecturers’ attitudes, readiness and anxiety around mandatory e-learning in Nigeria, while Hussein et al. (2024) discuss the integration of laboratory use with e-learning management technology. These sources support designing the module to fit its institutional setting; they do not establish that every Nigerian university lacks adequate laboratories.",
    )
    add_body(
        doc,
        "Evidence for this complementary role has strengthened. Li and Liang (2024), after combining results from engineering-education studies, reported a positive overall effect for virtual laboratories while cautioning against using them as a complete replacement for hands-on work. Hussein et al. (2024) likewise identify accessibility and simulated practical experimentation as benefits of laboratory e-learning, while noting that reproducing the tactile experience of physical equipment remains a challenge.",
    )
    add_body(
        doc,
        "Three-dimensional representation can make a dynamic experiment easier to interpret when spatial movement is central to the task. Zontou et al. (2024) review experimental virtual-reality research in engineering education and describe active engagement with spatial and procedural content, while Yang et al. (2024) report an overall practical-skills benefit across their wider evidence base. Their engineering and science subgroup estimates were not statistically significant, so these findings support cautious investigation of interactive visualisation rather than a claim that every 3D browser application automatically improves practical competence.",
    )
    add_body(
        doc,
        "The present project applies these ideas to a quadrotor control experiment. Cedro et al. (2024) model quadcopter altitude and attitude control with PID controllers, while Bae and Kang (2025) present current rigid-body force, moment and rotor-allocation relationships for a quadrotor. These visible relationships make the plant suitable for demonstrating feedback, controller tuning, overshoot, settling, tracking error, disturbance effects and actuator limits within a Mechatronics context.",
    )
    add_body(
        doc,
        "The developed laboratory is a standalone browser application created with React and TypeScript and built with Vite. It calculates the quadrotor response, renders a custom procedural 3D model and presents live measurements and guided tasks. The main LMS was developed separately with Next.js. The intended deployment arrangement is for the LMS to display the independently hosted Vite application through an iframe; therefore, the laboratory itself is not a Next.js project, and final live embedding remained outside the completed local evaluation.",
    )

    add_heading(doc, "1.2 Problem Statement")
    add_body(
        doc,
        "A physical engineering laboratory cannot always provide unlimited time for every student to repeat a dynamic experiment, test unsafe controller settings or compare many parameter combinations. The problem is particularly important for control-system work because the learner often needs several trials before the relationship among gain values, response speed, overshoot, stability and actuator demand becomes clear. Once a scheduled session ends, the same plant may not be available for independent revision.",
    )
    add_body(
        doc,
        "Although virtual laboratories can extend access, the Engineering LMS considered by this project did not contain an interactive Mechatronics experiment that combined a physics-based plant, user-adjustable feedback control, 3D motion, numerical plots and guided learning activities. A generic animation would not close this gap because it would show motion without calculating a response from the student’s control choices. A separate external simulator would also interrupt the intended course workflow unless it could be embedded in the host LMS.",
    )
    add_body(
        doc,
        "The project therefore addressed the absence of a browser-based quadrotor laboratory designed for subsequent LMS embedding. The required solution had to run without student-side installation, expose meaningful control parameters, return immediate visual and numerical feedback, and remain independent enough to be deployed separately from the Next.js host. It also required technical evaluation so that operational readiness would not be confused with unmeasured claims about learner achievement.",
    )

    add_heading(doc, "1.3 Aim and Objectives")
    add_body(
        doc,
        "The aim of this project is to design and implement a web-based virtual laboratory for the Engineering Learning Management System to support practical engineering education.",
    )
    add_body(doc, "The objectives of this project are as follows:")
    for number, objective in enumerate(
        (
            "To design a web-based virtual laboratory for the Engineering Learning Management System.",
            "To implement the designed web-based virtual laboratory.",
            "To evaluate the developed virtual laboratory.",
        ),
        start=1,
    ):
        add_numbered_recommendation(doc, number, objective)

    add_heading(doc, "1.4 Significance of the Study")
    add_body(
        doc,
        "The project gives students a repeatable environment in which a controller can be adjusted without risking damage to a physical aircraft. Li and Liang (2024) found that virtual laboratories can support engineering learning but should be integrated with physical experience rather than treated as a complete replacement; Kurtz et al. (2025) similarly distinguish the benefits and limitations of virtual and hands-on modes. In the present system, the learner can compare controller settings, repeat a trial and use both motion and measured response data to explain an outcome.",
    )
    add_body(
        doc,
        "For lecturers, the module provides a structured demonstration that can be linked to topics such as rigid-body dynamics, feedback, PID tuning, actuator saturation and numerical integration. Guided activities and measurable challenges organise the interaction, while the browser interface makes the same experimental setup reproducible during a class or independent study. The design also provides an extendable pattern for adding other Mechatronics experiments later.",
    )
    add_body(
        doc,
        "For the institution, the standalone deployment model avoids coupling the laboratory source code to the host LMS. The HTML iframe element creates a child content navigable, and its source attribute identifies the page to load; sandbox and permissions attributes can restrict the framed content (WHATWG, 2026). In the intended architecture, the Next.js LMS will point that iframe to the independently hosted Vite application. Identity, grades and persistent progress would require an additional communication and storage mechanism.",
    )

    add_heading(doc, "1.5 Scope of the Study")
    add_body(
        doc,
        "The study covers the design, implementation and technical evaluation of one web-based virtual experiment: a quadrotor controlled in altitude, roll, pitch and yaw. The software scope includes a six-degree-of-freedom rigid-body model, four PID controllers, a plus-configuration motor mixer, fixed-step RK4 integration, actuator limits, wind, payload and motor-degradation conditions, a procedural 3D scene, live plots, response metrics, pilot inputs, presets, guided activities, challenges and a payload mission.",
    )
    add_body(
        doc,
        "The laboratory was developed with React, TypeScript and Vite and prepared for iframe embedding in a separately developed Next.js LMS. Evaluation covered build and lint checks, principal functions, deterministic simulation trials, responsive layouts, two locally available browsers and a local iframe. The live institutional embed, persistent learner records, authentication and exchange of grades or progress were not implemented within the completed scope.",
    )
    add_body(
        doc,
        "The quadrotor is a software model rather than a calibrated digital twin of a particular aircraft. The controller uses ideal simulated altitude and attitude values directly from the calculated state; physical sensors, sensor noise, bias and delay are not modelled. No participant study was conducted, so the evaluation does not measure usability, knowledge gain or improvement in practical skill. The application is intended to complement supervised physical work rather than replace it.",
    )

    add_heading(doc, "1.6 Organisation of the Report")
    add_body(
        doc,
        "This report is organised into five chapters. Chapter One presents the background, problem, aim, objectives, significance and scope. Chapter Two reviews engineering laboratory learning, virtual-laboratory evidence, 3D web visualisation, quadrotor modelling, PID control, the implementation technologies and LMS integration. Chapter Three explains the applied design-and-development methodology, architecture, equations, implementation and evaluation procedure. Chapter Four presents and discusses the design, implementation and technical evaluation results. Chapter Five summarises the study, states the conclusion and gives two recommendations. A consolidated alphabetical reference list follows Chapter Five.",
    )

    add_heading(doc, "1.7 Definition of Terms")
    terms = (
        ("3D visualisation", "A computer-generated representation that displays depth and spatial movement in three dimensions."),
        ("Engineering Learning Management System", "The host web platform used to organise engineering course content and intended to display the deployed virtual laboratory."),
        ("Iframe", "An HTML element that displays one web page within another page."),
        ("PID controller", "A feedback controller whose proportional, integral and derivative actions are combined to reduce the difference between a command and a measured response."),
        ("Virtual laboratory", "A software environment in which a learner changes experimental variables and observes calculated results without operating the corresponding physical equipment."),
        ("Web-based simulation", "A numerical simulation delivered through a compatible web browser without a separate student-side application installation."),
    )
    for index, (term, definition) in enumerate(terms, start=1):
        paragraph = doc.add_paragraph(style="Normal")
        paragraph.paragraph_format.left_indent = Inches(0.25)
        paragraph.paragraph_format.first_line_indent = Inches(-0.25)
        set_run_font(paragraph.add_run(f"{index}. {term}: "), bold=True)
        set_run_font(paragraph.add_run(definition))


def add_chapter_two(doc: Document) -> None:
    add_chapter_title(doc, "CHAPTER TWO", "LITERATURE REVIEW")

    add_heading(doc, "2.0 Introduction")
    add_body(
        doc,
        "This chapter reviews the literature that informed the virtual laboratory. It considers the role and forms of engineering laboratories, evidence on virtual learning environments, 3D web visualisation, quadrotor dynamics, PID feedback, the selected browser technologies and LMS embedding. It concludes by comparing related studies and identifying the gap addressed by the project.",
    )

    add_heading(doc, "2.1 Practical Laboratory Learning in Engineering Education")
    add_body(
        doc,
        "Laboratory work gives engineering students a setting in which theory can be tested against observable behaviour. Li and Liang (2024) describe engineering laboratory learning as a route for developing problem-solving, design and troubleshooting abilities in addition to understanding theory, while Kurtz et al. (2025) distinguish the characteristics of virtual, remote and hands-on laboratory modes. A laboratory is therefore not defined only by the presence of equipment; the activity must require purposeful decisions and interpretation.",
    )
    add_body(
        doc,
        "The physical laboratory remains indispensable for experience with real components, safety, tolerances, faults and measurement uncertainty. Li and Liang (2024) caution that the positive overall effects observed for virtual laboratories do not justify complete replacement of hands-on practice and recommend integration with physical experience; Kurtz et al. (2025) likewise identify the authentic direct experience of hands-on laboratories. This position establishes the role of the present project as a supplementary practical environment.",
    )
    add_body(
        doc,
        "Access constraints provide one reason for adding a complementary digital route. Kurtz et al. (2025) distinguish the flexibility of virtual and remote laboratory access from the availability limits of hands-on equipment, while Idika et al. (2024) examine Nigerian university lecturers’ readiness, attitudes and anxiety around mandatory e-learning. Together, these sources support careful exploration of reusable software experiments alongside physical provision; they do not establish that every Nigerian university has inadequate laboratories.",
    )

    add_heading(doc, "2.2 Hands-on, Remote and Virtual Laboratory Modes")
    add_body(
        doc,
        "Engineering laboratory access can be organised in several ways. Li and Liang (2024) distinguish virtual laboratories, which use software or simulation to create the experimental environment, from remote laboratories, which provide network access to real equipment; Kurtz et al. (2025) make the same distinction in their review of virtual and remote laboratory research. In a hands-on laboratory, the learner and physical apparatus share a location. In a remote laboratory, the learner operates real apparatus through a network. In a virtual laboratory, a mathematical or logical model produces the observed response. Table 2.1 summarises these distinctions without ranking one mode as inherently superior.",
    )
    add_table_caption(doc, "Table 2.1: Comparison of hands-on, remote and virtual laboratory modes")
    add_table(
        doc,
        ("Laboratory mode", "Apparatus", "Access", "How the result is obtained"),
        (
            ("Hands-on", "Physical equipment", "Learner and apparatus are in the same laboratory.", "The learner operates the equipment and takes physical measurements."),
            ("Remote", "Physical equipment", "The learner connects to equipment from another location.", "Commands and measurements are transmitted through a network."),
            ("Virtual", "Computer model", "The learner uses a software interface locally or online.", "The program calculates the response from the model."),
        ),
        widths=(1.15, 1.35, 1.75, 1.75),
        font_size=Pt(11),
    )
    add_body(
        doc,
        "Table 2.1 shows that the essential distinction is the resource being manipulated. Hands-on and remote laboratories use physical apparatus, although the access location differs; a virtual laboratory uses a software model. This project belongs to the third category because every force, state and measurement is calculated locally in the browser. It should not be described as a remote laboratory because no physical quadrotor is controlled over the network. The classification follows the current distinctions discussed by Li and Liang (2024) and Kurtz et al. (2025).",
    )
    add_body(
        doc,
        "Each mode also introduces a different educational emphasis. Hands-on work develops direct equipment familiarity. Remote access can extend the use of physical apparatus but remains constrained by hardware availability and network control. Virtual experiments permit rapid reset, repeatable initial conditions and deliberate exposure to unstable values without damaging equipment. Li and Liang (2024) and Kurtz et al. (2025) therefore support selecting and combining modes according to the learning purpose.",
    )

    add_heading(doc, "2.3 Virtual Laboratories in Engineering Education")
    add_body(
        doc,
        "A virtual laboratory is most useful when the learner can act on a model and interpret the resulting evidence. Li and Liang (2024) identify accessibility, safety, flexibility and repeatability among the advantages reported for engineering virtual laboratories. Hussein et al. (2024) discuss e-learning management technology for laboratory use, while Kurtz et al. (2025) show that virtual and remote laboratory activities need deliberate educational organisation rather than mere online availability.",
    )
    add_body(
        doc,
        "Quantitative evidence is encouraging but not uniform. Li and Liang (2024) synthesised controlled comparisons in engineering education and calculated a positive overall effect for virtual laboratories. Yang et al. (2024) likewise report an overall effect across a broader virtual-reality evidence base, but their engineering and science subgroup estimates were not statistically significant. The label “virtual laboratory” alone therefore does not guarantee an outcome: the model must be accurate enough for its task, and the learning activity must direct attention to the relevant relationship.",
    )
    add_body(
        doc,
        "This requirement shaped the current interface. Changing a PID gain does not trigger a pre-recorded animation; it changes the control calculation that drives the motor mixer and plant. The same simulated state supplies the 3D motion, telemetry and graphs. Consequently, a learner can connect an input to a response using more than one representation. Repetition is also meaningful because each trial can begin from the same initial condition while varying one controller parameter.",
    )
    add_body(
        doc,
        "Nevertheless, technical interaction is not equivalent to demonstrated educational effectiveness. A laboratory may load correctly and still require usability improvement or stronger instructional scaffolding. The present study therefore reports software and simulation results rather than attributing knowledge gain to students who were not studied. This distinction follows the broader literature’s separation between system capability and measured learning outcome.",
    )

    add_heading(doc, "2.4 Three-Dimensional Web Visualisation")
    add_body(
        doc,
        "Three-dimensional visualisation is relevant when position and orientation are central to an experiment. Zontou et al. (2024) reviewed experimental virtual-reality research in engineering education and found that virtual environments are used for active engagement with spatial and procedural content. Yang et al. (2024) likewise report an overall practical-skills effect across their wider virtual-reality evidence base, although their engineering and science subgroup estimates were not statistically significant.",
    )
    add_body(
        doc,
        "Zontou et al. (2024) and Yang et al. (2024) review diverse virtual-reality settings rather than a single browser technology. Yang et al. reported an overall practical-skills effect across their evidence base; however, the separate engineering and science subgroup effects were not statistically significant. Furthermore, the immersive systems in those reviews differ from the non-immersive WebGL application developed here. The evidence therefore justifies presenting 3D interaction as a design feature to be evaluated, not asserting that the project has already improved practical skill.",
    )
    add_body(
        doc,
        "Modern browsers can present 3D content through WebGL. In the implemented application, Three.js organises the scene around objects, cameras, lights and a renderer, while React Three Fiber connects those display elements to React state. The aircraft transform is driven by the calculated position and an Euler-derived rotation matrix, while propeller motion reflects the calculated motor output.",
    )
    add_body(
        doc,
        "Visual fidelity must remain subordinate to model meaning. A detailed aircraft shape cannot correct an inaccurate controller or plant, and a smooth animation can hide numerical instability if the corresponding measurements are not displayed. For this reason, the 3D scene is paired with altitude, attitude and error plots and with response measures such as rise time, overshoot, settling time and final sampled error.",
    )

    add_heading(doc, "2.5 Quadrotor Dynamics and Modelling")
    add_body(
        doc,
        "A quadrotor has four rotors arranged around a central body. Cedro et al. (2024) describe a current quadcopter model in which altitude and Euler attitude are governed by vehicle dynamics and motor actions, while Bae and Kang (2025) present rigid-body force, moment and rotor-allocation relationships for a quadrotor. These sources support the force and motion relationships used in the simulation.",
    )
    add_body(
        doc,
        "Drone-focused education reviews provide context for using a quadrotor as the laboratory plant. Pergantis and Drigas (2024) review drones in the educational process, while Yeung et al. (2024) review drone-integrated STEM education at secondary-school level. These sources support the relevance of drone activities as a learning context; they do not validate this university-level simulation or its control model.",
    )
    add_body(
        doc,
        "The aircraft moves translationally along three axes and rotationally through roll, pitch and yaw. Four rotor inputs must influence these six degrees of freedom, so the plant is underactuated. Collective thrust mainly changes vertical acceleration when the vehicle is level. A roll or pitch command tilts the thrust vector and therefore creates horizontal acceleration, while the yaw moment changes heading. Figure 2.1 presents the force and body-axis convention used to explain these relationships.",
    )
    add_figure(
        doc,
        "chapter2_quadrotor_forces_axes.png",
        "Figure 2.1: Quadrotor plus-configuration, body axes, thrust, weight and control moments used in the simulation.",
        width=5.7,
    )
    add_body(
        doc,
        "Figure 2.1 shows four motors in a plus configuration. Total thrust acts opposite the positive downward body z-axis at level attitude, whereas weight remains aligned with gravity. Differential rotor thrust produces roll and pitch moments, and the reaction torques of the rotating propellers contribute to yaw. The diagram also clarifies why an attitude controller alone cannot return the aircraft to an original horizontal point after a gust: horizontal position requires an additional outer-loop command.",
    )
    add_body(
        doc,
        "A numerical plant simplifies some physical effects so that the chosen learning relationships remain observable. The current model includes rigid-body translation and rotation, gravity, axis-dependent drag, wind force, added mass, gyroscopic coupling, actuator limits and a motor-authority factor. Rotor lag, battery discharge, ground effect, detailed aerodynamics and sensor imperfections are excluded. These boundaries are reported because the model is a teaching simulation, not a validated replica of a particular aircraft.",
    )

    add_heading(doc, "2.6 Closed-Loop PID Control")
    add_body(
        doc,
        "Feedback control compares a desired value with an observed output and uses the difference to change the plant input. Cedro et al. (2024) apply PID control to quadcopter altitude and attitude, while Bae and Kang (2025) relate quadrotor control demand to rotor-level allocation. In the conventional PID structure, proportional action responds to current error, integral action accumulates error and derivative action responds to its rate of change. Tuning remains a trade-off because stronger action may improve response speed while increasing overshoot, oscillation, noise sensitivity or actuator demand.",
    )
    add_body(
        doc,
        "The virtual laboratory implements a closed loop for altitude, roll, pitch and yaw. The feedback is ideal simulated state feedback. Altitude and Euler attitude values are taken directly from the state produced by the rigid-body integrator; no physical barometer, inertial measurement unit, GPS receiver or sensor model is present. Figure 2.2 distinguishes this calculated feedback path from the interface displays.",
    )
    add_figure(
        doc,
        "chapter2_pid_feedback.png",
        "Figure 2.2: Closed-loop PID control and ideal simulated state-feedback path used in the developed virtual laboratory.",
        width=5.8,
    )
    add_body(
        doc,
        "Figure 2.2 begins with the setpoint and subtracts the calculated altitude or attitude response to form an error. The PID block converts that error into an acceleration or torque command, the motor mixer distributes the demand, and the quadrotor model plus RK4 integrator produces the next state. The feedback arrow closes the loop by returning the calculated response. The plots and 3D scene observe this shared state but do not act as sensors or controller inputs.",
    )
    add_body(
        doc,
        "Practical implementation requires more than the ideal textbook sum. The developed controller limits the accumulated integral, filters the derivative of the measurement and clamps its output. These measures make wind-up, derivative kick and actuator saturation less disruptive while still allowing poor gains to produce visibly poor responses. The preset controllers deliberately range from sluggish to unstable so that the effect of tuning can be compared under identical initial conditions.",
    )

    add_heading(doc, "2.7 Browser Technologies Used for the Virtual Laboratory")
    add_body(
        doc,
        "The laboratory required a client-side environment capable of frequent state updates, numerical calculation, 3D rendering and responsive controls. The implemented interface uses React 19.2, a release documented by the React Team (2025), to organise the console into coordinated flight, tuning, telemetry, scene and learning components.",
    )
    add_body(
        doc,
        "TypeScript adds type syntax and checking to JavaScript. Rosenwasser (2026) explains that TypeScript's checker can identify errors and support editor tooling before the program runs. The project uses TypeScript 6.0 structures for controller gains, setpoints, quadrotor state, disturbance conditions, history samples and component properties, reducing ambiguity between quantities used by the interface and physics modules.",
    )
    add_body(
        doc,
        "Vite is the development and build tool for the standalone laboratory. Vite (2026) documents Vite 8 as the release used by the project, while React Team (2025) documents the React 19.2 release used for the interface. This is the correct technology description for the project. Next.js is used only by the separately developed host LMS and is not the framework used to create the laboratory.",
    )
    add_body(
        doc,
        "Three.js supplies browser graphics, React Three Fiber connects the scene with React state, Zustand holds and updates the simulation state, and uPlot renders live engineering traces. The resulting software remains a client-side Vite application: the physics and controller calculations execute in the learner’s browser, while the production files can be served from a static web host.",
    )

    add_heading(doc, "2.8 LMS Integration and Iframe Delivery")
    add_body(
        doc,
        "An LMS provides a common location for course material, activities and communication. Hussein et al. (2024) discuss the accessibility and implementation considerations involved when laboratory use is connected with e-learning management technology. Their study supports the general integration rationale, but it does not specifically validate the iframe mechanism or the present application.",
    )
    add_body(
        doc,
        "The technical basis for the intended embed is the HTML iframe element. WHATWG (2026) specifies that an iframe creates a child content navigable and that its source attribute identifies the page to load; Vite (2026) documents the current build tool used for the framed application. For this project, the Next.js LMS will contain the iframe, while the deployed Vite laboratory will be the framed source. The two applications can therefore be built and updated separately.",
    )
    add_body(
        doc,
        "Iframe readiness does not mean that production integration has already occurred. A successful local frame confirms that the interface can render within a constrained page, but live operation also depends on the laboratory host allowing the LMS origin to frame it, suitable content-security and permission settings, the final course-page dimensions and deployment availability. Exchange of identity, scores or completion records would require a controlled communication method beyond visual embedding.",
    )

    add_heading(doc, "2.9 Review of Related Studies")
    add_body(
        doc,
        "The related studies were compared according to their focus, evidence and relevance to the present design. Table 2.2 avoids treating all virtual-laboratory publications as if they addressed the same question. Educational reviews explain learning and delivery considerations, while control and software sources support the technical implementation.",
    )
    add_table_caption(doc, "Table 2.2: Synthesis of selected related studies and the gap addressed by the project")
    related_studies = (
        ("Li & Liang (2024)", "Meta-analysis of engineering virtual-laboratory learning outcomes.", "Provides positive overall evidence and a complementary-use caution.", "Cannot substitute for a participant study of this application."),
        ("Kurtz et al. (2025)", "Systematic review of collaboration in virtual and remote laboratories.", "Clarifies the distinction between virtual, remote and hands-on modes.", "Does not define this project’s plant, interface or LMS arrangement."),
        ("Hussein et al. (2024)", "Study of e-learning management technology and laboratory use.", "Supports the general LMS-integration rationale.", "Does not validate the specific iframe implementation used here."),
        ("Yang et al. (2024)", "Meta-analysis of virtual reality and practical skills in science and engineering.", "Supports cautious discussion of interactive visualisation.", "Its engineering and science subgroup effects were not statistically significant."),
        ("Zontou et al. (2024)", "Systematic review of experimental virtual-reality research in engineering education.", "Supports discussion of active spatial 2D/3D environments.", "Includes technologies different from this non-immersive WebGL page."),
        ("Pergantis & Drigas (2024)", "Systematic review of drones in educational settings.", "Establishes educational use of drone-related activities.", "Does not provide this project’s dynamics or control model."),
        ("Cedro et al. (2024)", "PID altitude and attitude control for a quadcopter.", "Supports the control focus of the virtual experiment.", "Does not supply the learning interface or web deployment."),
        ("Bae & Kang (2025)", "Quadrotor rigid-body modelling and rotor allocation under wind disturbance.", "Supports force, moment, rotor-mixing and RK4 relationships.", "Does not evaluate an educational web application."),
    )
    add_table(
        doc,
        ("Study", "Focus and evidence", "Relevance", "Remaining gap"),
        related_studies,
        widths=(1.15, 1.75, 1.55, 1.55),
        font_size=Pt(11),
    )
    add_body(
        doc,
        "Table 2.2 shows that the project lies at the intersection of several established areas rather than duplicating one cited system. The education literature supports repeatable, guided virtual experimentation; the control literature supplies the quadrotor and PID foundations; and official browser documentation supports the chosen implementation and embed mechanisms. None of the reviewed sources combines the exact Vite-based software, ideal-state feedback plant, live metrics, guided quadrotor activities and planned iframe delivery implemented in this work.",
    )

    add_heading(doc, "2.10 Literature Synthesis and Research Gap")
    add_body(
        doc,
        "Three conclusions emerge from the review. First, laboratory learning must centre on purposeful experimentation, and virtual access should complement rather than displace physical practice. Second, a useful dynamic virtual laboratory needs a behaviour-producing model, adjustable variables and evidence that enables interpretation. Third, delivery within an LMS is valuable only when the integration preserves usability and clearly separates what has been technically verified from what remains to be deployed or educationally evaluated.",
    )
    add_body(
        doc,
        "The practical gap addressed by this study was therefore not merely the absence of another website. It was the absence, within the project’s Engineering LMS context, of an iframe-ready Mechatronics experiment that links adjustable PID control to a calculated quadrotor response, 3D motion, live plots, engineering metrics and guided activities. The developed laboratory addresses the software gap, while a later participant study is still needed to answer the separate question of measured learning effectiveness.",
    )

    add_heading(doc, "2.11 Chapter Summary")
    add_body(
        doc,
        "This chapter established the educational and technical basis of the project. Laboratory scholarship supports complementary physical and virtual experiences, while virtual-laboratory studies emphasise interaction, repeatability and instructional alignment. Quadrotor and PID literature provides the model and feedback foundations, and the official React, TypeScript, Vite, Three.js and HTML documentation supports the implemented browser architecture. The next chapter explains how these foundations were converted into the completed system and how the technical evaluation was conducted.",
    )


def add_chapter_three(doc: Document) -> None:
    add_chapter_title(doc, "CHAPTER THREE", "METHODOLOGY")

    add_heading(doc, "3.0 Introduction")
    add_body(
        doc,
        "This chapter explains the approach used to design, implement and technically evaluate the web-based virtual laboratory. It presents the system architecture, development technologies, quadrotor model, PID algorithm, numerical process, program operation and completed verification procedure.",
    )

    add_heading(doc, "3.1 Research and System-Design Approach")
    add_body(
        doc,
        "The study used an applied design-and-development approach. Its main output was a working software artefact rather than participant data. The work proceeded through requirement identification, modular system design, mathematical modelling and controller development, browser implementation, iterative inspection and controlled technical evaluation. Decisions were checked against the project objectives and against the requirement that the completed application remain separately deployable from the host LMS.",
    )
    add_body(
        doc,
        "Development was iterative. The interface, simulation and learning features were implemented in modules, assembled, exercised and revised when their behaviour did not match the intended experiment. For example, controller limits were used to make actuator saturation observable, response metrics were calculated from the same history plotted to the learner, and local iframe checks were used to examine the intended hosting arrangement. The final evaluation reported in Chapter Four used the completed code rather than a conceptual prototype.",
    )

    add_heading(doc, "3.2 System Overview")
    add_body(
        doc,
        "The system consists of four coordinated application layers. The React interface and learning layer receives setpoints, PID gains, presets, pilot commands and disturbance selections. The Zustand state and orchestration layer stores these inputs, advances a fixed-step scheduler and records history. The control and physics layer contains the PID controllers, plus-configuration motor mixer, rigid-body derivatives and RK4 integrator. The visualisation and telemetry layer uses Three.js and uPlot to display the calculated state and response evidence.",
    )
    add_figure(
        doc,
        "chapter3_system_architecture.png",
        "Figure 3.1: Architecture and feedback path of the web-based virtual laboratory.",
        width=5.8,
    )
    add_body(
        doc,
        "Figure 3.1 separates the host from the laboratory and follows one input through to the resulting display. The host LMS uses Next.js, whereas the standalone virtual laboratory was developed with Vite, React and TypeScript. After deployment, the LMS is intended to supply the laboratory address to an iframe. This separation means that Next.js is not part of the laboratory implementation and that the verified local frame is evidence of readiness, not evidence that live LMS integration has already been completed.",
    )
    add_body(
        doc,
        "The feedback route in Figure 3.1 is entirely simulated. At each physics step, the controller reads altitude, roll, pitch and yaw directly from the calculated state. These values represent ideal state feedback; there is no simulated barometer, inertial measurement unit, sensor fusion, noise, bias or transmission delay. The 3D model, telemetry cards and graphs are outputs of the same state and are not sensors in the loop.",
    )

    add_heading(doc, "3.3 Design and Implementation Methodology")
    add_heading(doc, "3.3.1 System Requirements", level=3)
    add_body(
        doc,
        "The requirements were derived from the three project objectives, the selected quadrotor experiment and the intended LMS context. Functional requirements described what the learner and simulation had to do, while non-functional requirements addressed delivery, organisation and responsive presentation. Table 3.1 records the principal requirements used to guide implementation and evaluation.",
    )
    add_table_caption(doc, "Table 3.1: Principal functional and non-functional system requirements")
    add_table(
        doc,
        ("Category", "Requirement", "Design response"),
        (
            ("Functional", "Allow altitude, roll, pitch and yaw commands and PID-gain adjustment.", "Setpoint fields, sliders, numerical inputs and five presets."),
            ("Functional", "Calculate a dynamic quadrotor response rather than play a fixed animation.", "Rigid-body derivatives, four PID loops, motor mixer and RK4 integration."),
            ("Functional", "Present immediate visual and numerical feedback.", "Procedural 3D scene, telemetry, three live plots and response metrics."),
            ("Functional", "Provide controlled disturbances and learning tasks.", "Wind, payload, motor degradation, guided activities, challenges and mission logic."),
            ("Non-functional", "Run through a compatible browser without learner-side installation.", "Client-side React and TypeScript application built into static assets by Vite."),
            ("Non-functional", "Remain separable from the existing host LMS.", "Independent deployment with planned iframe embedding."),
            ("Non-functional", "Remain usable at common page widths.", "Responsive layout and browser viewport checks."),
            ("Non-functional", "Keep the system maintainable and extensible.", "Separate interface, state, physics, scene, telemetry and learning modules."),
        ),
        widths=(1.0, 2.35, 2.65),
        font_size=Pt(11),
    )
    add_body(
        doc,
        "Table 3.1 links each requirement to a concrete design response, making the later status assessment traceable. Browser access and iframe readiness are separate requirements: the first concerns loading the standalone page, while the second concerns fitting it within another web page. Similarly, the availability of guided content was checked technically, but the learning effect of that content was not assumed without participant evidence.",
    )

    add_heading(doc, "3.3.2 Development Technologies", level=3)
    add_body(
        doc,
        "The software technologies were selected for a browser-side numerical and visual application. The interface uses React 19.2 (React Team, 2025), TypeScript 6.0 (Rosenwasser, 2026) and Vite 8 (Vite, 2026). Their specific responsibilities were established from the project dependency manifest and source code. Table 3.2 lists the actual role of each principal technology.",
    )
    add_table_caption(doc, "Table 3.2: Technologies used in the implemented virtual laboratory")
    add_table(
        doc,
        ("Technology", "Implemented purpose"),
        (
            ("React 19", "Component-based control panels, telemetry, learning interface and application composition."),
            ("TypeScript", "Typed controller, physics, simulation-state and user-interface logic."),
            ("Vite 8", "Development server and production build tool for the standalone laboratory."),
            ("Three.js", "WebGL-based 3D scene, geometry, lighting, cameras and object transforms."),
            ("React Three Fiber and Drei", "React integration and helpers for the Three.js scene."),
            ("Zustand", "Shared simulation state, actions, fixed-step scheduling and history orchestration."),
            ("uPlot", "Live altitude, attitude and tracking-error charts."),
            ("CSS/Tailwind Vite integration", "Responsive layout and visual styling."),
            ("Playwright Core", "Automated browser loading and viewport verification."),
        ),
        widths=(1.75, 4.25),
        font_size=Pt(11),
    )
    add_body(
        doc,
        "Table 3.2 confirms that Vite, not Next.js, builds the laboratory. The numerical controller and plant run in the browser with the interface; no server-rendered laboratory framework is required. Three.js is responsible for display, but it does not calculate the plant dynamics. Keeping these roles separate prevented the visual layer from becoming the source of truth for the simulation.",
    )

    add_heading(doc, "3.3.3 Mathematical Model of the Quadrotor", level=3)
    add_body(
        doc,
        "The quadrotor was represented as a rigid body that can move along the x, y and z axes and rotate in roll, pitch and yaw. Bae and Kang (2025) present recent multirotor force, moment, body-axis and rotor-allocation relationships, while Cedro et al. (2024) apply altitude and attitude control to a quadcopter model. The program stores position, linear velocity, the three attitude angles and angular velocity.",
    )
    add_body(doc, "The translational motion follows Newton's second law:")
    add_equation(doc, "m a = F_thrust + F_wind − F_drag − m g", "3.1")
    add_body(
        doc,
        "In Equation 3.1, m is the total mass, a is linear acceleration, F_thrust is the combined rotor thrust, F_wind is the selected wind force, F_drag opposes motion and mg is the weight of the quadrotor. The direction of rotor thrust changes when the aircraft tilts, which produces horizontal as well as vertical acceleration.",
    )
    add_body(doc, "The rotational motion is represented in the simpler form:")
    add_equation(doc, "I α = τ_control − τ_drag", "3.2")
    add_body(
        doc,
        "In Equation 3.2, I represents the moments of inertia, α is angular acceleration, τ_control contains the roll, pitch and yaw torques from the motors, and τ_drag opposes rotation. The implemented calculation also includes the coupling produced by the current angular velocity. Table 3.3 gives the numerical values used by the software model.",
    )
    add_table_caption(doc, "Table 3.3: Principal quadrotor and numerical-simulation parameters")
    add_table(
        doc,
        ("Parameter", "Implemented value", "Description"),
        (
            ("Gravity", "9.81 m/s²", "Constant gravitational acceleration."),
            ("Base mass", "1.22 kg", "Mass before optional or mission payload."),
            ("Arm length", "0.225 m", "Centre-to-rotor distance."),
            ("Inertia", "[0.019, 0.019, 0.036] kg·m²", "Diagonal roll, pitch and yaw moments."),
            ("Linear drag", "[0.18, 0.18, 0.24] N·s/m", "Axis-dependent translational damping."),
            ("Angular drag", "[0.018, 0.018, 0.024] N·m·s/rad", "Axis-dependent rotational damping."),
            ("Thrust coefficient", "1.9 × 10⁻⁵ N·s²/rad²", "Maps squared rotor speed to thrust."),
            ("Moment coefficient", "2.6 × 10⁻⁷ N·m·s²/rad²", "Contributes rotor reaction moment."),
            ("Rotor-speed range", "0–980 rad/s", "Applied actuator limit."),
            ("Ground altitude", "0.21 m", "Minimum centre-position constraint."),
            ("Physics step", "0.002 s (500 Hz)", "Fixed integration timestep."),
            ("History sample", "0.033 s", "Interval for plots and metrics."),
        ),
        widths=(1.55, 1.85, 2.6),
        font_size=Pt(11),
    )
    add_body(
        doc,
        "Table 3.3 records software parameters rather than measurements from a named physical quadrotor. Their inclusion makes the Chapter Four experiments reproducible and establishes the model boundaries. The maximum combined rotor thrust calculated from the coefficient and speed limit is approximately 72.99 N, which allows actuator saturation to be represented instead of permitting unlimited force.",
    )

    add_heading(doc, "3.3.4 PID Control and Motor Mixing", level=3)
    add_body(
        doc,
        "Four PID controllers regulate altitude, roll, pitch and yaw. Each controller first compares the required value with the value returned by the simulation. The difference is the control error:",
    )
    add_equation(doc, "e(t) = r(t) − y(t)", "3.3")
    add_body(
        doc,
        "Here, r(t) is the setpoint and y(t) is the simulated altitude or angle. The PID controller combines the present error, the accumulated error and the rate at which the error changes:",
    )
    add_equation(doc, "u(t) = Kp e(t) + Ki ∫e(t)dt + Kd de(t)/dt", "3.4")
    add_body(
        doc,
        "In Equation 3.4, Kp controls the immediate response, Ki corrects error that remains over time and Kd adds damping by responding to the rate of change. Cedro et al. (2024) similarly use PID control for quadcopter altitude and attitude, while Bae and Kang (2025) show the relationship between control demand and rotor allocation. In the implemented program, the integral value is limited, the derivative calculation is filtered and the final controller output is restricted. These safeguards reduce integral wind-up and prevent a controller from requesting unlimited force or torque.",
    )
    add_body(
        doc,
        "For altitude control, the controller output is treated as the additional vertical acceleration required above or below normal hover. The program converts this value to total thrust using the mass of the aircraft, gravity and the current roll and pitch angles. The relationship before software limits are applied is:",
    )
    add_equation(doc, "T = m(g + a_c) / (cos φ cos θ)", "3.5")
    add_body(
        doc,
        "In Equation 3.5, T is total thrust, m is the known aircraft and payload mass, g is gravity, a_c is the altitude-controller command, and φ and θ are roll and pitch. The denominator accounts for the loss of vertical thrust when the vehicle tilts. The program limits this compensation and the maximum thrust for numerical and actuator safety. Since payload mass is supplied directly to this calculation, the payload test represents a known mass change rather than an unknown disturbance.",
    )
    add_body(
        doc,
        "The motor mixer divides total thrust among the front, right, rear and left rotors and adds the differences required for roll, pitch and yaw. Rotor thrust is related to rotor speed by:",
    )
    add_equation(doc, "f_i = k_f Ω_i²", "3.6")
    add_body(
        doc,
        "In Equation 3.6, f_i is the thrust of motor i, k_f is the thrust coefficient and Ω_i is rotor speed. Each motor command is restricted to the implemented speed and thrust limits before it is returned to the quadrotor model.",
    )

    add_heading(doc, "3.3.5 Numerical Integration and Program Operation", level=3)
    add_body(
        doc,
        "The motion equations were advanced with fixed-step fourth-order Runge-Kutta integration. Bae and Kang (2025) also use fourth-order Runge-Kutta integration for quadrotor numerical simulation. The implemented update is:",
    )
    add_equation(doc, "x_(k+1) = x_k + (Δt/6)(k_1 + 2k_2 + 2k_3 + k_4)", "3.7")
    add_body(
        doc,
        "In Equation 3.7, x_k is the current simulated state, x_(k+1) is the next state, Δt is the 0.002 s timestep, and k_1 to k_4 are the four slope estimates. Browser frame time is accumulated, but the plant always advances in fixed 0.002 s steps. A ground constraint prevents the centre of the aircraft from falling below 0.21 m.",
    )
    add_body(
        doc,
        "During each simulation step, the program reads the current state, calculates the four PID outputs, mixes them into motor thrusts, applies motor limits and any selected fault, and then advances the rigid-body model with RK4. Figure 3.2 summarises this implemented sequence as a flowchart.",
    )
    add_figure(
        doc,
        "chapter3_program_flowchart.png",
        "Figure 3.2: Program flow for one running interval of the virtual laboratory.",
        width=5.65,
    )
    add_body(
        doc,
        "Figure 3.2 shows how browser input is converted into repeated fixed physics steps. If the simulation is paused, the current state remains displayed while the application waits for input. When running, every step reads simulated feedback, updates the controllers, mixes and limits motor commands, applies the selected conditions and advances the plant. History is sampled every 0.033 s for graphs and metrics, after which the scene and learning state are refreshed.",
    )

    add_heading(doc, "3.3.6 Interface, Learning Features and LMS Embedding", level=3)
    add_body(
        doc,
        "The interface was organised as a laboratory console. A large central region contains the 3D plant, while grouped flight, tuning and test panels control the current experiment. Telemetry and motor cards provide numerical state information, and three uPlot charts display altitude, attitude and tracking error. Inspect, follow, top and side camera modes change the observation view without changing the simulated state.",
    )
    add_body(
        doc,
        "The learning layer contains 12 guided activities, six short theory references, seven challenges and a payload-delivery mission. Each guided activity can configure a scenario and evaluate a coded condition. During auditing, three wording/model mismatches were identified: the Altitude Step text and configured target differ, the wind-recovery wording implies return to a horizontal point despite the absence of an x-y controller, and the Integral Payload activity assumes an unknown-load offset even though exact mass feed-forward is used. These items were treated as partial learning-support results rather than hidden.",
    )
    add_body(
        doc,
        "The production build generates static assets that can be deployed at a web address. The planned LMS page will use an iframe whose source is that address. The local verification wrapper reproduced this arrangement at a 984 px frame width. No claim of completed institutional integration was made because deployment, framing permissions, final course-page configuration and any progress-data exchange had not been completed.",
    )

    add_heading(doc, "3.3.7 Evaluation Procedure", level=3)
    add_body(
        doc,
        "Evaluation was limited to completed technical and deterministic simulation tests. The application controls, setpoints, gain inputs, presets, learning panels, disturbance tools, charts and mission transitions were checked. TypeScript compilation, the Vite production build and a focused ESLint check were also completed. The procedure did not include a questionnaire, participant observation or a comparison of student learning outcomes.",
    )
    add_table_caption(doc, "Table 3.4: Controlled evaluation procedure used for the completed application")
    add_table(
        doc,
        ("Evaluation area", "Controlled procedure", "Recorded evidence"),
        (
            ("Preset altitude response", "Five presets; initial 0.21 m; target 2.40 m; 15 s; no disturbance.", "Rise time, overshoot, settling time, final sampled error and endpoint altitude."),
            ("Custom altitude tuning", "Kp = 10, Ki = 0.20, Kd = 5; target 2.40 m; 8 s.", "Challenge limits and measured response metrics."),
            ("Attitude and heading", "Well Tuned; altitude 1.80 m; roll 10°; pitch −6°; yaw 45°; 10 s.", "Final values, errors and settling times."),
            ("Disturbance and mission", "Eight-second pre-hover before wind, 0.42 kg payload or persistent 58% motor authority; mission-state checks.", "Altitude, translation, motor thrust, attitude and state-transition observations."),
            ("Browser and iframe", "Edge at 1440 × 960, 1024 × 900 and 390 × 900; Chrome at 1280 × 800; local 984 px iframe.", "Scene/control loading and horizontal-overflow observations."),
            ("Build and static checks", "TypeScript/Vite production build and focused ESLint run.", "Completion status and processed-module count."),
        ),
        widths=(1.35, 2.75, 1.9),
        font_size=Pt(11),
    )
    add_body(
        doc,
        "Table 3.4 establishes the conditions behind the Chapter Four tables. Rise time was measured from 10% to 90% of the commanded step. Settling required every remaining sample to stay within 2% of the step, subject to a minimum tolerance of 0.02 m for altitude and 0.01 rad for angular channels. Final sampled error was calculated as setpoint minus the last stored response. For a response that had not settled, the endpoint difference was not described as steady-state error.",
    )

    add_heading(doc, "3.4 Chapter Summary")
    add_body(
        doc,
        "This chapter described the applied design-and-development process used to produce the laboratory. It traced the system from requirements through the Vite, React and TypeScript architecture, ideal simulated feedback, quadrotor equations, PID calculation, motor mixing, RK4 integration, interface and iframe arrangement. The selected code listings documented the main closed-loop path without reproducing the entire project, and the evaluation procedure defined the controlled tests whose results are presented next.",
    )


def add_chapter_four(doc: Document) -> None:
    add_chapter_title(doc, "CHAPTER FOUR", "RESULTS AND DISCUSSION")

    add_heading(doc, "4.0 Introduction")
    add_body(
        doc,
        "This chapter presents the design, implementation and technical evaluation results obtained from the completed local version of the virtual laboratory. Each table or figure is followed directly by a discussion of the evidence it contains.",
    )

    add_heading(doc, "4.1 Results of the System Design")
    add_body(
        doc,
        "The design stage produced a single-page console organised around interface and learning, shared simulation state, physics and control, and visualisation and telemetry. Table 4.1 compares the main requirements with the functions present in the tested application.",
    )
    add_table_caption(doc, "Table 4.1: Fulfilment of the principal system design requirements")
    add_table(
        doc,
        ("Requirement", "Implemented result", "Status"),
        (
            ("Browser access", "Standalone page loads without a learner-side application installation.", "Met"),
            ("Quadrotor experiment", "A rigid-body quadrotor is provided as the demonstrative Mechatronics plant.", "Met"),
            ("Adjustable control", "Altitude, roll, pitch and yaw gains and setpoints can be changed during use.", "Met"),
            ("3D visualisation", "The scene displays the aircraft, floor, trajectory, setpoint and mission objects.", "Met"),
            ("Real-time feedback", "Telemetry, errors, motor values and plots update from shared simulation state.", "Met"),
            ("Disturbance testing", "Wind, added payload and selectable motor degradation are available.", "Met"),
            ("Learning support", "Guided activities, notes, challenges and a mission are present; three activity/model descriptions require alignment.", "Partly met"),
            ("Responsive layout", "The console reorganises without horizontal page overflow at tested widths.", "Met"),
            ("Modular structure", "Interface, state, physics, scene, telemetry and learning functions are separated.", "Met"),
            ("LMS integration", "A local iframe test passed; deployment and live LMS embedding remain pending.", "Partly met"),
        ),
        widths=(1.4, 3.85, 0.75),
        font_size=Pt(11),
        alignments=(WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER),
    )
    add_body(
        doc,
        "Table 4.1 shows that the core browser, simulation, control, visualisation and responsive-design requirements were implemented. Two requirements were only partly met. Learning content is available, but the Altitude Step, wind-recovery and Integral Payload descriptions do not fully match their coded setup or plant behaviour. In addition, local iframe operation confirms technical compatibility with framing, whereas it does not confirm deployment permissions or final incorporation in the institutional LMS.",
    )
    add_figure(
        doc,
        "chapter4_interface_overview.png",
        "Figure 4.1: Implemented virtual laboratory interface showing the quadrotor, controls and live response charts.",
        width=5.8,
    )
    add_body(
        doc,
        "Figure 4.1 shows the completed console at a desktop viewport. The 3D plant occupies the primary work area, operational controls are grouped to the right and the response plots remain available below. This arrangement places the command, visible motion and numerical evidence within one workspace. The screenshot confirms implementation of the layout, but it does not by itself establish ease of use because no formal user study was completed.",
    )

    add_heading(doc, "4.2 Implementation Results")
    add_heading(doc, "4.2.1 Physics and Control Functions", level=3)
    add_body(
        doc,
        "The completed physics layer advances a six-degree-of-freedom rigid body with fourth-order Runge–Kutta integration at 500 fixed steps per simulated second. Four PID controllers request collective thrust and attitude torques, and the plus-configuration mixer applies rotor and motor-authority limits before the plant is advanced. Selected model values are summarised in Table 4.2.",
    )
    add_table_caption(doc, "Table 4.2: Selected model and simulation parameters in the implemented system")
    add_table(
        doc,
        ("Parameter", "Value", "Unit or description"),
        (
            ("Base mass", "1.22", "kg"),
            ("Gravitational acceleration", "9.81", "m/s²"),
            ("Arm length", "0.225", "m"),
            ("Moments of inertia", "0.019, 0.019, 0.036", "kg·m² for roll, pitch and yaw"),
            ("Linear drag", "0.18, 0.18, 0.24", "N·s/m; axis-dependent"),
            ("Angular drag", "0.018, 0.018, 0.024", "N·m·s/rad; axis-dependent"),
            ("Maximum rotor speed", "980", "rad/s"),
            ("Maximum combined thrust", "72.99", "N"),
            ("Physics timestep", "0.002", "s"),
            ("Numerical method", "Fourth-order Runge–Kutta", "Fixed-step integration"),
        ),
        widths=(1.8, 1.55, 2.65),
        font_size=Pt(11),
        alignments=(WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.LEFT),
    )
    add_body(
        doc,
        "Table 4.2 confirms that the numerical values used to obtain the response tables were fixed in the software. They are simulation parameters rather than measurements from a named commercial aircraft. Re-running a test with the same initial state, gains, setpoint and disturbance therefore gives the same result, which enabled controlled comparison of the preset controllers.",
    )

    add_heading(doc, "4.2.2 Visualisation, Telemetry and Learning Functions", level=3)
    add_body(
        doc,
        "The visual layer was implemented as a procedural quadrotor with a frame, four motor pods, propellers, landing structure, guard ring and navigation indicators. Its position and orientation follow the calculated state, while propeller motion is linked to motor output. The telemetry history supplies altitude, attitude and error plots and the 10–90% rise time, percentage overshoot, settling time, peak response and final sampled error.",
    )
    add_figure(
        doc,
        "chapter4_guided_learning.png",
        "Figure 4.2: Guided-learning panel containing the sequenced control-system activities.",
        width=5.8,
    )
    add_body(
        doc,
        "Figure 4.2 confirms that the learning layer was implemented rather than left as a design proposal. Twelve guided activities, six shorter theory references and seven challenges were available in the inspected version. Their sequence moves from orientation and manual control toward tuning, coupled motion, disturbances, landing and payload delivery. Technical availability was verified; learner comprehension and educational benefit were not measured.",
    )

    add_heading(doc, "4.3 Evaluation Results")
    add_heading(doc, "4.3.1 Build and Functional Verification", level=3)
    add_body(
        doc,
        "The production build completed without a TypeScript or Vite compilation error and processed 615 modules into deployment assets. A focused ESLint check also completed without an error. The principal application paths were then exercised, and the observed results are presented in Table 4.3.",
    )
    add_table_caption(doc, "Table 4.3: Functional verification results")
    add_table(
        doc,
        ("Test", "Expected result", "Observed result", "Status"),
        (
            ("Application load", "Console and 3D scene appear.", "Title, controls, WebGL scene and three charts loaded.", "Pass"),
            ("Run, pause, step and reset", "Time responds to each command.", "Run advanced time; step added 0.002 s; reset returned to 0 s and paused.", "Pass"),
            ("Speed selection", "0.25× to 4× values are accepted.", "All listed speed values were selectable and stored.", "Pass"),
            ("Setpoints", "Altitude and attitude commands update.", "Altitude, roll, pitch and yaw commands were accepted by the controllers.", "Pass"),
            ("Gain and preset controls", "Values change without page reload.", "Five presets loaded and manual input activated a custom gain set.", "Pass"),
            ("Flight, tune and test tabs", "Relevant panels appear.", "Correct control, metric and disturbance panels appeared.", "Pass"),
            ("Wind, payload and motor fault", "Each condition changes plant state.", "Gust, 0.42 kg payload and 58% motor authority were applied and cleared.", "Pass"),
            ("Mission logic", "Transitions require coded conditions.", "Ready, carrying and delivered states followed the encoded windows.", "Pass"),
            ("Learning content", "Lessons and challenges are available.", "12 guided activities, six references and seven challenges were displayed.", "Pass"),
            ("Charts and metrics", "History and measures update.", "One 3D canvas and three response charts rendered; measures updated from history.", "Pass"),
        ),
        widths=(1.15, 1.45, 2.75, 0.65),
        font_size=Pt(11),
        alignments=(WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER),
    )
    add_body(
        doc,
        "Table 4.3 establishes that the tested path from user input through state update, simulation and display was operational. The results apply to the listed paths and conditions; they are not exhaustive certification of every possible gain, pilot command or disturbance combination. Keyboard, virtual-stick and physical-gamepad operation were not included in the recorded browser checks, and the project does not yet contain a comprehensive automated unit-test suite.",
    )

    add_heading(doc, "4.3.2 Altitude-Controller Response", level=3)
    add_body(
        doc,
        "The preset comparison began at the 0.21 m ground constraint and applied a 2.40 m altitude command for 15 s without disturbance. The final error is the command minus the last history sample at approximately 15 s. For cases marked “Not settled”, that value is an endpoint difference rather than a steady-state measurement. Table 4.4 presents the results generated by the implemented simulation.",
    )
    add_table_caption(doc, "Table 4.4: Comparison of altitude responses produced by the supplied PID presets")
    add_table(
        doc,
        ("Preset", "Rise time (s)", "Overshoot (%)", "Settling time (s)", "Final sampled error (m)", "Final sampled altitude (m)"),
        (
            ("Untuned Start", "0.680", "48.05", "9.656", "−0.0118", "2.4118"),
            ("Well Tuned", "0.748", "17.73", "8.398", "−0.0067", "2.4067"),
            ("Sluggish", "2.618", "18.88", "Not settled", "−0.1124", "2.5124"),
            ("Oscillatory", "0.442", "64.64", "7.956", "−0.0010", "2.4010"),
            ("Unstable", "0.408", "126.32", "Not settled", "2.0216", "0.3784"),
        ),
        widths=(1.15, 0.82, 0.88, 0.95, 1.05, 1.15),
        font_size=Pt(11),
        alignments=tuple([WD_ALIGN_PARAGRAPH.CENTER] * 6),
    )
    add_body(
        doc,
        "Table 4.4 demonstrates the intended differences among the five preset personalities. The Unstable preset had the shortest 10–90% rise duration, but its 126.32% overshoot and failure to settle made that speed unacceptable. Oscillatory was the next fastest and also overshot substantially. Well Tuned reduced overshoot relative to Untuned Start, whereas Sluggish required the longest rise period and remained outside the settling band at the end of the trial. The table therefore shows why rise time must be considered with overshoot, settling and final response rather than used alone.",
    )
    add_body(
        doc,
        "A separate manual-tuning trial used Kp = 10.0, Ki = 0.20 and Kd = 5.0 for the same 2.40 m command over 8 s. The coded challenge required overshoot below 10%, settling below 2.0 s and an absolute final sampled error below 0.08 m. Table 4.5 compares the measured values with those limits.",
    )
    add_table_caption(doc, "Table 4.5: Result of the custom altitude-tuning challenge")
    add_table(
        doc,
        ("Measure", "Acceptance limit", "Measured result", "Decision"),
        (
            ("10–90% rise time", "Informative", "0.816 s", "Recorded"),
            ("Percentage overshoot", "Below 10%", "1.94%", "Pass"),
            ("Settling time", "Below 2.0 s", "1.292 s", "Pass"),
            ("Absolute final sampled error", "Below 0.08 m", "0.0218 m", "Pass"),
        ),
        widths=(1.85, 1.45, 1.45, 1.25),
        font_size=Pt(11),
        alignments=(WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER),
    )
    add_body(
        doc,
        "Table 4.5 shows that the manual setting satisfied all three performance limits encoded by the challenge. Its rise time was slightly slower than the fastest presets in Table 4.4, but the overshoot and settling results were considerably better. This reflects the expected PID trade-off: a preferred gain set depends on speed, damping, accuracy and output limits together, rather than on one maximum gain. Cedro et al. (2024) similarly evaluate altitude and attitude PID behaviour using more than one response characteristic.",
    )
    add_figure(
        doc,
        "chapter4_altitude_response.png",
        "Figure 4.3: Altitude response and 2.40 m setpoint for the custom PID setting.",
        width=5.75,
    )
    add_body(
        doc,
        "Figure 4.3 provides the time-domain evidence behind Table 4.5. The measured altitude rises from 0.21 m, crosses the command with a small peak and remains close to the 2.40 m reference. Both axes are labelled, and the high-resolution plot avoids treating a stretched interface screenshot as the measurement record.",
    )
    add_figure(
        doc,
        "chapter4_response_metrics.png",
        "Figure 4.4: Response metrics displayed after the custom altitude-tuning test.",
        width=5.8,
    )
    add_body(
        doc,
        "Figure 4.4 shows that the application reports the performance measures within the tuning interface after a run. The displayed values agree with Table 4.5 because both are calculated from the same stored history. This consistency allows a learner to relate the curve to numerical acceptance criteria, although a later learner study is required to determine how effectively students interpret those measures.",
    )

    add_heading(doc, "4.3.3 Attitude and Heading Response", level=3)
    add_body(
        doc,
        "A combined 10 s trial used the Well Tuned preset with commands of 1.80 m altitude, 10° roll, −6° pitch and 45° yaw. Table 4.6 presents the final angular values, errors and settling times obtained from the corresponding history channels.",
    )
    add_table_caption(doc, "Table 4.6: Combined attitude and heading tracking result")
    add_table(
        doc,
        ("Channel", "Command", "Final value", "Final error", "Settling time"),
        (
            ("Roll", "10.00°", "10.18°", "−0.18°", "1.054 s"),
            ("Pitch", "−6.00°", "−6.07°", "0.07°", "0.816 s"),
            ("Yaw", "45.00°", "45.69°", "−0.69°", "7.174 s"),
        ),
        widths=(1.1, 1.15, 1.15, 1.15, 1.45),
        font_size=Pt(11),
        alignments=tuple([WD_ALIGN_PARAGRAPH.CENTER] * 5),
    )
    add_body(
        doc,
        "Table 4.6 shows that roll and pitch settled quickly with small final errors, while yaw needed a longer interval. The final altitude was approximately 1.813 m, corresponding to an error of about −0.013 m. Since no horizontal position loop is present, holding non-zero roll or pitch also produces horizontal travel. The test verifies attitude and heading tracking under the stated model; it is not a waypoint or position-hold result.",
    )

    add_heading(doc, "4.3.4 Disturbance, Actuator and Mission Results", level=3)
    add_body(
        doc,
        "Disturbance tests began after an 8 s pre-hover period so that the aircraft was close to its initial command before the selected condition was applied. Wind and motor-fault displacement were measured from disturbance onset. Table 4.7 records the observations and the interpretation allowed by the current controller structure.",
    )
    add_table_caption(doc, "Table 4.7: Disturbance, actuator and mission evaluation results")
    add_table(
        doc,
        ("Test", "Condition", "Observed result", "Interpretation"),
        (
            ("Wind gust", "Well Tuned; target 1.80 m; [2.8, −1.4, 0] N for 1.35 s; observed 12 s.", "Peak horizontal speed 3.13 m/s; 19.03 m displacement; maximum altitude deviation about 0.034 m.", "Altitude was retained, but the craft did not return to its original x-y point."),
            ("Added payload", "Target 2.10 m; Kp = 10, Ki = 0, Kd = 5; add 0.42 kg; observe 6 s.", "Per-motor hover thrust rose from 2.992 N to 4.022 N; final altitude error was effectively zero.", "Exact known mass is included in gravity feed-forward."),
            ("Motor 2 degradation", "Well Tuned; target 1.72 m; persistent 58% authority; observed 8 s.", "Maximum roll 4.39°; altitude deviation 0.273 m; final error 0.041 m; about 14.13 m horizontal displacement.", "The fault remained bounded in attitude but produced substantial translation."),
            ("Payload mission", "Stable pickup and drop windows encoded in mission logic.", "State changed from ready to carrying and then delivered.", "The programmed stability and location conditions operated as intended."),
        ),
        widths=(0.95, 1.55, 2.15, 1.35),
        font_size=Pt(11),
    )
    add_body(
        doc,
        "Table 4.7 confirms that each selected condition affected either the plant or mission state. The wind and motor-fault trials also expose a controller boundary: small altitude and attitude deviations do not imply return to the starting position. Without x-y position feedback, horizontal momentum decays through drag rather than an active recovery loop. The payload result has a different limitation because the control calculation receives the added mass exactly; zero final altitude error with Ki = 0 is therefore expected and cannot be used as evidence that integral action rejected an unknown load.",
    )
    add_figure(
        doc,
        "chapter4_disturbance_tools.png",
        "Figure 4.5: Test panel showing the payload condition and disturbance controls.",
        width=5.8,
    )
    add_body(
        doc,
        "Figure 4.5 shows the interface through which the trials in Table 4.7 were configured. The panel allows the optional payload to be selected, a timed wind gust to be applied and a motor-authority reduction to be activated. The display makes experimental conditions visible to the user, while the response must still be judged from the state, plots and recorded measurements.",
    )

    add_heading(doc, "4.3.5 Browser Responsiveness and Iframe Readiness", level=3)
    add_body(
        doc,
        "The page was checked in Microsoft Edge at three viewport sizes, in Google Chrome at one desktop size and within a local iframe. The labels “desktop”, “tablet-sized” and “mobile-sized” describe viewport dimensions rather than three separate physical devices. Table 4.8 summarises the observed loading and page-overflow result.",
    )
    add_table_caption(doc, "Table 4.8: Browser, viewport and iframe verification")
    add_table(
        doc,
        ("Environment", "Viewport or frame", "WebGL and controls", "Horizontal overflow", "Result"),
        (
            ("Edge—desktop viewport", "1440 × 960 px", "Loaded", "None", "Pass"),
            ("Edge—tablet-sized viewport", "1024 × 900 px", "Loaded", "None", "Pass"),
            ("Edge—mobile-sized viewport", "390 × 900 px", "Loaded", "None", "Pass"),
            ("Local iframe", "984 px wide", "Loaded", "None", "Pass"),
            ("Chrome smoke test", "1280 × 800 px", "Loaded", "None observed", "Pass"),
        ),
        widths=(1.55, 1.2, 1.35, 1.2, 0.7),
        font_size=Pt(11),
        alignments=(WD_ALIGN_PARAGRAPH.LEFT, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER, WD_ALIGN_PARAGRAPH.CENTER),
    )
    add_body(
        doc,
        "Table 4.8 shows that the 3D scene and controls loaded and that no horizontal page overflow was observed at the recorded sizes. Edge received the three responsive-layout checks, whereas Chrome received only the stated 1280 × 800 smoke test. The local iframe result supports the planned visual embed, but the live host LMS, production origins, permissions, authentication flow and progress exchange were not part of this test.",
    )

    add_heading(doc, "4.4 Discussion of Findings")
    add_body(
        doc,
        "The first objective was achieved at the design level through a modular architecture that joins learner input, controller calculation, a dynamic plant and multiple forms of feedback. The second objective was achieved by implementing those modules as a working Vite, React and TypeScript application. The build and functional results show that the tested parts operate together rather than existing only as interface mock-ups.",
    )
    add_body(
        doc,
        "The third objective was achieved at the technical and simulation levels but not as a complete educational-suitability study. The preset and custom trials demonstrated repeatable controller differences, and the browser tests established operation under the recorded conditions. No learners or lecturers supplied study data, so the results cannot establish improvement in knowledge, usability or practical competence. This restraint is consistent with Li and Liang (2024), who treat virtual laboratories as complementary learning tools whose outcomes depend on implementation and study context.",
    )
    add_body(
        doc,
        "The results also reveal useful model boundaries. The current system regulates altitude and attitude but not horizontal position; it uses ideal calculated feedback instead of sensors; and its known-mass feed-forward removes the offset that the Integral Payload activity expects. Bae and Kang (2025) model broader rigid-body and rotor-allocation relationships, while Cedro et al. (2024) use a quadcopter control model with conditions beyond this teaching simulation. Reporting these boundaries prevents a software demonstration from being mistaken for full physical validation.",
    )
    add_body(
        doc,
        "Overall, the completed application provides a safe and repeatable environment for examining PID response, coupled attitude motion, actuator limits and selected disturbances. It is technically prepared for final deployment and iframe incorporation, but the LMS connection must still be completed. Its strongest supported claim is therefore that it is a functional virtual control experiment with structured learning features, not that those features have already produced a measured educational benefit.",
    )

    add_heading(doc, "4.5 Chapter Summary")
    add_body(
        doc,
        "This chapter presented and discussed the completed design, implementation and evaluation results. A custom altitude setting achieved 1.94% overshoot, 1.292 s settling time and 0.0218 m absolute final sampled error, while attitude, disturbance, mission, browser and local iframe behaviour were also recorded. The evidence confirmed technical functionality and repeatable controller experimentation, while identifying partial learning-content alignment, absence of horizontal position control, ideal state feedback and pending live LMS integration.",
    )


def add_chapter_five(doc: Document) -> None:
    add_chapter_title(doc, "CHAPTER FIVE", "CONCLUSION AND RECOMMENDATIONS")

    add_heading(doc, "5.1 Summary")
    add_body(
        doc,
        "Chapter One established the need for a complementary, repeatable practical environment in which students can explore a dynamic control system beyond the restrictions of a scheduled physical session. It defined the problem as the absence, in the project’s Engineering LMS context, of an interactive Mechatronics experiment that links adjustable control values to calculated motion and measured feedback. The chapter stated the aim of designing and implementing a web-based virtual laboratory and limited the evaluation claim to technical and simulation evidence.",
    )
    add_body(
        doc,
        "Chapter Two reviewed the educational and technical foundations. Li and Liang (2024) report a positive overall virtual-laboratory effect without supporting complete replacement of hands-on work, while Kurtz et al. (2025) distinguish virtual, remote and hands-on laboratory modes. The review also used verified quadrotor, PID and browser sources to establish the model, controller, 3D display and iframe basis. It identified the specific gap as an iframe-ready quadrotor experiment joining a calculated plant, live evidence and guided activities within the intended LMS workflow.",
    )
    add_body(
        doc,
        "Chapter Three described an applied design-and-development method. The standalone laboratory was implemented with Vite, React and TypeScript, while the host LMS remained a separate Next.js application. Ideal simulated altitude and attitude state values close four PID loops; a motor mixer and actuator limits drive a rigid-body model integrated with RK4 at 0.002 s. The chapter documented the architecture, flowchart, equations, selected code and controlled technical evaluation procedure without claiming a participant study.",
    )
    add_body(
        doc,
        "Chapter Four reported that the principal software functions, production build, browser layouts and local iframe operated under the tested conditions. Five presets produced distinct altitude responses, and a custom gain set achieved 1.94% overshoot, 1.292 s settling time and 0.0218 m absolute final sampled error. Attitude commands, selected disturbances and mission transitions were also verified. The results identified three learning-content mismatches, lack of x-y position control, ideal rather than sensor feedback and pending live LMS embedding.",
    )

    add_heading(doc, "5.2 Conclusion")
    add_body(
        doc,
        "The project concludes that a functional quadrotor control laboratory can be delivered as a standalone Vite-built browser application prepared for embedding in a separate Next.js LMS. The completed system links adjustable PID gains and commands to a calculated rigid-body response, 3D motion, motor information, plots and engineering performance measures. Its deterministic results support repeatable technical experimentation, and the local iframe result establishes readiness for the final integration step.",
    )
    add_body(
        doc,
        "This conclusion applies to the software and test conditions reported. The model is not a validated substitute for a physical quadrotor, and no learner study was performed. The appropriate final claim is therefore that the project achieved a working and technically evaluated virtual laboratory that can complement physical practical work; educational effectiveness must be established separately after deployment and content correction.",
    )

    add_heading(doc, "5.3 Recommendations")
    add_numbered_recommendation(
        doc,
        1,
        "Deploy the Vite production build and complete the iframe connection in the live Next.js LMS, then verify the final course-page dimensions, framing permissions and authentication environment.",
    )
    add_numbered_recommendation(
        doc,
        2,
        "Correct the Altitude Step, wind-recovery and Integral Payload activities so that they match the implemented model, then conduct a structured learner and usability evaluation before making claims about educational effectiveness.",
    )


def add_reference(doc: Document, parts: Sequence[tuple[str, bool]]) -> None:
    paragraph = doc.add_paragraph(style=STYLE_REFERENCE)
    for text, italic in parts:
        set_run_font(paragraph.add_run(text), italic=italic)


def add_references(doc: Document) -> None:
    heading = doc.add_paragraph(style="Heading 1")
    heading.alignment = WD_ALIGN_PARAGRAPH.CENTER
    set_run_font(heading.add_run("REFERENCES"), size=Pt(12), bold=True)

    references: Sequence[Sequence[tuple[str, bool]]] = (
        (
            ("Bae, J.-J., & Kang, J.-Y. (2025). Quaternion-based robust sliding-mode controller for quadrotor operation under wind disturbance. ", False),
            ("Aerospace, 12", True),
            ("(2), 93. https://doi.org/10.3390/aerospace12020093", False),
        ),
        (
            ("Cedro, L., Wieczorkowski, K., & Szcześniak, A. (2024). An adaptive PID control system for the attitude and altitude control of a quadcopter. ", False),
            ("Acta Mechanica et Automatica, 18", True),
            ("(1), 29–39. https://doi.org/10.2478/ama-2024-0004", False),
        ),
        (
            ("Hussein, M. K., Subhi, M. A., Mohammed, S. M., & Al-Khateeb, M. (2024). E-learning management technology integration for laboratory usage. ", False),
            ("Iraqi Journal for Computer Science and Mathematics, 5", True),
            ("(4), 208–219. https://doi.org/10.52866/2788-7421.1000", False),
        ),
        (
            ("Idika, E. O., Obiagu, A. N., & Ibe, E. (2024). Exploring university lecturers’ mandatory e-learning attitudes, readiness and anxiety in Nigeria. ", False),
            ("Journal of Applied Research in Higher Education, 17", True),
            ("(4), 1181–1195. https://doi.org/10.1108/JARHE-10-2023-0465", False),
        ),
        (
            ("Kurtz, M., Benabbou, A., Pons, C., & Broisin, J. (2025). Collaboration in virtual and remote laboratories for education: A systematic literature review. ", False),
            ("International Journal of Computer-Supported Collaborative Learning, 20", True),
            (", 549–603. https://doi.org/10.1007/s11412-025-09454-7", False),
        ),
        (
            ("Li, J., & Liang, W. (2024). Effectiveness of virtual laboratory in engineering education: A meta-analysis. ", False),
            ("PLOS ONE, 19", True),
            ("(12), e0316269. https://doi.org/10.1371/journal.pone.0316269", False),
        ),
        (
            ("Pergantis, P., & Drigas, A. (2024). The effect of drones in the educational process: A systematic review. ", False),
            ("Education Sciences, 14", True),
            ("(6), 665. https://doi.org/10.3390/educsci14060665", False),
        ),
        (
            ("React Team. (2025, October 1). ", False),
            ("React 19.2", True),
            (". React. https://react.dev/blog/2025/10/01/react-19-2", False),
        ),
        (
            ("Rosenwasser, D. (2026, March 23). ", False),
            ("Announcing TypeScript 6.0", True),
            (". Microsoft for Developers. https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/", False),
        ),
        (
            ("Vite. (2026, March 12). ", False),
            ("Vite 8.0 is out!", True),
            (" https://vite.dev/blog/announcing-vite8", False),
        ),
        (
            ("WHATWG. (2026, August 26). ", False),
            ("HTML: The Living Standard—The iframe element", True),
            (" (Edition for Web Developers). https://html.spec.whatwg.org/dev/iframe-embed-object.html", False),
        ),
        (
            ("Yang, C., Zhang, J., Hu, Y., Yang, X., Chen, M., Shan, M., & Li, L. (2024). The impact of virtual reality on practical skills for students in science and engineering education: A meta-analysis. ", False),
            ("International Journal of STEM Education, 11", True),
            (", Article 28. https://doi.org/10.1186/s40594-024-00487-2", False),
        ),
        (
            ("Yeung, C. Y., Yeung, C. H., Sun, D., & Looi, C.-K. (2024). A systematic review of drone integrated STEM education at secondary schools (2005–2023): Trends, pedagogies, and learning outcomes. ", False),
            ("Computers & Education, 212", True),
            (", 104999. https://doi.org/10.1016/j.compedu.2024.104999", False),
        ),
        (
            ("Zontou, E., Kaminaris, S., & Rangoussi, M. (2024). On the role of virtual reality in engineering education: A systematic literature review of experimental research (2011–2022). ", False),
            ("European Journal of Engineering Education, 49", True),
            ("(5), 856–888. https://doi.org/10.1080/03043797.2024.2369188", False),
        ),
    )

    legacy_references: Sequence[Sequence[tuple[str, bool]]] = (
        (
            ("Akintola, A. A., Aderounmu, G. A., & Owolarafe, O. K. (2002). Problems of engineering education and training in developing countries: Nigeria as a case study. ", False),
            ("European Journal of Engineering Education, 27", True),
            ("(4), 393–400. https://doi.org/10.1080/03043790210166693", False),
        ),
        (
            ("Ang, K. H., Chong, G., & Li, Y. (2005). PID control system analysis, design, and technology. ", False),
            ("IEEE Transactions on Control Systems Technology, 13", True),
            ("(4), 559–576. https://doi.org/10.1109/TCST.2005.847331", False),
        ),
        (
            ("Butcher, J. C. (2016). ", False),
            ("Numerical methods for ordinary differential equations", True),
            (" (3rd ed.). John Wiley & Sons. https://doi.org/10.1002/9781119121534", False),
        ),
        (
            ("de Jong, T., Linn, M. C., & Zacharia, Z. C. (2013). Physical and virtual laboratories in science and engineering education. ", False),
            ("Science, 340", True),
            ("(6130), 305–308. https://doi.org/10.1126/science.1230579", False),
        ),
        (
            ("Feisel, L. D., & Rosa, A. J. (2005). The role of the laboratory in undergraduate engineering education. ", False),
            ("Journal of Engineering Education, 94", True),
            ("(1), 121–130. https://doi.org/10.1002/j.2168-9830.2005.tb00833.x", False),
        ),
        (
            ("Hussein, M. K., Subhi, M. A., Mohammed, S. M., & Al-Khateeb, M. (2024). E-learning management technology integration for laboratory usage. ", False),
            ("Iraqi Journal for Computer Science and Mathematics, 5", True),
            ("(4), 208–219. https://doi.org/10.52866/2788-7421.1000", False),
        ),
        (
            ("Li, J., & Liang, W. (2024). Effectiveness of virtual laboratory in engineering education: A meta-analysis. ", False),
            ("PLOS ONE, 19", True),
            ("(12), e0316269. https://doi.org/10.1371/journal.pone.0316269", False),
        ),
        (
            ("Ma, J., & Nickerson, J. V. (2006). Hands-on, simulated, and remote laboratories: A comparative literature review. ", False),
            ("ACM Computing Surveys, 38", True),
            ("(3), Article 7. https://doi.org/10.1145/1132960.1132961", False),
        ),
        (
            ("Mahony, R., Kumar, V., & Corke, P. (2012). Multirotor aerial vehicles: Modeling, estimation, and control of quadrotor. ", False),
            ("IEEE Robotics & Automation Magazine, 19", True),
            ("(3), 20–32. https://doi.org/10.1109/MRA.2012.2206474", False),
        ),
        (
            ("Microsoft. (n.d.). ", False),
            ("The TypeScript handbook", True),
            (". TypeScript. Retrieved August 26, 2026, from https://www.typescriptlang.org/docs/handbook/intro.html", False),
        ),
        (
            ("Oloyede, A. A., Ajimotokan, H. A., & Faruk, N. (2017). Embracing the future of engineering education in Nigeria: Teaching and learning challenges. ", False),
            ("Nigerian Journal of Technology, 36", True),
            ("(4), 991–1001. https://doi.org/10.4314/njt.v36i4.1", False),
        ),
        (
            ("Potkonjak, V., Gardner, M., Callaghan, V., Mattila, P., Guetl, C., Petrović, V. M., & Jovanović, K. (2016). Virtual laboratories for education in science, technology, and engineering: A review. ", False),
            ("Computers & Education, 95", True),
            (", 309–327. https://doi.org/10.1016/j.compedu.2016.02.002", False),
        ),
        (
            ("Pounds, P., Mahony, R., & Corke, P. (2010). Modelling and control of a large quadrotor robot. ", False),
            ("Control Engineering Practice, 18", True),
            ("(7), 691–699. https://doi.org/10.1016/j.conengprac.2010.02.008", False),
        ),
        (
            ("React Team. (n.d.). ", False),
            ("Quick start", True),
            (". React. Retrieved August 26, 2026, from https://react.dev/learn", False),
        ),
        (
            ("Three.js Authors. (n.d.). ", False),
            ("Fundamentals", True),
            (". Three.js manual. Retrieved August 26, 2026, from https://threejs.org/manual/en/fundamentals.html", False),
        ),
        (
            ("Vite Contributors. (n.d.). ", False),
            ("Getting started", True),
            (". Vite. Retrieved August 26, 2026, from https://vite.dev/guide/", False),
        ),
        (
            ("Wahyudi, M. N. A., Budiyanto, C. W., Widiastuti, I., Hatta, P., & Bakar, M. S. (2023). Understanding virtual laboratories in engineering education: A systematic literature review. ", False),
            ("International Journal of Pedagogy and Teacher Education, 7", True),
            ("(2), 102–118. https://doi.org/10.20961/ijpte.v7i2.85271", False),
        ),
        (
            ("WHATWG. (n.d.). ", False),
            ("HTML standard: The iframe element", True),
            (". Retrieved August 26, 2026, from https://html.spec.whatwg.org/multipage/iframe-embed-object.html#the-iframe-element", False),
        ),
        (
            ("Yang, C., Zhang, J., Hu, Y., Yang, X., Chen, M., Shan, M., & Li, L. (2024). The impact of virtual reality on practical skills for students in science and engineering education: A meta-analysis. ", False),
            ("International Journal of STEM Education, 11", True),
            (", Article 28. https://doi.org/10.1186/s40594-024-00487-2", False),
        ),
        (
            ("Zontou, E., Kaminaris, S., & Rangoussi, M. (2024). On the role of virtual reality in engineering education: A systematic literature review of experimental research (2011–2022). ", False),
            ("European Journal of Engineering Education, 49", True),
            ("(5), 856–888. https://doi.org/10.1080/03043797.2024.2369188", False),
        ),
    )
    for reference in references:
        add_reference(doc, reference)


def create_report() -> Path:
    doc = Document()
    configure_section(doc.sections[0])
    doc.sections[0].footer.is_linked_to_previous = False
    define_styles(doc)
    add_update_fields_setting(doc)

    props = doc.core_properties
    props.title = "Design and Implementation of a Web-Based Virtual Laboratory for Engineering Learning Management System"
    props.subject = "Final Year Project Report"
    props.author = "Ella Victor Adakole"
    props.last_modified_by = "Ella Victor Adakole"
    props.keywords = "virtual laboratory, quadrotor, PID control, Vite, LMS, iframe"
    props.comments = "Supervisor-corrected consolidated report."

    add_front_matter(doc)

    main_section = doc.add_section(WD_SECTION.NEW_PAGE)
    configure_section(main_section)
    main_section.footer.is_linked_to_previous = False
    set_page_number_format(main_section, fmt="decimal", start=1)
    add_page_number(main_section)

    add_chapter_one(doc)
    add_chapter_two(doc)
    add_chapter_three(doc)
    add_chapter_four(doc)
    add_chapter_five(doc)
    add_references(doc)

    OUTPUT_DOCX.parent.mkdir(parents=True, exist_ok=True)
    doc.save(OUTPUT_DOCX)
    return OUTPUT_DOCX


if __name__ == "__main__":
    output = create_report()
    print(output)
