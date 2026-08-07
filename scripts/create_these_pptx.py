#!/usr/bin/env python3
"""
Soutenance de thèse — Agonistes du GLP-1 & maladie de Parkinson
~30 diapositives denses, style pharmacie clinique + design graphique soigné.
"""

from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

# --- Palette médicale académique (teal profond / anthracite / ambre) ---
NAVY = RGBColor(0x0A, 0x36, 0x42)
TEAL = RGBColor(0x1A, 0x6B, 0x7A)
TEAL_LT = RGBColor(0x2A, 0x8A, 0x9A)
ACCENT = RGBColor(0xC4, 0x7A, 0x2C)
ACCENT_DK = RGBColor(0x9A, 0x5C, 0x1A)
LIGHT = RGBColor(0xF3, 0xF6, 0xF7)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
DARK = RGBColor(0x1A, 0x22, 0x26)
MUTED = RGBColor(0x4E, 0x5E, 0x66)
SOFT = RGBColor(0xE4, 0xEC, 0xEE)
ROW_ALT = RGBColor(0xEE, 0xF4, 0xF5)
LINE = RGBColor(0xC5, 0xD4, 0xD8)
OK = RGBColor(0x1F, 0x6B, 0x4A)
WARN = RGBColor(0x8B, 0x45, 0x13)
NEUT = RGBColor(0x3D, 0x5A, 0x66)

SLIDE_W = Inches(13.333)
SLIDE_H = Inches(7.5)
TOTAL = 30


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
    return shape


def add_rect(slide, left, top, width, height, fill, line=None):
    shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, left, top, width, height)
    shape.fill.solid()
    shape.fill.fore_color.rgb = fill
    if line is None:
        shape.line.fill.background()
    else:
        shape.line.color.rgb = line
        shape.line.width = Pt(1)
    return shape


def add_round(slide, left, top, width, height, fill):
    shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
    shape.fill.solid()
    shape.fill.fore_color.rgb = fill
    shape.line.fill.background()
    # less rounded
    try:
        shape.adjustments[0] = 0.08
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


def add_para_box(slide, left, top, width, height, paragraphs, default_size=14):
    """paragraphs: list of dicts {text, size, bold, color, align, space_after}"""
    box = slide.shapes.add_textbox(left, top, width, height)
    tf = box.text_frame
    tf.word_wrap = True
    for i, item in enumerate(paragraphs):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = item.get("align", PP_ALIGN.LEFT)
        p.space_after = Pt(item.get("space_after", 6))
        run = p.add_run()
        run.text = item["text"]
        set_run(run, size=item.get("size", default_size),
                bold=item.get("bold", False),
                color=item.get("color", DARK),
                font=item.get("font", "Calibri"))
    return box


def add_bullets(slide, left, top, width, height, items, size=14, color=DARK, spacing=6, bold_first=False):
    box = slide.shapes.add_textbox(left, top, width, height)
    tf = box.text_frame
    tf.word_wrap = True
    for i, item in enumerate(items):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = PP_ALIGN.LEFT
        p.space_after = Pt(spacing)
        run = p.add_run()
        if isinstance(item, tuple):
            # (title, rest) — title bold
            run.text = "▸  " + item[0]
            set_run(run, size=size, bold=True, color=color)
            run2 = p.add_run()
            run2.text = item[1]
            set_run(run2, size=size, bold=False, color=MUTED)
        else:
            run.text = "▸  " + item
            set_run(run, size=size, bold=bold_first and i == 0, color=color)
    return box


def add_footer(slide, page, total=TOTAL):
    add_rect(slide, 0, Inches(7.12), SLIDE_W, Inches(0.38), NAVY)
    add_textbox(slide, Inches(0.35), Inches(7.16), Inches(10.5), Inches(0.28),
                "Agonistes du GLP-1 — Mise au point et potentiel dans la maladie de Parkinson",
                size=10, color=WHITE)
    add_textbox(slide, Inches(11.5), Inches(7.16), Inches(1.5), Inches(0.28),
                f"{page}  /  {total}", size=10, color=WHITE, align=PP_ALIGN.RIGHT)


def header(slide, kicker, title, subtitle=None):
    """Dense header bar — fills top, no empty gap under title."""
    add_bg(slide, LIGHT)
    add_rect(slide, 0, 0, SLIDE_W, Inches(1.15) if not subtitle else Inches(1.35), NAVY)
    add_rect(slide, 0, 0, Inches(0.12), Inches(1.15) if not subtitle else Inches(1.35), ACCENT)
    add_textbox(slide, Inches(0.4), Inches(0.18), Inches(12.5), Inches(0.28),
                kicker.upper(), size=11, bold=True, color=TEAL_LT)
    add_textbox(slide, Inches(0.4), Inches(0.45), Inches(12.5), Inches(0.45),
                title, size=24, bold=True, color=WHITE, font="Georgia")
    if subtitle:
        add_textbox(slide, Inches(0.4), Inches(0.95), Inches(12.5), Inches(0.28),
                    subtitle, size=12, color=RGBColor(0xB0, 0xD0, 0xD8))
    return Inches(1.5) if subtitle else Inches(1.35)


def card(slide, left, top, width, height, title, bullets, header_color=TEAL, body_size=13):
    add_round(slide, left, top, width, height, WHITE)
    add_rect(slide, left, top, width, Inches(0.42), header_color)
    add_textbox(slide, left + Inches(0.15), top + Inches(0.06), width - Inches(0.3), Inches(0.32),
                title, size=13, bold=True, color=WHITE)
    add_bullets(slide, left + Inches(0.15), top + Inches(0.55),
                width - Inches(0.3), height - Inches(0.65),
                bullets, size=body_size, spacing=5)


def kpi(slide, left, top, width, height, value, label, sub=None, bg=NAVY):
    add_round(slide, left, top, width, height, bg)
    add_textbox(slide, left + Inches(0.12), top + Inches(0.18), width - Inches(0.24), Inches(0.55),
                value, size=26, bold=True, color=WHITE, align=PP_ALIGN.CENTER, font="Georgia")
    add_textbox(slide, left + Inches(0.12), top + Inches(0.75), width - Inches(0.24), Inches(0.45),
                label, size=12, bold=True, color=RGBColor(0xB8, 0xD8, 0xE0), align=PP_ALIGN.CENTER)
    if sub:
        add_textbox(slide, left + Inches(0.12), top + Inches(1.15), width - Inches(0.24), Inches(0.4),
                    sub, size=11, color=RGBColor(0x90, 0xB8, 0xC0), align=PP_ALIGN.CENTER)


def add_table(slide, left, top, width, rows, col_widths, font_size=11, row_h=0.38):
    n_rows, n_cols = len(rows), len(rows[0])
    table_shape = slide.shapes.add_table(
        n_rows, n_cols, left, top, width, Inches(row_h * n_rows)
    )
    table = table_shape.table
    for i, w in enumerate(col_widths):
        table.columns[i].width = w
    for r, row in enumerate(rows):
        for c, cell_text in enumerate(row):
            cell = table.cell(r, c)
            cell.text = ""
            p = cell.text_frame.paragraphs[0]
            p.alignment = PP_ALIGN.LEFT
            run = p.add_run()
            run.text = str(cell_text)
            is_header = r == 0
            set_run(run, size=font_size, bold=is_header,
                    color=WHITE if is_header else DARK)
            cell.fill.solid()
            if is_header:
                cell.fill.fore_color.rgb = NAVY
            elif r % 2 == 0:
                cell.fill.fore_color.rgb = ROW_ALT
            else:
                cell.fill.fore_color.rgb = WHITE
    return table_shape


def section_divider(prs, blank, num, title, subtitle, page):
    s = prs.slides.add_slide(blank)
    add_bg(s, NAVY)
    add_rect(s, 0, 0, Inches(0.2), SLIDE_H, ACCENT)
    add_textbox(s, Inches(1.0), Inches(2.2), Inches(11), Inches(0.4),
                f"PARTIE  {num}", size=14, bold=True, color=ACCENT)
    add_textbox(s, Inches(1.0), Inches(2.7), Inches(11), Inches(1.2),
                title, size=36, bold=True, color=WHITE, font="Georgia")
    add_textbox(s, Inches(1.0), Inches(4.2), Inches(11), Inches(0.8),
                subtitle, size=16, color=RGBColor(0xA8, 0xD0, 0xD8))
    add_textbox(s, Inches(1.0), Inches(6.5), Inches(11), Inches(0.3),
                f"{page}  /  {TOTAL}", size=11, color=RGBColor(0x70, 0x98, 0xA0))
    return s


def build():
    prs = Presentation()
    prs.slide_width = SLIDE_W
    prs.slide_height = SLIDE_H
    blank = prs.slide_layouts[6]
    p = 0

    # =====================================================================
    # 1. TITRE
    # =====================================================================
    p += 1
    s = prs.slides.add_slide(blank)
    add_bg(s, NAVY)
    add_rect(s, 0, 0, Inches(0.18), SLIDE_H, ACCENT)
    add_rect(s, 0, Inches(5.85), SLIDE_W, Inches(1.65), TEAL)
    add_textbox(s, Inches(0.7), Inches(1.3), Inches(11.5), Inches(0.35),
                "SOUTENANCE DE THÈSE  ·  PHARMACIE", size=13, bold=True, color=TEAL_LT)
    add_textbox(s, Inches(0.7), Inches(1.85), Inches(11.8), Inches(2.2),
                "Agonistes du GLP-1 :\nMise au point et potentiel prometteur\npour la maladie de Parkinson",
                size=30, bold=True, color=WHITE, font="Georgia")
    add_textbox(s, Inches(0.7), Inches(4.4), Inches(11.5), Inches(0.5),
                "Physiologie  ·  Pharmacologie  ·  Indications métaboliques  ·  Repositionnement neurologique",
                size=14, color=RGBColor(0xB0, 0xD0, 0xD8))
    add_textbox(s, Inches(0.7), Inches(6.15), Inches(8), Inches(0.9),
                "Synthèse bibliographique critique\nRepositionnement thérapeutique & neuroprotection",
                size=13, color=WHITE)
    add_textbox(s, Inches(9.2), Inches(6.3), Inches(3.5), Inches(0.7),
                "Présentation de soutenance\n~30 diapositives",
                size=12, color=WHITE, align=PP_ALIGN.RIGHT)

    # =====================================================================
    # 2. PLAN
    # =====================================================================
    p += 1
    s = prs.slides.add_slide(blank)
    y0 = header(s, "Organisation", "Plan de la présentation",
                "Parcours logique : du besoin médical aux preuves cliniques")
    parts = [
        ("01", "Contexte", "Parkinson, besoin non satisfait, logique de repositionnement"),
        ("02", "Chapitre 1", "Physiologie du GLP-1, récepteur, panorama des agonistes"),
        ("03", "Chapitre 2", "DT2, obésité, cardio-rénal, tolérance — indications validées"),
        ("04", "Chapitre 3", "Neuroprotection, préclinique, essais (LIXIPARK), pharmacien"),
        ("05", "Conclusion", "Messages clés, perspectives et discussion"),
    ]
    for i, (n, t, d) in enumerate(parts):
        x = Inches(0.35) + Inches(i * 2.55)
        add_round(s, x, Inches(1.7), Inches(2.4), Inches(4.7), WHITE)
        add_rect(s, x, Inches(1.7), Inches(2.4), Inches(1.15), NAVY if i != 3 else TEAL)
        add_textbox(s, x + Inches(0.15), Inches(1.85), Inches(2.1), Inches(0.4),
                    n, size=28, bold=True, color=ACCENT if i == 3 else TEAL_LT, align=PP_ALIGN.CENTER)
        add_textbox(s, x + Inches(0.1), Inches(2.35), Inches(2.2), Inches(0.4),
                    t, size=14, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
        add_textbox(s, x + Inches(0.15), Inches(3.15), Inches(2.1), Inches(2.8),
                    d, size=13, color=DARK, align=PP_ALIGN.CENTER)
    add_footer(s, p)

    # =====================================================================
    # 3. OBJECTIFS
    # =====================================================================
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Objectifs", "Objectifs de ce travail",
           "Quatre axes complémentaires, d’une synthèse pharmacologique à la pratique officinale")
    objs = [
        ("1", "Physiologie & pharmacologie",
         "Décrire le GLP-1, le GLP-1R et comparer les agonistes (courte vs longue durée, structures, PK/PD)."),
        ("2", "Indications métaboliques",
         "Analyser l’efficacité dans le DT2, l’obésité et la protection cardio-rénale (LEADER, SUSTAIN-6, REWIND…)."),
        ("3", "Repositionnement Parkinson",
         "Évaluer mécanismes neuroprotecteurs, données précliniques et cliniques (exénatide, LIXIPARK, sémaglutide)."),
        ("4", "Rôle du pharmacien",
         "Préciser éducation thérapeutique, pharmacovigilance, essais cliniques et coordination pluridisciplinaire."),
    ]
    for i, (n, t, d) in enumerate(objs):
        y = Inches(1.55) + Inches(i * 1.25)
        add_round(s, Inches(0.35), y, Inches(12.6), Inches(1.1), WHITE)
        add_rect(s, Inches(0.35), y, Inches(0.9), Inches(1.1), NAVY if i != 2 else ACCENT)
        add_textbox(s, Inches(0.35), y + Inches(0.28), Inches(0.9), Inches(0.55),
                    n, size=26, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
        add_textbox(s, Inches(1.5), y + Inches(0.18), Inches(11), Inches(0.35),
                    t, size=16, bold=True, color=NAVY, font="Georgia")
        add_textbox(s, Inches(1.5), y + Inches(0.55), Inches(11), Inches(0.4),
                    d, size=13, color=MUTED)
    add_footer(s, p)

    # =====================================================================
    # 4. SECTION DIVIDER — CONTEXTE
    # =====================================================================
    p += 1
    section_divider(prs, blank, "A", "Contexte & besoin médical",
                    "La maladie de Parkinson : épidémiologie, physiopathologie et impasse thérapeutique", p)

    # =====================================================================
    # 5. PARKINSON EPIDEMIO
    # =====================================================================
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Contexte", "La maladie de Parkinson : un enjeu de santé publique",
           "Seconde maladie neurodégénérative après Alzheimer — fardeau croissant")
    kpi(s, Inches(0.35), Inches(1.55), Inches(4.0), Inches(1.7), "2ᵉ", "Maladie neurodégénérative", "après Alzheimer")
    kpi(s, Inches(4.55), Inches(1.55), Inches(4.0), Inches(1.7), "×2–3", "Patients attendus", "prochaines décennies", bg=TEAL)
    kpi(s, Inches(8.75), Inches(1.55), Inches(4.2), Inches(1.7), "Monde", "« Pandémie » PD", "vieillissement + expositions", bg=ACCENT_DK)

    card(s, Inches(0.35), Inches(3.5), Inches(6.2), Inches(3.2),
         "Impact clinique & sociétal",
         ["Handicap neurologique majeur chez l’adulte âgé",
          "Coûts de suivi prolongé et de perte d’autonomie",
          "Symptômes moteurs et non moteurs",
          "Défi collectif pour les systèmes de santé"],
         TEAL)
    card(s, Inches(6.8), Inches(3.5), Inches(6.15), Inches(3.2),
         "Urgence thérapeutique",
         ["Traitements actuels = symptomatiques seuls",
          "Aucun modificateur de maladie validé",
          "Besoin de stratégies neuroprotectrices",
          "Le repositionnement médicamenteux est une voie crédible"],
         NAVY)
    add_footer(s, p)

    # =====================================================================
    # 6. PHYSIOPATHO PD
    # =====================================================================
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Contexte", "Physiopathologie multifactorielle",
           "Plusieurs cibles potentielles pour un agoniste du GLP-1R")
    items = [
        ("α-synucléine", "Agrégation anormale, toxicité et propagation"),
        ("Mitochondries", "Dysfonction énergétique et production de ROS"),
        ("Stress oxydatif", "Lésions cellulaires cumulatives"),
        ("Neuroinflammation", "Activation microgliale et médiateurs toxiques"),
        ("Autophagie", "Dégradation protéique altérée"),
        ("Gènes & environnement", "Susceptibilité individuelle et progression"),
    ]
    for i, (t, d) in enumerate(items):
        col, row = i % 3, i // 3
        x = Inches(0.35) + Inches(col * 4.25)
        y = Inches(1.55) + Inches(row * 2.55)
        add_round(s, x, y, Inches(4.05), Inches(2.35), WHITE)
        add_rect(s, x, y, Inches(0.12), Inches(2.35), ACCENT if i in (0, 3) else TEAL)
        add_textbox(s, x + Inches(0.35), y + Inches(0.45), Inches(3.5), Inches(0.5),
                    t, size=16, bold=True, color=NAVY, font="Georgia")
        add_textbox(s, x + Inches(0.35), y + Inches(1.1), Inches(3.5), Inches(0.9),
                    d, size=13, color=MUTED)
    add_footer(s, p)

    # =====================================================================
    # 7. TRAITEMENTS ACTUELS
    # =====================================================================
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Contexte", "Prise en charge actuelle : efficace… mais limitée",
           "La lévodopa reste la référence — sans freiner la neurodégénérescence")
    rows = [
        ["Classe", "Rôle principal", "Limite"],
        ["Lévodopa (± ICOMT)", "Référence motrice", "Fluctuations, dyskinésies"],
        ["Agonistes dopaminergiques", "Symptômes moteurs", "EI neuropsy, somnolence"],
        ["IMAO-B", "Potentialisation DA", "Effet symptomatique seul"],
        ["Amantadine", "Dyskinésies", "Pas d’effet modificateur"],
        ["Thérapies avancées", "Stades compliqués", "Invasives, sélection"],
    ]
    add_table(s, Inches(0.35), Inches(1.55), Inches(12.6), rows,
              [Inches(3.2), Inches(4.5), Inches(4.9)], font_size=13, row_h=0.52)
    add_round(s, Inches(0.35), Inches(5.15), Inches(12.6), Inches(1.55), NAVY)
    add_textbox(s, Inches(0.6), Inches(5.35), Inches(12), Inches(0.35),
                "Message pharmacologique", size=13, bold=True, color=ACCENT)
    add_textbox(s, Inches(0.6), Inches(5.75), Inches(12), Inches(0.7),
                "Améliorer les symptômes ≠ modifier la maladie. Le besoin d’une stratégie neuroprotectrice reste entier — d’où l’intérêt du repositionnement des agonistes du GLP-1.",
                size=14, color=WHITE)
    add_footer(s, p)

    # =====================================================================
    # 8. REPOSITIONNEMENT
    # =====================================================================
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Contexte", "Repositionnement thérapeutique : pourquoi c’est pertinent",
           "Réduire délais et coûts en s’appuyant sur un profil de sécurité déjà connu")
    card(s, Inches(0.35), Inches(1.55), Inches(6.2), Inches(5.15),
         "Avantages du repositionnement",
         [("PK/PD connues", " — données déjà disponibles"),
          ("Tolérance documentée", " — millions d’années-patients"),
          ("Développement accéléré", " — vs NCE de novo"),
          ("Pertinent en neurodégénérescence", " — nombreux échecs d’innovations"),
          ("Classe GLP-1 mature", " — DT2, obésité, cardio-rénal")],
         TEAL, body_size=13)
    card(s, Inches(6.8), Inches(1.55), Inches(6.15), Inches(5.15),
         "Pourquoi le GLP-1 ici ?",
         [("GLP-1R au SNC", " — hypothalamus, tronc, hippocampe…"),
          ("Anti-inflammatoire", " — modèles expérimentaux"),
          ("Anti-oxydant / anti-apoptotique", " — survie neuronale"),
          ("Cibles PD chevauchantes", " — mitochondries, α-syn, inflammation"),
          ("Essais humains déjà menés", " — exénatide, lixisénatide…")],
         NAVY, body_size=13)
    add_footer(s, p)

    # =====================================================================
    # 9. SECTION — CHAPITRE 1
    # =====================================================================
    p += 1
    section_divider(prs, blank, "B", "Chapitre 1 — Physiologie & pharmacologie",
                    "GLP-1, GLP-1R et panorama des agonistes disponibles", p)

    # =====================================================================
    # 10. PHYSIO GLP-1
    # =====================================================================
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Chapitre 1", "Physiologie du GLP-1",
           "Hormone incrétine — production, formes actives, contrainte DPP-4")
    card(s, Inches(0.35), Inches(1.55), Inches(4.1), Inches(5.15),
         "Production",
         ["Cellules L (iléon distal, côlon)",
          "Faible expression neuronale (NTS)",
          "Clivage post-traductionnel du proglucagon",
          "Intestin → GLP-1, GLP-2, glicentine, oxyntomoduline",
          "Pancréas α → glucagon (autre voie)"],
         TEAL)
    card(s, Inches(4.65), Inches(1.55), Inches(4.1), Inches(5.15),
         "Formes & sécrétion",
         ["Actives : GLP-1(7-36)amide & (7-37)",
          "Stimulation postprandiale (glucides, lipides, protéines)",
          "Potentialisation insulinique glucose-dépendante",
          "Maintien de l’homéostasie glycémique",
          "Effet incrétine physiologique"],
         NAVY)
    card(s, Inches(8.95), Inches(1.55), Inches(4.0), Inches(5.15),
         "Contrainte PK",
         ["Inactivation rapide par DPP-4",
          "Demi-vie plasmatique ≈ 1–2 min",
          "Activité biologique très limitée",
          "→ Agonistes résistants à la DPP-4",
          "→ Prolongation d’exposition récepteur"],
         ACCENT_DK)
    add_footer(s, p)

    # =====================================================================
    # 11. RECEPTEUR
    # =====================================================================
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Chapitre 1", "Le récepteur GLP-1R",
           "GPCR classe B — 463 AA — cible pléiotrope")
    add_round(s, Inches(0.35), Inches(1.55), Inches(6.2), Inches(5.15), WHITE)
    add_rect(s, Inches(0.35), Inches(1.55), Inches(6.2), Inches(0.45), TEAL)
    add_textbox(s, Inches(0.55), Inches(1.62), Inches(5.8), Inches(0.35),
                "Structure & distribution", size=14, bold=True, color=WHITE)
    add_bullets(s, Inches(0.55), Inches(2.2), Inches(5.8), Inches(4.2), [
        ("Domaine extracellulaire large", " — liaison du ligand"),
        ("7 TM + domaine intracellulaire", " — transmission du signal"),
        ("Pancréas β", " — sécrétion d’insuline"),
        ("Cœur, rein, tube digestif", " — effets périphériques"),
        ("SNC", " — hypothalamus, tronc, hippocampe, aire postrema"),
        ("Lecture clé", " — la distribution explique les effets hors glycémie"),
    ], size=13, spacing=8)

    add_round(s, Inches(6.8), Inches(1.55), Inches(6.15), Inches(5.15), WHITE)
    add_rect(s, Inches(6.8), Inches(1.55), Inches(6.15), Inches(0.45), NAVY)
    add_textbox(s, Inches(7.0), Inches(1.62), Inches(5.8), Inches(0.35),
                "Signalisation intracellulaire", size=14, bold=True, color=WHITE)
    paths = [
        ("Gs → Adénylate cyclase → AMPc", "Voie principale"),
        ("PKA & EPAC2", "Exocytose d’insuline, survie β"),
        ("PI3K / Akt", "Anti-apoptose, métabolisme"),
        ("MAPK / ERK", "Prolifération, réparation"),
        ("Au SNC", "Neuroprotection : ↓ oxydatif, inflammation, mort neuronale"),
    ]
    for i, (t, d) in enumerate(paths):
        y = Inches(2.2) + Inches(i * 0.85)
        add_rect(s, Inches(7.05), y, Inches(5.7), Inches(0.75), SOFT if i % 2 == 0 else LIGHT)
        add_textbox(s, Inches(7.2), y + Inches(0.08), Inches(5.4), Inches(0.3),
                    t, size=13, bold=True, color=NAVY)
        add_textbox(s, Inches(7.2), y + Inches(0.38), Inches(5.4), Inches(0.28),
                    d, size=12, color=MUTED)
    add_footer(s, p)

    # =====================================================================
    # 12. COURTE VS LONGUE
    # =====================================================================
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Chapitre 1", "Courte vs longue durée d’action",
           "La durée d’exposition du récepteur dicte le profil d’efficacité")
    card(s, Inches(0.35), Inches(1.55), Inches(6.2), Inches(5.15),
         "Courte durée — Exénatide, Lixisénatide",
         [("Pic puis nadir", " — stimulation intermittente"),
          ("Moins de tachyphylaxie gastrique", " — vidange ralentie"),
          ("Contrôle postprandial marqué", " — excursions glycémiques"),
          ("Exénatide", " — 2×/j ou LP hebdomadaire"),
          ("Lixisénatide", " — 1×/j ; intérêt Parkinson (LIXIPARK)")],
         TEAL, body_size=13)
    card(s, Inches(6.8), Inches(1.55), Inches(6.15), Inches(5.15),
         "Longue durée — Lira, Dula, Séma, Tirzépatide",
         [("Exposition continue", " — concentrations stables"),
          ("Meilleur contrôle du jeûne / HbA1c", " — nuit incluse"),
          ("Tachyphylaxie gastrique", " — effet transit s’atténue"),
          ("Liraglutide", " — quotidien mais « long acting »"),
          ("Dula / Séma / Tirzépatide", " — hebdomadaires")],
         NAVY, body_size=13)
    add_footer(s, p)

    # =====================================================================
    # 13. STRUCTURES MOLECULAIRES
    # =====================================================================
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Chapitre 1", "Spécificités moléculaires des agonistes",
           "Même cible, architectures différentes — impact PK et pénétration")
    rows = [
        ["Molécule", "Origine / structure", "Demi-vie", "Administration"],
        ["Exénatide", "Exendine-4 (Heloderma) ; ~53 % homologie ; résistant DPP-4", "Quelques heures", "SC 2×/j (ou LP 1×/sem.)"],
        ["Lixisénatide", "Exendine-4 + 6 Lys C-term. ; ↑ affinité", "~3 h", "SC 1×/j"],
        ["Liraglutide", "GLP-1 humain ~97 % ; C16 + espaceur ; liaison albumine", "~13 h", "SC 1×/j"],
        ["Dulaglutide", "2 analogues + Fc IgG4 ; ↓ clairance rénale", "~5 j", "SC 1×/sem."],
        ["Sémaglutide", "~94 % ; Pos8 anti-DPP-4 ; C18 albumine", "~1 sem.", "SC 1×/sem. ou oral"],
        ["Tirzépatide", "Double agoniste GIP/GLP-1 + chaîne lipidique", "~5 j", "SC 1×/sem."],
    ]
    add_table(s, Inches(0.25), Inches(1.5), Inches(12.8), rows,
              [Inches(1.9), Inches(5.6), Inches(2.0), Inches(3.3)], font_size=11, row_h=0.58)
    add_textbox(s, Inches(0.35), Inches(6.4), Inches(12.6), Inches(0.4),
                "Point expert : structure (exendine-4 vs GLP-1 humain, taille, lipidation) → demi-vie, immunogénicité potentielle et accès au SNC variables.",
                size=12, color=MUTED)
    add_footer(s, p)

    # =====================================================================
    # 14. MECANISMES ACTION METABOLIQUES
    # =====================================================================
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Chapitre 1", "Mécanismes d’action métaboliques",
           "Reproduction des effets du GLP-1 endogène, prolongés dans le temps")
    acts = [
        ("↑ Insuline", "Sécrétion glucose-dépendante → faible risque d’hypoglycémie en monothérapie"),
        ("↓ Glucagon", "Réduction de la production hépatique de glucose"),
        ("Vidange gastrique", "Ralentissement (surtout courte durée) → ↓ pic postprandial"),
        ("Satiété centrale", "Action SNC → ↓ apports, perte de poids"),
        ("Cellules β", "Survie / fonction préservées (anti-apoptose)"),
        ("Effets pléiotropes", "Vasculaire, rénal, inflammatoire — au-delà de la glycémie"),
    ]
    for i, (t, d) in enumerate(acts):
        col, row = i % 3, i // 3
        x = Inches(0.35) + Inches(col * 4.25)
        y = Inches(1.55) + Inches(row * 2.55)
        add_round(s, x, y, Inches(4.05), Inches(2.35), WHITE)
        add_rect(s, x, y, Inches(4.05), Inches(0.5), TEAL if row == 0 else NAVY)
        add_textbox(s, x + Inches(0.2), y + Inches(0.1), Inches(3.65), Inches(0.35),
                    t, size=14, bold=True, color=WHITE)
        add_textbox(s, x + Inches(0.2), y + Inches(0.75), Inches(3.65), Inches(1.3),
                    d, size=13, color=DARK)
    add_footer(s, p)

    # =====================================================================
    # 15. SECTION — CHAPITRE 2
    # =====================================================================
    p += 1
    section_divider(prs, blank, "C", "Chapitre 2 — Indications validées",
                    "Diabète de type 2, obésité et protection cardio-rénale", p)

    # =====================================================================
    # 16. DT2
    # =====================================================================
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Chapitre 2", "Diabète de type 2 : place des agonistes du GLP-1",
           "Recommandations ADA / EASD — classe majeure")
    card(s, Inches(0.35), Inches(1.55), Inches(6.2), Inches(5.15),
         "Rationnel physiopathologique",
         ["DT2 = insulinorésistance + défaillance β progressive",
          "Diminution de l’effet incrétine = cible clé",
          "Agonistes = effet incrétine pharmacologique durable",
          "Contrôle glycémique sans hypoglycémie « intrinsèque »",
          "Après mesures hygiéno-diététiques ± metformine",
          "Introduction précoce si MCV / MRC / haut risque CV"],
         TEAL)
    card(s, Inches(6.8), Inches(1.55), Inches(6.15), Inches(5.15),
         "Profil d’efficacité glycémique",
         ["↓ HbA1c typiquement 0,8 à 1,8 %",
          "Courte durée → postprandial (vidange)",
          "Longue durée → jeûne + HbA1c plus marqués",
          "Sémaglutide & tirzépatide parmi les plus puissants",
          "Intensification thérapeutique privilégiée",
          "Bénéfice pondéral concomitant"],
         NAVY)
    add_footer(s, p)

    # =====================================================================
    # 17. POIDS / OBESITE
    # =====================================================================
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Chapitre 2", "Contrôle du poids et obésité",
           "SCALE, STEP, SURMOUNT — un changement de paradigme")
    kpi(s, Inches(0.35), Inches(1.55), Inches(4.0), Inches(1.85), "~15 %", "Sémaglutide (STEP)", "perte de poids moyenne", bg=TEAL)
    kpi(s, Inches(4.55), Inches(1.55), Inches(4.0), Inches(1.85), "3 mg", "Liraglutide (SCALE)", "bénéfice durable", bg=NAVY)
    kpi(s, Inches(8.75), Inches(1.55), Inches(4.2), Inches(1.85), "++", "Tirzépatide", "souvent > sélectifs GLP-1", bg=ACCENT_DK)

    card(s, Inches(0.35), Inches(3.65), Inches(6.2), Inches(3.05),
         "Mécanismes du bénéfice pondéral",
         ["↓ appétit et ↑ satiété (action centrale)",
          "Réduction des apports alimentaires",
          "Amélioration secondaire de la sensibilité à l’insuline",
          "Impact sur syndrome métabolique (PA, lipides, inflammation)"],
         TEAL)
    card(s, Inches(6.8), Inches(3.65), Inches(6.15), Inches(3.05),
         "Lecture pharmacienne",
         ["Titration progressive = clé de l’adhésion",
          "EI digestifs = 1ʳᵉ cause d’arrêt",
          "Éducation injection / oubli / conservation",
          "Surveillance nutritionnelle et hydratation"],
         NAVY)
    add_footer(s, p)

    # =====================================================================
    # 18. CARDIO RENAL
    # =====================================================================
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Chapitre 2", "Cardioprotection et néphroprotection",
           "Au-delà de l’HbA1c — essais de sécurité CV pivots")
    rows = [
        ["Essai", "Molécule", "Population", "Résultat principal"],
        ["LEADER", "Liraglutide", "DT2 haut risque CV", "↓ MACE, ↓ mortalité CV & toutes causes ; ↓ macroalbuminurie"],
        ["SUSTAIN-6", "Sémaglutide", "DT2 haut risque CV", "↓ MACE ; signal cérébrovasculaire ; ↓ événements rénaux"],
        ["REWIND", "Dulaglutide", "DT2 risque CV", "Bénéfice CV démontré — effet de classe au-delà de la glycémie"],
    ]
    add_table(s, Inches(0.25), Inches(1.5), Inches(12.8), rows,
              [Inches(1.8), Inches(2.0), Inches(2.8), Inches(6.2)], font_size=12, row_h=0.7)
    add_round(s, Inches(0.35), Inches(4.85), Inches(12.6), Inches(1.85), SOFT)
    add_textbox(s, Inches(0.55), Inches(5.05), Inches(12.2), Inches(0.3),
                "Mécanismes plausibles du bénéfice CV/rénal", size=13, bold=True, color=NAVY)
    add_bullets(s, Inches(0.55), Inches(5.4), Inches(12.2), Inches(1.1), [
        "Perte de poids, ↓ PA, amélioration lipidique, ↓ inflammation",
        "Effets directs vasculaires / cardiaques / glomérulaires possibles",
        "Données rénales souvent secondaires mais cohérentes → intérêt si risque MRC",
    ], size=13, spacing=4)
    add_footer(s, p)

    # =====================================================================
    # 19. TOLERANCE
    # =====================================================================
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Chapitre 2", "Tolérance et sécurité : ce que le pharmacien doit maîtriser",
           "Profil globalement favorable — vigilance ciblée")
    card(s, Inches(0.35), Inches(1.55), Inches(4.1), Inches(5.15),
         "Effets indésirables fréquents",
         ["Nausées, vomissements, diarrhées",
          "Surtout en initiation / ↑ dose",
          "Souvent transitoires",
          "Réduits par titration lente",
          "Cause n°1 d’arrêt précoce",
          "Conseils : repas légers, hydratation"],
         TEAL)
    card(s, Inches(4.65), Inches(1.55), Inches(4.1), Inches(5.15),
         "Risques à anticiper",
         ["Hypoglycémie rare en monothérapie",
          "↑ si insuline ou sulfamides",
          "Adapter / anticiper les doses associées",
          "Signes de pancréatite aiguë",
          "Complications biliaires",
          "Contre-indications spécifiques à respecter"],
         WARN)
    card(s, Inches(8.95), Inches(1.55), Inches(4.0), Inches(5.15),
         "Messages rassurants",
         ["Grands essais de sécurité disponibles",
          "Inquiétudes historiques cancers / pancréatite non confirmées au niveau populationnel",
          "Classe mature et largement utilisée",
          "Pharmacovigilance reste essentielle",
          "Information claire du patient",
          "Traçabilité des EI"],
         NAVY)
    add_footer(s, p)

    # =====================================================================
    # 20. SECTION — CHAPITRE 3
    # =====================================================================
    p += 1
    section_divider(prs, blank, "D", "Chapitre 3 — Parkinson & repositionnement",
                    "Mécanismes, preuves précliniques, essais cliniques et rôle du pharmacien", p)

    # =====================================================================
    # 21. JUSTIFICATION PD
    # =====================================================================
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Chapitre 3", "Pourquoi repositionner dans la Parkinson ?",
           "Chevauchement entre physiopathologie PD et effets du GLP-1R")
    rows = [
        ["Mécanisme PD", "Modulation potentielle par agonistes GLP-1", "Niveau de preuve"],
        ["Neuroinflammation", "↓ activation microgliale / médiateurs", "Préclinique ++"],
        ["Stress oxydatif", "↓ ROS, meilleure intégrité cellulaire", "Préclinique ++"],
        ["Dysfonction mitochondriale", "Soutien énergétique via PI3K/Akt, AMPc", "Préclinique +"],
        ["Apoptose neuronale", "Voies de survie (PKA, Akt, ERK)", "Préclinique ++"],
        ["α-synucléine / autophagie", "↑ clairance, ↓ agrégation (hypothèse)", "Préclinique + / exploratoire"],
        ["Déficit dopaminergique", "Préservation neuronale (modèles toxiques)", "Préclinique → clinique hétérogène"],
    ]
    add_table(s, Inches(0.25), Inches(1.5), Inches(12.8), rows,
              [Inches(3.0), Inches(5.5), Inches(4.3)], font_size=12, row_h=0.58)
    add_footer(s, p)

    # =====================================================================
    # 22. MECANISMES NEURO
    # =====================================================================
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Chapitre 3", "Mécanismes neuroprotecteurs putatifs",
           "Activation GLP-1R → cascades de survie et contrôle de l’environnement toxique")
    mechs = [
        ("cAMP / PKA / EPAC", "Survie neuronale, plasticité synaptique"),
        ("PI3K / Akt", "Anti-apoptose, métabolisme énergétique"),
        ("MAPK / ERK", "Réparation, différenciation"),
        ("Mitochondries", "↓ dysfonction, ↓ stress oxydatif"),
        ("Microglie", "Atténuation de la neuroinflammation"),
        ("Autophagie", "Clairance de l’α-synucléine pathologique"),
    ]
    for i, (t, d) in enumerate(mechs):
        col, row = i % 3, i // 3
        x = Inches(0.35) + Inches(col * 4.25)
        y = Inches(1.55) + Inches(row * 2.55)
        add_round(s, x, y, Inches(4.05), Inches(2.35), WHITE)
        add_rect(s, x, y, Inches(4.05), Inches(0.55), NAVY if i % 2 == 0 else TEAL)
        add_textbox(s, x + Inches(0.2), y + Inches(0.12), Inches(3.65), Inches(0.35),
                    t, size=14, bold=True, color=WHITE)
        add_textbox(s, x + Inches(0.2), y + Inches(0.85), Inches(3.65), Inches(1.2),
                    d, size=14, color=DARK)
    add_footer(s, p)

    # =====================================================================
    # 23. PRECLINIQUE
    # =====================================================================
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Chapitre 3", "Données précliniques : signaux convergents",
           "Modèles MPTP et 6-OHDA — plausibilité biologique forte")
    rows = [
        ["Molécule", "Observations principales dans les modèles"],
        ["Exénatide", "Préservation neurones DA ; ↓ stress oxydatif ; ↓ neuroinflammation"],
        ["Liraglutide", "Amélioration performances motrices ; protection contre perte neuronale"],
        ["Lixisénatide", "Intérêt pour action / pénétration centrale ; effet protecteur"],
        ["Sémaglutide", "Survie neuronale ; autophagie ; ↓ agrégation d’α-synucléine"],
    ]
    add_table(s, Inches(0.35), Inches(1.5), Inches(12.6), rows,
              [Inches(2.5), Inches(10.1)], font_size=13, row_h=0.65)
    add_round(s, Inches(0.35), Inches(5.2), Inches(12.6), Inches(1.5), NAVY)
    add_textbox(s, Inches(0.6), Inches(5.4), Inches(12.1), Inches(0.3),
                "Limite de transposition", size=13, bold=True, color=ACCENT)
    add_textbox(s, Inches(0.6), Inches(5.8), Inches(12.1), Inches(0.7),
                "La plausibilité préclinique ne garantit pas l’efficacité humaine. Le passage modèle animal → clinique reste l’obstacle majeur — d’où des résultats cliniques parfois décevants.",
                size=13, color=WHITE)
    add_footer(s, p)

    # =====================================================================
    # 24. CLINIQUE EXENATIDE
    # =====================================================================
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Chapitre 3 — Clinique", "Exénatide : du signal ouvert à la phase III",
           "Première molécule largement explorée — résultat final décevant")
    card(s, Inches(0.35), Inches(1.55), Inches(6.2), Inches(5.15),
         "Ce qui a nourri l’espoir",
         ["Études ouvertes : amélioration motrice suggérée",
          "Essai contrôlé initial encourageant",
          "Bonne tolérance globale",
          "Rationnel préclinique solide",
          "Classe déjà connue en métabolisme",
          "Hypothèse modificatrice de maladie"],
         TEAL)
    card(s, Inches(6.8), Inches(1.55), Inches(6.15), Inches(5.15),
         "Ce que la phase III a montré",
         ["Pas de bénéfice significatif sur la progression",
          "Déception importante pour le champ",
          "N’invalide pas totalement l’hypothèse de classe",
          "Limites possibles : sélection, durée, pénétration SNC",
          "Critères : symptomatique vs modificateur ?",
          "Leçon : un signal précoce ≠ preuve définitive"],
         WARN)
    add_footer(s, p)

    # =====================================================================
    # 25. LIXIPARK
    # =====================================================================
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Chapitre 3 — Clinique", "Lixisénatide — essai LIXIPARK",
           "Signal le plus encourageant à ce jour — stade précoce")
    kpi(s, Inches(0.35), Inches(1.55), Inches(4.0), Inches(1.7), "Précoce", "Stade de la PD", "population cible", bg=TEAL)
    kpi(s, Inches(4.55), Inches(1.55), Inches(4.0), Inches(1.7), "Stable", "Scores moteurs", "vs aggravation placebo", bg=NAVY)
    kpi(s, Inches(8.75), Inches(1.55), Inches(4.2), Inches(1.7), "Washout", "Effet persistant", "au-delà du symptomatique ?", bg=ACCENT_DK)

    add_round(s, Inches(0.35), Inches(3.5), Inches(12.6), Inches(3.2), WHITE)
    add_rect(s, Inches(0.35), Inches(3.5), Inches(12.6), Inches(0.45), NAVY)
    add_textbox(s, Inches(0.55), Inches(3.58), Inches(12.2), Inches(0.35),
                "Lecture critique de pharmacien / chercheur", size=14, bold=True, color=WHITE)
    add_bullets(s, Inches(0.55), Inches(4.15), Inches(12.2), Inches(2.3), [
        "Stabilisation motrice sous lixisénatide alors que le placebo s’aggrave → signal clinique réel",
        "Persistance après washout → argument contre un pur effet symptomatique immédiat",
        "Questions ouvertes : durabilité à long terme, tolérance digestive, généralisabilité",
        "Renforce l’intérêt pour les agonistes à profil favorable d’accès / d’action centrale",
        "Ne remplace pas encore un avis réglementaire d’indication neurologique",
    ], size=13, spacing=5)
    add_footer(s, p)

    # =====================================================================
    # 26. AUTRES ESSAIS + SYNTHESE TABLE
    # =====================================================================
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Chapitre 3 — Clinique", "Synthèse des essais cliniques dans la PD",
           "Résultats hétérogènes — la classe n’est pas uniforme")
    rows = [
        ["Molécule / essai", "Phase / design", "Résultat principal"],
        ["Exénatide", "Ouvert → contrôlé → phase III", "Signal initial non confirmé ; pas de bénéfice significatif sur progression"],
        ["Lixisénatide (LIXIPARK)", "Essai contrôlé, PD précoce", "Stabilisation motrice vs placebo ; effet après washout"],
        ["Sémaglutide", "Essais en cours", "Candidat crédible (PK, puissance) ; résultats définitifs en attente"],
        ["Autres / dérivés", "Exploration", "Analogues plus pénétrants, formulations adaptées"],
    ]
    add_table(s, Inches(0.25), Inches(1.5), Inches(12.8), rows,
              [Inches(3.2), Inches(3.5), Inches(6.1)], font_size=12, row_h=0.7)
    add_round(s, Inches(0.35), Inches(5.5), Inches(12.6), Inches(1.2), SOFT)
    add_textbox(s, Inches(0.55), Inches(5.7), Inches(12.2), Inches(0.8),
                "Conclusion intermédiaire : la plausibilité de classe est réelle, mais l’efficacité clinique dépend de la molécule, du stade, de la pénétration SNC et du design d’essai.",
                size=14, color=DARK)
    add_footer(s, p)

    # =====================================================================
    # 27. LIMITES
    # =====================================================================
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Chapitre 3 — Discussion", "Limites méthodologiques et questions ouvertes",
           "Lire les données sans optimisme prématuré")
    card(s, Inches(0.35), Inches(1.55), Inches(6.2), Inches(5.15),
         "Limites des essais",
         ["Peu d’études, souvent de taille modeste",
          "Durées trop courtes pour une maladie lente",
          "Critères moteurs ≠ preuve de neuroprotection",
          "Difficile de séparer symptomatique vs modificateur",
          "Hétérogénéité des populations et stades",
          "Placebo / effets métaboliques confondants possibles"],
         WARN)
    card(s, Inches(6.8), Inches(1.55), Inches(6.15), Inches(5.15),
         "Questions pharmacologiques",
         ["Passage de la BHE variable selon la molécule",
          "Structure (exendine vs GLP-1, taille, lipidation)",
          "Dose neurologique ≠ dose métabolique ?",
          "Quelle molécule pour le SNC ?",
          "Biomarqueurs de sélection manquants",
          "Besoin d’essais plus larges et mieux ciblés"],
         NAVY)
    add_footer(s, p)

    # =====================================================================
    # 28. PERSPECTIVES
    # =====================================================================
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Chapitre 3 — Perspectives", "Où va la recherche ?",
           "De l’hypothèse de classe à une stratégie de précision")
    pers = [
        ("1", "Stade précoce / prodromal", "Intervenir avant une perte neuronale trop avancée"),
        ("2", "Biomarqueurs", "Sélectionner les patients les plus susceptibles de répondre"),
        ("3", "Essais plus longs", "Démontrer un vrai ralentissement de progression"),
        ("4", "Molécules optimisées", "Meilleure pénétration SNC, formulations dédiées"),
        ("5", "Combinaisons", "Neuroprotection + symptomatique + métabolique"),
        ("6", "Sémaglutide & suivants", "Résultats attendus pour clarifier le champ"),
    ]
    for i, (n, t, d) in enumerate(pers):
        col, row = i % 3, i // 3
        x = Inches(0.35) + Inches(col * 4.25)
        y = Inches(1.55) + Inches(row * 2.55)
        add_round(s, x, y, Inches(4.05), Inches(2.35), WHITE)
        add_rect(s, x, y, Inches(0.7), Inches(2.35), TEAL if row == 0 else NAVY)
        add_textbox(s, x + Inches(0.05), y + Inches(0.9), Inches(0.6), Inches(0.5),
                    n, size=20, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
        add_textbox(s, x + Inches(0.9), y + Inches(0.45), Inches(2.95), Inches(0.6),
                    t, size=14, bold=True, color=NAVY, font="Georgia")
        add_textbox(s, x + Inches(0.9), y + Inches(1.2), Inches(2.95), Inches(0.8),
                    d, size=12, color=MUTED)
    add_footer(s, p)

    # =====================================================================
    # 29. PHARMACIEN
    # =====================================================================
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Chapitre 3 — Pratique", "Rôle du pharmacien : du métabolisme à la neurologie",
           "Éducation, vigilance, essais cliniques et coordination")
    roles = [
        ("Éducation thérapeutique", ["Technique d’injection SC", "Schéma de titration", "Régularité (formes hebdo)", "Gestion des oublis"]),
        ("Tolérance & adhésion", ["Anticiper EI digestifs", "Conseils alimentaires", "Hydratation", "Limiter les arrêts précoces"]),
        ("Pharmacovigilance", ["Insuline / sulfamides", "Pancréatite / biliaire", "Déclaration des EI", "Interactions / iatrogénie"]),
        ("Essais & info patient", ["Traçabilité protocole", "Conservation / dispensation", "Usage validé vs expérimental", "Éviter espoirs disproportionnés"]),
        ("Coordination", ["Neurologue", "Endocrinologue", "Médecin traitant", "Patient parkinsonien DT2/obèse"]),
        ("Valeur ajoutée", ["Acteur de proximité", "Sécurisation du parcours", "Optimisation thérapeutique", "Lien ville–hôpital"],),
    ]
    for i, (t, bullets) in enumerate(roles):
        col, row = i % 3, i // 3
        x = Inches(0.3) + Inches(col * 4.3)
        y = Inches(1.5) + Inches(row * 2.6)
        card(s, x, y, Inches(4.1), Inches(2.4), t, bullets,
             TEAL if i % 2 == 0 else NAVY, body_size=12)
    add_footer(s, p)

    # =====================================================================
    # 30. CONCLUSION + MERCI (combined? user asked ~30)
    # Actually make conclusion as 30 and maybe merge thank you into it or have 30 as conclusion and stop
    # Let me count: currently p will be 29 after pharmacist. Need conclusion as 30.
    # Wait - section dividers count too. Let me recount...
    # 1 title, 2 plan, 3 objectifs, 4 divider A, 5 epidemio, 6 physio PD, 7 treatments, 8 repositionnement,
    # 9 divider B, 10 physio GLP1, 11 receptor, 12 short vs long, 13 structures, 14 mechanisms,
    # 15 divider C, 16 DT2, 17 weight, 18 cardio, 19 tolerance,
    # 20 divider D, 21 why PD, 22 neuro mech, 23 preclinical, 24 exenatide, 25 LIXIPARK, 26 synthesis, 27 limits, 28 perspectives, 29 pharmacist
    # That's 29. Need slide 30 = conclusion. Maybe add thank you as part of conclusion or a 30th.
    # User asked ~30. Perfect with conclusion as 30. I could add a thank you as extra - but TOTAL=30. So conclusion is 30, and I can put "merci" elements on it or make conclusion dense and skip separate thanks.
    # Better: make a rich conclusion as 30, with key messages + merci line at bottom.
    # =====================================================================
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Conclusion", "Messages à retenir",
           "Synthèse critique — de la plausibilité biologique à la preuve clinique")
    msgs = [
        ("1", "Classe mature", "Les agonistes du GLP-1 sont incontournables dans le DT2, l’obésité et la protection cardio-rénale."),
        ("2", "Rationnel solide", "Le repositionnement dans la Parkinson repose sur des mécanismes neuroprotecteurs plausibles et convergents en préclinique."),
        ("3", "Clinique hétérogène", "Exénatide négatif en phase III ; LIXIPARK encourageant ; sémaglutide en cours — la classe n’est pas uniforme."),
        ("4", "Preuve à construire", "Essais plus larges, plus précoces, mieux ciblés par biomarqueurs, avec suivi prolongé."),
        ("5", "Pharmacien central", "Éducation, vigilance, coordination et sécurisation — aujourd’hui en métabolisme, demain peut-être en neurologie."),
    ]
    for i, (n, t, d) in enumerate(msgs):
        y = Inches(1.45) + Inches(i * 0.95)
        add_round(s, Inches(0.35), y, Inches(12.6), Inches(0.85), WHITE)
        add_rect(s, Inches(0.35), y, Inches(0.7), Inches(0.85), ACCENT if i == 2 else NAVY)
        add_textbox(s, Inches(0.35), y + Inches(0.2), Inches(0.7), Inches(0.45),
                    n, size=18, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
        add_textbox(s, Inches(1.25), y + Inches(0.1), Inches(11.4), Inches(0.3),
                    t, size=14, bold=True, color=NAVY, font="Georgia")
        add_textbox(s, Inches(1.25), y + Inches(0.42), Inches(11.4), Inches(0.35),
                    d, size=12, color=MUTED)
    # Override footer with merci
    add_rect(s, 0, Inches(7.12), SLIDE_W, Inches(0.38), NAVY)
    add_textbox(s, Inches(0.35), Inches(7.16), Inches(10), Inches(0.28),
                "Merci de votre attention  —  Discussion & questions",
                size=11, bold=True, color=WHITE)
    add_textbox(s, Inches(11.5), Inches(7.16), Inches(1.5), Inches(0.28),
                f"{p}  /  {TOTAL}", size=10, color=WHITE, align=PP_ALIGN.RIGHT)

    assert p == TOTAL, f"Expected {TOTAL} slides, got {p}"

    out = "/workspace/docs/presentation/Soutenance_GLP1_Parkinson.pptx"
    prs.save(out)
    print(f"Saved: {out}")
    print(f"Slides: {len(prs.slides)} (counter={p})")
    return out


if __name__ == "__main__":
    build()
