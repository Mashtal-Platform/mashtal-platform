#!/usr/bin/env python3
"""
Soutenance GLP-1 & Parkinson — dense, mix illustré / classique, images annotées.
~30 slides. Objectif: minimiser le vide, idées lisibles, créatif + professionnel.
"""

from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE
import os
import shutil

NAVY = RGBColor(0x0A, 0x3D, 0x4F)
TEAL = RGBColor(0x14, 0x8A, 0x96)
TEAL_LT = RGBColor(0x2E, 0xB8, 0xC4)
MINT = RGBColor(0xE6, 0xF4, 0xF2)
CORAL = RGBColor(0xE8, 0x6A, 0x4E)
CORAL_DK = RGBColor(0xC4, 0x4E, 0x35)
GOLD = RGBColor(0xE0, 0x9B, 0x24)
GOLD_DK = RGBColor(0xB8, 0x7A, 0x12)
SKY = RGBColor(0x2F, 0x8F, 0xC7)
GREEN = RGBColor(0x2A, 0x96, 0x68)
GREEN_DK = RGBColor(0x1C, 0x72, 0x4E)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
DARK = RGBColor(0x16, 0x24, 0x2A)
MUTED = RGBColor(0x3F, 0x55, 0x5C)
SOFT = RGBColor(0xEE, 0xF6, 0xF4)
ROW = RGBColor(0xE8, 0xF3, 0xF0)

W = Inches(13.333)
H = Inches(7.5)
TOTAL = 30
ASSETS = "/workspace/docs/presentation/assets"


def run(r, size=14, bold=False, color=DARK, font="Calibri"):
    r.font.size = Pt(size)
    r.font.bold = bold
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


def roundr(slide, l, t, w, h, fill):
    sh = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, l, t, w, h)
    sh.fill.solid()
    sh.fill.fore_color.rgb = fill
    sh.line.fill.background()
    try:
        sh.adjustments[0] = 0.06
    except Exception:
        pass
    return sh


def txt(slide, l, t, w, h, text, size=14, bold=False, color=DARK,
        align=PP_ALIGN.LEFT, font="Calibri"):
    box = slide.shapes.add_textbox(l, t, w, h)
    tf = box.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.alignment = align
    r = p.add_run()
    r.text = text
    run(r, size=size, bold=bold, color=color, font=font)
    return box


def bullets(slide, l, t, w, h, items, size=12, color=DARK, spacing=3):
    box = slide.shapes.add_textbox(l, t, w, h)
    tf = box.text_frame
    tf.word_wrap = True
    for i, item in enumerate(items):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = PP_ALIGN.LEFT
        p.space_after = Pt(spacing)
        r = p.add_run()
        if isinstance(item, tuple):
            r.text = "▸ " + item[0]
            run(r, size=size, bold=True, color=color)
            r2 = p.add_run()
            r2.text = item[1]
            run(r2, size=size, bold=False, color=MUTED)
        else:
            r.text = "▸ " + item
            run(r, size=size, color=color)
    return box


def footer(slide, page):
    rect(slide, 0, Inches(7.15), W, Inches(0.35), NAVY)
    rect(slide, 0, Inches(7.15), Inches(0.2), Inches(0.35), CORAL)
    txt(slide, Inches(0.35), Inches(7.18), Inches(10.2), Inches(0.28),
        "Agonistes du GLP-1  ·  Parkinson  ·  Soutenance densifiée",
        size=9, color=WHITE)
    txt(slide, Inches(11.4), Inches(7.18), Inches(1.6), Inches(0.28),
        f"{page}/{TOTAL}", size=10, bold=True, color=TEAL_LT, align=PP_ALIGN.RIGHT)


def header(slide, kicker, title, color=NAVY, accent=CORAL):
    """Compact header — maximise body space."""
    bg(slide, MINT)
    rect(slide, 0, 0, W, Inches(0.95), color)
    rect(slide, 0, 0, Inches(0.14), Inches(0.95), accent)
    rect(slide, 0, Inches(0.95), W, Inches(0.06), TEAL_LT)
    txt(slide, Inches(0.35), Inches(0.12), Inches(12.6), Inches(0.22),
        kicker.upper(), size=10, bold=True, color=TEAL_LT)
    txt(slide, Inches(0.35), Inches(0.38), Inches(12.6), Inches(0.45),
        title, size=20, bold=True, color=WHITE, font="Georgia")


def card(slide, l, t, w, h, title, items, hc=TEAL, size=11):
    roundr(slide, l, t, w, h, WHITE)
    rect(slide, l, t, w, Inches(0.36), hc)
    txt(slide, l + Inches(0.12), t + Inches(0.05), w - Inches(0.24), Inches(0.28),
        title, size=11, bold=True, color=WHITE)
    bullets(slide, l + Inches(0.12), t + Inches(0.42),
            w - Inches(0.24), h - Inches(0.48), items, size=size, spacing=2)


def kpi(slide, l, t, w, h, value, label, sub=None, fill=TEAL):
    roundr(slide, l, t, w, h, fill)
    txt(slide, l + Inches(0.08), t + Inches(0.12), w - Inches(0.16), Inches(0.45),
        value, size=22, bold=True, color=WHITE, align=PP_ALIGN.CENTER, font="Georgia")
    txt(slide, l + Inches(0.08), t + Inches(0.6), w - Inches(0.16), Inches(0.35),
        label, size=11, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
    if sub:
        txt(slide, l + Inches(0.08), t + Inches(0.95), w - Inches(0.16), Inches(0.35),
            sub, size=10, color=RGBColor(0xDC, 0xF2, 0xEE), align=PP_ALIGN.CENTER)


def img(slide, name, l, t, w, h):
    path = os.path.join(ASSETS, name)
    if os.path.exists(path):
        return slide.shapes.add_picture(path, l, t, width=w, height=h)
    roundr(slide, l, t, w, h, SOFT)
    return None


def table(slide, l, t, w, rows, widths, fs=11, rh=0.36):
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


def divider(prs, blank, num, title, subtitle, page, accent=CORAL):
    s = prs.slides.add_slide(blank)
    bg(s, NAVY)
    rect(s, 0, 0, Inches(0.22), H, accent)
    rect(s, Inches(0.22), 0, Inches(0.08), H, TEAL_LT)
    # filled content strip so divider isn't empty
    roundr(s, Inches(0.9), Inches(1.8), Inches(1.5), Inches(0.5), accent)
    txt(s, Inches(0.9), Inches(1.88), Inches(1.5), Inches(0.35),
        f"PARTIE {num}", size=12, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
    txt(s, Inches(0.9), Inches(2.5), Inches(11.2), Inches(1.1),
        title, size=30, bold=True, color=WHITE, font="Georgia")
    txt(s, Inches(0.9), Inches(3.7), Inches(11.2), Inches(0.6),
        subtitle, size=15, color=TEAL_LT)
    # roadmap chips filling bottom
    chips = [
        ("A", "Contexte"), ("B", "Pharmacologie"), ("C", "Indications"),
        ("D", "Parkinson"), ("E", "Conclusion")
    ]
    for i, (n, lab) in enumerate(chips):
        x = Inches(0.9) + Inches(i * 2.35)
        col = accent if n == num else TEAL
        roundr(s, x, Inches(5.2), Inches(2.2), Inches(1.2), col)
        txt(s, x, Inches(5.35), Inches(2.2), Inches(0.35),
            n, size=16, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
        txt(s, x, Inches(5.75), Inches(2.2), Inches(0.4),
            lab, size=12, color=WHITE, align=PP_ALIGN.CENTER)
    txt(s, Inches(0.9), Inches(6.7), Inches(11), Inches(0.3),
        f"{page}/{TOTAL}", size=10, color=RGBColor(0x7A, 0xA8, 0xB0))
    return s


def illustrated(prs, blank, kicker, title, image, takeaway, points, page,
                hc=NAVY, ac=CORAL, points_title="Idées à retenir"):
    """Image annotée (gauche) + panneau dense (droite) + bandeau takeaway."""
    s = prs.slides.add_slide(blank)
    header(s, kicker, title, color=hc, accent=ac)
    # image frame fills left
    roundr(s, Inches(0.25), Inches(1.15), Inches(7.35), Inches(4.55), WHITE)
    img(s, image, Inches(0.35), Inches(1.25), Inches(7.15), Inches(4.35))
    # dense right panel
    card(s, Inches(7.75), Inches(1.15), Inches(5.3), Inches(4.55),
         points_title, points, ac, size=12)
    # full-width takeaway bar — kills empty bottom
    roundr(s, Inches(0.25), Inches(5.85), Inches(12.8), Inches(1.1), hc)
    txt(s, Inches(0.45), Inches(5.98), Inches(1.6), Inches(0.28),
        "À RETENIR", size=11, bold=True, color=GOLD)
    txt(s, Inches(0.45), Inches(6.3), Inches(12.4), Inches(0.5),
        takeaway, size=13, color=WHITE)
    footer(s, page)
    return s


def build():
    prs = Presentation()
    prs.slide_width = W
    prs.slide_height = H
    blank = prs.slide_layouts[6]
    p = 0

    # ========== 1 TITLE (illustrated mix) ==========
    p += 1
    s = prs.slides.add_slide(blank)
    bg(s, NAVY)
    rect(s, 0, 0, Inches(0.18), H, CORAL)
    rect(s, Inches(0.18), 0, Inches(0.08), H, GOLD)
    txt(s, Inches(0.5), Inches(0.55), Inches(6.5), Inches(0.3),
        "SOUTENANCE DE THÈSE  ·  PHARMACIE", size=12, bold=True, color=TEAL_LT)
    txt(s, Inches(0.5), Inches(1.0), Inches(6.6), Inches(2.4),
        "Agonistes du GLP-1 :\nmise au point et potentiel\nprometteur pour la maladie\nde Parkinson",
        size=24, bold=True, color=WHITE, font="Georgia")
    # image right
    roundr(s, Inches(7.3), Inches(0.5), Inches(5.7), Inches(4.0), WHITE)
    img(s, "ann_01_parkinson.png", Inches(7.4), Inches(0.6), Inches(5.5), Inches(3.8))
    # bottom filled chips
    chips = [
        ("Physiologie", TEAL), ("Métabolisme", CORAL),
        ("Neuroprotection", GREEN), ("LIXIPARK", GOLD_DK), ("Pharmacien", SKY)
    ]
    for i, (lab, col) in enumerate(chips):
        x = Inches(0.5) + Inches(i * 2.5)
        roundr(s, x, Inches(5.3), Inches(2.35), Inches(1.35), col)
        txt(s, x + Inches(0.1), Inches(5.7), Inches(2.15), Inches(0.5),
            lab, size=13, bold=True, color=WHITE, align=PP_ALIGN.CENTER)

    # ========== 2 PLAN dense ==========
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Organisation", "Plan — 5 blocs, lecture continue", accent=GOLD)
    parts = [
        ("A", "Contexte", ["Parkinson & fardeau", "Physiopathologie", "Limites thérapeutiques", "Repositionnement"], CORAL),
        ("B", "Chapitre 1", ["Physiologie GLP-1", "Récepteur & voies", "Courte vs longue", "Panorama molécules"], TEAL),
        ("C", "Chapitre 2", ["DT2", "Obésité / poids", "Cardio-rénal", "Tolérance"], SKY),
        ("D", "Chapitre 3", ["Mécanismes PD", "Préclinique", "Exénatide / LIXIPARK", "Pharmacien"], GREEN),
        ("E", "Conclusion", ["5 messages", "Perspectives", "Discussion", "Questions"], GOLD_DK),
    ]
    for i, (n, t, items, col) in enumerate(parts):
        x = Inches(0.25) + Inches(i * 2.6)
        card(s, x, Inches(1.2), Inches(2.45), Inches(5.6), f"{n} · {t}", items, col, size=12)
    footer(s, p)

    # ========== 3 OBJECTIFS dense ==========
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Objectifs", "Quatre objectifs — fil pharmacologique", accent=TEAL)
    objs = [
        ("1", "Physiologie & pharmacologie", "GLP-1, GLP-1R, structures, PK courte/longue, panorama des agonistes.", CORAL,
         ["Demi-vie DPP-4", "Signalisation", "Tableau comparatif"]),
        ("2", "Indications validées", "DT2, obésité, protection cardio-rénale, place ADA/EASD.", TEAL,
         ["HbA1c 0,8–1,8%", "STEP / SCALE", "LEADER / SUSTAIN-6"]),
        ("3", "Repositionnement Parkinson", "Mécanismes, préclinique, essais (exénatide, LIXIPARK, séma).", GREEN,
         ["Neuroprotection", "Hétérogénéité", "Washout LIXIPARK"]),
        ("4", "Rôle du pharmacien", "Éducation, vigilance, essais, coordination pluridisciplinaire.", GOLD_DK,
         ["Injection / titration", "EI digestifs", "Usage validé vs expérimental"]),
    ]
    for i, (n, t, d, col, tags) in enumerate(objs):
        y = Inches(1.15) + Inches(i * 1.4)
        roundr(s, Inches(0.25), y, Inches(12.8), Inches(1.28), WHITE)
        rect(s, Inches(0.25), y, Inches(0.85), Inches(1.28), col)
        txt(s, Inches(0.25), y + Inches(0.35), Inches(0.85), Inches(0.5),
            n, size=24, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
        txt(s, Inches(1.3), y + Inches(0.12), Inches(7.5), Inches(0.35),
            t, size=15, bold=True, color=NAVY, font="Georgia")
        txt(s, Inches(1.3), y + Inches(0.5), Inches(7.5), Inches(0.55),
            d, size=12, color=MUTED)
        for j, tag in enumerate(tags):
            tx = Inches(9.0) + Inches(j * 1.3)
            roundr(s, tx, y + Inches(0.4), Inches(1.2), Inches(0.45), col)
            txt(s, tx, y + Inches(0.48), Inches(1.2), Inches(0.3),
                tag, size=9, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
    footer(s, p)

    # ========== 4 DIVIDER A ==========
    p += 1
    divider(prs, blank, "A", "Contexte & besoin médical",
            "Parkinson : fardeau, physiopathologie, impasse, repositionnement", p, CORAL)

    # ========== 5 ILLUSTRATED Parkinson ==========
    p += 1
    illustrated(
        prs, blank, "Contexte · illustré",
        "Parkinson : lire l’image = comprendre le problème",
        "ann_01_parkinson.png",
        "Dégénérescence dopaminergique + mécanismes multiples → besoin d’un traitement modificateur, pas seulement symptomatique.",
        ["2ᵉ neurodégénérescence (après Alzheimer)",
         "Hausse attendue ×2–3 des patients",
         "Moteurs + non moteurs → qualité de vie",
         "α-synucléine, inflammation, oxydatif",
         "Aucun modificateur de maladie validé",
         "Cible idéale pour repositionnement"],
        p, NAVY, CORAL, "Ce que montre l’image"
    )

    # ========== 6 NORMAL physiopath dense ==========
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Contexte · classique", "Physiopathologie — 6 cibles potentielles du GLP-1R", accent=GOLD)
    items = [
        ("α-synucléine", "Agrégation, toxicité, propagation", CORAL),
        ("Mitochondries", "Dysfonction énergétique + ROS", TEAL),
        ("Stress oxydatif", "Lésions cumulatives neuronales", GOLD_DK),
        ("Neuroinflammation", "Microglie & médiateurs toxiques", SKY),
        ("Autophagie", "Clairance protéique altérée", GREEN),
        ("Gènes / environnement", "Susceptibilité & progression", CORAL_DK),
    ]
    for i, (t, d, col) in enumerate(items):
        c, r = i % 3, i // 3
        x = Inches(0.25) + Inches(c * 4.3)
        y = Inches(1.15) + Inches(r * 2.85)
        card(s, x, y, Inches(4.15), Inches(2.7), t,
             [d, "Modulable potentiellement par agonistes GLP-1", "Justifie l’hypothèse neuroprotectrice"],
             col, size=12)
    footer(s, p)

    # ========== 7 NORMAL treatments ==========
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Contexte · classique", "Traitements actuels : utiles, mais non modificateurs", accent=CORAL)
    rows = [
        ["Classe", "Rôle clinique", "Limite majeure"],
        ["Lévodopa (± ICOMT)", "Référence motrice", "Fluctuations / dyskinésies"],
        ["Agonistes dopaminergiques", "Symptômes moteurs", "EI neuropsychiatriques"],
        ["IMAO-B", "Potentialisation dopamine", "Effet symptomatique seul"],
        ["Amantadine", "Dyskinésies", "Pas d’effet modificateur"],
        ["Thérapies avancées", "Stades compliqués", "Invasives, sélection"],
    ]
    table(s, Inches(0.25), Inches(1.15), Inches(12.8), rows,
          [Inches(3.5), Inches(4.2), Inches(5.1)], fs=12, rh=0.55)
    roundr(s, Inches(0.25), Inches(4.7), Inches(6.2), Inches(2.15), CORAL)
    txt(s, Inches(0.45), Inches(4.9), Inches(5.8), Inches(0.3),
        "MESSAGE PHARMACOLOGIQUE", size=11, bold=True, color=GOLD)
    txt(s, Inches(0.45), Inches(5.3), Inches(5.8), Inches(1.3),
        "Améliorer les symptômes ≠ freiner la neurodégénérescence. Le besoin d’une stratégie neuroprotectrice reste entier.",
        size=14, color=WHITE)
    roundr(s, Inches(6.65), Inches(4.7), Inches(6.4), Inches(2.15), NAVY)
    txt(s, Inches(6.85), Inches(4.9), Inches(6.0), Inches(0.3),
        "POURQUOI LE REPOSITIONNEMENT ?", size=11, bold=True, color=TEAL_LT)
    bullets(s, Inches(6.85), Inches(5.3), Inches(6.0), Inches(1.4),
            ["PK/PD et tolérance déjà connus", "Délais/coûts réduits vs NCE",
             "GLP-1R présent dans le SNC"], size=12, color=WHITE, spacing=3)
    footer(s, p)

    # ========== 8 NORMAL repositionnement ==========
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Contexte · classique", "Repositionnement GLP-1 : logique en 2 colonnes", accent=GREEN)
    card(s, Inches(0.25), Inches(1.15), Inches(6.35), Inches(5.65),
         "Avantages stratégiques",
         [("PK/PD connues", " — données déjà disponibles"),
          ("Tolérance documentée", " — classe mature, millions de patients"),
          ("Développement accéléré", " — vs molécule de novo"),
          ("Pertinent en neuro", " — nombreux échecs d’innovations"),
          ("GLP-1R au SNC", " — hypothalamus, tronc, hippocampe…"),
          ("Essais déjà menés", " — exénatide, lixisénatide, séma")],
         TEAL, size=13)
    card(s, Inches(6.8), Inches(1.15), Inches(6.25), Inches(5.65),
         "Hypothèse thérapeutique",
         [("Anti-inflammatoire", " — ↓ microglie / médiateurs"),
          ("Anti-oxydant", " — ↓ ROS, intégrité cellulaire"),
          ("Anti-apoptotique", " — PI3K/Akt, PKA"),
          ("Mitochondries", " — soutien énergétique"),
          ("α-synucléine", " — autophagie / clairance (hypothèse)"),
          ("But", " — ralentir la progression, pas seulement masquer")],
         CORAL, size=13)
    footer(s, p)

    # ========== 9 DIVIDER B ==========
    p += 1
    divider(prs, blank, "B", "Chapitre 1 — Physiologie & pharmacologie",
            "GLP-1, récepteur, courte/longue durée, panorama des agonistes", p, TEAL)

    # ========== 10 ILLUSTRATED GLP-1 ==========
    p += 1
    illustrated(
        prs, blank, "Chapitre 1 · illustré",
        "Physiologie du GLP-1 — lire le parcours hormone",
        "ann_02_glp1.png",
        "Hormone incrétine utile… mais détruite en 1–2 min par la DPP-4 → d’où les agonistes résistants.",
        ["Cellules L (iléon / côlon)",
         "Clivage du proglucagon",
         "Formes actives (7-36)/(7-37)",
         "Sécrétion postprandiale",
         "Insuline glucose-dépendante",
         "DPP-4 = contrainte PK majeure",
         "Agonistes = solution pharmaceutique"],
        p, TEAL, CORAL, "Lecture de l’illustration"
    )

    # ========== 11 ILLUSTRATED receptor ==========
    p += 1
    illustrated(
        prs, blank, "Chapitre 1 · illustré",
        "GLP-1R & cascades — du ligand à la survie cellulaire",
        "ann_03_signal.png",
        "Même récepteur, plusieurs voies : métabolisme périphérique ET neuroprotection centrale.",
        ["GPCR classe B (463 AA)",
         "Expression : pancréas, cœur, rein, SNC",
         "Gs → AMPc → PKA / EPAC",
         "PI3K/Akt : anti-apoptose",
         "MAPK/ERK : réparation",
         "Au cerveau : ↓ inflammation / oxydatif",
         "Cible pléiotrope = opportunité PD"],
        p, NAVY, TEAL, "Ce que disent les flèches"
    )

    # ========== 12 ILLUSTRATED short vs long ==========
    p += 1
    illustrated(
        prs, blank, "Chapitre 1 · illustré",
        "Courte vs longue durée — 2 profils, 2 usages",
        "ann_04_agonistes.png",
        "La durée d’exposition du récepteur dicte le profil clinique (postprandial vs jeûne/HbA1c).",
        ["Courte : exénatide, lixisénatide",
         "Stimulation intermittente",
         "Fort effet vidange gastrique",
         "Contrôle postprandial marqué",
         "Longue : lira / dula / séma / tirzépatide",
         "Exposition continue",
         "Meilleur contrôle jeûne & HbA1c"],
        p, CORAL_DK, TEAL, "Comparer les deux stylos"
    )

    # ========== 13 NORMAL table molecules ==========
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Chapitre 1 · classique", "Panorama des agonistes — tableau de référence", accent=GOLD)
    rows = [
        ["Molécule", "Profil", "Admin.", "Particularité clinique"],
        ["Exénatide", "Courte", "2×/j ou LP", "Exendine-4 · essais Parkinson"],
        ["Lixisénatide", "Courte", "1×/j", "LIXIPARK · postprandial"],
        ["Liraglutide", "Longue", "1×/j", "DT2 + obésité · LEADER"],
        ["Dulaglutide", "Longue", "1×/sem.", "REWIND (CV)"],
        ["Sémaglutide", "Longue", "1×/sem. / oral", "STEP · SUSTAIN-6 · essais PD"],
        ["Tirzépatide", "GIP/GLP-1", "1×/sem.", "Puissance métabolique majeure"],
    ]
    table(s, Inches(0.25), Inches(1.15), Inches(12.8), rows,
          [Inches(2.3), Inches(2.0), Inches(2.6), Inches(5.9)], fs=12, rh=0.52)
    roundr(s, Inches(0.25), Inches(5.2), Inches(12.8), Inches(1.6), TEAL)
    txt(s, Inches(0.45), Inches(5.4), Inches(12.4), Inches(0.3),
        "POINT EXPERT", size=11, bold=True, color=GOLD)
    txt(s, Inches(0.45), Inches(5.8), Inches(12.4), Inches(0.8),
        "Structure (exendine-4 vs GLP-1 humain, taille, lipidation) → demi-vie, immunogénicité et accès au SNC variables. La classe n’est pas uniforme pour un usage neurologique.",
        size=13, color=WHITE)
    footer(s, p)

    # ========== 14 NORMAL mechanisms ==========
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Chapitre 1 · classique", "Mécanismes métaboliques — 6 actions simultanées", accent=SKY)
    acts = [
        ("↑ Insuline", "Glucose-dépendante → peu d’hypoglycémies en monothérapie", TEAL),
        ("↓ Glucagon", "Moins de production hépatique de glucose", CORAL),
        ("Vidange gastrique", "Ralentie (surtout courte durée) → ↓ pic postprandial", GOLD_DK),
        ("Satiété centrale", "↓ appétit → perte de poids cliniquement utile", GREEN),
        ("Cellules β", "Survie / fonction préservées (anti-apoptose)", SKY),
        ("Pléiotropie", "Vasculaire, rénal, inflammatoire — au-delà de l’HbA1c", CORAL_DK),
    ]
    for i, (t, d, col) in enumerate(acts):
        c, r = i % 3, i // 3
        x = Inches(0.25) + Inches(c * 4.3)
        y = Inches(1.15) + Inches(r * 2.85)
        card(s, x, y, Inches(4.15), Inches(2.7), t, [d, "Effet classiquement recherché en DT2/obésité"], col, size=12)
    footer(s, p)

    # ========== 15 DIVIDER C ==========
    p += 1
    divider(prs, blank, "C", "Chapitre 2 — Indications validées",
            "DT2, obésité, cardio-rénal, tolérance : la base solide du repositionnement", p, SKY)

    # ========== 16 NORMAL DT2 ==========
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Chapitre 2 · classique", "Diabète de type 2 — place clinique actuelle", accent=TEAL)
    kpi(s, Inches(0.25), Inches(1.15), Inches(4.15), Inches(1.55), "0,8–1,8%", "↓ HbA1c typique", "selon molécule / dose", TEAL)
    kpi(s, Inches(4.55), Inches(1.15), Inches(4.15), Inches(1.55), "ADA/EASD", "Classe majeure", "précoce si CV/MRC", CORAL)
    kpi(s, Inches(8.85), Inches(1.15), Inches(4.2), Inches(1.55), "Faible", "Risque d’hypoglycémie", "sauf +insuline/sulfamides", GREEN)
    card(s, Inches(0.25), Inches(2.9), Inches(6.35), Inches(3.9),
         "Rationnel physiopathologique",
         ["DT2 = insulinorésistance + défaillance β",
          "Effet incrétine diminué = cible clé",
          "Agonistes = incrétine pharmacologique durable",
          "Courte durée → postprandial",
          "Longue durée → jeûne + HbA1c",
          "Sémaglutide & tirzépatide très puissants"],
         TEAL, size=12)
    card(s, Inches(6.8), Inches(2.9), Inches(6.25), Inches(3.9),
         "Décision thérapeutique",
         ["Après mesures hygiéno-diététiques ± metformine",
          "Introduction précoce si MCV / MRC / haut risque",
          "Bénéfice poids concomitant",
          "Intensification préférée chez nombreux patients",
          "Toujours éduquer sur titration & EI digestifs",
          "Surveillance associations hypoglycémiantes"],
         CORAL, size=12)
    footer(s, p)

    # ========== 17 NORMAL weight ==========
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Chapitre 2 · classique", "Obésité — SCALE, STEP, SURMOUNT", accent=GOLD)
    kpi(s, Inches(0.25), Inches(1.15), Inches(4.15), Inches(1.7), "~15%", "Sémaglutide (STEP)", "perte moyenne", TEAL)
    kpi(s, Inches(4.55), Inches(1.15), Inches(4.15), Inches(1.7), "3 mg", "Liraglutide (SCALE)", "bénéfice durable", CORAL)
    kpi(s, Inches(8.85), Inches(1.15), Inches(4.2), Inches(1.7), "++", "Tirzépatide", "souvent > sélectifs", GOLD_DK)
    card(s, Inches(0.25), Inches(3.05), Inches(6.35), Inches(3.75),
         "Mécanismes du bénéfice pondéral",
         ["↓ appétit / ↑ satiété (action centrale)",
          "Réduction des apports alimentaires",
          "Amélioration sensibilité à l’insuline",
          "Impact syndrome métabolique (PA, lipides)",
          "Effet cliniquement significatif et durable"],
         TEAL, size=12)
    card(s, Inches(6.8), Inches(3.05), Inches(6.25), Inches(3.75),
         "Conseil officinal prioritaire",
         ["Titration progressive = adhésion",
          "EI digestifs = 1ʳᵉ cause d’arrêt",
          "Repas légers, hydratation",
          "Éducation injection / oubli / conservation",
          "Suivi nutritionnel et motivationnel"],
         CORAL, size=12)
    footer(s, p)

    # ========== 18 ILLUSTRATED cardio ==========
    p += 1
    illustrated(
        prs, blank, "Chapitre 2 · illustré",
        "Cardio-rénal — au-delà de la glycémie",
        "ann_05_cardio.png",
        "LEADER, SUSTAIN-6, REWIND : bénéfice CV (et signal rénal) robuste → classe repositionnée dans les recommandations.",
        ["LEADER : liraglutide ↓ MACE & mortalité",
         "SUSTAIN-6 : sémaglutide ↓ MACE + rein",
         "REWIND : dulaglutide bénéfice CV",
         "Mécanismes : poids, PA, lipides, inflammation",
         "Effets directs vasculaires possibles",
         "Intérêt fort si risque CV / MRC"],
        p, SKY, GREEN, "Lire le triangle cœur–rein–glycé"
    )

    # ========== 19 NORMAL safety ==========
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Chapitre 2 · classique", "Tolérance & sécurité — check-list pharmacien", accent=CORAL)
    card(s, Inches(0.25), Inches(1.15), Inches(4.15), Inches(5.65),
         "Fréquents",
         ["Nausées, vomissements, diarrhées",
          "Surtout initiation / ↑ dose",
          "Souvent transitoires",
          "Réduits par titration lente",
          "Cause n°1 d’arrêt précoce",
          "Conseils : repas légers, hydratation",
          "Réassurance + suivi rapproché"],
         CORAL, size=12)
    card(s, Inches(4.55), Inches(1.15), Inches(4.15), Inches(5.65),
         "À anticiper",
         ["Hypoglycémie si insuline/sulfamides",
          "Adapter/anticiper doses associées",
          "Signes de pancréatite aiguë",
          "Complications biliaires",
          "Contre-indications spécifiques",
          "Déclaration pharmacovigilance",
          "Interactions / iatrogénie"],
         GOLD_DK, size=12)
    card(s, Inches(8.85), Inches(1.15), Inches(4.2), Inches(5.65),
         "Messages utiles",
         ["Classe mature, essais de sécurité",
          "Profil globalement favorable",
          "Inquiétudes historiques non confirmées au niveau populationnel",
          "Information claire du patient",
          "Traçabilité des EI",
          "Base solide pour explorer d’autres indications"],
         GREEN, size=12)
    footer(s, p)

    # ========== 20 DIVIDER D ==========
    p += 1
    divider(prs, blank, "D", "Chapitre 3 — Parkinson & repositionnement",
            "Mécanismes, preuves, LIXIPARK, limites, rôle du pharmacien", p, GREEN)

    # ========== 21 NORMAL why PD table ==========
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Chapitre 3 · classique", "Pourquoi le GLP-1 dans la Parkinson ? Matrice", accent=GREEN)
    rows = [
        ["Mécanisme PD", "Modulation potentielle GLP-1", "Niveau"],
        ["Neuroinflammation", "↓ microglie / médiateurs", "Préclinique ++"],
        ["Stress oxydatif", "↓ ROS, intégrité cellulaire", "Préclinique ++"],
        ["Mitochondries", "Soutien énergétique (Akt/AMPc)", "Préclinique +"],
        ["Apoptose neuronale", "Voies de survie PKA / Akt / ERK", "Préclinique ++"],
        ["α-synucléine", "Autophagie / clairance", "Exploratoire"],
        ["Neurones DA", "Préservation (modèles toxiques)", "Préclin. → clin. hétérogène"],
    ]
    table(s, Inches(0.25), Inches(1.15), Inches(12.8), rows,
          [Inches(3.2), Inches(5.5), Inches(4.1)], fs=12, rh=0.55)
    footer(s, p)

    # ========== 22 ILLUSTRATED neuro ==========
    p += 1
    illustrated(
        prs, blank, "Chapitre 3 · illustré",
        "Neuroprotection — ce que l’image résume",
        "ann_06_neuro.png",
        "Activation GLP-1R → survie neuronale + contrôle de l’environnement toxique (inflammation, oxydatif, apoptose).",
        ["cAMP/PKA/EPAC → survie / plasticité",
         "PI3K/Akt → anti-apoptose",
         "MAPK/ERK → réparation",
         "↓ neuroinflammation microgliale",
         "Soutien mitochondrial",
         "Autophagie → ↓ α-syn (hypothèse)",
         "Plausibilité biologique forte"],
        p, GREEN_DK, TEAL, "Légende de l’illustration"
    )

    # ========== 23 NORMAL preclinical ==========
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Chapitre 3 · classique", "Préclinique (MPTP / 6-OHDA) — signaux convergents", accent=TEAL)
    rows = [
        ["Molécule", "Observations principales"],
        ["Exénatide", "Préservation neurones DA · ↓ oxydatif · ↓ inflammation"],
        ["Liraglutide", "Amélioration motrice · protection neuronale"],
        ["Lixisénatide", "Intérêt pénétration / action centrale"],
        ["Sémaglutide", "Survie · autophagie · ↓ agrégation α-syn"],
    ]
    table(s, Inches(0.25), Inches(1.15), Inches(12.8), rows,
          [Inches(2.6), Inches(10.2)], fs=13, rh=0.6)
    roundr(s, Inches(0.25), Inches(4.5), Inches(12.8), Inches(2.3), CORAL)
    txt(s, Inches(0.5), Inches(4.75), Inches(12.3), Inches(0.3),
        "LIMITE DE TRANSPOSITION", size=12, bold=True, color=GOLD)
    txt(s, Inches(0.5), Inches(5.2), Inches(12.3), Inches(1.3),
        "La plausibilité animale est forte, mais ne garantit pas l’efficacité humaine. Le passage modèle → clinique reste l’obstacle majeur — d’où des résultats parfois décevants (ex. exénatide phase III).",
        size=14, color=WHITE)
    footer(s, p)

    # ========== 24 NORMAL exenatide ==========
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Chapitre 3 · classique", "Exénatide : du signal ouvert à l’échec phase III", accent=CORAL)
    card(s, Inches(0.25), Inches(1.15), Inches(6.35), Inches(5.65),
         "Ce qui a nourri l’espoir",
         ["Études ouvertes : amélioration motrice suggérée",
          "Essai contrôlé initial encourageant",
          "Bonne tolérance globale",
          "Rationnel préclinique solide",
          "Classe déjà connue en métabolisme",
          "Hypothèse modificatrice de maladie",
          "Ouverture du champ GLP-1 / PD"],
         TEAL, size=12)
    card(s, Inches(6.8), Inches(1.15), Inches(6.25), Inches(5.65),
         "Ce que la phase III a montré",
         ["Pas de bénéfice significatif sur progression",
          "Déception importante pour le champ",
          "N’invalide pas toute la classe",
          "Limites possibles : sélection, durée, BHE",
          "Critères : symptomatique vs modificateur ?",
          "Leçon : un signal précoce ≠ preuve",
          "Nécessité de designs plus robustes"],
         CORAL, size=12)
    footer(s, p)

    # ========== 25 ILLUSTRATED LIXIPARK ==========
    p += 1
    illustrated(
        prs, blank, "Chapitre 3 · illustré",
        "LIXIPARK — le signal clinique le plus encourageant",
        "ann_07_lixipark.png",
        "Stade précoce : scores moteurs stabilisés vs aggravation placebo ; persistance après washout → argument contre un pur effet symptomatique immédiat.",
        ["Population : PD stade précoce",
         "Lixisénatide vs placebo",
         "Stabilisation motrice sous traitement",
         "Aggravation sous placebo",
         "Effet persistant après washout",
         "Questions : durabilité, tolérance, généralisation",
         "Pas encore une indication neurologique"],
        p, GREEN, CORAL, "Lire le schéma LIXIPARK"
    )

    # ========== 26 NORMAL synthesis ==========
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Chapitre 3 · classique", "Synthèse clinique — classe hétérogène", accent=GOLD)
    rows = [
        ["Molécule / essai", "Design", "Résultat principal"],
        ["Exénatide", "Ouvert → phase III", "Signal initial non confirmé"],
        ["Lixisénatide (LIXIPARK)", "Contrôlé, PD précoce", "Stabilisation + washout"],
        ["Sémaglutide", "Essais en cours", "Résultats définitifs attendus"],
        ["Autres / dérivés", "Exploration", "Meilleure pénétration SNC ?"],
    ]
    table(s, Inches(0.25), Inches(1.15), Inches(12.8), rows,
          [Inches(3.5), Inches(3.5), Inches(5.8)], fs=12, rh=0.65)
    roundr(s, Inches(0.25), Inches(4.8), Inches(12.8), Inches(2.0), NAVY)
    txt(s, Inches(0.5), Inches(5.05), Inches(12.3), Inches(0.3),
        "CONCLUSION INTERMÉDIAIRE", size=12, bold=True, color=GOLD)
    txt(s, Inches(0.5), Inches(5.5), Inches(12.3), Inches(1.0),
        "Plausibilité de classe réelle, mais efficacité clinique dépend de la molécule, du stade, de la BHE et du design d’essai. Ne pas extrapoler un résultat d’une molécule à toute la classe.",
        size=14, color=WHITE)
    footer(s, p)

    # ========== 27 NORMAL limits + perspectives split ==========
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Chapitre 3 · classique", "Limites vs perspectives — lecture équilibrée", accent=CORAL)
    card(s, Inches(0.25), Inches(1.15), Inches(6.35), Inches(5.65),
         "Limites & questions",
         ["Peu d’essais, tailles souvent modestes",
          "Durées courtes vs maladie lente",
          "Critères moteurs ≠ preuve de neuroprotection",
          "Difficile : symptomatique vs modificateur",
          "Passage BHE variable selon molécule",
          "Dose neurologique ≠ dose métabolique ?",
          "Biomarqueurs de sélection encore manquants"],
         CORAL, size=12)
    card(s, Inches(6.8), Inches(1.15), Inches(6.25), Inches(5.65),
         "Perspectives concrètes",
         ["Intervention précoce / prodromale",
          "Sélection par biomarqueurs",
          "Essais plus larges et plus longs",
          "Analogues plus pénétrants / formulations",
          "Approches combinées (métabolique + neuro)",
          "Résultats sémaglutide à venir",
          "Pharmacien dans la sécurisation du parcours"],
         GREEN, size=12)
    footer(s, p)

    # ========== 28 ILLUSTRATED pharmacist ==========
    p += 1
    illustrated(
        prs, blank, "Chapitre 3 · illustré",
        "Pharmacien — acteur de sécurisation du parcours",
        "ann_08_pharma.png",
        "Aujourd’hui en métabolisme ; demain potentiellement en neurologie : éducation, vigilance, coordination, distinction usage validé vs expérimental.",
        ["Éducation injection & titration",
         "Régularité des formes hebdomadaires",
         "Anticiper EI digestifs (adhésion)",
         "Vigilance insuline / sulfamides",
         "Pancréatite / biliaire — alerte",
         "Essais : traçabilité / conservation",
         "Lien neurologue–endocrinologue"],
        p, GREEN_DK, CORAL, "Missions visibles sur l’image"
    )

    # ========== 29 NORMAL pharmacist detail grid ==========
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Chapitre 3 · classique", "Missions pharmacien — grille opérationnelle", accent=SKY)
    roles = [
        ("Éducation", ["Injection SC", "Titration", "Oublis / conservation"], TEAL),
        ("Tolérance", ["EI digestifs", "Repas légers", "Limiter arrêts"], CORAL),
        ("Vigilance", ["Insuline/sulfamides", "Pancréatite", "Biliaire"], GOLD_DK),
        ("Essais cliniques", ["Traçabilité", "Protocole", "Dispensation"], GREEN),
        ("Information", ["Validé vs expérimental", "Attentes réalistes", "Consentement éclairé"], SKY),
        ("Coordination", ["Neurologue", "Endocrinologue", "Médecin traitant"], CORAL_DK),
    ]
    for i, (t, items, col) in enumerate(roles):
        c, r = i % 3, i // 3
        x = Inches(0.25) + Inches(c * 4.3)
        y = Inches(1.15) + Inches(r * 2.85)
        card(s, x, y, Inches(4.15), Inches(2.7), t, items, col, size=13)
    footer(s, p)

    # ========== 30 CONCLUSION dense ==========
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Conclusion", "5 messages à retenir — puis discussion", accent=GOLD)
    msgs = [
        ("1", "Classe mature", "Incontournable en DT2, obésité et protection cardio-rénale.", TEAL),
        ("2", "Rationnel solide", "Neuroprotection plausible et convergente en préclinique.", GREEN),
        ("3", "Clinique hétérogène", "Exénatide négatif en ph. III ; LIXIPARK encourageant ; séma en cours.", CORAL),
        ("4", "Preuve à construire", "Essais plus larges, précoces, ciblés par biomarqueurs, plus longs.", GOLD_DK),
        ("5", "Pharmacien central", "Éducation, vigilance, coordination — aujourd’hui et demain.", SKY),
    ]
    for i, (n, t, d, col) in enumerate(msgs):
        y = Inches(1.12) + Inches(i * 1.0)
        roundr(s, Inches(0.25), y, Inches(12.8), Inches(0.9), WHITE)
        rect(s, Inches(0.25), y, Inches(0.7), Inches(0.9), col)
        txt(s, Inches(0.25), y + Inches(0.22), Inches(0.7), Inches(0.45),
            n, size=18, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
        txt(s, Inches(1.15), y + Inches(0.12), Inches(11.6), Inches(0.3),
            t, size=14, bold=True, color=NAVY, font="Georgia")
        txt(s, Inches(1.15), y + Inches(0.45), Inches(11.6), Inches(0.35),
            d, size=12, color=MUTED)
    rect(s, 0, Inches(7.15), W, Inches(0.35), NAVY)
    rect(s, 0, Inches(7.15), Inches(0.2), Inches(0.35), GOLD)
    txt(s, Inches(0.35), Inches(7.18), Inches(10), Inches(0.28),
        "Merci  ·  Questions & discussion", size=11, bold=True, color=WHITE)
    txt(s, Inches(11.4), Inches(7.18), Inches(1.6), Inches(0.28),
        f"{p}/{TOTAL}", size=10, bold=True, color=TEAL_LT, align=PP_ALIGN.RIGHT)

    assert p == TOTAL, f"Expected {TOTAL}, got {p}"
    out = "/workspace/docs/presentation/Soutenance_GLP1_Parkinson.pptx"
    prs.save(out)
    shutil.copy2(out, "/opt/cursor/artifacts/Soutenance_GLP1_Parkinson.pptx")
    print(f"Saved: {out}")
    print(f"Slides: {len(prs.slides)}")
    return out


if __name__ == "__main__":
    build()
