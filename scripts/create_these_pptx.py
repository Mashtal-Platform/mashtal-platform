#!/usr/bin/env python3
"""
Soutenance GLP-1 & Parkinson — version colorée + images (~30 slides).
"""

from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE
import os

# --- Palette plus colorée (médical / moderne, sans violet générique) ---
NAVY = RGBColor(0x0A, 0x3D, 0x4F)
TEAL = RGBColor(0x14, 0x8A, 0x96)
TEAL_LT = RGBColor(0x2E, 0xB8, 0xC4)
MINT = RGBColor(0xE8, 0xF7, 0xF5)
CORAL = RGBColor(0xE8, 0x6A, 0x4E)
CORAL_DK = RGBColor(0xC4, 0x4E, 0x35)
GOLD = RGBColor(0xE8, 0xA8, 0x2E)
GOLD_DK = RGBColor(0xC4, 0x86, 0x18)
SKY = RGBColor(0x3A, 0x9B, 0xD9)
GREEN = RGBColor(0x2F, 0x9E, 0x6E)
GREEN_DK = RGBColor(0x1F, 0x7A, 0x54)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
DARK = RGBColor(0x1A, 0x28, 0x2E)
MUTED = RGBColor(0x4A, 0x60, 0x68)
SOFT = RGBColor(0xF0, 0xF8, 0xF7)
ROW_ALT = RGBColor(234, 245, 243)
CREAM = RGBColor(255, 248, 240)

SLIDE_W = Inches(13.333)
SLIDE_H = Inches(7.5)
TOTAL = 30
ASSETS = "/workspace/docs/presentation/assets"


def set_run(run, size=16, bold=False, color=DARK, font="Calibri"):
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.color.rgb = color
    run.font.name = font


def add_bg(slide, color):
    shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, SLIDE_W, SLIDE_H)
    shape.fill.solid()
    shape.fill.fore_color.rgb = color
    shape.line.fill.background()
    spTree = slide.shapes._spTree
    sp = shape._element
    spTree.remove(sp)
    spTree.insert(2, sp)


def add_rect(slide, left, top, width, height, fill):
    shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, top, width, height)
    shape.fill.solid()
    shape.fill.fore_color.rgb = fill
    shape.line.fill.background()
    return shape


def add_round(slide, left, top, width, height, fill):
    shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
    shape.fill.solid()
    shape.fill.fore_color.rgb = fill
    shape.line.fill.background()
    try:
        shape.adjustments[0] = 0.1
    except Exception:
        pass
    return shape


def add_textbox(slide, left, top, width, height, text, size=16, bold=False,
                color=DARK, align=PP_ALIGN.LEFT, font="Calibri"):
    box = slide.shapes.add_textbox(left, top, width, height)
    tf = box.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.alignment = align
    run = p.add_run()
    run.text = text
    set_run(run, size=size, bold=bold, color=color, font=font)
    return box


def add_bullets(slide, left, top, width, height, items, size=13, color=DARK, spacing=5):
    box = slide.shapes.add_textbox(left, top, width, height)
    tf = box.text_frame
    tf.word_wrap = True
    for i, item in enumerate(items):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = PP_ALIGN.LEFT
        p.space_after = Pt(spacing)
        run = p.add_run()
        if isinstance(item, tuple):
            run.text = "●  " + item[0]
            set_run(run, size=size, bold=True, color=color)
            run2 = p.add_run()
            run2.text = item[1]
            set_run(run2, size=size, bold=False, color=MUTED)
        else:
            run.text = "●  " + item
            set_run(run, size=size, color=color)
    return box


def add_footer(slide, page, total=TOTAL):
    add_rect(slide, 0, Inches(7.12), SLIDE_W, Inches(0.38), NAVY)
    add_rect(slide, 0, Inches(7.12), Inches(0.25), Inches(0.38), CORAL)
    add_textbox(slide, Inches(0.4), Inches(7.16), Inches(10.2), Inches(0.28),
                "Agonistes du GLP-1  ·  Parkinson  ·  Soutenance",
                size=10, color=WHITE)
    add_textbox(slide, Inches(11.4), Inches(7.16), Inches(1.6), Inches(0.28),
                f"{page} / {total}", size=10, bold=True, color=TEAL_LT, align=PP_ALIGN.RIGHT)


def header(slide, kicker, title, color=NAVY, accent=CORAL):
    add_bg(slide, MINT)
    add_rect(slide, 0, 0, SLIDE_W, Inches(1.2), color)
    add_rect(slide, 0, 0, Inches(0.16), Inches(1.2), accent)
    add_rect(slide, 0, Inches(1.2), SLIDE_W, Inches(0.08), TEAL_LT)
    add_textbox(slide, Inches(0.4), Inches(0.18), Inches(12.5), Inches(0.28),
                kicker.upper(), size=11, bold=True, color=TEAL_LT)
    add_textbox(slide, Inches(0.4), Inches(0.48), Inches(12.5), Inches(0.5),
                title, size=24, bold=True, color=WHITE, font="Georgia")


def card(slide, left, top, width, height, title, bullets, header_color=TEAL, body_size=12):
    add_round(slide, left, top, width, height, WHITE)
    add_rect(slide, left, top, width, Inches(0.42), header_color)
    add_textbox(slide, left + Inches(0.14), top + Inches(0.06), width - Inches(0.28), Inches(0.32),
                title, size=12, bold=True, color=WHITE)
    add_bullets(slide, left + Inches(0.14), top + Inches(0.52),
                width - Inches(0.28), height - Inches(0.6),
                bullets, size=body_size, spacing=4)


def kpi(slide, left, top, width, height, value, label, sub=None, bg=TEAL):
    add_round(slide, left, top, width, height, bg)
    add_textbox(slide, left + Inches(0.1), top + Inches(0.2), width - Inches(0.2), Inches(0.55),
                value, size=26, bold=True, color=WHITE, align=PP_ALIGN.CENTER, font="Georgia")
    add_textbox(slide, left + Inches(0.1), top + Inches(0.8), width - Inches(0.2), Inches(0.4),
                label, size=12, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
    if sub:
        add_textbox(slide, left + Inches(0.1), top + Inches(1.2), width - Inches(0.2), Inches(0.35),
                    sub, size=11, color=RGBColor(0xE0, 0xF5, 0xF0), align=PP_ALIGN.CENTER)


def add_img(slide, path, left, top, width, height=None):
    if not os.path.exists(path):
        add_round(slide, left, top, width, height or Inches(3), SOFT)
        return None
    if height:
        return slide.shapes.add_picture(path, left, top, width=width, height=height)
    return slide.shapes.add_picture(path, left, top, width=width)


def add_table(slide, left, top, width, rows, col_widths, font_size=11, row_h=0.4):
    n_rows, n_cols = len(rows), len(rows[0])
    table_shape = slide.shapes.add_table(
        n_rows, n_cols, left, top, width, Inches(row_h * n_rows)
    )
    table = table_shape.table
    for i, w in enumerate(col_widths):
        table.columns[i].width = w
    header_colors = [NAVY, TEAL, CORAL_DK, GREEN_DK, GOLD_DK]
    for r, row in enumerate(rows):
        for c, cell_text in enumerate(row):
            cell = table.cell(r, c)
            cell.text = ""
            p = cell.text_frame.paragraphs[0]
            run = p.add_run()
            run.text = str(cell_text)
            is_header = r == 0
            set_run(run, size=font_size, bold=is_header,
                    color=WHITE if is_header else DARK)
            cell.fill.solid()
            if is_header:
                cell.fill.fore_color.rgb = header_colors[c % len(header_colors)] if False else NAVY
            elif r % 2 == 0:
                cell.fill.fore_color.rgb = ROW_ALT
            else:
                cell.fill.fore_color.rgb = WHITE
    # colorful header strip via first row already navy; add coral accent on first col header feel via content
    return table_shape


def section_divider(prs, blank, num, title, subtitle, page, accent=CORAL):
    s = prs.slides.add_slide(blank)
    add_bg(s, NAVY)
    add_rect(s, 0, 0, Inches(0.25), SLIDE_H, accent)
    add_rect(s, Inches(0.25), 0, Inches(0.08), SLIDE_H, TEAL_LT)
    add_round(s, Inches(1.0), Inches(2.0), Inches(1.4), Inches(0.55), accent)
    add_textbox(s, Inches(1.0), Inches(2.08), Inches(1.4), Inches(0.4),
                f"PARTIE {num}", size=12, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
    add_textbox(s, Inches(1.0), Inches(2.8), Inches(11), Inches(1.3),
                title, size=34, bold=True, color=WHITE, font="Georgia")
    add_textbox(s, Inches(1.0), Inches(4.3), Inches(11), Inches(0.8),
                subtitle, size=16, color=TEAL_LT)
    add_textbox(s, Inches(1.0), Inches(6.5), Inches(11), Inches(0.3),
                f"{page} / {TOTAL}", size=11, color=RGBColor(0x7A, 0xA8, 0xB0))
    return s


def img_text_slide(prs, blank, kicker, title, img_name, bullets, page,
                   header_color=NAVY, card_color=TEAL, img_left=True):
    s = prs.slides.add_slide(blank)
    header(s, kicker, title, color=header_color)
    img = os.path.join(ASSETS, img_name)
    if img_left:
        add_round(s, Inches(0.3), Inches(1.45), Inches(6.5), Inches(5.4), WHITE)
        add_img(s, img, Inches(0.45), Inches(1.6), Inches(6.2), Inches(5.1))
        card(s, Inches(7.0), Inches(1.45), Inches(5.95), Inches(5.4),
             "Points clés", bullets, card_color, body_size=13)
    else:
        card(s, Inches(0.3), Inches(1.45), Inches(5.95), Inches(5.4),
             "Points clés", bullets, card_color, body_size=13)
        add_round(s, Inches(6.45), Inches(1.45), Inches(6.5), Inches(5.4), WHITE)
        add_img(s, img, Inches(6.6), Inches(1.6), Inches(6.2), Inches(5.1))
    add_footer(s, page)
    return s


def build():
    prs = Presentation()
    prs.slide_width = SLIDE_W
    prs.slide_height = SLIDE_H
    blank = prs.slide_layouts[6]
    p = 0

    # 1 TITLE ----------------------------------------------------------------
    p += 1
    s = prs.slides.add_slide(blank)
    add_bg(s, NAVY)
    add_rect(s, 0, 0, Inches(0.22), SLIDE_H, CORAL)
    add_rect(s, Inches(0.22), 0, Inches(0.08), SLIDE_H, GOLD)
    add_img(s, os.path.join(ASSETS, "01_parkinson_brain.png"),
            Inches(7.2), Inches(1.2), Inches(5.7), Inches(4.2))
    add_textbox(s, Inches(0.6), Inches(1.3), Inches(6.3), Inches(0.35),
                "SOUTENANCE DE THÈSE  ·  PHARMACIE", size=13, bold=True, color=TEAL_LT)
    add_textbox(s, Inches(0.6), Inches(1.85), Inches(6.5), Inches(2.4),
                "Agonistes du GLP-1 :\nMise au point et potentiel\nprometteur pour la maladie\nde Parkinson",
                size=26, bold=True, color=WHITE, font="Georgia")
    add_round(s, Inches(0.6), Inches(5.0), Inches(6.3), Inches(1.5), TEAL)
    add_textbox(s, Inches(0.85), Inches(5.25), Inches(5.9), Inches(1.1),
                "Physiologie  ·  Pharmacologie  ·  Cardio-rénal\nNeuroprotection  ·  LIXIPARK  ·  Rôle du pharmacien",
                size=14, color=WHITE)

    # 2 PLAN -----------------------------------------------------------------
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Organisation", "Plan coloré de la présentation", color=NAVY, accent=GOLD)
    parts = [
        ("A", "Contexte", "Parkinson & besoin", CORAL),
        ("B", "Chapitre 1", "GLP-1 & agonistes", TEAL),
        ("C", "Chapitre 2", "DT2 · obésité · CV", SKY),
        ("D", "Chapitre 3", "Parkinson & preuves", GREEN),
        ("E", "Conclusion", "Messages clés", GOLD_DK),
    ]
    for i, (n, t, d, col) in enumerate(parts):
        x = Inches(0.35) + Inches(i * 2.55)
        add_round(s, x, Inches(1.7), Inches(2.4), Inches(4.8), WHITE)
        add_rect(s, x, Inches(1.7), Inches(2.4), Inches(1.4), col)
        add_textbox(s, x, Inches(1.9), Inches(2.4), Inches(0.45),
                    n, size=28, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
        add_textbox(s, x + Inches(0.1), Inches(2.45), Inches(2.2), Inches(0.45),
                    t, size=14, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
        add_textbox(s, x + Inches(0.15), Inches(3.5), Inches(2.1), Inches(2.2),
                    d + "\n\nIdées claires\nsans zones vides\nvisuels ciblés",
                    size=13, color=DARK, align=PP_ALIGN.CENTER)
    add_footer(s, p)

    # 3 OBJECTIVES -----------------------------------------------------------
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Objectifs", "Quatre objectifs — une lecture de pharmacien", accent=TEAL_LT)
    objs = [
        ("1", "Physiologie & pharmacologie", "GLP-1, GLP-1R, panorama des agonistes", CORAL),
        ("2", "Indications validées", "DT2, obésité, protection cardio-rénale", TEAL),
        ("3", "Repositionnement Parkinson", "Mécanismes, préclinique, LIXIPARK", GREEN),
        ("4", "Rôle du pharmacien", "Éducation, vigilance, coordination", GOLD_DK),
    ]
    for i, (n, t, d, col) in enumerate(objs):
        y = Inches(1.55) + Inches(i * 1.25)
        add_round(s, Inches(0.35), y, Inches(12.6), Inches(1.1), WHITE)
        add_rect(s, Inches(0.35), y, Inches(1.0), Inches(1.1), col)
        add_textbox(s, Inches(0.35), y + Inches(0.28), Inches(1.0), Inches(0.55),
                    n, size=26, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
        add_textbox(s, Inches(1.6), y + Inches(0.2), Inches(10.8), Inches(0.35),
                    t, size=17, bold=True, color=NAVY, font="Georgia")
        add_textbox(s, Inches(1.6), y + Inches(0.58), Inches(10.8), Inches(0.35),
                    d, size=13, color=MUTED)
    add_footer(s, p)

    # 4 DIVIDER A ------------------------------------------------------------
    p += 1
    section_divider(prs, blank, "A", "Contexte & besoin médical",
                    "Parkinson : fardeau, physiopathologie, impasse thérapeutique", p, CORAL)

    # 5 PARKINSON + IMAGE ----------------------------------------------------
    p += 1
    img_text_slide(
        prs, blank, "Contexte", "La maladie de Parkinson : un enjeu majeur",
        "01_parkinson_brain.png",
        ["2ᵉ maladie neurodégénérative (après Alzheimer)",
         "Prévalence en forte hausse (×2–3 attendu)",
         "Handicap moteur + symptômes non moteurs",
         "Impact médical, social et économique majeur",
         "Besoin urgent de stratégies neuroprotectrices",
         "Traitements actuels = symptomatiques seuls"],
        p, NAVY, CORAL, img_left=True
    )

    # 6 PHYSIOPATHO ----------------------------------------------------------
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Contexte", "Physiopathologie multifactorielle", accent=GOLD)
    items = [
        ("α-synucléine", "Agrégation & propagation", CORAL),
        ("Mitochondries", "Dysfonction & ROS", TEAL),
        ("Stress oxydatif", "Lésions cumulatives", GOLD_DK),
        ("Neuroinflammation", "Microglie activée", SKY),
        ("Autophagie", "Dégradation altérée", GREEN),
        ("Gènes & environnement", "Susceptibilité", CORAL_DK),
    ]
    for i, (t, d, col) in enumerate(items):
        col_i, row = i % 3, i // 3
        x = Inches(0.35) + Inches(col_i * 4.25)
        y = Inches(1.55) + Inches(row * 2.55)
        add_round(s, x, y, Inches(4.05), Inches(2.35), WHITE)
        add_rect(s, x, y, Inches(4.05), Inches(0.55), col)
        add_textbox(s, x + Inches(0.2), y + Inches(0.12), Inches(3.65), Inches(0.35),
                    t, size=15, bold=True, color=WHITE)
        add_textbox(s, x + Inches(0.2), y + Inches(0.9), Inches(3.65), Inches(1.1),
                    d + "\n\nCible potentielle des agonistes du GLP-1R",
                    size=13, color=DARK)
    add_footer(s, p)

    # 7 TREATMENTS -----------------------------------------------------------
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Contexte", "Traitements actuels : efficaces… mais limités", accent=CORAL)
    rows = [
        ["Classe", "Rôle", "Limite"],
        ["Lévodopa (± ICOMT)", "Référence motrice", "Fluctuations, dyskinésies"],
        ["Agonistes dopaminergiques", "Symptômes moteurs", "EI neuropsychiatriques"],
        ["IMAO-B", "Potentialisation DA", "Effet symptomatique seul"],
        ["Amantadine", "Dyskinésies", "Pas d’effet modificateur"],
        ["Thérapies avancées", "Stades compliqués", "Invasives, sélection"],
    ]
    add_table(s, Inches(0.35), Inches(1.5), Inches(12.6), rows,
              [Inches(3.4), Inches(4.2), Inches(5.0)], font_size=13, row_h=0.55)
    add_round(s, Inches(0.35), Inches(5.3), Inches(12.6), Inches(1.4), CORAL)
    add_textbox(s, Inches(0.6), Inches(5.55), Inches(12.1), Inches(0.9),
                "Message clé : améliorer les symptômes ≠ freiner la neurodégénérescence.\nD’où l’intérêt du repositionnement des agonistes du GLP-1.",
                size=15, bold=True, color=WHITE)
    add_footer(s, p)

    # 8 REPOSITIONING --------------------------------------------------------
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Contexte", "Repositionnement : une stratégie intelligente", accent=GREEN)
    card(s, Inches(0.35), Inches(1.5), Inches(6.2), Inches(5.2),
         "Pourquoi repositionner ?",
         [("PK/PD connues", " — données déjà disponibles"),
          ("Tolérance documentée", " — classe mature"),
          ("Développement accéléré", " — vs molécule de novo"),
          ("Pertinent en neuro", " — nombreux échecs d’innovations"),
          ("GLP-1R au SNC", " — cible accessible")],
         TEAL, 13)
    card(s, Inches(6.8), Inches(1.5), Inches(6.15), Inches(5.2),
         "Pourquoi le GLP-1 ici ?",
         [("Anti-inflammatoire", " — modèles expérimentaux"),
          ("Anti-oxydant", " — survie cellulaire"),
          ("Anti-apoptotique", " — voies PI3K/Akt"),
          ("Cibles PD chevauchantes", " — mitochondries, α-syn…"),
          ("Essais humains", " — exénatide, LIXIPARK…")],
         CORAL, 13)
    add_footer(s, p)

    # 9 DIVIDER B ------------------------------------------------------------
    p += 1
    section_divider(prs, blank, "B", "Chapitre 1 — Physiologie & pharmacologie",
                    "Du GLP-1 endogène aux agonistes modernes", p, TEAL)

    # 10 PHYSIO + IMAGE ------------------------------------------------------
    p += 1
    img_text_slide(
        prs, blank, "Chapitre 1", "Physiologie du GLP-1 (hormone incrétine)",
        "02_glp1_physiology.png",
        ["Produit par les cellules L (iléon / côlon)",
         "Issu du clivage du proglucagon",
         "Formes actives : (7-36)amide & (7-37)",
         "Sécrétion stimulée par les nutriments",
         "Effet incrétine glucose-dépendant",
         "Demi-vie très courte : 1–2 min (DPP-4)",
         "→ Besoin d’agonistes résistants à la DPP-4"],
        p, TEAL, CORAL, img_left=True
    )

    # 11 RECEPTOR + IMAGE ----------------------------------------------------
    p += 1
    img_text_slide(
        prs, blank, "Chapitre 1", "Récepteur GLP-1R & signalisation",
        "03_receptor_signaling.png",
        ["GPCR classe B (463 acides aminés)",
         "Pancréas β, cœur, rein, tube digestif",
         "SNC : hypothalamus, tronc, hippocampe…",
         "Gs → AMPc → PKA / EPAC2",
         "PI3K/Akt : anti-apoptose",
         "MAPK/ERK : réparation / plasticité",
         "Au cerveau → effets neuroprotecteurs"],
        p, NAVY, TEAL, img_left=False
    )

    # 12 SHORT VS LONG + IMAGE -----------------------------------------------
    p += 1
    img_text_slide(
        prs, blank, "Chapitre 1", "Courte vs longue durée d’action",
        "04_agonists_compare.png",
        ["Courte : exénatide, lixisénatide",
         "→ stimulation intermittente",
         "→ fort effet sur vidange gastrique",
         "→ contrôle postprandial marqué",
         "Longue : lira, dula, séma, tirzépatide",
         "→ exposition continue du récepteur",
         "→ meilleur contrôle jeûne / HbA1c"],
        p, CORAL_DK, TEAL, img_left=True
    )

    # 13 TABLE MOLECULES -----------------------------------------------------
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Chapitre 1", "Panorama des agonistes — comparaison claire", accent=GOLD)
    rows = [
        ["Molécule", "Profil", "Admin.", "Particularité"],
        ["Exénatide", "Courte", "2×/j ou LP", "Exendine-4 · essais PD"],
        ["Lixisénatide", "Courte", "1×/j", "LIXIPARK · postprandial"],
        ["Liraglutide", "Longue", "1×/j", "DT2 + obésité · LEADER"],
        ["Dulaglutide", "Longue", "1×/sem.", "REWIND (CV)"],
        ["Sémaglutide", "Longue", "1×/sem. / oral", "STEP · SUSTAIN-6 · PD"],
        ["Tirzépatide", "GIP/GLP-1", "1×/sem.", "Puissance métabolique ++"],
    ]
    add_table(s, Inches(0.3), Inches(1.5), Inches(12.7), rows,
              [Inches(2.3), Inches(2.2), Inches(2.8), Inches(5.4)], font_size=13, row_h=0.55)
    add_round(s, Inches(0.3), Inches(5.9), Inches(12.7), Inches(0.85), TEAL)
    add_textbox(s, Inches(0.5), Inches(6.1), Inches(12.3), Inches(0.5),
                "Structure différente → demi-vie, immunogénicité et accès au SNC variables.",
                size=14, bold=True, color=WHITE)
    add_footer(s, p)

    # 14 MECHANISMS METABOLIC ------------------------------------------------
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Chapitre 1", "Mécanismes d’action métaboliques", accent=SKY)
    acts = [
        ("↑ Insuline", "Glucose-dépendante → peu d’hypoglycémies", TEAL),
        ("↓ Glucagon", "Moins de production hépatique de glucose", CORAL),
        ("Vidange gastrique", "Ralentie (surtout courte durée)", GOLD_DK),
        ("Satiété centrale", "↓ appétit → perte de poids", GREEN),
        ("Cellules β", "Survie / fonction préservées", SKY),
        ("Effets pléiotropes", "Vasculaire, rénal, inflammatoire", CORAL_DK),
    ]
    for i, (t, d, col) in enumerate(acts):
        col_i, row = i % 3, i // 3
        x = Inches(0.35) + Inches(col_i * 4.25)
        y = Inches(1.55) + Inches(row * 2.55)
        add_round(s, x, y, Inches(4.05), Inches(2.35), WHITE)
        add_rect(s, x, y, Inches(4.05), Inches(0.55), col)
        add_textbox(s, x + Inches(0.2), y + Inches(0.12), Inches(3.65), Inches(0.35),
                    t, size=15, bold=True, color=WHITE)
        add_textbox(s, x + Inches(0.2), y + Inches(0.9), Inches(3.65), Inches(1.1),
                    d, size=14, color=DARK)
    add_footer(s, p)

    # 15 DIVIDER C -----------------------------------------------------------
    p += 1
    section_divider(prs, blank, "C", "Chapitre 2 — Indications validées",
                    "Diabète, obésité et protection cardio-rénale", p, SKY)

    # 16 DT2 -----------------------------------------------------------------
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Chapitre 2", "Diabète de type 2 : place majeure", accent=TEAL)
    kpi(s, Inches(0.35), Inches(1.5), Inches(4.0), Inches(1.7), "0,8–1,8%", "↓ HbA1c", "selon molécule / dose", TEAL)
    kpi(s, Inches(4.55), Inches(1.5), Inches(4.0), Inches(1.7), "ADA/EASD", "Classe prioritaire", "surtout si risque CV/MRC", CORAL)
    kpi(s, Inches(8.75), Inches(1.5), Inches(4.2), Inches(1.7), "Faible", "Hypoglycémie", "en monothérapie", GREEN)
    card(s, Inches(0.35), Inches(3.5), Inches(6.2), Inches(3.2),
         "Rationnel",
         ["Diminution de l’effet incrétine dans le DT2",
          "Agonistes = incrétine pharmacologique durable",
          "Courte durée → postprandial",
          "Longue durée → jeûne + HbA1c"],
         TEAL)
    card(s, Inches(6.8), Inches(3.5), Inches(6.15), Inches(3.2),
         "Lecture pratique",
         ["Après mesures hygiéno-diététiques ± metformine",
          "Précoce si MCV / MRC / haut risque CV",
          "Sémaglutide & tirzépatide très puissants",
          "Bénéfice poids concomitant"],
         CORAL)
    add_footer(s, p)

    # 17 WEIGHT --------------------------------------------------------------
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Chapitre 2", "Obésité : un changement de paradigme", accent=GOLD)
    kpi(s, Inches(0.35), Inches(1.5), Inches(4.0), Inches(1.85), "~15%", "Sémaglutide (STEP)", "perte de poids moyenne", TEAL)
    kpi(s, Inches(4.55), Inches(1.5), Inches(4.0), Inches(1.85), "3 mg", "Liraglutide (SCALE)", "bénéfice durable", CORAL)
    kpi(s, Inches(8.75), Inches(1.5), Inches(4.2), Inches(1.85), "++", "Tirzépatide", "souvent > sélectifs", GOLD_DK)
    card(s, Inches(0.35), Inches(3.65), Inches(6.2), Inches(3.05),
         "Comment ça marche ?",
         ["↓ appétit / ↑ satiété (action centrale)",
          "Réduction des apports alimentaires",
          "Amélioration sensibilité à l’insuline",
          "Impact sur syndrome métabolique"],
         TEAL)
    card(s, Inches(6.8), Inches(3.65), Inches(6.15), Inches(3.05),
         "Conseil pharmacien",
         ["Titration progressive = adhésion",
          "EI digestifs = 1ʳᵉ cause d’arrêt",
          "Éducation injection / conservation",
          "Hydratation & repas légers"],
         CORAL)
    add_footer(s, p)

    # 18 CARDIORENAL + IMAGE -------------------------------------------------
    p += 1
    img_text_slide(
        prs, blank, "Chapitre 2", "Cardioprotection & néphroprotection",
        "05_cardiorenal.png",
        ["LEADER (liraglutide) : ↓ MACE & mortalité",
         "SUSTAIN-6 (sémaglutide) : ↓ MACE + signal rénal",
         "REWIND (dulaglutide) : bénéfice CV",
         "Effet au-delà de l’HbA1c",
         "Mécanismes : poids, PA, lipides, inflammation",
         "Intérêt fort si risque CV / MRC"],
        p, SKY, GREEN, img_left=True
    )

    # 19 SAFETY --------------------------------------------------------------
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Chapitre 2", "Tolérance & sécurité — vigilance pharmacienne", accent=CORAL)
    card(s, Inches(0.3), Inches(1.5), Inches(4.15), Inches(5.2),
         "Fréquents",
         ["Nausées / vomissements",
          "Diarrhées",
          "Début de traitement / ↑ dose",
          "Souvent transitoires",
          "Titration lente = clé"],
         CORAL)
    card(s, Inches(4.6), Inches(1.5), Inches(4.15), Inches(5.2),
         "À anticiper",
         ["Hypoglycémie si insuline/sulfamides",
          "Pancréatite (signes d’alerte)",
          "Complications biliaires",
          "Contre-indications spécifiques",
          "Déclaration pharmacovigilance"],
         GOLD_DK)
    card(s, Inches(8.9), Inches(1.5), Inches(4.1), Inches(5.2),
         "Messages rassurants",
         ["Classe mature",
          "Grands essais de sécurité",
          "Profil globalement favorable",
          "Information claire du patient",
          "Traçabilité des EI"],
         GREEN)
    add_footer(s, p)

    # 20 DIVIDER D -----------------------------------------------------------
    p += 1
    section_divider(prs, blank, "D", "Chapitre 3 — Parkinson & repositionnement",
                    "Mécanismes, preuves et rôle du pharmacien", p, GREEN)

    # 21 WHY PD TABLE --------------------------------------------------------
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Chapitre 3", "Pourquoi le GLP-1 dans la Parkinson ?", accent=GREEN)
    rows = [
        ["Mécanisme PD", "Modulation GLP-1", "Preuve"],
        ["Neuroinflammation", "↓ microglie / médiateurs", "Préclinique ++"],
        ["Stress oxydatif", "↓ ROS, intégrité cellulaire", "Préclinique ++"],
        ["Mitochondries", "Soutien énergétique", "Préclinique +"],
        ["Apoptose", "Voies de survie (Akt, PKA)", "Préclinique ++"],
        ["α-synucléine", "Autophagie / clairance", "Exploratoire"],
        ["Neurones DA", "Préservation (modèles)", "Préclin. → clin. hétérogène"],
    ]
    add_table(s, Inches(0.3), Inches(1.45), Inches(12.7), rows,
              [Inches(3.2), Inches(5.3), Inches(4.2)], font_size=12, row_h=0.58)
    add_footer(s, p)

    # 22 NEURO + IMAGE -------------------------------------------------------
    p += 1
    img_text_slide(
        prs, blank, "Chapitre 3", "Mécanismes neuroprotecteurs putatifs",
        "06_neuroprotection.png",
        ["cAMP / PKA / EPAC → survie neuronale",
         "PI3K / Akt → anti-apoptose",
         "MAPK / ERK → réparation",
         "↓ neuroinflammation microgliale",
         "Soutien mitochondrial / ↓ oxydatif",
         "Autophagie → ↓ α-synucléine (hypothèse)",
         "Plausibilité biologique forte"],
        p, GREEN_DK, TEAL, img_left=True
    )

    # 23 PRECLINICAL ---------------------------------------------------------
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Chapitre 3", "Données précliniques convergentes", accent=TEAL)
    rows = [
        ["Molécule", "Observations (MPTP / 6-OHDA)"],
        ["Exénatide", "Préservation neurones DA · ↓ oxydatif · ↓ inflammation"],
        ["Liraglutide", "Amélioration motrice · protection neuronale"],
        ["Lixisénatide", "Intérêt pénétration / action centrale"],
        ["Sémaglutide", "Survie · autophagie · ↓ agrégation α-syn"],
    ]
    add_table(s, Inches(0.35), Inches(1.5), Inches(12.6), rows,
              [Inches(2.6), Inches(10.0)], font_size=13, row_h=0.65)
    add_round(s, Inches(0.35), Inches(5.3), Inches(12.6), Inches(1.4), CORAL)
    add_textbox(s, Inches(0.6), Inches(5.55), Inches(12.1), Inches(0.9),
                "Attention : la plausibilité animale ne garantit pas le succès clinique.\nLe passage modèle → humain reste l’obstacle majeur.",
                size=14, bold=True, color=WHITE)
    add_footer(s, p)

    # 24 EXENATIDE -----------------------------------------------------------
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Chapitre 3 — Clinique", "Exénatide : espoir puis déception (phase III)", accent=CORAL)
    card(s, Inches(0.35), Inches(1.5), Inches(6.2), Inches(5.2),
         "Ce qui a nourri l’espoir",
         ["Études ouvertes encourageantes",
          "Essai contrôlé initial positif",
          "Bonne tolérance",
          "Rationnel préclinique solide",
          "Classe déjà connue"],
         TEAL)
    card(s, Inches(6.8), Inches(1.5), Inches(6.15), Inches(5.2),
         "Ce que la phase III a montré",
         ["Pas de bénéfice significatif sur progression",
          "Déception pour le champ",
          "N’invalide pas toute la classe",
          "Limites : sélection, durée, BHE ?",
          "Leçon : signal ≠ preuve définitive"],
         CORAL)
    add_footer(s, p)

    # 25 LIXIPARK + IMAGE ----------------------------------------------------
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Chapitre 3 — Clinique", "LIXIPARK (lixisénatide) — signal le plus fort", accent=GREEN)
    add_round(s, Inches(0.3), Inches(1.45), Inches(6.3), Inches(3.3), WHITE)
    add_img(s, os.path.join(ASSETS, "07_clinical_trial.png"),
            Inches(0.4), Inches(1.55), Inches(6.1), Inches(3.1))
    kpi(s, Inches(6.85), Inches(1.45), Inches(3.0), Inches(1.5), "Précoce", "Stade PD", bg=TEAL)
    kpi(s, Inches(10.05), Inches(1.45), Inches(2.95), Inches(1.5), "Stable", "Scores moteurs", bg=GREEN)
    kpi(s, Inches(6.85), Inches(3.15), Inches(6.15), Inches(1.6), "Washout +", "Effet persistant → au-delà du purement symptomatique ?", bg=CORAL)
    add_round(s, Inches(0.3), Inches(4.95), Inches(12.7), Inches(1.75), NAVY)
    add_textbox(s, Inches(0.55), Inches(5.15), Inches(12.2), Inches(1.35),
                "Lecture critique : stabilisation motrice vs aggravation placebo + persistance après washout.\nQuestions : durabilité long terme, tolérance digestive, généralisabilité — pas encore une indication neurologique.",
                size=14, color=WHITE)
    add_footer(s, p)

    # 26 SYNTHESIS -----------------------------------------------------------
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Chapitre 3 — Clinique", "Synthèse des essais : classe hétérogène", accent=GOLD)
    rows = [
        ["Molécule / essai", "Design", "Résultat"],
        ["Exénatide", "Ouvert → ph. III", "Signal non confirmé"],
        ["Lixisénatide (LIXIPARK)", "Contrôlé, PD précoce", "Stabilisation + washout"],
        ["Sémaglutide", "Essais en cours", "Résultats attendus"],
        ["Autres / dérivés", "Exploration", "Meilleure pénétration SNC ?"],
    ]
    add_table(s, Inches(0.3), Inches(1.5), Inches(12.7), rows,
              [Inches(3.5), Inches(3.5), Inches(5.7)], font_size=13, row_h=0.7)
    add_round(s, Inches(0.3), Inches(5.5), Inches(12.7), Inches(1.2), TEAL)
    add_textbox(s, Inches(0.5), Inches(5.75), Inches(12.3), Inches(0.7),
                "La plausibilité de classe est réelle, mais l’efficacité dépend de la molécule, du stade, de la BHE et du design.",
                size=14, bold=True, color=WHITE)
    add_footer(s, p)

    # 27 LIMITS --------------------------------------------------------------
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Chapitre 3 — Discussion", "Limites & questions ouvertes", accent=CORAL)
    card(s, Inches(0.35), Inches(1.5), Inches(6.2), Inches(5.2),
         "Limites des essais",
         ["Peu d’études, tailles modestes",
          "Durées courtes vs maladie lente",
          "Critères moteurs ≠ neuroprotection prouvée",
          "Symptomatique vs modificateur ?",
          "Populations / stades hétérogènes"],
         CORAL)
    card(s, Inches(6.8), Inches(1.5), Inches(6.15), Inches(5.2),
         "Questions pharmacologiques",
         ["Passage BHE variable",
          "Structure (exendine vs GLP-1 humain)",
          "Dose neurologique ≠ dose métabolique ?",
          "Biomarqueurs de sélection manquants",
          "Besoin d’essais plus larges / longs"],
         NAVY)
    add_footer(s, p)

    # 28 PERSPECTIVES --------------------------------------------------------
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Chapitre 3 — Perspectives", "Où va la recherche ?", accent=SKY)
    pers = [
        ("1", "Stade précoce", "Avant perte neuronale trop avancée", TEAL),
        ("2", "Biomarqueurs", "Sélectionner les meilleurs répondeurs", CORAL),
        ("3", "Essais longs", "Prouver un vrai ralentissement", GREEN),
        ("4", "Molécules optimisées", "Meilleure pénétration SNC", GOLD_DK),
        ("5", "Combinaisons", "Neuroprotection + symptomatique", SKY),
        ("6", "Sémaglutide & suite", "Clarifier le champ clinique", CORAL_DK),
    ]
    for i, (n, t, d, col) in enumerate(pers):
        col_i, row = i % 3, i // 3
        x = Inches(0.35) + Inches(col_i * 4.25)
        y = Inches(1.55) + Inches(row * 2.55)
        add_round(s, x, y, Inches(4.05), Inches(2.35), WHITE)
        add_rect(s, x, y, Inches(0.7), Inches(2.35), col)
        add_textbox(s, x, y + Inches(0.85), Inches(0.7), Inches(0.5),
                    n, size=20, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
        add_textbox(s, x + Inches(0.9), y + Inches(0.5), Inches(2.95), Inches(0.55),
                    t, size=14, bold=True, color=NAVY, font="Georgia")
        add_textbox(s, x + Inches(0.9), y + Inches(1.2), Inches(2.95), Inches(0.8),
                    d, size=13, color=MUTED)
    add_footer(s, p)

    # 29 PHARMACIST + IMAGE --------------------------------------------------
    p += 1
    img_text_slide(
        prs, blank, "Chapitre 3 — Pratique", "Rôle du pharmacien : sécuriser le parcours",
        "08_pharmacist.png",
        ["Éducation : injection, titration, régularité",
         "Tolérance : anticiper les EI digestifs",
         "Vigilance : insuline/sulfamides, pancréatite",
         "Pharmacovigilance & déclaration des EI",
         "Essais : traçabilité / conservation",
         "Info claire : usage validé vs expérimental",
         "Coordination neurologue–endocrinologue"],
        p, GREEN_DK, CORAL, img_left=False
    )

    # 30 CONCLUSION ----------------------------------------------------------
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Conclusion", "Messages à retenir", accent=GOLD)
    msgs = [
        ("1", "Classe mature", "Incontournable en DT2, obésité et protection cardio-rénale.", TEAL),
        ("2", "Rationnel solide", "Neuroprotection plausible et convergente en préclinique.", GREEN),
        ("3", "Clinique hétérogène", "Exénatide négatif en ph. III ; LIXIPARK encourageant.", CORAL),
        ("4", "Preuve à construire", "Essais plus larges, précoces, ciblés, plus longs.", GOLD_DK),
        ("5", "Pharmacien central", "Éducation, vigilance, coordination — aujourd’hui et demain.", SKY),
    ]
    for i, (n, t, d, col) in enumerate(msgs):
        y = Inches(1.4) + Inches(i * 0.95)
        add_round(s, Inches(0.35), y, Inches(12.6), Inches(0.85), WHITE)
        add_rect(s, Inches(0.35), y, Inches(0.75), Inches(0.85), col)
        add_textbox(s, Inches(0.35), y + Inches(0.2), Inches(0.75), Inches(0.45),
                    n, size=18, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
        add_textbox(s, Inches(1.3), y + Inches(0.1), Inches(11.3), Inches(0.3),
                    t, size=14, bold=True, color=NAVY, font="Georgia")
        add_textbox(s, Inches(1.3), y + Inches(0.42), Inches(11.3), Inches(0.35),
                    d, size=12, color=MUTED)
    add_rect(s, 0, Inches(7.12), SLIDE_W, Inches(0.38), NAVY)
    add_rect(s, 0, Inches(7.12), Inches(0.25), Inches(0.38), GOLD)
    add_textbox(s, Inches(0.4), Inches(7.16), Inches(10), Inches(0.28),
                "Merci  ·  Questions & discussion", size=12, bold=True, color=WHITE)
    add_textbox(s, Inches(11.4), Inches(7.16), Inches(1.6), Inches(0.28),
                f"{p} / {TOTAL}", size=10, bold=True, color=TEAL_LT, align=PP_ALIGN.RIGHT)

    assert p == TOTAL, f"Expected {TOTAL}, got {p}"
    out = "/workspace/docs/presentation/Soutenance_GLP1_Parkinson.pptx"
    prs.save(out)
    # also copy to artifacts for easy download
    art = "/opt/cursor/artifacts/Soutenance_GLP1_Parkinson.pptx"
    import shutil
    shutil.copy2(out, art)
    print(f"Saved: {out}")
    print(f"Artifact: {art}")
    print(f"Slides: {len(prs.slides)}")
    return out


if __name__ == "__main__":
    build()
