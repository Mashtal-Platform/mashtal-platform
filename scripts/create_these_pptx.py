#!/usr/bin/env python3
"""
Soutenance 15–20 min — 21 diapositives.
Fil directeur : piste de repositionnement crédible, sans preuve clinique
suffisante pour une indication dans Parkinson.
"""

from pathlib import Path

from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN
from pptx.util import Inches, Pt

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
WARN = RGBColor(0x8B, 0x45, 0x13)

SLIDE_W = Inches(13.333)
SLIDE_H = Inches(7.5)
TOTAL = 21
ASSETS = Path("/workspace/docs/presentation/assets")


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
    sp_tree = slide.shapes._spTree
    sp = shape._element
    sp_tree.remove(sp)
    sp_tree.insert(2, sp)
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


def add_footer(slide, page, cite=None):
    add_rect(slide, 0, Inches(7.12), SLIDE_W, Inches(0.38), NAVY)
    left = "Sara Yousef & Wiam Bourhan  ·  Université Libanaise — Faculté de Pharmacie"
    if cite:
        left = cite
    add_textbox(slide, Inches(0.35), Inches(7.16), Inches(10.6), Inches(0.28),
                left, size=10, color=WHITE)
    add_textbox(slide, Inches(11.4), Inches(7.16), Inches(1.6), Inches(0.28),
                f"{page}  /  {TOTAL}", size=10, color=WHITE, align=PP_ALIGN.RIGHT)


def header(slide, kicker, title, subtitle=None):
    add_bg(slide, LIGHT)
    h = Inches(1.18) if not subtitle else Inches(1.36)
    add_rect(slide, 0, 0, SLIDE_W, h, NAVY)
    add_rect(slide, 0, 0, Inches(0.12), h, ACCENT)
    add_textbox(slide, Inches(0.4), Inches(0.16), Inches(12.5), Inches(0.26),
                kicker.upper(), size=11, bold=True, color=TEAL_LT)
    add_textbox(slide, Inches(0.4), Inches(0.44), Inches(12.5), Inches(0.46),
                title, size=22, bold=True, color=WHITE, font="Georgia")
    if subtitle:
        add_textbox(slide, Inches(0.4), Inches(0.96), Inches(12.5), Inches(0.28),
                    subtitle, size=13, color=RGBColor(0xB0, 0xD0, 0xD8))


def add_nested(slide, left, top, width, height, items, size=16, spacing=10):
    box = slide.shapes.add_textbox(left, top, width, height)
    tf = box.text_frame
    tf.word_wrap = True
    first = True
    for item in items:
        if isinstance(item, tuple):
            title, children = item
            p = tf.paragraphs[0] if first else tf.add_paragraph()
            first = False
            p.space_after = Pt(4)
            run = p.add_run()
            run.text = "▸  " + title
            set_run(run, size=size, bold=True, color=DARK)
            for child in children:
                p = tf.add_paragraph()
                p.space_after = Pt(3)
                run = p.add_run()
                run.text = "      ○  " + child
                set_run(run, size=size - 1, bold=False, color=MUTED)
        else:
            p = tf.paragraphs[0] if first else tf.add_paragraph()
            first = False
            p.space_after = Pt(spacing)
            run = p.add_run()
            run.text = "▸  " + item
            set_run(run, size=size, bold=False, color=DARK)
    return box


def add_table(slide, left, top, width, rows, col_widths, font_size=13, row_h=0.5):
    n_rows = len(rows)
    table_shape = slide.shapes.add_table(
        n_rows, len(rows[0]), left, top, width, Inches(row_h * n_rows)
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
            set_run(run, size=font_size, bold=is_header, color=WHITE if is_header else DARK)
            cell.fill.solid()
            if is_header:
                cell.fill.fore_color.rgb = NAVY
            elif r % 2 == 0:
                cell.fill.fore_color.rgb = ROW_ALT
            else:
                cell.fill.fore_color.rgb = WHITE
    return table_shape


def pic(slide, name, left, top, width, height):
    path = ASSETS / name
    if not path.exists() and path.suffix == ".png":
        alt = path.with_suffix(".jpg")
        if alt.exists():
            path = alt
    if path.suffix == ".png":
        jpg = path.with_suffix(".jpg")
        if jpg.exists():
            path = jpg
    return slide.shapes.add_picture(str(path), left, top, width=width, height=height)


def split_slide(prs, blank, page, kicker, title, items, image, cite=None,
                size=16, spacing=9, img_w=6.15):
    s = prs.slides.add_slide(blank)
    header(s, kicker, title)
    add_round(s, Inches(0.35), Inches(1.5), Inches(6.45), Inches(5.25), WHITE)
    add_nested(s, Inches(0.55), Inches(1.7), Inches(6.1), Inches(4.9),
               items, size=size, spacing=spacing)
    pic(s, image, Inches(6.95), Inches(1.5), Inches(img_w), Inches(5.25))
    add_footer(s, page, cite)
    return s


def build():
    prs = Presentation()
    prs.slide_width = SLIDE_W
    prs.slide_height = SLIDE_H
    blank = prs.slide_layouts[6]
    p = 0

    # 1. TITRE
    p += 1
    s = prs.slides.add_slide(blank)
    pic(s, "v01_cerveau_pancreas.png", 0, 0, SLIDE_W, SLIDE_H)
    add_rect(s, 0, 0, Inches(8.35), SLIDE_H, NAVY)
    add_rect(s, Inches(8.35), 0, Inches(0.08), SLIDE_H, ACCENT)
    pic(s, "ul_logo.png", Inches(0.45), Inches(0.28), Inches(0.85), Inches(0.85))
    pic(s, "ul_logo_faculty.jpg", Inches(1.4), Inches(0.28), Inches(0.85), Inches(0.85))
    add_textbox(s, Inches(2.4), Inches(0.38), Inches(5.6), Inches(0.7),
                "Université Libanaise\nFaculté de Pharmacie",
                size=13, bold=True, color=TEAL_LT)
    add_textbox(s, Inches(0.5), Inches(1.35), Inches(7.5), Inches(0.35),
                "THÈSE  ·  DOCTOR IN PHARMACY PRACTICE",
                size=12, bold=True, color=ACCENT)
    add_textbox(
        s, Inches(0.5), Inches(1.85), Inches(7.6), Inches(2.3),
        "Agonistes du GLP-1 :\nmise au point et potentiel\nprometteur pour la maladie\nde Parkinson",
        size=24, bold=True, color=WHITE, font="Georgia",
    )
    add_textbox(s, Inches(0.5), Inches(4.4), Inches(7.5), Inches(0.7),
                "Sara Yousef  &  Wiam Bourhan\nDirectrice de thèse : Pr. Dalia Khachman",
                size=15, color=WHITE)
    add_textbox(s, Inches(0.5), Inches(6.35), Inches(7.5), Inches(0.55),
                "Soutenance  ·  03 septembre 2026",
                size=14, bold=True, color=TEAL_LT)

    # 2. CONTEXTE ET PROBLÉMATIQUE
    p += 1
    split_slide(prs, blank, p, "Cadrage", "Contexte et problématique", [
        "Parkinson : maladie neurodégénérative progressive et invalidante.",
        "Les traitements actuels restent principalement symptomatiques.",
        "Aucun traitement n’a démontré de façon certaine un ralentissement de la neurodégénérescence.",
        "Question : les agonistes du GLP-1R peuvent-ils constituer une stratégie modificatrice ?",
        "Une plausibilité biologique n’est pas une preuve clinique.",
    ], "v02_besoin_neuroprotection.png", size=15, spacing=11)

    # 3. OBJECTIFS
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Cadrage", "Objectifs de la thèse")
    objs = [
        ("1", "Physiologie & pharmacologie", "Présenter le GLP-1, le GLP-1R et les agonistes disponibles."),
        ("2", "Bénéfices établis", "Examiner DT2, obésité et protection cardio-rénale — molécule par molécule."),
        ("3", "Potentiel Parkinson", "Évaluer de façon critique le repositionnement (préclinique et clinique)."),
        ("4", "Rôle du pharmacien", "Préciser l’accompagnement, la tolérance et la prévention du hors indication."),
    ]
    for i, (n, t, d) in enumerate(objs):
        x = Inches(0.35) + Inches(i * 3.22)
        add_round(s, x, Inches(1.7), Inches(3.05), Inches(4.9), WHITE)
        add_rect(s, x, Inches(1.7), Inches(3.05), Inches(1.15), NAVY if i != 2 else TEAL)
        add_textbox(s, x, Inches(1.85), Inches(3.05), Inches(0.5),
                    n, size=28, bold=True, color=ACCENT, align=PP_ALIGN.CENTER)
        add_textbox(s, x + Inches(0.12), Inches(3.1), Inches(2.8), Inches(1.0),
                    t, size=15, bold=True, color=NAVY, align=PP_ALIGN.CENTER, font="Georgia")
        add_textbox(s, x + Inches(0.15), Inches(4.2), Inches(2.75), Inches(2.0),
                    d, size=14, color=MUTED, align=PP_ALIGN.CENTER)
    add_footer(s, p)

    # 4. PLAN
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Cadrage", "Plan de la présentation",
           "Parcours : du médicament métabolique à la question neurologique")
    parts = [
        ("I", "GLP-1 et agonistes", "Physiologie, DPP-4, récepteur, molécules non interchangeables"),
        ("II", "Applications validées", "DT2, obésité, cardio-rénal, tolérance"),
        ("III", "Potentiel Parkinson", "Mécanismes, préclinique, LIXIPARK, Exenatide-PD3"),
        ("IV", "Limites et pharmacien", "Pas d’indication hors essai ; sécurisation de l’usage"),
    ]
    add_rect(s, Inches(0.7), Inches(3.35), Inches(12.0), Inches(0.08), ACCENT)
    for i, (n, t, d) in enumerate(parts):
        x = Inches(0.4) + Inches(i * 3.22)
        add_round(s, x + Inches(1.05), Inches(1.85), Inches(0.7), Inches(0.7), TEAL if i < 3 else ACCENT_DK)
        add_textbox(s, x + Inches(1.05), Inches(1.95), Inches(0.7), Inches(0.5),
                    n, size=18, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
        add_round(s, x, Inches(3.7), Inches(3.05), Inches(2.9), WHITE)
        add_textbox(s, x + Inches(0.12), Inches(3.9), Inches(2.8), Inches(0.7),
                    t, size=15, bold=True, color=NAVY, align=PP_ALIGN.CENTER, font="Georgia")
        add_textbox(s, x + Inches(0.15), Inches(4.65), Inches(2.75), Inches(1.7),
                    d, size=13, color=MUTED, align=PP_ALIGN.CENTER)
    add_footer(s, p)

    # 5. PARKINSON — BESOIN
    p += 1
    split_slide(prs, blank, p, "I. GLP-1 et pharmacologie",
                "Parkinson : un besoin thérapeutique majeur", [
                    "Triade motrice : bradykinésie, tremblement de repos, rigidité.",
                    "Symptômes non moteurs fréquents : constipation, sommeil, humeur, cognition.",
                    "Perte progressive des neurones dopaminergiques de la substance noire.",
                    "Aucun traitement n’a démontré de façon certaine un ralentissement de la neurodégénérescence.",
                ], "v05_moteurs_non_moteurs.png", size=15, spacing=12)

    # 6. PHYSIOLOGIE GLP-1
    p += 1
    split_slide(prs, blank, p, "I. GLP-1 et pharmacologie",
                "GLP-1 : physiologie et effet incrétine", [
                    "Hormone incrétine issue des cellules L intestinales, après les repas.",
                    "Insulinosécrétion glucose-dépendante.",
                    "Diminue le glucagon en hyperglycémie.",
                    "Ralentit la vidange gastrique et favorise la satiété.",
                    "Régulation glycémique et énergétique.",
                ], "fig0_physiologie_glp1.png", size=15, spacing=11)

    # 7. POURQUOI DES AGONISTES
    p += 1
    split_slide(prs, blank, p, "I. GLP-1 et pharmacologie",
                "Pourquoi développer des agonistes du GLP-1R ?", [
                    "Demi-vie du GLP-1 endogène : environ 1 à 2 minutes.",
                    "Inactivation rapide, principalement par la DPP-4.",
                    "Le peptide natif n’est pas un médicament utilisable.",
                    ("Les analogues visent à :", [
                        "Résister à la DPP-4",
                        "Prolonger l’exposition systémique",
                        "Permettre une administration quotidienne ou hebdomadaire",
                    ]),
                ], "v07_dpp4_vs_agonistes.png", size=15, spacing=8)

    # 8. RÉCEPTEUR
    p += 1
    split_slide(prs, blank, p, "I. GLP-1 et pharmacologie",
                "Récepteur du GLP-1 et voies de signalisation", [
                    "GLP-1R : récepteur couplé aux protéines G (Gs).",
                    "Augmentation de l’AMPc → PKA / EPAC2.",
                    "Dans la cellule β : sécrétion d’insuline glucose-dépendante.",
                    "Modulation possible de PI3K/Akt et MAPK/ERK.",
                    "Dans les modèles : survie cellulaire et réponse au stress — pas une preuve humaine.",
                ], "fig1_glp1r_signalisation.png", size=15, spacing=10)

    # 9. NON INTERCHANGEABLES
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "I. GLP-1 et pharmacologie", "Les agonistes du GLP-1R ne sont pas interchangeables")
    add_nested(s, Inches(0.45), Inches(1.45), Inches(12.4), Inches(1.1), [
        "Même cible, mais structures, demi-vies, administrations et expositions tissulaires différentes — pas d’effet neurologique de classe a priori.",
    ], size=16, spacing=4)
    rows = [
        ["Famille", "Molécules", "Particularité"],
        ["Dérivés de l’exendine-4", "Exénatide, lixisénatide", "Action plutôt courte ; évalués dans Parkinson"],
        ["Analogues du GLP-1 humain", "Liraglutide, dulaglutide, sémaglutide", "Action prolongée ; données CV / rénales pour certains"],
        ["Double agoniste GIP/GLP-1", "Tirzépatide", "Non sélectif du GLP-1R — à distinguer de la classe"],
    ]
    add_table(s, Inches(0.35), Inches(2.7), Inches(12.6), rows,
              [Inches(3.3), Inches(4.2), Inches(5.1)], font_size=14, row_h=0.85)
    add_footer(s, p)

    # 10. PK
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "II. Applications validées", "Profils pharmacocinétiques et implications pratiques")
    rows = [
        ["Molécule", "Demi-vie", "Administration", "Particularité"],
        ["Exénatide", "Quelques heures (std)", "2×/j ou LP 1×/sem.", "Action courte / LP ; évalué dans PD"],
        ["Lixisénatide", "~3 h", "1×/j", "Postprandial ; LIXIPARK"],
        ["Liraglutide", "~13 h", "1×/j", "DT2 ; obésité selon la dose"],
        ["Dulaglutide", "~5 j", "1×/sem.", "Bénéfice CV (REWIND)"],
        ["Sémaglutide", "~1 sem.", "1×/sem. ou oral", "CV (SUSTAIN-6, SELECT) ; rénal (FLOW)"],
    ]
    add_table(s, Inches(0.3), Inches(1.5), Inches(12.7), rows,
              [Inches(2.2), Inches(2.5), Inches(3.0), Inches(5.0)], font_size=13, row_h=0.7)
    add_textbox(s, Inches(0.4), Inches(6.15), Inches(12.5), Inches(0.7),
                "Action courte : davantage le postprandial (vidange). Action prolongée : davantage le jeûne / HbA1c ; tachyphylaxie gastrique possible.",
                size=14, color=MUTED)
    add_footer(s, p)

    # 11. DT2
    p += 1
    split_slide(prs, blank, p, "II. Applications validées",
                "Place dans le diabète de type 2", [
                    "Réduction de l’HbA1c, glycémies à jeun et postprandiales.",
                    "Faible risque intrinsèque d’hypoglycémie hors insuline ou sulfamides.",
                    "Diminution du glucagon en hyperglycémie ; satiété et poids.",
                    "Choix individualisé : risque cardio-rénal, poids, tolérance, préférences.",
                ], "v11_effets_metaboliques.png", size=16, spacing=12)

    # 12. OBÉSITÉ ET CARDIO-RÉNAL
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "II. Applications validées", "Obésité et bénéfices cardio-rénaux",
           "Des molécules et des populations précises — pas un effet de classe automatique")
    rows = [
        ["Essai", "Molécule", "Population", "Message clé"],
        ["LEADER", "Liraglutide", "DT2, haut risque CV", "Réduction du MACE"],
        ["SUSTAIN-6", "Sémaglutide", "DT2, haut risque CV", "Résultat favorable sur le MACE"],
        ["REWIND", "Dulaglutide", "DT2, risque CV", "Réduction du MACE"],
        ["SELECT", "Sémaglutide", "Surpoids/obésité, MCV, sans DT2", "Réduction du MACE"],
        ["FLOW", "Sémaglutide", "DT2 et MRC", "Réduction des événements rénaux majeurs"],
    ]
    add_table(s, Inches(0.3), Inches(1.55), Inches(12.7), rows,
              [Inches(1.9), Inches(2.1), Inches(4.2), Inches(4.5)], font_size=13, row_h=0.72)
    add_footer(s, p)

    # 13. TOLÉRANCE + PHARMACIEN
    p += 1
    split_slide(prs, blank, p, "II. Applications validées",
                "Tolérance et rôle du pharmacien", [
                    "EI digestifs fréquents : nausées, vomissements, diarrhée, constipation, douleurs, ↓ appétit.",
                    "La titration progressive améliore souvent la tolérance.",
                    "Surveiller hydratation, poids, apports et hypoglycémie si insuline / sulfamides.",
                    "Éducation : technique d’injection, conservation, oubli.",
                ], "v13_pharmacien_icones.png", size=15, spacing=11)

    # 14. POURQUOI REPOSITIONNER
    p += 1
    split_slide(prs, blank, p, "III. Potentiel dans Parkinson",
                "Pourquoi envisager un repositionnement ?", [
                    "Médicaments déjà connus (pharmacologie, clinique, pharmacovigilance).",
                    "Plausibilité biologique : métabolisme, inflammation, mitochondries, neurodégénérescence.",
                    "L’efficacité dans le DT2 ou l’obésité ne prédit pas une efficacité neurologique.",
                    "Une démonstration spécifique dans Parkinson reste indispensable.",
                ], "v14_repositionnement_parcours.png", size=15, spacing=12)

    # 15. MÉCANISMES
    p += 1
    split_slide(prs, blank, p, "III. Potentiel dans Parkinson",
                "Mécanismes neuroprotecteurs potentiels", [
                    "Activation AMPc/PKA, PI3K/Akt, MAPK/ERK.",
                    "Survie cellulaire et réduction de signaux pro-apoptotiques (modèles).",
                    "Meilleure réponse au stress et modulation du métabolisme énergétique.",
                    "Ce sont des hypothèses précliniques, non une preuve thérapeutique.",
                ], "fig2_neuroprotection.png", size=15, spacing=12)

    # 16. MITO / INFLAMMATION
    p += 1
    split_slide(prs, blank, p, "III. Potentiel dans Parkinson",
                "Mitochondries, stress oxydatif et neuroinflammation", [
                    "La dysfonction mitochondriale fragilise les neurones dopaminergiques.",
                    "Dans certains modèles : meilleurs paramètres mitochondriaux, ↓ marqueurs oxydatifs.",
                    "Modulation de la microglie et de médiateurs pro-inflammatoires.",
                    "Résultats précliniques : ils ne démontrent pas une neuroprotection humaine.",
                ], "v16_mito_inflammation.png", size=15, spacing=11)

    # 17. AUTOPHAGIE / ALPHA-SYN
    p += 1
    split_slide(prs, blank, p, "III. Potentiel dans Parkinson",
                "Autophagie, protéostase et alpha-synucléine", [
                    "L’agrégation d’alpha-synucléine est centrale dans Parkinson.",
                    "Certains modèles suggèrent une modulation de l’autophagie et de la protéostase.",
                    "Aucune preuve que cela réduise la charge pathologique chez l’humain.",
                ], "v17_autophagie_asyn.png", size=16, spacing=14)

    # 18. PRÉCLINIQUE
    p += 1
    split_slide(prs, blank, p, "III. Potentiel dans Parkinson",
                "Données précliniques : intérêt et limites", [
                    "Signaux favorables (MPTP, 6-OHDA) avec exénatide, liraglutide, lixisénatide, sémaglutide.",
                    "Limites : lésions rapides, maladie humaine incomplète, doses, espèces, voies.",
                    "Ces modèles justifient des essais — ils ne prouvent pas l’efficacité clinique.",
                ], "v18_preclinique_balance.png", size=16, spacing=14)

    # 19. ESSAIS CLINIQUES
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "III. Potentiel dans Parkinson", "Essais cliniques : résultats contrastés")
    rows = [
        ["Essai", "Molécule", "Design", "Résultat principal"],
        ["Phase II exénatide", "Exénatide hebdo", "Signal exploratoire", "Amélioration motrice OFF suggérée — puissance limitée"],
        ["LIXIPARK", "Lixisénatide 1×/j", "Ph. II ; n=156 ; PD précoce ; 12 mois", "Δ ajustée 3,08 pts MDS-UPDRS III vs placebo"],
        ["Exenatide-PD3", "Exénatide hebdo", "Ph. III ; n=194 ; 96 semaines", "Pas de différence sur le MDS-UPDRS III OFF"],
    ]
    add_table(s, Inches(0.25), Inches(1.5), Inches(12.8), rows,
              [Inches(2.3), Inches(2.3), Inches(4.0), Inches(4.2)], font_size=13, row_h=0.85)
    add_round(s, Inches(0.35), Inches(5.3), Inches(12.6), Inches(1.45), SOFT)
    add_textbox(s, Inches(0.55), Inches(5.5), Inches(12.2), Inches(1.1),
                "LIXIPARK : −0,04 vs +3,04 points (MDS-UPDRS III) ; nausées/vomissements plus fréquents.\n"
                "Pas d’effet de classe : un signal avec le lixisénatide n’implique pas un bénéfice de l’exénatide, ni l’inverse.",
                size=14, color=DARK)
    add_footer(s, p, "LIXIPARK, NEJM 2024  ·  Exenatide-PD3, phase III")

    # 20. INTERPRÉTATION
    p += 1
    split_slide(
        prs, blank, p, "IV. Limites et perspectives",
        "Interprétation critique et perspectives",
        [
            "LIXIPARK : signal encourageant, mais phase II et suivi court.",
            "Exenatide-PD3 : résultat négatif majeur pour l’exénatide.",
            "Aucun effet de classe démontré.",
            ("Futurs essais :", [
                "Patients précoces, mieux stratifiés",
                "Suivi prolongé",
                "Moteurs et non moteurs, cognition, autonomie, QdV, nutrition, biomarqueurs",
            ]),
        ],
        "v20_perspectives_essais.png",
        cite="Distinction : plausibilité ≠ signal clinique ≠ effet modificateur",
        size=14, spacing=8,
    )

    # 21. CONCLUSION
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Conclusion", "Messages à retenir")
    msgs = [
        ("1", "Valeur établie", "DT2 ; pour certaines molécules, obésité et protection cardio-rénale."),
        ("2", "Plausibilité Parkinson", "Cohérente, mais surtout préclinique."),
        ("3", "Données humaines", "Hétérogènes : LIXIPARK vs Exenatide-PD3."),
        ("4", "Pas d’indication", "Hors essai clinique, les agonistes du GLP-1R ne sont pas indiqués dans Parkinson."),
        ("5", "Pharmacien", "Sécurité, éducation thérapeutique, prévention des usages hors indication injustifiés."),
    ]
    for i, (n, t, d) in enumerate(msgs):
        y = Inches(1.42) + Inches(i * 0.92)
        add_round(s, Inches(0.35), y, Inches(12.6), Inches(0.84), WHITE)
        add_rect(s, Inches(0.35), y, Inches(0.62), Inches(0.84), ACCENT if i == 3 else NAVY)
        add_textbox(s, Inches(0.35), y + Inches(0.18), Inches(0.62), Inches(0.5),
                    n, size=16, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
        add_textbox(s, Inches(1.15), y + Inches(0.1), Inches(11.5), Inches(0.3),
                    t, size=14, bold=True, color=NAVY, font="Georgia")
        add_textbox(s, Inches(1.15), y + Inches(0.42), Inches(11.5), Inches(0.35),
                    d, size=13, color=MUTED)
    add_rect(s, 0, Inches(7.12), SLIDE_W, Inches(0.38), NAVY)
    add_textbox(s, Inches(0.35), Inches(7.16), Inches(10.6), Inches(0.28),
                "Merci pour votre attention  —  Discussion",
                size=12, bold=True, color=WHITE)
    add_textbox(s, Inches(11.4), Inches(7.16), Inches(1.6), Inches(0.28),
                f"{p}  /  {TOTAL}", size=10, color=WHITE, align=PP_ALIGN.RIGHT)

    assert p == TOTAL, f"Expected {TOTAL} slides, got {p}"
    out = Path("/workspace/docs/presentation/Soutenance_GLP1_Parkinson.pptx")
    prs.save(str(out))
    print(f"Saved: {out}")
    print(f"Slides: {len(prs.slides)}")
    return str(out)


if __name__ == "__main__":
    build()
