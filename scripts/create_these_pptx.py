#!/usr/bin/env python3
"""
Soutenance GLP-1 & Parkinson — polices LCD, sans cadres, images style atlas médical.
"""

from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE
import os
import shutil

# Palette proche du style atlas médical (bleu nuit + accents)
NAVY = RGBColor(0x0D, 0x2F, 0x4F)
BLUE = RGBColor(0x1A, 0x4F, 0x7A)
TEAL = RGBColor(0x0E, 0x7C, 0x86)
CORAL = RGBColor(0xD9, 0x5D, 0x39)
GOLD = RGBColor(0xC9, 0x8A, 0x1A)
GREEN = RGBColor(0x2A, 0x8F, 0x62)
SKY = RGBColor(0x2B, 0x7C, 0xB8)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
DARK = RGBColor(0x12, 0x1E, 0x28)
MUTED = RGBColor(0x2F, 0x42, 0x4C)
BG = RGBColor(0xF7, 0xFA, 0xFC)
SOFT = RGBColor(0xEE, 0xF4, 0xF8)
ROW = RGBColor(0xE8, 0xF0, 0xF5)

W = Inches(13.333)
H = Inches(7.5)
TOTAL = 30
ASSETS = "/workspace/docs/presentation/assets"

# Polices pensées pour projection LCD
T_TITLE = 28
T_BODY = 18
T_BULLET = 17
T_KPI = 28
T_SMALL = 15


def run(r, size=T_BODY, bold=True, color=DARK, font="Calibri"):
    """Tout le texte en gras pour lisibilité projection."""
    r.font.size = Pt(size)
    r.font.bold = True  # forcé bold partout
    r.font.color.rgb = color
    r.font.name = font


def bg(slide, color):
    sh = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, W, H)
    sh.fill.solid()
    sh.fill.fore_color.rgb = color
    sh.line.fill.background()
    tree = slide.shapes._spTree
    el = sh._element
    tree.remove(el)
    tree.insert(2, el)


def rect(slide, l, t, w, h, fill):
    sh = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, l, t, w, h)
    sh.fill.solid()
    sh.fill.fore_color.rgb = fill
    sh.line.fill.background()
    return sh


def oval(slide, l, t, w, h, fill):
    sh = slide.shapes.add_shape(MSO_SHAPE.OVAL, l, t, w, h)
    sh.fill.solid()
    sh.fill.fore_color.rgb = fill
    sh.line.fill.background()
    return sh


def txt(slide, l, t, w, h, text, size=T_BODY, bold=True, color=DARK,
        align=PP_ALIGN.LEFT, font="Calibri"):
    box = slide.shapes.add_textbox(l, t, w, h)
    tf = box.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.alignment = align
    r = p.add_run()
    r.text = text
    run(r, size=size, bold=True, color=color, font=font)
    return box


def bullets(slide, l, t, w, h, items, size=T_BULLET, color=DARK, spacing=8):
    box = slide.shapes.add_textbox(l, t, w, h)
    tf = box.text_frame
    tf.word_wrap = True
    for i, item in enumerate(items):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = PP_ALIGN.LEFT
        p.space_after = Pt(spacing)
        r = p.add_run()
        if isinstance(item, tuple):
            r.text = "●  " + item[0]
            run(r, size=size, bold=True, color=color)
            r2 = p.add_run()
            r2.text = item[1]
            run(r2, size=size, bold=True, color=MUTED)
        else:
            r.text = "●  " + item
            run(r, size=size, bold=True, color=color)
    return box


def footer(slide, page):
    rect(slide, 0, Inches(7.18), W, Inches(0.32), NAVY)
    txt(slide, Inches(0.35), Inches(7.2), Inches(10), Inches(0.26),
        "Agonistes du GLP-1  ·  Parkinson  ·  Soutenance",
        size=12, color=WHITE)
    txt(slide, Inches(11.3), Inches(7.2), Inches(1.7), Inches(0.26),
        f"{page} / {TOTAL}", size=13, bold=True, color=WHITE, align=PP_ALIGN.RIGHT)


def header(slide, kicker, title):
    bg(slide, BG)
    rect(slide, 0, 0, W, Inches(1.05), NAVY)
    rect(slide, 0, Inches(1.05), W, Inches(0.06), TEAL)
    txt(slide, Inches(0.4), Inches(0.12), Inches(12.5), Inches(0.25),
        kicker.upper(), size=13, bold=True, color=RGBColor(0x8E, 0xC8, 0xD4))
    txt(slide, Inches(0.4), Inches(0.4), Inches(12.5), Inches(0.55),
        title, size=T_TITLE, bold=True, color=WHITE, font="Georgia")


def panel(slide, l, t, w, h, title, items, accent=TEAL, icon_letter="•"):
    """Panneau SANS cadre : fond doux + pastille + titre + bullets."""
    rect(slide, l, t, w, h, SOFT)
    oval(slide, l + Inches(0.18), t + Inches(0.18), Inches(0.42), Inches(0.42), accent)
    txt(slide, l + Inches(0.18), t + Inches(0.22), Inches(0.42), Inches(0.35),
        icon_letter, size=14, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
    txt(slide, l + Inches(0.72), t + Inches(0.2), w - Inches(0.9), Inches(0.4),
        title, size=18, bold=True, color=NAVY, font="Georgia")
    bullets(slide, l + Inches(0.22), t + Inches(0.75),
            w - Inches(0.4), h - Inches(0.9), items, size=T_BULLET, spacing=7)


def kpi(slide, l, t, w, h, value, label, fill=TEAL):
    rect(slide, l, t, w, h, fill)
    txt(slide, l + Inches(0.1), t + Inches(0.25), w - Inches(0.2), Inches(0.55),
        value, size=T_KPI, bold=True, color=WHITE, align=PP_ALIGN.CENTER, font="Georgia")
    txt(slide, l + Inches(0.1), t + Inches(0.9), w - Inches(0.2), Inches(0.5),
        label, size=16, bold=True, color=WHITE, align=PP_ALIGN.CENTER)


def img(slide, name, l, t, w, h):
    path = os.path.join(ASSETS, name)
    if os.path.exists(path):
        return slide.shapes.add_picture(path, l, t, width=w, height=h)
    rect(slide, l, t, w, h, SOFT)
    return None


def table(slide, l, t, w, rows, widths, fs=16, rh=0.48):
    n_r, n_c = len(rows), len(rows[0])
    sh = slide.shapes.add_table(n_r, n_c, l, t, w, Inches(rh * n_r))
    tb = sh.table
    for i, cw in enumerate(widths):
        tb.columns[i].width = cw
    for r, row in enumerate(rows):
        for c, val in enumerate(row):
            cell = tb.cell(r, c)
            cell.text = ""
            p = cell.text_frame.paragraphs[0]
            rr = p.add_run()
            rr.text = str(val)
            hdr = r == 0
            run(rr, size=fs, bold=hdr, color=WHITE if hdr else DARK)
            cell.fill.solid()
            cell.fill.fore_color.rgb = NAVY if hdr else (ROW if r % 2 == 0 else WHITE)
    return sh


def divider(prs, blank, num, title, subtitle, page, accent=TEAL, image=None):
    """Séparateur : grande photo plein écran SANS cadre + titre gras."""
    s = prs.slides.add_slide(blank)
    bg(s, NAVY)
    if image:
        # Grande photo plein écran, sans cadre
        img(s, image, 0, 0, W, H)
        # Voile sombre à gauche pour lisibilité du titre (pas un cadre photo)
        rect(s, 0, 0, Inches(6.8), H, NAVY)
        # Fine barre d'accent (pas un cadre autour de la photo)
        rect(s, Inches(6.8), 0, Inches(0.12), H, accent)
    else:
        rect(s, 0, 0, Inches(0.25), H, accent)
    txt(s, Inches(0.7), Inches(2.0), Inches(5.8), Inches(0.4),
        f"PARTIE  {num}", size=20, bold=True, color=accent)
    txt(s, Inches(0.7), Inches(2.55), Inches(5.8), Inches(1.6),
        title, size=34, bold=True, color=WHITE, font="Georgia")
    txt(s, Inches(0.7), Inches(4.4), Inches(5.8), Inches(1.2),
        subtitle, size=20, bold=True, color=RGBColor(0xB5, 0xDC, 0xE4))
    txt(s, Inches(0.7), Inches(6.5), Inches(5.5), Inches(0.35),
        f"{page} / {TOTAL}", size=15, bold=True, color=RGBColor(0x8A, 0xB8, 0xC0))
    return s


def atlas_slide(prs, blank, kicker, title, image, points, takeaway, page, accent=TEAL):
    """Style proche de la slide pancreas : grande image + panneaux sans cadre."""
    s = prs.slides.add_slide(blank)
    header(s, kicker, title)
    # Grande image (style atlas)
    img(s, image, Inches(0.25), Inches(1.25), Inches(8.0), Inches(4.55)
        )
    # Panneaux droits sans cadre
    panel(s, Inches(8.4), Inches(1.25), Inches(4.65), Inches(4.55),
          "Points clés", points, accent, "i")
    # Bandeau takeaway plein largeur
    rect(s, Inches(0.25), Inches(5.95), Inches(12.8), Inches(1.0), NAVY)
    txt(s, Inches(0.45), Inches(6.05), Inches(2.0), Inches(0.28),
        "À RETENIR", size=14, bold=True, color=GOLD)
    txt(s, Inches(0.45), Inches(6.35), Inches(12.4), Inches(0.5),
        takeaway, size=17, color=WHITE)
    footer(s, page)
    return s


def build():
    prs = Presentation()
    prs.slide_width = W
    prs.slide_height = H
    blank = prs.slide_layouts[6]
    p = 0

    # 1 TITLE — fond photo atténué + contenu
    p += 1
    s = prs.slides.add_slide(blank)
    # Grande photo de fond, couleurs atténuées, sans cadre (visible aussi derrière les boxs du bas)
    img(s, "title_bg_muted_v2.png", 0, 0, W, H)
    # Voile sombre à gauche UNIQUEMENT derrière le titre (s'arrête au-dessus des boxs)
    rect(s, 0, 0, Inches(7.0), Inches(5.25), NAVY)
    rect(s, Inches(7.0), 0, Inches(0.1), Inches(5.25), TEAL)
    txt(s, Inches(0.55), Inches(0.9), Inches(6.2), Inches(0.35),
        "SOUTENANCE DE THÈSE  ·  PHARMACIE", size=15, bold=True,
        color=RGBColor(0x8E, 0xC8, 0xD4))
    txt(s, Inches(0.55), Inches(1.4), Inches(6.2), Inches(2.8),
        "Agonistes du GLP-1 :\nmise au point et potentiel\nprometteur pour la\nmaladie de Parkinson",
        size=30, bold=True, color=WHITE, font="Georgia")
    # Photo principale à droite (sur le fond atténué)
    img(s, "med_01_brain_pd.png", Inches(7.35), Inches(0.55), Inches(5.7), Inches(4.4))
    # Boxs du bas : la photo de fond reste visible derrière elles
    labels = [("Physiologie", TEAL), ("Métabolisme", CORAL), ("Neuroprotection", GREEN),
              ("LIXIPARK", GOLD), ("Pharmacien", SKY)]
    for i, (lab, col) in enumerate(labels):
        x = Inches(0.55) + Inches(i * 2.5)
        rect(s, x, Inches(5.5), Inches(2.35), Inches(1.2), col)
        txt(s, x, Inches(5.85), Inches(2.35), Inches(0.5),
            lab, size=16, bold=True, color=WHITE, align=PP_ALIGN.CENTER)

    # 2 PLAN
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Organisation", "Plan de la présentation")
    parts = [
        ("A", "Contexte", "Parkinson, besoin, repositionnement", CORAL),
        ("B", "Chapitre 1", "GLP-1, récepteur, agonistes", TEAL),
        ("C", "Chapitre 2", "DT2, obésité, cardio-rénal", SKY),
        ("D", "Chapitre 3", "Neuroprotection & essais", GREEN),
        ("E", "Conclusion", "Messages & discussion", GOLD),
    ]
    for i, (n, t, d, col) in enumerate(parts):
        x = Inches(0.3) + Inches(i * 2.55)
        rect(s, x, Inches(1.4), Inches(2.4), Inches(5.3), SOFT)
        rect(s, x, Inches(1.4), Inches(2.4), Inches(1.3), col)
        txt(s, x, Inches(1.55), Inches(2.4), Inches(0.5),
            n, size=28, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
        txt(s, x + Inches(0.1), Inches(2.15), Inches(2.2), Inches(0.4),
            t, size=16, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
        txt(s, x + Inches(0.15), Inches(3.1), Inches(2.1), Inches(3.0),
            d, size=17, color=DARK, align=PP_ALIGN.CENTER)
    footer(s, p)

    # 3 OBJECTIFS
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Objectifs", "Quatre objectifs de la thèse")
    objs = [
        ("1", "Physiologie & pharmacologie", "GLP-1, GLP-1R, différences PK/PD — molécule par molécule", CORAL),
        ("2", "Indications validées", "DT2, obésité, cardio-rénal (LEADER, SELECT, FLOW…)", TEAL),
        ("3", "Repositionnement Parkinson", "Plausibilité ≠ preuve ; LIXIPARK vs Exenatide-PD3", GREEN),
        ("4", "Rôle du pharmacien", "Sécurisation, tolérance, pas d’indication hors recherche", GOLD),
    ]
    for i, (n, t, d, col) in enumerate(objs):
        y = Inches(1.3) + Inches(i * 1.35)
        rect(s, Inches(0.3), y, Inches(12.7), Inches(1.2), SOFT)
        rect(s, Inches(0.3), y, Inches(1.0), Inches(1.2), col)
        txt(s, Inches(0.3), y + Inches(0.3), Inches(1.0), Inches(0.55),
            n, size=28, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
        txt(s, Inches(1.55), y + Inches(0.2), Inches(11), Inches(0.4),
            t, size=22, bold=True, color=NAVY, font="Georgia")
        txt(s, Inches(1.55), y + Inches(0.65), Inches(11), Inches(0.4),
            d, size=17, color=MUTED)
    footer(s, p)

    # 4 DIVIDER A
    p += 1
    divider(prs, blank, "A", "Contexte & besoin médical",
            "Parkinson : fardeau, physiopathologie, impasse thérapeutique", p, CORAL)

    # 5 ATLAS brain
    p += 1
    atlas_slide(
        prs, blank, "Contexte · atlas médical",
        "Maladie de Parkinson — anatomie fonctionnelle",
        "med_01_brain_pd.png",
        ["2ᵉ neurodégénérescence",
         "Bradykinésie + tremblement/rigidité",
         "Symptômes non moteurs majeurs",
         "α-synucléine + inflammation",
         "Traitements = symptomatiques",
         "Aucun modificateur certain"],
        "Besoin non couvert : freiner la neurodégénérescence — sans confondre MDS-UPDRS / score moteur et neuroprotection.",
        p, CORAL
    )

    # 6 PHYSIOPATH
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Contexte", "Physiopathologie — 6 mécanismes clés")
    items = [
        ("α-synucléine", "Agrégation et propagation", CORAL),
        ("Mitochondries", "Dysfonction et ROS", TEAL),
        ("Stress oxydatif", "Lésions cumulatives", GOLD),
        ("Neuroinflammation", "Microglie activée", SKY),
        ("Autophagie", "Clairance altérée", GREEN),
        ("Gènes / environnement", "Susceptibilité", BLUE),
    ]
    for i, (t, d, col) in enumerate(items):
        c, r = i % 3, i // 3
        x = Inches(0.3) + Inches(c * 4.3)
        y = Inches(1.3) + Inches(r * 2.75)
        panel(s, x, y, Inches(4.15), Inches(2.55), t,
              [d, "Cible potentielle des agonistes GLP-1"], col, str(i + 1))
    footer(s, p)

    # 7 TREATMENTS
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Contexte", "Traitements actuels : utiles mais limités")
    rows = [
        ["Classe", "Rôle", "Limite"],
        ["Lévodopa", "Référence motrice", "Fluctuations / dyskinésies"],
        ["Agonistes DA", "Symptômes moteurs", "EI neuropsychiatriques"],
        ["IMAO-B", "Potentialisation DA", "Effet symptomatique seul"],
        ["Amantadine", "Dyskinésies", "Pas d’effet modificateur"],
    ]
    table(s, Inches(0.3), Inches(1.3), Inches(12.7), rows,
          [Inches(3.2), Inches(4.3), Inches(5.2)], fs=17, rh=0.65)
    rect(s, Inches(0.3), Inches(5.0), Inches(12.7), Inches(1.85), NAVY)
    txt(s, Inches(0.55), Inches(5.25), Inches(12.2), Inches(0.35),
        "MESSAGE CLÉ", size=15, bold=True, color=GOLD)
    txt(s, Inches(0.55), Inches(5.7), Inches(12.2), Inches(0.9),
        "Améliorer un score (ex. MDS-UPDRS) ≠ prouver un effet modificateur.\nBiomarqueurs de progression encore insuffisants — d’où la prudence méthodologique.",
        size=18, color=WHITE)
    footer(s, p)

    # 8 REPOSITIONING
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Contexte", "Pourquoi repositionner les agonistes du GLP-1 ?")
    panel(s, Inches(0.3), Inches(1.3), Inches(6.3), Inches(5.5),
          "Avantages du repositionnement",
          ["PK/PD déjà connues",
           "Tolérance documentée",
           "Pharmacovigilance existante",
           "Développement accéléré possible",
           "Mais preuve d’efficacité toujours requise"],
          TEAL, "A")
    panel(s, Inches(6.8), Inches(1.3), Inches(6.2), Inches(5.5),
          "Prudence scientifique",
          ["Plausibilité ≠ efficacité clinique",
           "Pas d’équivalence entre molécules",
           "Pas d’effet de classe présumé",
           "Symptomatique ≠ modificateur",
           "Indication PD : aucune à ce jour"],
          CORAL, "H")
    footer(s, p)

    # 9 DIVIDER B
    p += 1
    divider(prs, blank, "B", "Chapitre 1 — Physiologie & pharmacologie",
            "GLP-1, récepteur, courte/longue durée, panorama", p, TEAL,
            image="sec_ch1_glp1.png")

    # 10 ATLAS GLP1
    p += 1
    atlas_slide(
        prs, blank, "Chapitre 1 · atlas médical",
        "Physiologie du GLP-1 — du tube digestif au pancréas",
        "med_02_glp1_path.png",
        ["Cellules L intestinales",
         "Hormone incrétine",
         "Insuline glucose-dépendante",
         "DPP-4 : demi-vie 1–2 min",
         "Agonistes résistants DPP-4",
         "Base de toute la classe"],
        "Sans résistance à la DPP-4, pas de médicament utilisable : c’est le cœur du design pharmaceutique.",
        p, TEAL
    )

    # 11 ATLAS receptor
    p += 1
    atlas_slide(
        prs, blank, "Chapitre 1 · atlas médical",
        "Récepteur GLP-1R et voies de signalisation",
        "med_03_receptor.png",
        ["GPCR classe B",
         "Pancréas, cœur, rein, SNC",
         "AMPc → PKA / EPAC",
         "PI3K / Akt : survie",
         "MAPK / ERK : réparation",
         "Base de la neuroprotection"],
        "Même récepteur, plusieurs cascades : métabolisme périphérique et survie neuronale.",
        p, BLUE
    )

    # 12 ATLAS agonists
    p += 1
    atlas_slide(
        prs, blank, "Chapitre 1 · atlas médical",
        "Courte vs longue durée d’action",
        "med_04_agonists.png",
        ["Courte : exénatide, lixisénatide",
         "Stimulation intermittente",
         "Fort effet postprandial",
         "Longue : lira, dula, séma…",
         "Exposition continue",
         "Meilleur contrôle HbA1c / jeûne"],
        "La durée d’exposition du récepteur explique les différences d’efficacité clinique.",
        p, CORAL
    )

    # 13 TABLE
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Chapitre 1", "Panorama des agonistes — référence claire")
    rows = [
        ["Molécule", "Profil", "Admin.", "Point clé"],
        ["Exénatide", "Courte / LP", "2×/j ou 1×/sem.", "Exenatide-PD3 négatif"],
        ["Lixisénatide", "Courte", "1×/j", "LIXIPARK (phase II)"],
        ["Liraglutide", "Longue", "1×/j", "LEADER / obésité 3 mg"],
        ["Dulaglutide", "Longue", "1×/sem.", "REWIND"],
        ["Sémaglutide", "Longue", "1×/sem. / oral", "SELECT · FLOW · MOST-ABLE"],
        ["Tirzépatide", "GIP/GLP-1", "1×/sem.", "Non sélectif GLP-1R"],
    ]
    table(s, Inches(0.25), Inches(1.25), Inches(12.8), rows,
          [Inches(2.4), Inches(2.2), Inches(2.8), Inches(5.4)], fs=16, rh=0.55)
    rect(s, Inches(0.25), Inches(5.5), Inches(12.8), Inches(1.35), TEAL)
    txt(s, Inches(0.5), Inches(5.85), Inches(12.3), Inches(0.7),
        "Tirzépatide ≠ agoniste sélectif. Structure/PK variables → pas d’effet de classe neurologique présumé.",
        size=18, color=WHITE)
    footer(s, p)

    # 14 MECHANISMS
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Chapitre 1", "Six actions métaboliques simultanées")
    acts = [
        ("↑ Insuline", "Glucose-dépendante", TEAL),
        ("↓ Glucagon", "Moins de glucose hépatique", CORAL),
        ("Vidange gastrique", "↓ pic postprandial", GOLD),
        ("Satiété", "↓ appétit / poids", GREEN),
        ("Cellules β", "Survie et fonction", SKY),
        ("Pléiotropie", "Cœur, rein, inflammation", BLUE),
    ]
    for i, (t, d, col) in enumerate(acts):
        c, r = i % 3, i // 3
        x = Inches(0.3) + Inches(c * 4.3)
        y = Inches(1.3) + Inches(r * 2.75)
        panel(s, x, y, Inches(4.15), Inches(2.55), t, [d], col, "●")
    footer(s, p)

    # 15 DIVIDER C
    p += 1
    divider(prs, blank, "C", "Chapitre 2 — Indications validées",
            "DT2, obésité, cardio-rénal, tolérance", p, SKY,
            image="sec_ch2_metabolic.png")

    # 16 DT2
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Chapitre 2", "Diabète de type 2 — place actuelle")
    kpi(s, Inches(0.3), Inches(1.3), Inches(4.15), Inches(1.7), "0,8–1,8%", "↓ HbA1c", TEAL)
    kpi(s, Inches(4.55), Inches(1.3), Inches(4.15), Inches(1.7), "ADA/EASD", "Classe majeure", CORAL)
    kpi(s, Inches(8.8), Inches(1.3), Inches(4.2), Inches(1.7), "Faible", "Hypoglycémie*", GREEN)
    panel(s, Inches(0.3), Inches(3.25), Inches(6.3), Inches(3.55),
          "Rationnel",
          ["Effet incrétine diminué dans le DT2",
           "Agonistes = incrétine durable",
           "Courte durée → postprandial",
           "Longue durée → jeûne / HbA1c"],
          TEAL, "1")
    panel(s, Inches(6.8), Inches(3.25), Inches(6.2), Inches(3.55),
          "En pratique",
          ["Après mesures ± metformine",
           "Précoce si risque CV / MRC",
           "Séma & tirzépatide très puissants",
           "*sauf association insuline/sulfamides"],
          CORAL, "2")
    footer(s, p)

    # 17 WEIGHT
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Chapitre 2", "Obésité — un changement de paradigme")
    kpi(s, Inches(0.3), Inches(1.3), Inches(4.15), Inches(1.8), "~15%", "Sémaglutide (STEP)", TEAL)
    kpi(s, Inches(4.55), Inches(1.3), Inches(4.15), Inches(1.8), "3 mg", "Liraglutide (SCALE)", CORAL)
    kpi(s, Inches(8.8), Inches(1.3), Inches(4.2), Inches(1.8), "++", "Tirzépatide", GOLD)
    panel(s, Inches(0.3), Inches(3.35), Inches(6.3), Inches(3.45),
          "Mécanismes",
          ["↓ appétit / ↑ satiété",
           "Réduction des apports",
           "Meilleure sensibilité insulinique",
           "Impact cardiométabolique"],
          TEAL, "M")
    panel(s, Inches(6.8), Inches(3.35), Inches(6.2), Inches(3.45),
          "Vigilance clinique",
          ["Titration = adhésion",
           "EI digestifs fréquents",
           "Attention âgés / fragiles",
           "Risque dénutrition / sarcopénie"],
          CORAL, "P")
    footer(s, p)

    # 18 ATLAS cardio
    p += 1
    atlas_slide(
        prs, blank, "Chapitre 2 · atlas médical",
        "Cardioprotection et néphroprotection",
        "med_05_cardiorenal.png",
        ["LEADER : liraglutide (MACE↓)",
         "SUSTAIN-6 : sémaglutide",
         "REWIND : dulaglutide",
         "SELECT : séma sans DT2",
         "FLOW : séma + MRC",
         "Molécule ≠ classe entière"],
        "Bénéfices cardio-rénaux démontrés pour certaines molécules — pas une interchangeabilité automatique.",
        p, GREEN
    )

    # 19 SAFETY
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Chapitre 2", "Tolérance & sécurité — check-list")
    panel(s, Inches(0.25), Inches(1.3), Inches(4.2), Inches(5.5),
          "Fréquents",
          ["Nausées / vomissements",
           "Diarrhées",
           "Début / ↑ dose",
           "Souvent transitoires",
           "Titration lente"],
          CORAL, "1")
    panel(s, Inches(4.55), Inches(1.3), Inches(4.2), Inches(5.5),
          "À anticiper",
          ["Hypoglycémie si associations",
           "Pancréatite (alerte)",
           "Complications biliaires",
           "Contre-indications",
           "Pharmacovigilance"],
          GOLD, "2")
    panel(s, Inches(8.85), Inches(1.3), Inches(4.2), Inches(5.5),
          "Messages utiles",
          ["Classe mature",
           "Essais de sécurité",
           "Profil favorable",
           "Info patient claire",
           "Traçabilité EI"],
          GREEN, "3")
    footer(s, p)

    # 20 DIVIDER D
    p += 1
    divider(prs, blank, "D", "Chapitre 3 — Parkinson & preuves",
            "Mécanismes, préclinique, essais, pharmacien", p, GREEN,
            image="sec_ch3_parkinson.png")

    # 21 MATRIX
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Chapitre 3", "Pourquoi le GLP-1 dans la Parkinson ?")
    rows = [
        ["Mécanisme PD", "Effet GLP-1 potentiel", "Preuve"],
        ["Neuroinflammation", "↓ microglie", "Préclin. ++"],
        ["Stress oxydatif", "↓ ROS", "Préclin. ++"],
        ["Mitochondries", "Soutien énergétique", "Préclin. +"],
        ["Apoptose", "Voies de survie", "Préclin. ++"],
        ["α-synucléine", "Autophagie / clairance", "Exploratoire"],
    ]
    table(s, Inches(0.25), Inches(1.3), Inches(12.8), rows,
          [Inches(3.4), Inches(5.0), Inches(4.4)], fs=17, rh=0.65)
    footer(s, p)

    # 22 ATLAS neuro
    p += 1
    atlas_slide(
        prs, blank, "Chapitre 3 · atlas médical",
        "Mécanismes neuroprotecteurs putatifs",
        "med_06_neuro.png",
        ["Activation GLP-1R",
         "Survie neuronale",
         "↓ inflammation",
         "↓ stress oxydatif",
         "↓ apoptose",
         "Autophagie / α-syn"],
        "Plausibilité biologique forte — hypothèses précliniques, pas une preuve d’efficacité humaine.",
        p, GREEN
    )

    # 23 PRECLIN + 24 EXENATIDE combined? Keep separate for density
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Chapitre 3", "Préclinique : signaux convergents")
    rows = [
        ["Molécule", "Observations (MPTP / 6-OHDA)"],
        ["Exénatide", "Préservation neurones DA · ↓ oxydatif / inflammation"],
        ["Liraglutide", "Amélioration motrice · protection neuronale"],
        ["Lixisénatide", "Intérêt pour action centrale"],
        ["Sémaglutide", "Survie · autophagie · ↓ α-syn"],
    ]
    table(s, Inches(0.25), Inches(1.25), Inches(12.8), rows,
          [Inches(2.8), Inches(10.0)], fs=17, rh=0.6)
    rect(s, Inches(0.25), Inches(4.7), Inches(12.8), Inches(2.1), CORAL)
    txt(s, Inches(0.5), Inches(4.95), Inches(12.3), Inches(0.35),
        "LIMITE", size=16, bold=True, color=WHITE)
    txt(s, Inches(0.5), Inches(5.4), Inches(12.3), Inches(1.1),
        "La plausibilité animale ne garantit pas le succès humain.\nLe passage modèle → clinique reste l’obstacle majeur.",
        size=19, color=WHITE)
    footer(s, p)

    # 24 EXENATIDE
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Chapitre 3", "Exénatide : espoir puis échec de phase III")
    panel(s, Inches(0.3), Inches(1.3), Inches(6.3), Inches(5.5),
          "Espoir initial",
          ["Études pilotes / phase II",
           "Signal moteur exploratoire",
           "Bonne tolérance globale",
           "Rationnel préclinique solide",
           "A justifié Exenatide-PD3"],
          TEAL, "+")
    panel(s, Inches(6.8), Inches(1.3), Inches(6.2), Inches(5.5),
          "Exenatide-PD3 (phase III)",
          ["194 participants · 96 semaines",
           "Exénatide hebdomadaire vs placebo",
           "MDS-UPDRS III OFF : pas de différence",
           "Pas d’effet modificateur démontré",
           "Fin de l’optimisme de classe"],
          CORAL, "–")
    footer(s, p)

    # 25 ATLAS LIXIPARK
    p += 1
    atlas_slide(
        prs, blank, "Chapitre 3 · atlas médical",
        "LIXIPARK — signal phase II, pas une preuve de neuroprotection",
        "med_07_lixipark.png",
        ["Phase II · 156 patients",
         "Parkinson précoce · 12 mois",
         "MDS-UPDRS III : −0,04 vs +3,04",
         "Différence ajustée : 3,08 pts",
         "Nausées / vomissements ↑",
         "Pas d’indication réglementaire"],
        "Signal moteur favorable à court terme — insuffisant pour affirmer un effet modificateur durable.",
        p, GREEN
    )

    # 26 SYNTHESIS
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Chapitre 3", "Synthèse des essais — classe hétérogène")
    rows = [
        ["Molécule / essai", "Design", "Résultat"],
        ["Exénatide (pilote/ph.II)", "Faible effectif", "Signal exploratoire"],
        ["LIXIPARK (lixisénatide)", "Ph.II · 156 · 12 mois", "+3,08 pts MDS-UPDRS III"],
        ["Exenatide-PD3", "Ph.III · 194 · 96 sem.", "Négatif (OFF)"],
        ["MOST-ABLE (séma oral)", "Ph.II · 99 · 48 sem.", "Résultats en attente"],
    ]
    table(s, Inches(0.25), Inches(1.3), Inches(12.8), rows,
          [Inches(4.0), Inches(3.8), Inches(5.0)], fs=16, rh=0.65)
    rect(s, Inches(0.25), Inches(4.9), Inches(12.8), Inches(1.9), NAVY)
    txt(s, Inches(0.5), Inches(5.3), Inches(12.3), Inches(1.2),
        "Pas d’effet de classe démontré. Pas d’indication dans Parkinson hors essai clinique.\nMéta-analyse globale : pas de bénéfice moteur significatif (signal courte durée = exploratoire).",
        size=17, color=WHITE)
    footer(s, p)

    # 27 LIMITS / PERSPECTIVES
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Chapitre 3", "Limites et perspectives")
    panel(s, Inches(0.3), Inches(1.3), Inches(6.3), Inches(5.5),
          "Limites",
          ["Phase II ≠ preuve modificatrice",
           "Durées souvent trop courtes",
           "MDS-UPDRS OFF insuffisant seul",
           "Biomarqueurs non validés",
           "Hétérogénéité patients / molécules"],
          CORAL, "L")
    panel(s, Inches(6.8), Inches(1.3), Inches(6.2), Inches(5.5),
          "Perspectives",
          ["Stade précoce + suivi long",
           "Critères moteurs + non moteurs",
           "Cognition, chutes, nutrition",
           "Stratification / biomarqueurs",
           "MOST-ABLE et essais confirmatoires"],
          GREEN, "P")
    footer(s, p)

    # 28 ATLAS pharmacist
    p += 1
    atlas_slide(
        prs, blank, "Chapitre 3 · atlas médical",
        "Rôle du pharmacien — sécuriser le parcours",
        "med_08_pharma.png",
        ["Éducation injection / titration",
         "EI digestifs & hydratation",
         "Constipation / perte de poids",
         "Risque chute / sarcopénie (PD)",
         "Hypoglycémie si associations",
         "Hors essai = pas d’indication PD"],
        "Le pharmacien sécurise l’usage métabolique et rappelle clairement le caractère expérimental dans Parkinson.",
        p, SKY
    )

    # 29 PHARMA GRID
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Chapitre 3", "Missions du pharmacien — grille claire")
    roles = [
        ("Éducation", ["Injection SC", "Titration", "Oublis / conservation"], TEAL),
        ("Tolérance", ["Nausées / vomissements", "Constipation (PD)", "Hydratation"], CORAL),
        ("Vigilance", ["Insuline/sulfamides", "Dénutrition", "Chutes / fragilité"], GOLD),
        ("Essais", ["Traçabilité", "Protocole", "Dispensation"], GREEN),
        ("Information", ["Pas d’indication PD", "Attentes réalistes", "Anti-automédication"], SKY),
        ("Coordination", ["Neurologue", "Endocrinologue", "Diététicien / MG"], BLUE),
    ]
    for i, (t, items, col) in enumerate(roles):
        c, r = i % 3, i // 3
        x = Inches(0.3) + Inches(c * 4.3)
        y = Inches(1.3) + Inches(r * 2.75)
        panel(s, x, y, Inches(4.15), Inches(2.55), t, items, col, "●")
    footer(s, p)

    # 30 CONCLUSION
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Conclusion", "Cinq messages à retenir")
    msgs = [
        ("1", "Classe mature en métabolisme", "DT2, obésité, cardio-rénal : bénéfices molécule-spécifiques.", TEAL),
        ("2", "Rationnel PD plausible", "Survie, mitochondries, inflammation, α-syn — préclinique.", GREEN),
        ("3", "Clinique hétérogène", "LIXIPARK + (ph.II) · Exenatide-PD3 − · pas d’effet de classe.", CORAL),
        ("4", "Pas d’indication actuelle", "Hors protocole de recherche : ne pas prescrire dans Parkinson.", GOLD),
        ("5", "Pharmacien central", "Éducation, tolérance, nutrition, information réaliste.", SKY),
    ]
    for i, (n, t, d, col) in enumerate(msgs):
        y = Inches(1.25) + Inches(i * 1.05)
        rect(s, Inches(0.3), y, Inches(12.7), Inches(0.95), SOFT)
        rect(s, Inches(0.3), y, Inches(0.85), Inches(0.95), col)
        txt(s, Inches(0.3), y + Inches(0.22), Inches(0.85), Inches(0.5),
            n, size=24, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
        txt(s, Inches(1.4), y + Inches(0.12), Inches(11.3), Inches(0.35),
            t, size=20, bold=True, color=NAVY, font="Georgia")
        txt(s, Inches(1.4), y + Inches(0.5), Inches(11.3), Inches(0.35),
            d, size=17, color=MUTED)
    rect(s, 0, Inches(7.18), W, Inches(0.32), NAVY)
    txt(s, Inches(0.35), Inches(7.2), Inches(10), Inches(0.26),
        "Merci  ·  Questions & discussion", size=14, bold=True, color=WHITE)
    txt(s, Inches(11.3), Inches(7.2), Inches(1.7), Inches(0.26),
        f"{p} / {TOTAL}", size=13, bold=True, color=WHITE, align=PP_ALIGN.RIGHT)

    assert p == TOTAL, f"Expected {TOTAL}, got {p}"
    out = "/workspace/docs/presentation/Soutenance_GLP1_Parkinson.pptx"
    prs.save(out)
    shutil.copy2(out, "/opt/cursor/artifacts/Soutenance_GLP1_Parkinson.pptx")
    print(f"Saved: {out}")
    print(f"Slides: {len(prs.slides)}")
    return out


if __name__ == "__main__":
    build()
