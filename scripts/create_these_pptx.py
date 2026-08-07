#!/usr/bin/env python3
"""Generate thesis defense PowerPoint: Agonistes du GLP-1 & Parkinson."""

from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.enum.shapes import MSO_SHAPE

# --- Palette (academic medical: deep teal + charcoal, no purple/cream clichés) ---
NAVY = RGBColor(0x0B, 0x3D, 0x4A)       # deep teal-navy
TEAL = RGBColor(0x1A, 0x6B, 0x7A)        # mid teal
ACCENT = RGBColor(0xC4, 0x7A, 0x2C)      # warm amber accent (sparingly)
LIGHT = RGBColor(0xF5, 0xF7, 0xF8)       # cool off-white
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
DARK = RGBColor(0x1C, 0x24, 0x28)        # near-black text
MUTED = RGBColor(0x5A, 0x6A, 0x72)       # secondary text
SOFT = RGBColor(0xE6, 0xEE, 0xF0)        # soft panel bg
ROW_ALT = RGBColor(0xF0, 0xF5, 0xF6)

SLIDE_W = Inches(13.333)
SLIDE_H = Inches(7.5)


def set_run(run, size=18, bold=False, color=DARK, font="Calibri"):
    run.font.size = Pt(size)
    run.font.bold = bold
    run.font.color.rgb = color
    run.font.name = font


def add_bg(slide, color):
    shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, SLIDE_W, SLIDE_H)
    shape.fill.solid()
    shape.fill.fore_color.rgb = color
    shape.line.fill.background()
    # send to back
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
    return shape


def add_textbox(slide, left, top, width, height, text, size=18, bold=False,
                color=DARK, align=PP_ALIGN.LEFT, font="Calibri", anchor=MSO_ANCHOR.TOP):
    box = slide.shapes.add_textbox(left, top, width, height)
    tf = box.text_frame
    tf.word_wrap = True
    tf.auto_size = None
    try:
        tf._txBody.bodyPr.set("anchor", {MSO_ANCHOR.TOP: "t", MSO_ANCHOR.MIDDLE: "ctr", MSO_ANCHOR.BOTTOM: "b"}[anchor])
    except Exception:
        pass
    p = tf.paragraphs[0]
    p.alignment = align
    run = p.add_run()
    run.text = text
    set_run(run, size=size, bold=bold, color=color, font=font)
    return box


def add_bullets(slide, left, top, width, height, items, size=16, color=DARK, spacing=8):
    box = slide.shapes.add_textbox(left, top, width, height)
    tf = box.text_frame
    tf.word_wrap = True
    for i, item in enumerate(items):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = PP_ALIGN.LEFT
        p.level = 0
        p.space_after = Pt(spacing)
        # bullet via text prefix for reliability across platforms
        run = p.add_run()
        run.text = "•  " + item
        set_run(run, size=size, color=color)
    return box


def add_footer(slide, page, total=16):
    add_rect(slide, 0, Inches(7.15), SLIDE_W, Inches(0.35), NAVY)
    add_textbox(slide, Inches(0.4), Inches(7.18), Inches(10), Inches(0.3),
                "Agonistes du GLP-1 — Mise au point et potentiel dans la maladie de Parkinson",
                size=10, color=WHITE)
    add_textbox(slide, Inches(11.8), Inches(7.18), Inches(1.2), Inches(0.3),
                f"{page} / {total}", size=10, color=WHITE, align=PP_ALIGN.RIGHT)


def section_header(slide, chapter, title, subtitle=None):
    add_bg(slide, LIGHT)
    add_rect(slide, 0, 0, SLIDE_W, Inches(1.35), NAVY)
    add_textbox(slide, Inches(0.5), Inches(0.25), Inches(12), Inches(0.35),
                chapter, size=13, color=RGBColor(0xA8, 0xD0, 0xD8), bold=True)
    add_textbox(slide, Inches(0.5), Inches(0.55), Inches(12), Inches(0.55),
                title, size=28, bold=True, color=WHITE, font="Georgia")
    if subtitle:
        add_textbox(slide, Inches(0.5), Inches(1.5), Inches(12.3), Inches(0.4),
                    subtitle, size=14, color=MUTED)


def add_table(slide, left, top, width, rows, col_widths, font_size=11):
    """rows: list of lists; first row = header."""
    n_rows = len(rows)
    n_cols = len(rows[0])
    table_shape = slide.shapes.add_table(n_rows, n_cols, left, top, width, Inches(0.4 * n_rows))
    table = table_shape.table
    for i, w in enumerate(col_widths):
        table.columns[i].width = w
    for r, row in enumerate(rows):
        for c, cell_text in enumerate(row):
            cell = table.cell(r, c)
            cell.text = ""
            p = cell.text_frame.paragraphs[0]
            p.alignment = PP_ALIGN.LEFT if c > 0 or r > 0 else PP_ALIGN.LEFT
            run = p.add_run()
            run.text = cell_text
            is_header = r == 0
            set_run(run, size=font_size, bold=is_header,
                    color=WHITE if is_header else DARK)
            # fill
            fill = cell.fill
            fill.solid()
            if is_header:
                fill.fore_color.rgb = NAVY
            elif r % 2 == 0:
                fill.fore_color.rgb = ROW_ALT
            else:
                fill.fore_color.rgb = WHITE
    return table_shape


def build():
    prs = Presentation()
    prs.slide_width = SLIDE_W
    prs.slide_height = SLIDE_H
    blank = prs.slide_layouts[6]
    total = 16

    # ========== 1. TITLE ==========
    s = prs.slides.add_slide(blank)
    add_bg(s, NAVY)
    add_rect(s, 0, Inches(5.9), SLIDE_W, Inches(1.6), TEAL)
    add_textbox(s, Inches(0.8), Inches(1.6), Inches(11.5), Inches(0.4),
                "Soutenance de thèse", size=14, color=RGBColor(0xA8, 0xD0, 0xD8), bold=True)
    add_textbox(s, Inches(0.8), Inches(2.1), Inches(11.5), Inches(1.6),
                "Agonistes du GLP-1 :\nMise au point et potentiel prometteur\npour la maladie de Parkinson",
                size=32, bold=True, color=WHITE, font="Georgia")
    add_textbox(s, Inches(0.8), Inches(4.5), Inches(11.5), Inches(0.5),
                "Repositionnement thérapeutique • Neuroprotection • Données cliniques",
                size=16, color=RGBColor(0xC8, 0xDE, 0xE4))
    add_textbox(s, Inches(0.8), Inches(6.2), Inches(11.5), Inches(0.8),
                "Pharmacie • Synthèse bibliographique\nPrésentation de soutenance",
                size=14, color=WHITE)

    # ========== 2. PLAN ==========
    s = prs.slides.add_slide(blank)
    section_header(s, "PLAN", "Organisation de la présentation")
    items = [
        ("01", "Contexte", "Maladie de Parkinson : besoin médical non satisfait"),
        ("02", "Chapitre 1", "Physiologie du GLP-1 et panorama pharmacologique"),
        ("03", "Chapitre 2", "Intérêt métabolique, cardio-rénal et tolérance"),
        ("04", "Chapitre 3", "Repositionnement dans la maladie de Parkinson"),
        ("05", "Conclusion", "Synthèse, rôle du pharmacien et perspectives"),
    ]
    for i, (num, title, desc) in enumerate(items):
        y = Inches(1.7) + Inches(i * 0.95)
        add_rect(s, Inches(0.5), y, Inches(1.1), Inches(0.75), NAVY)
        add_textbox(s, Inches(0.5), y + Inches(0.15), Inches(1.1), Inches(0.5),
                    num, size=22, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
        add_textbox(s, Inches(1.9), y + Inches(0.05), Inches(10), Inches(0.35),
                    title, size=20, bold=True, color=NAVY, font="Georgia")
        add_textbox(s, Inches(1.9), y + Inches(0.4), Inches(10), Inches(0.35),
                    desc, size=14, color=MUTED)
    add_footer(s, 2, total)

    # ========== 3. PARKINSON ==========
    s = prs.slides.add_slide(blank)
    section_header(s, "INTRODUCTION", "La maladie de Parkinson : un défi thérapeutique",
                   "Seconde maladie neurodégénérative la plus fréquente après Alzheimer")
    # three cards
    cards = [
        ("Physiopathologie", [
            "Dégénérescence dopaminergique (SNpc)",
            "Agrégation d’α-synucléine",
            "Stress oxydatif, neuroinflammation",
            "Dysfonction mitochondriale",
        ]),
        ("Clinique", [
            "Bradykinésie, rigidité, tremblement",
            "Instabilité posturale",
            "Symptômes non moteurs majeurs",
            "Impact majeur sur la qualité de vie",
        ]),
        ("Limites actuelles", [
            "Traitements purement symptomatiques",
            "Lévodopa = référence",
            "Fluctuations et dyskinésies",
            "Aucun modificateur de maladie validé",
        ]),
    ]
    for i, (title, bullets) in enumerate(cards):
        x = Inches(0.4) + Inches(i * 4.25)
        add_rect(s, x, Inches(2.1), Inches(4.0), Inches(4.5), WHITE)
        add_rect(s, x, Inches(2.1), Inches(4.0), Inches(0.55), TEAL)
        add_textbox(s, x + Inches(0.2), Inches(2.18), Inches(3.6), Inches(0.4),
                    title, size=16, bold=True, color=WHITE)
        add_bullets(s, x + Inches(0.2), Inches(2.85), Inches(3.6), Inches(3.4),
                    bullets, size=14, spacing=10)
    add_footer(s, 3, total)

    # ========== 4. WHY GLP-1 ==========
    s = prs.slides.add_slide(blank)
    section_header(s, "INTRODUCTION", "Pourquoi les agonistes du GLP-1 ?",
                   "Du diabète de type 2 au repositionnement en neurologie")
    add_bullets(s, Inches(0.5), Inches(1.7), Inches(7.5), Inches(4.5), [
        "Repositionnement médicamenteux : profil de tolérance déjà connu",
        "Récepteurs GLP-1R présents dans le système nerveux central",
        "Effets anti-inflammatoires, anti-oxydants et anti-apoptotiques (préclinique)",
        "Hypothèse : ralentir la neurodégénérescence, pas seulement les symptômes",
        "Essais cliniques : exénatide, lixisénatide (LIXIPARK), sémaglutide…",
    ], size=16, spacing=12)

    # key message box
    add_rect(s, Inches(8.3), Inches(1.9), Inches(4.5), Inches(4.2), NAVY)
    add_textbox(s, Inches(8.55), Inches(2.2), Inches(4.0), Inches(0.5),
                "Message clé", size=14, bold=True, color=ACCENT)
    add_textbox(s, Inches(8.55), Inches(2.8), Inches(4.0), Inches(2.8),
                "Une classe métabolique mature, au profil cardio-rénal solide, dont la plausibilité biologique justifie l’exploration d’un effet neuroprotecteur dans la maladie de Parkinson.",
                size=15, color=WHITE)
    add_footer(s, 4, total)

    # ========== 5. OBJECTIVES ==========
    s = prs.slides.add_slide(blank)
    section_header(s, "OBJECTIFS", "Objectifs de la thèse")
    objs = [
        ("1", "Physiologie & pharmacologie", "Décrire le GLP-1, son récepteur et le panorama des agonistes disponibles"),
        ("2", "Indications validées", "Analyser l’intérêt dans le DT2, l’obésité et la protection cardio-rénale"),
        ("3", "Repositionnement Parkinson", "Évaluer mécanismes, données précliniques et cliniques (exénatide, LIXIPARK…)"),
        ("4", "Rôle du pharmacien", "Préciser l’accompagnement, la vigilance et la coordination pluridisciplinaire"),
    ]
    for i, (n, t, d) in enumerate(objs):
        y = Inches(1.7) + Inches(i * 1.2)
        add_rect(s, Inches(0.5), y, Inches(12.3), Inches(1.05), WHITE)
        add_rect(s, Inches(0.5), y, Inches(0.15), Inches(1.05), ACCENT if i == 2 else TEAL)
        add_textbox(s, Inches(0.9), y + Inches(0.15), Inches(0.6), Inches(0.7),
                    n, size=28, bold=True, color=NAVY)
        add_textbox(s, Inches(1.6), y + Inches(0.15), Inches(10.5), Inches(0.4),
                    t, size=18, bold=True, color=NAVY, font="Georgia")
        add_textbox(s, Inches(1.6), y + Inches(0.55), Inches(10.5), Inches(0.4),
                    d, size=14, color=MUTED)
    add_footer(s, 5, total)

    # ========== 6. GLP-1 PHYSIO ==========
    s = prs.slides.add_slide(blank)
    section_header(s, "CHAPITRE 1 — PHYSIOLOGIE", "Le GLP-1 : hormone incrétine",
                   "Production, formes actives et contrainte pharmacocinétique")
    left_items = [
        "Produit par les cellules L (iléon distal, côlon)",
        "Issu du clivage du proglucagon",
        "Formes actives : GLP-1(7-36) amide et (7-37)",
        "Sécrétion stimulée par les nutriments",
        "Effet incrétine glucose-dépendant",
    ]
    add_rect(s, Inches(0.4), Inches(1.85), Inches(6.1), Inches(4.6), WHITE)
    add_textbox(s, Inches(0.65), Inches(2.05), Inches(5.6), Inches(0.4),
                "Physiologie", size=18, bold=True, color=NAVY, font="Georgia")
    add_bullets(s, Inches(0.65), Inches(2.6), Inches(5.6), Inches(3.5), left_items, size=15, spacing=10)

    add_rect(s, Inches(6.8), Inches(1.85), Inches(6.1), Inches(4.6), NAVY)
    add_textbox(s, Inches(7.1), Inches(2.2), Inches(5.5), Inches(0.4),
                "Point critique", size=16, bold=True, color=ACCENT)
    add_textbox(s, Inches(7.1), Inches(2.8), Inches(5.5), Inches(2.5),
                "Demi-vie plasmatique très courte (1–2 min) par inactivation DPP-4.\n\n→ Développement d’agonistes résistants à la DPP-4, à demi-vie prolongée.",
                size=16, color=WHITE)
    add_textbox(s, Inches(7.1), Inches(5.4), Inches(5.5), Inches(0.7),
                "Cible : GLP-1R (GPCR classe B)", size=14, bold=True, color=RGBColor(0xA8, 0xD0, 0xD8))
    add_footer(s, 6, total)

    # ========== 7. RECEPTOR ==========
    s = prs.slides.add_slide(blank)
    section_header(s, "CHAPITRE 1 — RÉCEPTEUR", "GLP-1R : distribution et signalisation",
                   "Une cible au-delà du pancréas")
    add_textbox(s, Inches(0.5), Inches(1.7), Inches(6), Inches(0.4),
                "Expression tissulaire", size=18, bold=True, color=NAVY, font="Georgia")
    add_bullets(s, Inches(0.5), Inches(2.2), Inches(6), Inches(3.5), [
        "Cellules β pancréatiques (insuline)",
        "Cœur, rein, tube digestif",
        "SNC : hypothalamus, tronc cérébral, hippocampe, aire postrema",
        "Distribution étendue → effets pléiotropes",
    ], size=15, spacing=10)

    add_textbox(s, Inches(7), Inches(1.7), Inches(5.8), Inches(0.4),
                "Voies intracellulaires", size=18, bold=True, color=NAVY, font="Georgia")
    pathways = [
        ("AMPc → PKA / EPAC2", "Sécrétion d’insuline, survie cellulaire"),
        ("PI3K / Akt", "Anti-apoptose, métabolisme énergétique"),
        ("MAPK / ERK", "Prolifération, réparation, neuroprotection"),
    ]
    for i, (t, d) in enumerate(pathways):
        y = Inches(2.25) + Inches(i * 1.15)
        add_rect(s, Inches(7), y, Inches(5.8), Inches(1.0), WHITE)
        add_textbox(s, Inches(7.25), y + Inches(0.15), Inches(5.3), Inches(0.35),
                    t, size=15, bold=True, color=TEAL)
        add_textbox(s, Inches(7.25), y + Inches(0.5), Inches(5.3), Inches(0.35),
                    d, size=13, color=MUTED)
    add_footer(s, 7, total)

    # ========== 8. AGONISTS TABLE ==========
    s = prs.slides.add_slide(blank)
    section_header(s, "CHAPITRE 1 — PANORAMA", "Les agonistes du GLP-1R",
                   "Courte vs longue durée d’action")
    rows = [
        ["Molécule", "Profil", "Administration", "Particularité"],
        ["Exénatide", "Courte", "2×/j (ou LP 1×/sem.)", "Exendine-4 ; essais Parkinson"],
        ["Lixisénatide", "Courte", "1×/j", "LIXIPARK ; postprandial"],
        ["Liraglutide", "Longue", "1×/j", "DT2 + obésité ; LEADER"],
        ["Dulaglutide", "Longue", "1×/sem.", "REWIND (CV)"],
        ["Sémaglutide", "Longue", "1×/sem. / oral", "STEP ; SUSTAIN-6 ; essais PD"],
        ["Tirzépatide", "Double GIP/GLP-1", "1×/sem.", "Efficacité métabolique majeure"],
    ]
    add_table(s, Inches(0.4), Inches(1.75), Inches(12.5), rows,
              [Inches(2.2), Inches(2.4), Inches(3.2), Inches(4.7)], font_size=12)
    add_textbox(s, Inches(0.5), Inches(6.5), Inches(12.3), Inches(0.45),
                "Longue durée → meilleur contrôle HbA1c / jeûne  •  Courte durée → effet gastrique plus marqué (moins de tachyphylaxie)",
                size=13, color=MUTED)
    add_footer(s, 8, total)

    # ========== 9. CHAPTER 2 METABOLIC ==========
    s = prs.slides.add_slide(blank)
    section_header(s, "CHAPITRE 2 — INDICATIONS VALIDÉES", "Diabète de type 2 et obésité",
                   "Efficacité métabolique aujourd’hui solidement établie")
    # two columns
    add_rect(s, Inches(0.4), Inches(1.85), Inches(6.1), Inches(4.6), WHITE)
    add_rect(s, Inches(0.4), Inches(1.85), Inches(6.1), Inches(0.55), TEAL)
    add_textbox(s, Inches(0.6), Inches(1.95), Inches(5.7), Inches(0.4),
                "Diabète de type 2", size=17, bold=True, color=WHITE)
    add_bullets(s, Inches(0.6), Inches(2.6), Inches(5.7), Inches(3.5), [
        "Insuline glucose-dépendante + ↓ glucagon",
        "↓ HbA1c typiquement 0,8–1,8 %",
        "Faible risque d’hypoglycémie en monothérapie",
        "Place majeure ADA/EASD ; précoce si risque CV/MRC",
        "Sémaglutide & tirzépatide parmi les plus efficaces",
    ], size=14, spacing=8)

    add_rect(s, Inches(6.8), Inches(1.85), Inches(6.1), Inches(4.6), WHITE)
    add_rect(s, Inches(6.8), Inches(1.85), Inches(6.1), Inches(0.55), NAVY)
    add_textbox(s, Inches(7.0), Inches(1.95), Inches(5.7), Inches(0.4),
                "Obésité / poids", size=17, bold=True, color=WHITE)
    add_bullets(s, Inches(7.0), Inches(2.6), Inches(5.7), Inches(3.5), [
        "↓ appétit, ↑ satiété (action centrale)",
        "SCALE (liraglutide 3 mg)",
        "STEP : sémaglutide ≈ −15 % de poids",
        "Amélioration des paramètres cardiométaboliques",
        "Tirzépatide : perte pondérale encore supérieure",
    ], size=14, spacing=8)
    add_footer(s, 9, total)

    # ========== 10. CARDIO RENAL ==========
    s = prs.slides.add_slide(blank)
    section_header(s, "CHAPITRE 2 — PROTECTION", "Cardioprotection et néphroprotection",
                   "Un bénéfice au-delà du contrôle glycémique")
    rows = [
        ["Essai", "Molécule", "Résultat principal"],
        ["LEADER", "Liraglutide", "↓ MACE, ↓ mortalité CV et toutes causes ; ↓ macroalbuminurie"],
        ["SUSTAIN-6", "Sémaglutide", "↓ événements CV majeurs ; signal rénal favorable"],
        ["REWIND", "Dulaglutide", "Bénéfice cardiovasculaire démontré"],
    ]
    add_table(s, Inches(0.4), Inches(1.8), Inches(12.5), rows,
              [Inches(2.5), Inches(2.5), Inches(7.5)], font_size=13)
    add_textbox(s, Inches(0.5), Inches(4.3), Inches(12.3), Inches(0.4),
                "Tolérance", size=16, bold=True, color=NAVY, font="Georgia")
    add_bullets(s, Inches(0.5), Inches(4.75), Inches(12.3), Inches(2), [
        "EI digestifs fréquents (nausées, vomissements, diarrhées) — souvent transitoires ; titration progressive",
        "Hypoglycémie rare seule ; ↑ si association insuline / sulfamides",
        "Profil globalement favorable ; vigilance pancréatite / complications biliaires",
    ], size=14, spacing=6)
    add_footer(s, 10, total)

    # ========== 11. NEUROPROTECTION ==========
    s = prs.slides.add_slide(blank)
    section_header(s, "CHAPITRE 3 — MÉCANISMES", "Mécanismes neuroprotecteurs putatifs",
                   "Pourquoi cibler le GLP-1R dans la maladie de Parkinson ?")
    mechs = [
        ("Survie neuronale", "cAMP/PKA, PI3K/Akt, MAPK/ERK → ↓ apoptose"),
        ("Mitochondries", "Amélioration fonctionnelle, ↓ radicaux libres"),
        ("Neuroinflammation", "Atténuation de l’activation microgliale"),
        ("α-synucléine", "Autophagie / dégradation → ↓ accumulation"),
        ("Stress oxydatif", "Limitation des lésions oxydatives"),
        ("Plasticité", "Soutien du métabolisme et de l’intégrité cellulaire"),
    ]
    for i, (t, d) in enumerate(mechs):
        col = i % 3
        row = i // 3
        x = Inches(0.4) + Inches(col * 4.25)
        y = Inches(1.85) + Inches(row * 2.35)
        add_rect(s, x, y, Inches(4.05), Inches(2.1), WHITE)
        add_rect(s, x, y, Inches(0.12), Inches(2.1), ACCENT if i in (0, 2, 3) else TEAL)
        add_textbox(s, x + Inches(0.35), y + Inches(0.4), Inches(3.5), Inches(0.5),
                    t, size=16, bold=True, color=NAVY, font="Georgia")
        add_textbox(s, x + Inches(0.35), y + Inches(1.0), Inches(3.5), Inches(0.8),
                    d, size=13, color=MUTED)
    add_footer(s, 11, total)

    # ========== 12. PRECLINICAL ==========
    s = prs.slides.add_slide(blank)
    section_header(s, "CHAPITRE 3 — PRÉCLINIQUE", "Données expérimentales",
                   "Modèles MPTP et 6-OHDA : plausibilité biologique forte")
    add_bullets(s, Inches(0.5), Inches(1.75), Inches(12.3), Inches(3.5), [
        "Exénatide : préservation des neurones dopaminergiques, ↓ stress oxydatif et inflammation",
        "Liraglutide : amélioration motrice et protection neuronale",
        "Lixisénatide : intérêt pour la pénétration / action centrale",
        "Sémaglutide : survie neuronale, autophagie, ↓ agrégation d’α-synucléine",
    ], size=16, spacing=12)
    add_rect(s, Inches(0.5), Inches(5.2), Inches(12.3), Inches(1.5), SOFT)
    add_textbox(s, Inches(0.75), Inches(5.45), Inches(11.8), Inches(1.1),
                "Limite majeure : la transposition du modèle animal à la clinique reste difficile — plusieurs essais humains ont donné des résultats mitigés ou négatifs malgré des signaux précliniques favorables.",
                size=15, color=DARK)
    add_footer(s, 12, total)

    # ========== 13. CLINICAL ==========
    s = prs.slides.add_slide(blank)
    section_header(s, "CHAPITRE 3 — CLINIQUE", "Essais chez l’humain : résultats hétérogènes",
                   "Exénatide, LIXIPARK (lixisénatide) et sémaglutide")
    rows = [
        ["Molécule / essai", "Population", "Résultat"],
        ["Exénatide (phase III)", "Patients PD", "Signal ouvert non confirmé ; pas de bénéfice significatif sur la progression"],
        ["Lixisénatide — LIXIPARK", "PD stade précoce", "Stabilisation motrice vs aggravation placebo ; effet après washout"],
        ["Sémaglutide", "Essais en cours", "Candidat crédible ; résultats définitifs en attente"],
    ]
    add_table(s, Inches(0.35), Inches(1.75), Inches(12.6), rows,
              [Inches(3.4), Inches(2.8), Inches(6.4)], font_size=12)
    add_rect(s, Inches(0.4), Inches(4.7), Inches(12.5), Inches(2.0), NAVY)
    add_textbox(s, Inches(0.7), Inches(4.95), Inches(11.9), Inches(0.4),
                "Lecture critique", size=15, bold=True, color=ACCENT)
    add_textbox(s, Inches(0.7), Inches(5.4), Inches(11.9), Inches(1.0),
                "LIXIPARK est le signal le plus encourageant (stade précoce, persistance après washout). L’échec de l’exénatide en phase III rappelle la prudence : taille d’essai, sélection des patients, durée de suivi et passage de la BHE varient selon les molécules.",
                size=14, color=WHITE)
    add_footer(s, 13, total)

    # ========== 14. LIMITS & PERSPECTIVES ==========
    s = prs.slides.add_slide(blank)
    section_header(s, "CHAPITRE 3 — DISCUSSION", "Limites et perspectives",
                   "Ce qu’il reste à démontrer")
    add_rect(s, Inches(0.4), Inches(1.85), Inches(6.1), Inches(4.6), WHITE)
    add_rect(s, Inches(0.4), Inches(1.85), Inches(6.1), Inches(0.55), RGBColor(0x8B, 0x3A, 0x2A))
    add_textbox(s, Inches(0.6), Inches(1.95), Inches(5.7), Inches(0.4),
                "Limites", size=17, bold=True, color=WHITE)
    add_bullets(s, Inches(0.6), Inches(2.6), Inches(5.7), Inches(3.5), [
        "Peu d’essais, souvent de taille modeste",
        "Difficile de séparer effet symptomatique vs modificateur",
        "Évolution lente de la PD vs durées d’étude courtes",
        "Passage variable de la barrière hémato-encéphalique",
        "Hétérogénéité inter-molécules",
    ], size=14, spacing=8)

    add_rect(s, Inches(6.8), Inches(1.85), Inches(6.1), Inches(4.6), WHITE)
    add_rect(s, Inches(6.8), Inches(1.85), Inches(6.1), Inches(0.55), TEAL)
    add_textbox(s, Inches(7.0), Inches(1.95), Inches(5.7), Inches(0.4),
                "Perspectives", size=17, bold=True, color=WHITE)
    add_bullets(s, Inches(7.0), Inches(2.6), Inches(5.7), Inches(3.5), [
        "Intervention précoce / prodromale",
        "Sélection par biomarqueurs",
        "Essais plus larges et suivi prolongé",
        "Analogues plus pénétrants / formulations adaptées",
        "Approches combinées (métabolique + neuroprotecteur)",
    ], size=14, spacing=8)
    add_footer(s, 14, total)

    # ========== 15. PHARMACIST ==========
    s = prs.slides.add_slide(blank)
    section_header(s, "CHAPITRE 3 — PHARMACIEN", "Rôle du pharmacien",
                   "Éducation, vigilance et coordination")
    roles = [
        ("Éducation thérapeutique", "Technique d’injection, titration, régularité (formes hebdomadaires)"),
        ("Tolérance", "Anticiper et limiter les EI digestifs — 1ʳᵉ cause d’arrêt"),
        ("Pharmacovigilance", "Interactions (insuline/sulfamides), pancréatite, biliaire ; déclaration EI"),
        ("Essais cliniques", "Traçabilité, conservation, dispensation conforme au protocole"),
        ("Information patient", "Distinguer usage métabolique validé vs usage neurologique expérimental"),
        ("Coordination", "Lien pharmacien – neurologue – endocrinologue (PD + DT2/obésité)"),
    ]
    for i, (t, d) in enumerate(roles):
        col = i % 3
        row = i // 3
        x = Inches(0.4) + Inches(col * 4.25)
        y = Inches(1.85) + Inches(row * 2.35)
        add_rect(s, x, y, Inches(4.05), Inches(2.1), WHITE)
        add_textbox(s, x + Inches(0.25), y + Inches(0.35), Inches(3.55), Inches(0.55),
                    t, size=15, bold=True, color=NAVY, font="Georgia")
        add_textbox(s, x + Inches(0.25), y + Inches(1.0), Inches(3.55), Inches(0.85),
                    d, size=13, color=MUTED)
    add_footer(s, 15, total)

    # ========== 16. CONCLUSION ==========
    s = prs.slides.add_slide(blank)
    section_header(s, "CONCLUSION", "Messages à retenir")
    msgs = [
        "Les agonistes du GLP-1 ont une place incontournable dans le DT2, l’obésité et la protection cardio-rénale.",
        "Leur repositionnement dans la Parkinson repose sur une plausibilité biologique solide (préclinique).",
        "Les données cliniques restent hétérogènes : échec phase III de l’exénatide vs signal encourageant de LIXIPARK.",
        "Des essais plus larges, mieux ciblés et plus longs sont nécessaires pour établir un effet modificateur de maladie.",
        "Le pharmacien est un acteur clé d’éducation, de vigilance et de coordination dans cette dynamique.",
    ]
    for i, m in enumerate(msgs):
        y = Inches(1.65) + Inches(i * 0.95)
        add_rect(s, Inches(0.45), y, Inches(0.7), Inches(0.7), NAVY if i != 2 else ACCENT)
        add_textbox(s, Inches(0.45), y + Inches(0.15), Inches(0.7), Inches(0.45),
                    str(i + 1), size=20, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
        add_textbox(s, Inches(1.4), y + Inches(0.1), Inches(11.3), Inches(0.7),
                    m, size=15, color=DARK)
    add_footer(s, 16, total)

    # ========== 17. THANKS (bonus) ==========
    s = prs.slides.add_slide(blank)
    add_bg(s, NAVY)
    add_textbox(s, Inches(0.8), Inches(2.4), Inches(11.7), Inches(1.0),
                "Merci de votre attention", size=40, bold=True, color=WHITE,
                align=PP_ALIGN.CENTER, font="Georgia")
    add_textbox(s, Inches(0.8), Inches(3.6), Inches(11.7), Inches(0.6),
                "Questions — Discussion", size=22, color=RGBColor(0xA8, 0xD0, 0xD8),
                align=PP_ALIGN.CENTER)
    add_textbox(s, Inches(0.8), Inches(5.2), Inches(11.7), Inches(0.8),
                "Agonistes du GLP-1 • Mise au point et potentiel prometteur\npour la maladie de Parkinson",
                size=14, color=RGBColor(0xC8, 0xDE, 0xE4), align=PP_ALIGN.CENTER)

    out = "/workspace/docs/presentation/Soutenance_GLP1_Parkinson.pptx"
    prs.save(out)
    print(f"Saved: {out}")
    print(f"Slides: {len(prs.slides)}")
    return out


if __name__ == "__main__":
    build()
