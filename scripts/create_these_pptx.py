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


def info_header(slide, badge, title, key_text, accent=CORAL):
    """En-tête style infographie médicale : badge + titre + POINT CLÉ."""
    bg(slide, BG)
    # bande haute claire
    rect(slide, 0, 0, W, Inches(1.15), WHITE)
    rect(slide, 0, Inches(1.15), W, Inches(0.04), accent)
    # badge numéro/section
    rect(slide, Inches(0.25), Inches(0.22), Inches(1.35), Inches(0.7), accent)
    txt(slide, Inches(0.25), Inches(0.35), Inches(1.35), Inches(0.45),
        badge, size=16, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
    # titre
    txt(slide, Inches(1.8), Inches(0.28), Inches(7.2), Inches(0.65),
        title.upper(), size=20, bold=True, color=NAVY)
    # POINT CLÉ
    rect(slide, Inches(9.15), Inches(0.15), Inches(3.9), Inches(0.85), accent)
    txt(slide, Inches(9.3), Inches(0.2), Inches(3.6), Inches(0.25),
        "POINT CLÉ", size=11, bold=True, color=WHITE)
    txt(slide, Inches(9.3), Inches(0.45), Inches(3.6), Inches(0.5),
        key_text, size=13, bold=True, color=WHITE)


def mech_flow(slide, l, t, w, title, steps, accent=TEAL):
    """Colonne gauche : mécanisme proposé (flowchart vertical)."""
    rect(slide, l, t, w, Inches(5.7), SOFT)
    txt(slide, l + Inches(0.15), t + Inches(0.12), w - Inches(0.3), Inches(0.35),
        title.upper(), size=14, bold=True, color=accent)
    n = len(steps)
    step_h = 0.72 if n <= 5 else 0.58
    for i, step in enumerate(steps):
        y = t + Inches(0.55) + Inches(i * (step_h + 0.18))
        oval(slide, l + Inches(0.18), y + Inches(0.08), Inches(0.48), Inches(0.48), accent)
        txt(slide, l + Inches(0.18), y + Inches(0.15), Inches(0.48), Inches(0.35),
            str(i + 1), size=14, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
        rect(slide, l + Inches(0.8), y, w - Inches(1.0), Inches(step_h), WHITE)
        txt(slide, l + Inches(0.95), y + Inches(0.15), w - Inches(1.3), Inches(step_h - 0.2),
            step, size=14, bold=True, color=DARK)
        if i < n - 1:
            # flèche simple
            txt(slide, l + Inches(0.25), y + Inches(step_h - 0.05), Inches(0.4), Inches(0.25),
                "▼", size=12, bold=True, color=accent, align=PP_ALIGN.CENTER)


def evid_col(slide, l, t, w, title, blocks, accent=NAVY):
    """Colonne droite : preuves / données cliniques numérotées."""
    rect(slide, l, t, w, Inches(5.7), SOFT)
    txt(slide, l + Inches(0.15), t + Inches(0.12), w - Inches(0.3), Inches(0.35),
        title.upper(), size=14, bold=True, color=accent)
    y = t + Inches(0.55)
    for num, head, body in blocks:
        # hauteur adaptative
        bh = Inches(1.15) if len(body) < 70 else Inches(1.35)
        rect(slide, l + Inches(0.15), y, w - Inches(0.3), bh, WHITE)
        oval(slide, l + Inches(0.28), y + Inches(0.2), Inches(0.42), Inches(0.42), accent)
        txt(slide, l + Inches(0.28), y + Inches(0.25), Inches(0.42), Inches(0.32),
            str(num), size=13, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
        txt(slide, l + Inches(0.85), y + Inches(0.12), w - Inches(1.2), Inches(0.35),
            head, size=15, bold=True, color=NAVY)
        txt(slide, l + Inches(0.85), y + Inches(0.48), w - Inches(1.2), bh - Inches(0.55),
            body, size=13, bold=True, color=MUTED)
        y += bh + Inches(0.12)


def info_slide(prs, blank, badge, title, key_text, mech_title, steps,
               evid_title, blocks, page, accent=CORAL):
    """Slide sans photo, style infographie médicale (mécanisme | preuves)."""
    s = prs.slides.add_slide(blank)
    info_header(s, badge, title, key_text, accent)
    mech_flow(s, Inches(0.25), Inches(1.35), Inches(5.9), mech_title, steps, accent)
    evid_col(s, Inches(6.35), Inches(1.35), Inches(6.7), evid_title, blocks, NAVY)
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

    # 2 PLAN — infographie
    p += 1
    info_slide(
        prs, blank, "01 · PLAN", "Organisation de la soutenance",
        "5 blocs · lecture continue",
        "Parcours logique",
        ["Besoin médical (Parkinson)",
         "Physiologie & pharmacologie GLP-1",
         "Indications métaboliques validées",
         "Repositionnement PD & essais",
         "Conclusion & rôle du pharmacien"],
        "Ce que chaque partie apporte",
        [("1", "Contexte", "Fardeau, physiopathologie, traitements symptomatiques, besoin non couvert."),
         ("2", "Chapitres 1–2", "Fondements GLP-1 puis bénéfices DT2 / obésité / cardio-rénal."),
         ("3", "Chapitre 3", "LIXIPARK vs Exenatide-PD3 : lecture critique molécule par molécule.")],
        p, TEAL
    )

    # 3 OBJECTIFS — infographie
    p += 1
    info_slide(
        prs, blank, "02 · OBJECTIFS", "Objectifs de la thèse",
        "Plausibilité ≠ preuve clinique",
        "Démarche de la thèse",
        ["Décrire GLP-1 / GLP-1R / molécules",
         "Analyser DT2, obésité, cardio-rénal",
         "Évaluer le repositionnement PD",
         "Préciser le rôle du pharmacien",
         "Conclure sans surinterprétation"],
        "Questions centrales",
        [("1", "Pharmacologie", "Différences PK/PD : pas d’équivalence entre agonistes."),
         ("2", "Clinique PD", "LIXIPARK (ph.II) vs Exenatide-PD3 (ph.III négatif)."),
         ("3", "Pratique", "Aucune indication PD hors protocole de recherche.")],
        p, CORAL
    )

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

    # 6 PHYSIOPATH — infographie
    p += 1
    info_slide(
        prs, blank, "03 · PD", "Physiopathologie multifactorielle",
        "Plusieurs cibles potentielles du GLP-1R",
        "Mécanismes proposés",
        ["Agrégation d’α-synucléine",
         "Dysfonction mitochondriale",
         "Stress oxydatif (ROS)",
         "Neuroinflammation microgliale",
         "Autophagie / protéostase altérées"],
        "Implications cliniques",
        [("1", "Hétérogénéité", "Expression clinique et progression très variables d’un patient à l’autre."),
         ("2", "Cibles GLP-1", "Survie cellulaire, mitochondries, inflammation, α-syn (préclinique)."),
         ("3", "Limite", "Mécanismes plausibles ≠ démonstration d’efficacité humaine.")],
        p, CORAL
    )

    # 7 TREATMENTS — infographie
    p += 1
    info_slide(
        prs, blank, "04 · SOINS", "Traitements actuels de la Parkinson",
        "MDS-UPDRS ≠ neuroprotection",
        "Stratégie symptomatique",
        ["Lévodopa = référence motrice",
         "Agonistes dopaminergiques",
         "IMAO-B / ICOMT / amantadine",
         "Stimulation cérébrale profonde",
         "Aucun modificateur certain"],
        "Lecture méthodologique",
        [("1", "Efficacité motrice", "Les traitements améliorent les symptômes, pas la dégénérescence."),
         ("2", "Scores cliniques", "Une variation MDS-UPDRS peut être symptomatique ou variable."),
         ("3", "Besoin", "Essais longs + biomarqueurs pour prouver un effet modificateur.")],
        p, GOLD
    )

    # 8 REPOSITIONING — infographie
    p += 1
    info_slide(
        prs, blank, "05 · RATIONNEL", "Repositionnement des agonistes du GLP-1",
        "Aucune indication PD à ce jour",
        "Pourquoi cette classe ?",
        ["PK/PD et tolérance déjà connues",
         "GLP-1R présent dans le SNC",
         "Voies AMPc / PI3K / MAPK",
         "Signaux précliniques favorables",
         "Essais humains déjà conduits"],
        "Garde-fous scientifiques",
        [("1", "Pas d’effet de classe", "Chaque molécule a sa PK, son exposition et ses preuves."),
         ("2", "Preuve requise", "Le repositionnement n’exempte pas d’essais rigoureux."),
         ("3", "Distinction clé", "Plausibilité / symptomatique / modificateur de maladie.")],
        p, TEAL
    )

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

    # 13 PANORAMA — infographie
    p += 1
    info_slide(
        prs, blank, "06 · MOLÉCULES", "Panorama des agonistes du GLP-1R",
        "Tirzépatide ≠ sélectif GLP-1R",
        "Logique de classification",
        ["Exendine-4 : exénatide, lixisénatide",
         "Analogues GLP-1 humain : lira/dula/séma",
         "Courte vs longue durée d’action",
         "PK différente → effets différents",
         "Tirzépatide : double GIP/GLP-1"],
        "Ancrage Parkinson / preuves",
        [("1", "Exénatide LP", "Évalué en PD ; Exenatide-PD3 négatif (ph.III)."),
         ("2", "Lixisénatide", "LIXIPARK ph.II : signal moteur +3,08 pts."),
         ("3", "Sémaglutide", "SELECT / FLOW ; MOST-ABLE (oral) en cours.")],
        p, BLUE
    )

    # 14 ACTIONS MÉTABOLIQUES — infographie
    p += 1
    info_slide(
        prs, blank, "07 · ACTION", "Effets métaboliques des agonistes",
        "Action plurimodale glucose-dépendante",
        "Mécanisme d’action",
        ["↑ Insuline (si hyperglycémie)",
         "↓ Glucagon (si hyperglycémie)",
         "Ralentissement vidange gastrique",
         "↑ Satiété / ↓ apports",
         "Effets cardio-rénaux (certaines molécules)"],
        "Conséquences pratiques",
        [("1", "Hypoglycémie", "Faible en monothérapie ; ↑ si insuline/sulfamides."),
         ("2", "Courte durée", "Effet postprandial plus marqué (vidange)."),
         ("3", "Longue durée", "Meilleur contrôle jeûne / HbA1c (exposition continue).")],
        p, TEAL
    )

    # 15 DIVIDER C
    p += 1
    divider(prs, blank, "C", "Chapitre 2 — Indications validées",
            "DT2, obésité, cardio-rénal, tolérance", p, SKY,
            image="sec_ch2_metabolic.png")

    # 16 DT2 — infographie
    p += 1
    info_slide(
        prs, blank, "08 · DT2", "Diabète de type 2 : place des GLP-1R",
        "Priorité aux comorbidités CV/MRC",
        "Rationnel physiopathologique",
        ["Insulinorésistance + déficit β",
         "Effet incrétine diminué",
         "Activation pharmacologique GLP-1R",
         "↓ glycémie jeûne et postprandiale",
         "↓ poids + faible hypo intrinsèque"],
        "Décision thérapeutique",
        [("1", "Cibles", "HbA1c n’est plus le seul critère : CV, rein, poids, préférences."),
         ("2", "Introduction", "Possible tôt si MCV/MRC, selon molécule et recommandations."),
         ("3", "Associations", "Attention insuline/sulfamides (hypoglycémie) et SGLT2 (hydratation).")],
        p, TEAL
    )

    # 17 OBÉSITÉ — infographie
    p += 1
    info_slide(
        prs, blank, "09 · POIDS", "Obésité et réduction pondérale",
        "Réponse variable · reprise après arrêt",
        "Mécanisme pondéral",
        ["↑ satiété / ↓ faim",
         "↓ apports énergétiques",
         "Liraglutide 3 mg (SCALE)",
         "Sémaglutide hebdo (STEP)",
         "Tirzépatide : double agoniste"],
        "Vigilance clinique",
        [("1", "Bénéfice", "Utile si obésité + risque cardiométabolique."),
         ("2", "Risque", "Âgés / fragiles : dénutrition, sarcopénie, déshydratation."),
         ("3", "Suivi", "Poids + apports + digestif + force / autonomie.")],
        p, GOLD
    )

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

    # 19 SAFETY — infographie
    p += 1
    info_slide(
        prs, blank, "10 · SÉCURITÉ", "Tolérance et sécurité d’emploi",
        "Titration = clé d’adhésion",
        "Cascade des EI digestifs",
        ["Instauration / ↑ dose",
         "Nausées, vomissements, diarrhée",
         "↓ appétit / constipation",
         "Risque déshydratation",
         "Arrêt si intolérance sévère"],
        "Points de vigilance pharmacien",
        [("1", "Hypoglycémie", "Rare seul ; surveiller si insuline ou sulfamides."),
         ("2", "Alertes", "Douleur abdominale intense : biliaire / pancréatite."),
         ("3", "Éducation", "Injection, conservation, oubli, repas légers, hydratation.")],
        p, CORAL
    )

    # 20 DIVIDER D
    p += 1
    divider(prs, blank, "D", "Chapitre 3 — Parkinson & preuves",
            "Mécanismes, préclinique, essais, pharmacien", p, GREEN,
            image="sec_ch3_parkinson.png")

    # 21 WHY PD — infographie
    p += 1
    info_slide(
        prs, blank, "11 · PD/GLP-1", "Pourquoi explorer le GLP-1 dans Parkinson ?",
        "Hypothèses précliniques, pas une preuve",
        "Chaîne mécanistique proposée",
        ["Activation du GLP-1R",
         "AMPc / PKA / EPAC2",
         "PI3K-Akt & MAPK-ERK",
         "↓ inflammation / oxydatif",
         "Survie neuronale putative"],
        "Niveau de preuve actuel",
        [("1", "Préclinique ++", "Signaux sur inflammation, ROS, survie (modèles)."),
         ("2", "α-synucléine", "Autophagie / protéostase : encore exploratoire."),
         ("3", "Clinique", "Hétérogène : LIXIPARK ≠ Exenatide-PD3.")],
        p, GREEN
    )

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

    # 23 PRECLIN — infographie
    p += 1
    info_slide(
        prs, blank, "12 · PRÉCLIN.", "Données expérimentales (MPTP / 6-OHDA)",
        "Preuve de concept ≠ validation humaine",
        "Ce que montrent les modèles",
        ["Atteinte dopaminergique induite",
         "Exénatide / lira / lixi / séma",
         "Signaux moteurs / histologiques",
         "↓ oxydatif / inflammation",
         "Justification d’essais cliniques"],
        "Limites de transposition",
        [("1", "Modèles toxiques", "Lésion rapide ≠ progression lente humaine."),
         ("2", "α-synucléine", "Mal reproduite dans MPTP/6-OHDA classiques."),
         ("3", "Lecture", "Soutenir un essai, pas conclure à l’efficacité.")],
        p, TEAL
    )

    # 24 EXENATIDE — infographie
    p += 1
    info_slide(
        prs, blank, "13 · EXÉNATIDE", "De l’espoir initial à Exenatide-PD3",
        "Phase III négative · 96 semaines",
        "Trajectoire des preuves",
        ["Études pilotes / ph.II",
         "Signal moteur exploratoire",
         "Justification d’un grand essai",
         "Exenatide-PD3 (194 patients)",
         "Pas de différence OFF"],
        "Données chiffrées clés",
        [("1", "Design PD3", "Exénatide hebdo vs placebo · 96 semaines."),
         ("2", "Critère", "MDS-UPDRS III à l’état OFF : aggravation similaire."),
         ("3", "Conclusion", "Pas d’effet modificateur démontré pour l’exénatide.")],
        p, CORAL
    )

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

    # 26 SYNTHESIS — infographie
    p += 1
    info_slide(
        prs, blank, "14 · SYNTHÈSE", "Essais cliniques : lecture comparative",
        "Pas d’effet de classe démontré",
        "Hiérarchie des résultats",
        ["Pilotes exénatide : signal",
         "LIXIPARK : +3,08 pts (ph.II)",
         "Exenatide-PD3 : négatif (ph.III)",
         "MOST-ABLE : en cours",
         "Méta-analyse : globalement NS"],
        "Interprétation prudente",
        [("1", "LIXIPARK", "156 patients · 12 mois · Parkinson précoce · EI digestifs ↑."),
         ("2", "Exenatide-PD3", "194 patients · 96 sem. · pas de bénéfice OFF."),
         ("3", "Pratique", "Aucune indication PD hors essai clinique.")],
        p, NAVY
    )

    # 27 LIMITS — infographie
    p += 1
    info_slide(
        prs, blank, "15 · MÉTHODE", "Limites et perspectives de recherche",
        "Symptomatique vs modificateur",
        "Obstacles méthodologiques",
        ["Durées trop courtes",
         "MDS-UPDRS OFF insuffisant seul",
         "Biomarqueurs non validés",
         "Hétérogénéité patients/molécules",
         "Risque de surinterprétation"],
        "Ce que devront faire les essais futurs",
        [("1", "Design", "Stade précoce + suivi long + puissance adéquate."),
         ("2", "Critères", "Moteurs + non moteurs + cognition + chutes + nutrition."),
         ("3", "Stratification", "Phénotypes métaboliques/génétiques testés a priori.")],
        p, GOLD
    )

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

    # 29 PHARMA GRID — infographie
    p += 1
    info_slide(
        prs, blank, "16 · PHARMA", "Missions du pharmacien (contexte PD)",
        "Pas d’usage hors essai clinique",
        "Parcours d’accompagnement",
        ["Éducation injection / titration",
         "Repérage EI digestifs",
         "Surveillance poids / hydratation",
         "Prévention hypoglycémie associée",
         "Coordination pluridisciplinaire"],
        "Spécificités Parkinson",
        [("1", "Vulnérabilités", "Constipation, sarcopénie, chutes, dextérité, cognition."),
         ("2", "Information", "Rappeler le caractère expérimental de la stratégie PD."),
         ("3", "Sécurité", "Prévenir automédication et attentes disproportionnées.")],
        p, SKY
    )

    # 30 CONCLUSION — infographie
    p += 1
    info_slide(
        prs, blank, "17 · FIN", "Messages à retenir pour le jury",
        "Candidats au repositionnement, pas traitements établis",
        "Fil de démonstration",
        ["Classe mature en métabolisme",
         "Rationnel PD biologiquement cohérent",
         "Clinique hétérogène (LIXI ≠ EXEN)",
         "Aucune indication PD actuelle",
         "Pharmacien = sécurisation + information"],
        "Formulation finale",
        [("1", "Métabolisme", "Bénéfices CV/rénaux : molécule et population spécifiques."),
         ("2", "Parkinson", "LIXIPARK signal ph.II ; Exenatide-PD3 négatif ; pas d’effet de classe."),
         ("3", "Avenir", "Essais longs, ciblés, multicritères — puis seulement pratique.")],
        p, NAVY
    )

    assert p == TOTAL, f"Expected {TOTAL}, got {p}"
    out = "/workspace/docs/presentation/Soutenance_GLP1_Parkinson.pptx"
    prs.save(out)
    shutil.copy2(out, "/opt/cursor/artifacts/Soutenance_GLP1_Parkinson.pptx")
    print(f"Saved: {out}")
    print(f"Slides: {len(prs.slides)}")
    return out


if __name__ == "__main__":
    build()
