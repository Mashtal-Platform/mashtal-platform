#!/usr/bin/env python3
"""
Soutenance GLP-1 & Parkinson — base d64243a6 enrichie :
idée principale brève sous chaque titre/sous-titre + petites illustrations,
mêmes polices LCD et mêmes photos atlas.
"""

from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE
import os
import shutil

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
TOTAL = 33
ASSETS = "/workspace/docs/presentation/assets"
ICONS = os.path.join(ASSETS, "icons")

T_TITLE = 28
T_BODY = 18
T_BULLET = 17
T_KPI = 28
T_SMALL = 15


def run(r, size=T_BODY, bold=True, color=DARK, font="Calibri"):
    r.font.size = Pt(size)
    r.font.bold = True
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


def header(slide, kicker, title, idea=None):
    """Header navy + idée principale brève sous le titre (pas un mot-clé seul)."""
    bg(slide, BG)
    top_h = Inches(1.05) if not idea else Inches(1.28)
    rect(slide, 0, 0, W, top_h, NAVY)
    rect(slide, 0, top_h, W, Inches(0.06), TEAL)
    txt(slide, Inches(0.4), Inches(0.10), Inches(12.5), Inches(0.24),
        kicker.upper(), size=13, bold=True, color=RGBColor(0x8E, 0xC8, 0xD4))
    txt(slide, Inches(0.4), Inches(0.34), Inches(12.5), Inches(0.45),
        title, size=T_TITLE if not idea else 26, bold=True, color=WHITE, font="Georgia")
    if idea:
        txt(slide, Inches(0.4), Inches(0.82), Inches(12.5), Inches(0.38),
            idea, size=15, bold=True, color=RGBColor(0xB5, 0xDC, 0xE4))
    return top_h + Inches(0.12)


def panel(slide, l, t, w, h, title, items, accent=TEAL, icon_letter="•", idea=None):
    """Panneau sans cadre : titre + idée brève + bullets enrichis."""
    rect(slide, l, t, w, h, SOFT)
    oval(slide, l + Inches(0.18), t + Inches(0.18), Inches(0.42), Inches(0.42), accent)
    txt(slide, l + Inches(0.18), t + Inches(0.22), Inches(0.42), Inches(0.35),
        icon_letter, size=14, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
    txt(slide, l + Inches(0.72), t + Inches(0.16), w - Inches(0.9), Inches(0.35),
        title, size=17, bold=True, color=NAVY, font="Georgia")
    y0 = t + Inches(0.55)
    if idea:
        txt(slide, l + Inches(0.22), y0, w - Inches(0.4), Inches(0.4),
            idea, size=14, bold=True, color=accent)
        y0 += Inches(0.38)
    bullets(slide, l + Inches(0.22), y0,
            w - Inches(0.4), h - (y0 - t) - Inches(0.15), items, size=T_BULLET - 1, spacing=6)


def kpi(slide, l, t, w, h, value, label, fill=TEAL, idea=None):
    rect(slide, l, t, w, h, fill)
    txt(slide, l + Inches(0.1), t + Inches(0.18), w - Inches(0.2), Inches(0.5),
        value, size=T_KPI, bold=True, color=WHITE, align=PP_ALIGN.CENTER, font="Georgia")
    txt(slide, l + Inches(0.1), t + Inches(0.72), w - Inches(0.2), Inches(0.35),
        label, size=15, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
    if idea:
        txt(slide, l + Inches(0.1), t + Inches(1.1), w - Inches(0.2), Inches(0.4),
            idea, size=13, bold=True, color=RGBColor(0xE8, 0xF4, 0xF8), align=PP_ALIGN.CENTER)


def img(slide, name, l, t, w, h):
    path = name if os.path.isabs(name) else os.path.join(ASSETS, name)
    if os.path.exists(path):
        return slide.shapes.add_picture(path, l, t, width=w, height=h)
    rect(slide, l, t, w, h, SOFT)
    return None


def icon(slide, name, l, t, size=Inches(0.85)):
    path = os.path.join(ICONS, name)
    return img(slide, path, l, t, size, size)


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


def divider(prs, blank, num, title, subtitle, page, accent=TEAL, image=None, idea=None):
    s = prs.slides.add_slide(blank)
    bg(s, NAVY)
    if image:
        img(s, image, 0, 0, W, H)
        rect(s, 0, 0, Inches(6.8), H, NAVY)
        rect(s, Inches(6.8), 0, Inches(0.12), H, accent)
    else:
        rect(s, 0, 0, Inches(0.25), H, accent)
    txt(s, Inches(0.7), Inches(1.85), Inches(5.8), Inches(0.4),
        f"PARTIE  {num}", size=20, bold=True, color=accent)
    txt(s, Inches(0.7), Inches(2.35), Inches(5.8), Inches(1.5),
        title, size=32, bold=True, color=WHITE, font="Georgia")
    txt(s, Inches(0.7), Inches(4.0), Inches(5.8), Inches(0.9),
        subtitle, size=18, bold=True, color=RGBColor(0xB5, 0xDC, 0xE4))
    if idea:
        txt(s, Inches(0.7), Inches(5.1), Inches(5.8), Inches(0.9),
            idea, size=16, bold=True, color=RGBColor(0x8E, 0xC8, 0xD4))
    txt(s, Inches(0.7), Inches(6.5), Inches(5.5), Inches(0.35),
        f"{page} / {TOTAL}", size=15, bold=True, color=RGBColor(0x8A, 0xB8, 0xC0))
    return s


def atlas_slide(prs, blank, kicker, title, image, points, takeaway, page,
                accent=TEAL, idea=None, panel_title="Idées à retenir"):
    s = prs.slides.add_slide(blank)
    header(s, kicker, title, idea=idea)
    y_img = Inches(1.45) if idea else Inches(1.25)
    h_img = Inches(4.35) if idea else Inches(4.55)
    img(s, image, Inches(0.25), y_img, Inches(8.0), h_img)
    panel(s, Inches(8.4), y_img, Inches(4.65), h_img,
          panel_title, points, accent, "i")
    rect(s, Inches(0.25), Inches(5.95), Inches(12.8), Inches(1.0), NAVY)
    txt(s, Inches(0.45), Inches(6.05), Inches(2.0), Inches(0.28),
        "À RETENIR", size=14, bold=True, color=GOLD)
    txt(s, Inches(0.45), Inches(6.35), Inches(12.4), Inches(0.5),
        takeaway, size=16, color=WHITE)
    footer(s, page)
    return s


def build():
    prs = Presentation()
    prs.slide_width = W
    prs.slide_height = H
    blank = prs.slide_layouts[6]
    p = 0

    # 1 TITLE
    p += 1
    s = prs.slides.add_slide(blank)
    img(s, "title_bg_muted_v2.png", 0, 0, W, H)
    rect(s, 0, 0, Inches(7.0), Inches(5.25), NAVY)
    rect(s, Inches(7.0), 0, Inches(0.1), Inches(5.25), TEAL)
    txt(s, Inches(0.55), Inches(0.75), Inches(6.2), Inches(0.3),
        "SOUTENANCE DE THÈSE  ·  PHARMACIE", size=15, bold=True,
        color=RGBColor(0x8E, 0xC8, 0xD4))
    txt(s, Inches(0.55), Inches(1.15), Inches(6.2), Inches(2.5),
        "Agonistes du GLP-1 :\nmise au point et potentiel\nprometteur pour la\nmaladie de Parkinson",
        size=28, bold=True, color=WHITE, font="Georgia")
    txt(s, Inches(0.55), Inches(4.0), Inches(6.2), Inches(0.9),
        "Idée directrice : une classe mature en métabolisme, un rationnel PD plausible, "
        "mais des preuves cliniques encore hétérogènes.",
        size=15, bold=True, color=RGBColor(0xB5, 0xDC, 0xE4))
    img(s, "med_01_brain_pd.png", Inches(7.35), Inches(0.55), Inches(5.7), Inches(4.4))
    labels = [
        ("Physiologie", "Hormone & récepteur", TEAL),
        ("Métabolisme", "DT2 · poids · CV-rein", CORAL),
        ("Neuroprotection", "Hypothèse préclinique", GREEN),
        ("LIXIPARK", "Signal phase II", GOLD),
        ("Pharmacien", "Sécuriser & informer", SKY),
    ]
    for i, (lab, idea, col) in enumerate(labels):
        x = Inches(0.55) + Inches(i * 2.5)
        rect(s, x, Inches(5.45), Inches(2.35), Inches(1.35), col)
        txt(s, x, Inches(5.6), Inches(2.35), Inches(0.4),
            lab, size=15, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
        txt(s, x + Inches(0.08), Inches(6.1), Inches(2.2), Inches(0.5),
            idea, size=13, bold=True, color=RGBColor(0xF0, 0xF7, 0xFA), align=PP_ALIGN.CENTER)

    # 2 PLAN
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Organisation", "Plan de la présentation",
           idea="Cinq étapes : du besoin médical à la lecture critique des preuves PD.")
    parts = [
        ("A", "Contexte", "Pourquoi chercher un modificateur ?",
         "Parkinson : fardeau, mécanismes, impasse thérapeutique et logique de repositionnement.", CORAL, "ico_brain.png"),
        ("B", "Chapitre 1", "Comment agit le GLP-1 ?",
         "Physiologie, récepteur, courte/longue durée et panorama des molécules.", TEAL, "ico_glp1.png"),
        ("C", "Chapitre 2", "Ce qui est déjà validé",
         "DT2, obésité, cardio-rénal et tolérance : preuves matures, molécule par molécule.", SKY, "ico_cardio.png"),
        ("D", "Chapitre 3", "Que dit la clinique PD ?",
         "Mécanismes putatifs, préclinique, LIXIPARK vs Exenatide-PD3, rôle du pharmacien.", GREEN, "ico_neuron.png"),
        ("E", "Conclusion", "Que retenir pour le jury ?",
         "Messages prudents : plausibilité ≠ preuve ≠ indication.", GOLD, "ico_pharma.png"),
    ]
    for i, (n, t, sub, idea, col, ico) in enumerate(parts):
        x = Inches(0.25) + Inches(i * 2.6)
        rect(s, x, Inches(1.55), Inches(2.5), Inches(5.3), SOFT)
        rect(s, x, Inches(1.55), Inches(2.5), Inches(1.15), col)
        txt(s, x, Inches(1.65), Inches(2.5), Inches(0.4),
            n, size=24, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
        txt(s, x + Inches(0.08), Inches(2.1), Inches(2.35), Inches(0.45),
            t, size=15, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
        icon(s, ico, x + Inches(0.75), Inches(2.85), Inches(1.0))
        txt(s, x + Inches(0.1), Inches(4.0), Inches(2.3), Inches(0.7),
            sub, size=15, bold=True, color=NAVY, align=PP_ALIGN.CENTER)
        txt(s, x + Inches(0.1), Inches(4.7), Inches(2.3), Inches(1.8),
            idea, size=13, bold=True, color=MUTED, align=PP_ALIGN.CENTER)
    footer(s, p)

    # 3 OBJECTIFS
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Objectifs", "Quatre objectifs de la thèse",
           idea="Chaque objectif sert une question : décrire, situer, juger, accompagner.")
    objs = [
        ("1", "Physiologie & pharmacologie",
         "Comprendre GLP-1, GLP-1R et les différences PK/PD — molécule par molécule, sans effet de classe.",
         CORAL, "ico_receptor.png"),
        ("2", "Indications validées",
         "Situer la classe dans DT2, obésité et cardio-rénal (LEADER, SELECT, FLOW…) avec leurs limites.",
         TEAL, "ico_glucose.png"),
        ("3", "Repositionnement Parkinson",
         "Séparer plausibilité, signal symptomatique et preuve modificatrice (LIXIPARK vs Exenatide-PD3).",
         GREEN, "ico_trial.png"),
        ("4", "Rôle du pharmacien",
         "Sécuriser l’usage métabolique et rappeler qu’il n’existe aucune indication PD hors recherche.",
         GOLD, "ico_pharma.png"),
    ]
    for i, (n, t, d, col, ico) in enumerate(objs):
        y = Inches(1.55) + Inches(i * 1.3)
        rect(s, Inches(0.3), y, Inches(12.7), Inches(1.15), SOFT)
        rect(s, Inches(0.3), y, Inches(1.0), Inches(1.15), col)
        txt(s, Inches(0.3), y + Inches(0.28), Inches(1.0), Inches(0.55),
            n, size=26, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
        icon(s, ico, Inches(1.45), y + Inches(0.15), Inches(0.85))
        txt(s, Inches(2.5), y + Inches(0.15), Inches(10.2), Inches(0.35),
            t, size=20, bold=True, color=NAVY, font="Georgia")
        txt(s, Inches(2.5), y + Inches(0.55), Inches(10.2), Inches(0.5),
            d, size=15, color=MUTED)
    footer(s, p)

    # 4 DIVIDER A
    p += 1
    divider(prs, blank, "A", "Contexte & besoin médical",
            "Parkinson : fardeau, physiopathologie, impasse thérapeutique", p, CORAL,
            idea="Idée : les soins actuels soulagent, mais ne freinent pas la dégénérescence.")

    # 5 ATLAS brain
    p += 1
    atlas_slide(
        prs, blank, "Contexte · atlas médical",
        "Maladie de Parkinson — anatomie fonctionnelle",
        "med_01_brain_pd.png",
        ["2ᵉ neurodégénérescence — fardeau croissant et handicap progressif",
         "Triade motrice — bradykinésie ± tremblement / rigidité",
         "Non moteurs majeurs — constipation, sommeil, cognition, chutes",
         "α-synucléine + inflammation — axes physiopathologiques centraux",
         "Traitements = symptomatiques — dopa et apparentés soulagent",
         "Aucun modificateur certain — besoin médical non couvert"],
        "Besoin non couvert : freiner la neurodégénérescence — sans confondre MDS-UPDRS et neuroprotection.",
        p, CORAL,
        idea="Le cerveau dopaminergique est atteint ; l’enjeu n’est plus seulement de masquer les symptômes."
    )

    # 6 PHYSIOPATH
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Contexte", "Physiopathologie — 6 mécanismes clés",
           idea="Plusieurs voies convergent vers la mort neuronale : autant de portes d’entrée putatives pour le GLP-1R.")
    items = [
        ("α-synucléine", "Agrégation et propagation",
         "Protéine mal repliée qui se propage et aggrave la lésion.", CORAL, "ico_asyn.png"),
        ("Mitochondries", "Dysfonction et ROS",
         "Énergie cellulaire défaillante → fragilité neuronale.", TEAL, "ico_mito.png"),
        ("Stress oxydatif", "Lésions cumulatives",
         "Les ROS endommagent lipides, protéines et ADN.", GOLD, "ico_inflam.png"),
        ("Neuroinflammation", "Microglie activée",
         "Inflammation chronique qui entretient la dégénérescence.", SKY, "ico_inflam.png"),
        ("Autophagie", "Clairance altérée",
         "Moins de recyclage des agrégats toxiques.", GREEN, "ico_flow.png"),
        ("Gènes / environnement", "Susceptibilité",
         "Terrain génétique + expositions modulent le risque.", BLUE, "ico_brain.png"),
    ]
    for i, (t, sub, idea, col, ico) in enumerate(items):
        c, r = i % 3, i // 3
        x = Inches(0.3) + Inches(c * 4.3)
        y = Inches(1.55) + Inches(r * 2.65)
        rect(s, x, y, Inches(4.15), Inches(2.45), SOFT)
        oval(s, x + Inches(0.18), y + Inches(0.18), Inches(0.42), Inches(0.42), col)
        txt(s, x + Inches(0.18), y + Inches(0.22), Inches(0.42), Inches(0.35),
            str(i + 1), size=14, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
        txt(s, x + Inches(0.72), y + Inches(0.18), Inches(2.3), Inches(0.4),
            t, size=17, bold=True, color=NAVY, font="Georgia")
        icon(s, ico, x + Inches(3.1), y + Inches(0.15), Inches(0.85))
        txt(s, x + Inches(0.22), y + Inches(0.75), Inches(3.7), Inches(0.4),
            sub, size=15, bold=True, color=col)
        txt(s, x + Inches(0.22), y + Inches(1.25), Inches(3.7), Inches(0.95),
            idea + " Cible potentielle des agonistes GLP-1 en préclinique.",
            size=14, bold=True, color=MUTED)
    footer(s, p)

    # 7 TREATMENTS
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Contexte", "Traitements actuels : utiles mais limités",
           idea="Ils restaurent la transmission dopaminergique, pas la survie neuronale.")
    rows = [
        ["Classe", "Idée principale", "Limite clinique"],
        ["Lévodopa", "Référence motrice la plus efficace", "Fluctuations / dyskinésies au long cours"],
        ["Agonistes DA", "Stimulent les récepteurs DA", "EI neuropsychiatriques possibles"],
        ["IMAO-B", "Prolongent la dopamine endogène", "Effet symptomatique seulement"],
        ["Amantadine", "Aide surtout sur les dyskinésies", "Pas d’effet modificateur démontré"],
    ]
    table(s, Inches(0.3), Inches(1.55), Inches(12.7), rows,
          [Inches(2.8), Inches(4.7), Inches(5.2)], fs=16, rh=0.58)
    rect(s, Inches(0.3), Inches(4.85), Inches(12.7), Inches(2.0), NAVY)
    txt(s, Inches(0.55), Inches(5.05), Inches(12.2), Inches(0.3),
        "MESSAGE CLÉ", size=15, bold=True, color=GOLD)
    txt(s, Inches(0.55), Inches(5.45), Inches(12.2), Inches(1.1),
        "Améliorer un score (ex. MDS-UPDRS) ≠ prouver un effet modificateur.\n"
        "Biomarqueurs de progression encore insuffisants — d’où la prudence méthodologique.",
        size=17, color=WHITE)
    footer(s, p)

    # 8 REPOSITIONING
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Contexte", "Pourquoi repositionner les agonistes du GLP-1 ?",
           idea="On gagne du temps sur la sécurité connue, pas sur la preuve d’efficacité PD.")
    icon(s, "ico_pill.png", Inches(0.55), Inches(1.6), Inches(1.0))
    icon(s, "ico_shield.png", Inches(7.05), Inches(1.6), Inches(1.0))
    panel(s, Inches(0.3), Inches(2.7), Inches(6.3), Inches(4.1),
          "Avantages du repositionnement",
          ["PK/PD déjà connues — moins d’inconnu pharmacologique",
           "Tolérance documentée — profil EI déjà cartographié",
           "Pharmacovigilance existante — suivi de sécurité en vie réelle",
           "Développement accéléré possible — mais pas automatique",
           "Preuve d’efficacité toujours requise — repositionner ≠ valider"],
          TEAL, "A",
          idea="Idée : partir d’une classe mature pour tester une nouvelle indication.")
    panel(s, Inches(6.8), Inches(2.7), Inches(6.2), Inches(4.1),
          "Prudence scientifique",
          ["Plausibilité ≠ efficacité clinique — le cerveau n’est pas le pancréas",
           "Pas d’équivalence entre molécules — PK et BHE varient",
           "Pas d’effet de classe présumé — chaque preuve est locale",
           "Symptomatique ≠ modificateur — un score peut tromper",
           "Indication PD : aucune à ce jour — hors essai seulement"],
          CORAL, "H",
          idea="Idée : le repositionnement n’exempte jamais d’un essai rigoureux.")
    footer(s, p)

    # 9 DIVIDER B
    p += 1
    divider(prs, blank, "B", "Chapitre 1 — Physiologie & pharmacologie",
            "GLP-1, récepteur, courte/longue durée, panorama", p, TEAL,
            image="sec_ch1_glp1.png",
            idea="Idée : comprendre la classe avant de juger son potentiel neurologique.")

    # 10 PROGLUCAGON / ORIGINE DU GLP-1 (nouvelle slide après le séparateur)
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Chapitre 1 · physiologie", "Origine du GLP-1 : du proglucagon aux formes actives",
           idea="Un même précurseur, des enzymes de maturation différentes → des peptides aux rôles distincts.")
    # Illustration principale
    img(s, "med_proglucagon_glp1.png", Inches(0.25), Inches(1.45), Inches(8.15), Inches(4.55))
    # Panneau droit : idées brèves
    panel(s, Inches(8.55), Inches(1.45), Inches(4.5), Inches(4.55),
          "Idées à retenir",
          ["Incrétine peptidique — issue du proglucagon (pancréas, intestin, SNC)",
           "Cellules α — proglucagon → glucagon",
           "Cellules L (iléon/côlon) — GLP-1, GLP-2, glicentine, oxyntomoduline",
           "Formes actives — GLP-1(7-36) amide et GLP-1(7-37)",
           "Sécrétion postprandiale — glucides, lipides, protéines",
           "Réponse précoce — signaux nerveux / endocrines / paracrines",
           "NTS (tronc cérébral) — GLP-1 central (satiété) ; intestin = source circulante"],
          TEAL, "Φ",
          idea="Spécificité tissulaire = fonctions différentes.")
    rect(s, Inches(0.25), Inches(6.1), Inches(12.8), Inches(0.85), NAVY)
    txt(s, Inches(0.45), Inches(6.2), Inches(2.0), Inches(0.25),
        "À RETENIR", size=13, bold=True, color=GOLD)
    txt(s, Inches(0.45), Inches(6.45), Inches(12.4), Inches(0.4),
        "Le tractus gastro-intestinal est la principale source de GLP-1 circulant ; la production centrale reste complémentaire.",
        size=15, color=WHITE)
    footer(s, p)

    # 11 EFFET INCRÉTINE & RÉGULATION GLYCÉMIQUE
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Chapitre 1 · I.1.2", "Effet incrétine et régulation glycémique",
           idea="Glucose oral > glucose I.V. : le GLP-1 (avec le GIP) amplifie l’insuline de façon glucose-dépendante.")
    img(s, "med_incretine_glycemie.png", Inches(0.25), Inches(1.45), Inches(8.15), Inches(4.55))
    panel(s, Inches(8.55), Inches(1.45), Inches(4.5), Inches(4.55),
          "Idées à retenir",
          ["Effet incrétine — plus d’insuline après glucose oral qu’après I.V.",
           "GLP-1 + GIP — action coordonnée postprandiale",
           "Insuline glucose-dépendante — max si glycémie ↑, ↓ si glycémie ↓",
           "↓ Glucagon en hyperglycémie — moins de glucose hépatique",
           "Vidange gastrique ralentie — atténue le pic postprandial",
           "Hypoglycémie — faible risque seul ; ↑ si insuline/sulfamides"],
          TEAL, "G",
          idea="Propriété clé de sécurité de la classe.")
    rect(s, Inches(0.25), Inches(6.1), Inches(12.8), Inches(0.85), NAVY)
    txt(s, Inches(0.45), Inches(6.2), Inches(2.0), Inches(0.25),
        "À RETENIR", size=13, bold=True, color=GOLD)
    txt(s, Inches(0.45), Inches(6.45), Inches(12.4), Inches(0.4),
        "En association à l’insuline ou aux sulfamides, anticiper l’hypoglycémie et adapter si besoin.",
        size=15, color=WHITE)
    footer(s, p)

    # 12 SATIÉTÉ & PRISE ALIMENTAIRE
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Chapitre 1 · I.1.3", "Satiété et régulation de la prise alimentaire",
           idea="Signaux digestifs, vagaux et centraux → satiété ↑, faim ↓, apports énergétiques ↓.")
    img(s, "med_satiete_appetit.png", Inches(0.25), Inches(1.45), Inches(8.15), Inches(4.55))
    panel(s, Inches(8.55), Inches(1.45), Inches(4.5), Inches(4.55),
          "Idées à retenir",
          ["Satiété / faim — intégration périphérique et centrale",
           "↓ apports énergétiques — fondement du traitement de l’obésité",
           "Bénéfice — utile si obésité ou DT2 à haut risque cardiométabolique",
           "Vigilance — âgés, fragiles, dénutris, sarcopéniques",
           "Risques — déshydratation, perte de masse maigre, ↓ autonomie",
           "Chapitre II — cette balance bénéfice/risque sera développée"],
          GOLD, "P",
          idea="La perte de poids n’est pas un bien absolu.")
    rect(s, Inches(0.25), Inches(6.1), Inches(12.8), Inches(0.85), NAVY)
    txt(s, Inches(0.45), Inches(6.2), Inches(2.0), Inches(0.25),
        "À RETENIR", size=13, bold=True, color=GOLD)
    txt(s, Inches(0.45), Inches(6.45), Inches(12.4), Inches(0.4),
        "Juger la perte de poids dans le contexte clinique global : bénéfice cardiométabolique vs risque de fragilité.",
        size=15, color=WHITE)
    footer(s, p)

    # 13 ATLAS GLP1
    p += 1
    atlas_slide(
        prs, blank, "Chapitre 1 · atlas médical",
        "Physiologie du GLP-1 — du tube digestif au pancréas",
        "med_02_glp1_path.png",
        ["Cellules L — sécrètent le GLP-1 après le repas",
         "Hormone incrétine — amplifie l’insuline si glucose élevé",
         "Glucose-dépendance — faible risque d’hypoglycémie seul",
         "DPP-4 — détruit le GLP-1 en 1–2 minutes",
         "Agonistes résistants — rendent le médicament utilisable",
         "Base de classe — tout part de cette physiologie"],
        "Sans résistance à la DPP-4, pas de médicament utilisable : c’est le cœur du design pharmaceutique.",
        p, TEAL,
        idea="Le GLP-1 naturel est trop fugace : les agonistes corrigent ce frein pharmacocinétique."
    )

    # 11 ATLAS receptor
    p += 1
    atlas_slide(
        prs, blank, "Chapitre 1 · atlas médical",
        "Récepteur GLP-1R et voies de signalisation",
        "med_03_receptor.png",
        ["GPCR classe B — récepteur membranaire spécifique",
         "Distribution large — pancréas, cœur, rein, SNC",
         "AMPc → PKA / EPAC — signal métabolique central",
         "PI3K / Akt — voies de survie cellulaire",
         "MAPK / ERK — réparation / plasticité",
         "Pont vers la neuroprotection — même récepteur, autre tissu"],
        "Même récepteur, plusieurs cascades : métabolisme périphérique et survie neuronale putative.",
        p, BLUE,
        idea="Activer le GLP-1R n’est pas un seul effet : c’est un réseau de signaux."
    )

    # 12 ATLAS agonists
    p += 1
    atlas_slide(
        prs, blank, "Chapitre 1 · atlas médical",
        "Courte vs longue durée d’action",
        "med_04_agonists.png",
        ["Courte (exé, lixi) — stimulation intermittente du récepteur",
         "Postprandial fort — utile sur le pic glycémique",
         "Longue (lira, dula, séma) — exposition continue",
         "Jeûne / HbA1c — meilleur contrôle glycémique global",
         "PK différente → effets différents — pas d’interchangeabilité",
         "Conséquence PD — l’exposition centrale peut aussi différer"],
        "La durée d’exposition du récepteur explique les différences d’efficacité clinique.",
        p, CORAL,
        idea="Deux agonistes « GLP-1 » ne donnent pas le même profil d’action."
    )

    # 13 TABLE
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Chapitre 1", "Panorama des agonistes — référence claire",
           idea="Chaque molécule a un profil, une posologie et une ancre de preuve distincts.")
    rows = [
        ["Molécule", "Profil", "Admin.", "Idée / ancre de preuve"],
        ["Exénatide", "Courte / LP", "2×/j ou 1×/sem.", "Testé en PD ; Exenatide-PD3 négatif"],
        ["Lixisénatide", "Courte", "1×/j", "LIXIPARK : signal moteur phase II"],
        ["Liraglutide", "Longue", "1×/j", "LEADER (CV) · obésité 3 mg"],
        ["Dulaglutide", "Longue", "1×/sem.", "REWIND : bénéfice CV"],
        ["Sémaglutide", "Longue", "1×/sem. / oral", "SELECT · FLOW · MOST-ABLE (PD)"],
        ["Tirzépatide", "GIP/GLP-1", "1×/sem.", "Double agoniste — non sélectif"],
    ]
    table(s, Inches(0.25), Inches(1.5), Inches(12.8), rows,
          [Inches(2.4), Inches(2.2), Inches(2.8), Inches(5.4)], fs=15, rh=0.52)
    rect(s, Inches(0.25), Inches(5.5), Inches(12.8), Inches(1.35), TEAL)
    txt(s, Inches(0.5), Inches(5.85), Inches(12.3), Inches(0.7),
        "Tirzépatide ≠ agoniste sélectif. Structure/PK variables → pas d’effet de classe neurologique présumé.",
        size=17, color=WHITE)
    footer(s, p)

    # 14 MECHANISMS
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Chapitre 1", "Six actions métaboliques simultanées",
           idea="Un seul médicament agit sur plusieurs leviers glycémiques et pondéraux.")
    acts = [
        ("↑ Insuline", "Glucose-dépendante",
         "Sécrétion stimulée seulement si glycémie élevée.", TEAL, "ico_glucose.png"),
        ("↓ Glucagon", "Moins de glucose hépatique",
         "Réduit la production de glucose par le foie.", CORAL, "ico_flow.png"),
        ("Vidange gastrique", "↓ pic postprandial",
         "Ralentit l’arrivée des nutriments après le repas.", GOLD, "ico_time.png"),
        ("Satiété", "↓ appétit / poids",
         "Action centrale sur la faim et les apports.", GREEN, "ico_weight.png"),
        ("Cellules β", "Survie et fonction",
         "Soutien fonctionnel des îlots en modèles.", SKY, "ico_pill.png"),
        ("Pléiotropie", "Cœur, rein, inflammation",
         "Effets hors glycémie pour certaines molécules.", BLUE, "ico_cardio.png"),
    ]
    for i, (t, sub, idea, col, ico) in enumerate(acts):
        c, r = i % 3, i // 3
        x = Inches(0.3) + Inches(c * 4.3)
        y = Inches(1.55) + Inches(r * 2.65)
        rect(s, x, y, Inches(4.15), Inches(2.45), SOFT)
        icon(s, ico, x + Inches(0.2), y + Inches(0.2), Inches(0.8))
        txt(s, x + Inches(1.15), y + Inches(0.25), Inches(2.8), Inches(0.4),
            t, size=17, bold=True, color=NAVY, font="Georgia")
        txt(s, x + Inches(1.15), y + Inches(0.7), Inches(2.8), Inches(0.35),
            sub, size=14, bold=True, color=col)
        txt(s, x + Inches(0.22), y + Inches(1.25), Inches(3.7), Inches(0.95),
            idea, size=15, bold=True, color=MUTED)
    footer(s, p)

    # 15 DIVIDER C
    p += 1
    divider(prs, blank, "C", "Chapitre 2 — Indications validées",
            "DT2, obésité, cardio-rénal, tolérance", p, SKY,
            image="sec_ch2_metabolic.png",
            idea="Idée : ici les preuves sont solides — c’est le contraste avec le chapitre Parkinson.")

    # 16 DT2
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Chapitre 2", "Diabète de type 2 — place actuelle",
           idea="Classe majeure : glycémie, poids et, selon molécule, protection cardio-rénale.")
    kpi(s, Inches(0.3), Inches(1.55), Inches(4.15), Inches(1.55), "0,8–1,8%", "↓ HbA1c", TEAL,
        idea="Efficacité glycémique robuste")
    kpi(s, Inches(4.55), Inches(1.55), Inches(4.15), Inches(1.55), "ADA/EASD", "Classe majeure", CORAL,
        idea="Recommandée tôt si CV/MRC")
    kpi(s, Inches(8.8), Inches(1.55), Inches(4.2), Inches(1.55), "Faible", "Hypoglycémie*", GREEN,
        idea="Sauf associations à risque")
    panel(s, Inches(0.3), Inches(3.3), Inches(6.3), Inches(3.5),
          "Rationnel",
          ["Effet incrétine diminué dans le DT2 — déficit à compenser",
           "Agonistes = incrétine durable — action pharmacologique stable",
           "Courte durée → postprandial — utile sur le pic",
           "Longue durée → jeûne / HbA1c — contrôle global"],
          TEAL, "1",
          idea="Idée : on restaure une physiologie incrétine défaillante.")
    panel(s, Inches(6.8), Inches(3.3), Inches(6.2), Inches(3.5),
          "En pratique",
          ["Après mesures ± metformine — selon recommandations",
           "Précoce si risque CV / MRC — bénéfice au-delà de l’HbA1c",
           "Séma & tirzépatide très puissants — poids + glycémie",
           "*sauf association insuline/sulfamides — surveiller l’hypo"],
          CORAL, "2",
          idea="Idée : le choix se guide aussi par les comorbidités.")
    footer(s, p)

    # 17 WEIGHT
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Chapitre 2", "Obésité — un changement de paradigme",
           idea="De l’échec des seuls régimes à des traitements hormonaux à forte efficacité.")
    kpi(s, Inches(0.3), Inches(1.55), Inches(4.15), Inches(1.55), "~15%", "Sémaglutide (STEP)", TEAL,
        idea="Perte de poids majeure")
    kpi(s, Inches(4.55), Inches(1.55), Inches(4.15), Inches(1.55), "3 mg", "Liraglutide (SCALE)", CORAL,
        idea="Dose spécifique obésité")
    kpi(s, Inches(8.8), Inches(1.55), Inches(4.2), Inches(1.55), "++", "Tirzépatide", GOLD,
        idea="Double agoniste très puissant")
    panel(s, Inches(0.3), Inches(3.3), Inches(6.3), Inches(3.5),
          "Mécanismes",
          ["↓ appétit / ↑ satiété — levier central de la prise alimentaire",
           "Réduction des apports — déficit énergétique durable",
           "Meilleure sensibilité insulinique — bénéfice métabolique",
           "Impact cardiométabolique — au-delà du seul chiffre de poids"],
          TEAL, "M",
          idea="Idée : on traite une maladie, pas seulement un chiffre sur la balance.")
    panel(s, Inches(6.8), Inches(3.3), Inches(6.2), Inches(3.5),
          "Vigilance clinique",
          ["Titration = adhésion — monter trop vite fait arrêter",
           "EI digestifs fréquents — anticiper et éduquer",
           "Attention âgés / fragiles — risque de dénutrition",
           "Sarcopénie possible — surveiller force et apports"],
          CORAL, "P",
          idea="Idée : l’efficacité pondérale impose une surveillance nutritionnelle.")
    footer(s, p)

    # 18 ATLAS cardio
    p += 1
    atlas_slide(
        prs, blank, "Chapitre 2 · atlas médical",
        "Cardioprotection et néphroprotection",
        "med_05_cardiorenal.png",
        ["LEADER — liraglutide ↓ MACE",
         "SUSTAIN-6 — sémaglutide : bénéfice CV",
         "REWIND — dulaglutide en prévention",
         "SELECT — séma sans DT2 : preuve élargie",
         "FLOW — séma + MRC : rein protégé",
         "Molécule ≠ classe — pas d’interchangeabilité"],
        "Bénéfices cardio-rénaux démontrés pour certaines molécules — pas une interchangeabilité automatique.",
        p, GREEN,
        idea="Les bénéfices CV/rénaux sont prouvés pour des molécules précises, pas pour « les GLP-1 » en bloc."
    )

    # 19 SAFETY
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Chapitre 2", "Tolérance & sécurité — check-list",
           idea="Classe mature : EI digestifs fréquents, alertes rares mais à connaître.")
    icon(s, "ico_shield.png", Inches(11.9), Inches(1.45), Inches(0.9))
    panel(s, Inches(0.25), Inches(1.55), Inches(4.2), Inches(5.25),
          "Fréquents",
          ["Nausées / vomissements — surtout à l’instauration",
           "Diarrhées — dose-dépendantes",
           "Début / ↑ dose — moment de vigilance",
           "Souvent transitoires — s’atténuent en titration",
           "Titration lente — clé de l’adhésion"],
          CORAL, "1",
          idea="Idée : la plupart des arrêts viennent du digestif.")
    panel(s, Inches(4.55), Inches(1.55), Inches(4.2), Inches(5.25),
          "À anticiper",
          ["Hypoglycémie si associations — insuline/sulfamides",
           "Pancréatite (alerte) — douleur abdo intense",
           "Complications biliaires — surveillance clinique",
           "Contre-indications — respecter le RCP",
           "Pharmacovigilance — déclarer les EI"],
          GOLD, "2",
          idea="Idée : rares mais graves = messages patient clairs.")
    panel(s, Inches(8.85), Inches(1.55), Inches(4.2), Inches(5.25),
          "Messages utiles",
          ["Classe mature — données de sécurité larges",
           "Essais de sécurité — CV et métaboliques",
           "Profil favorable — si bonne sélection",
           "Info patient claire — injection, repas, oubli",
           "Traçabilité EI — rôle du pharmacien"],
          GREEN, "3",
          idea="Idée : éduquer vaut mieux que corriger après coup.")
    footer(s, p)

    # 20 DIVIDER D
    p += 1
    divider(prs, blank, "D", "Chapitre 3 — Parkinson & preuves",
            "Mécanismes, préclinique, essais, pharmacien", p, GREEN,
            image="sec_ch3_parkinson.png",
            idea="Idée : passer de la plausibilité biologique à la lecture critique des essais.")

    # 21 MATRIX
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Chapitre 3", "Pourquoi le GLP-1 dans la Parkinson ?",
           idea="Chaque mécanisme PD a un pendant putatif via le GLP-1R — surtout préclinique.")
    rows = [
        ["Mécanisme PD", "Effet GLP-1 potentiel (idée)", "Niveau de preuve"],
        ["Neuroinflammation", "Atténuer l’activation microgliale", "Préclin. ++"],
        ["Stress oxydatif", "Réduire la charge en ROS", "Préclin. ++"],
        ["Mitochondries", "Soutenir le métabolisme énergétique", "Préclin. +"],
        ["Apoptose", "Activer des voies de survie", "Préclin. ++"],
        ["α-synucléine", "Favoriser autophagie / clairance", "Exploratoire"],
    ]
    table(s, Inches(0.25), Inches(1.55), Inches(12.8), rows,
          [Inches(3.2), Inches(5.4), Inches(4.2)], fs=16, rh=0.62)
    footer(s, p)

    # 22 ATLAS neuro
    p += 1
    atlas_slide(
        prs, blank, "Chapitre 3 · atlas médical",
        "Mécanismes neuroprotecteurs putatifs",
        "med_06_neuro.png",
        ["Activation GLP-1R — point d’entrée commun",
         "Survie neuronale — voies PI3K/Akt, MAPK",
         "↓ inflammation — microglie moins délétère",
         "↓ stress oxydatif — moins de lésions cumulées",
         "↓ apoptose — moins de mort cellulaire",
         "Autophagie / α-syn — piste encore exploratoire"],
        "Plausibilité biologique forte — hypothèses précliniques, pas une preuve d’efficacité humaine.",
        p, GREEN,
        idea="Beau schéma mécanistique ≠ démonstration clinique chez le patient parkinsonien."
    )

    # 23 PRECLIN
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Chapitre 3", "Préclinique : signaux convergents",
           idea="Les modèles animaux convergent — mais ils ne reproduisent pas la maladie humaine.")
    rows = [
        ["Molécule", "Observations (MPTP / 6-OHDA) — idée"],
        ["Exénatide", "Préserve neurones DA ; ↓ oxydatif / inflammation"],
        ["Liraglutide", "Améliore le moteur ; protection neuronale"],
        ["Lixisénatide", "Intérêt pour une action centrale possible"],
        ["Sémaglutide", "Survie, autophagie, ↓ α-syn en modèles"],
    ]
    table(s, Inches(0.25), Inches(1.5), Inches(12.8), rows,
          [Inches(2.8), Inches(10.0)], fs=16, rh=0.55)
    rect(s, Inches(0.25), Inches(4.7), Inches(12.8), Inches(2.1), CORAL)
    txt(s, Inches(0.5), Inches(4.95), Inches(12.3), Inches(0.35),
        "LIMITE", size=16, bold=True, color=WHITE)
    txt(s, Inches(0.5), Inches(5.4), Inches(12.3), Inches(1.1),
        "La plausibilité animale ne garantit pas le succès humain.\n"
        "Le passage modèle → clinique reste l’obstacle majeur.",
        size=18, color=WHITE)
    footer(s, p)

    # 24 EXENATIDE
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Chapitre 3", "Exénatide : espoir puis échec de phase III",
           idea="Le signal exploratoire n’a pas survécu à l’épreuve d’un grand essai.")
    icon(s, "ico_trial.png", Inches(6.15), Inches(1.5), Inches(0.95))
    panel(s, Inches(0.3), Inches(2.55), Inches(6.3), Inches(4.25),
          "Espoir initial",
          ["Études pilotes / phase II — premiers signaux moteurs",
           "Signal exploratoire — encourageant mais fragile",
           "Bonne tolérance globale — acceptable en PD",
           "Rationnel préclinique solide — justifiait un grand essai",
           "A justifié Exenatide-PD3 — passage à l’échelle"],
          TEAL, "+",
          idea="Idée : l’espoir venait d’un signal, pas d’une preuve.")
    panel(s, Inches(6.8), Inches(2.55), Inches(6.2), Inches(4.25),
          "Exenatide-PD3 (phase III)",
          ["194 participants · 96 semaines — vrai test de force",
           "Exénatide hebdomadaire vs placebo — design robuste",
           "MDS-UPDRS III OFF : pas de différence — critère raté",
           "Pas d’effet modificateur démontré — conclusion nette",
           "Fin de l’optimisme de classe — lire molécule par molécule"],
          CORAL, "–",
          idea="Idée : un négatif de phase III pèse plus qu’un signal de phase II.")
    footer(s, p)

    # 25 ATLAS LIXIPARK
    p += 1
    atlas_slide(
        prs, blank, "Chapitre 3 · atlas médical",
        "LIXIPARK — signal phase II, pas une preuve de neuroprotection",
        "med_07_lixipark.png",
        ["Phase II · 156 patients — taille correcte mais pas confirmatoire",
         "Parkinson précoce · 12 mois — fenêtre courte",
         "MDS-UPDRS III : −0,04 vs +3,04 — moins d’aggravation sous lixi",
         "Différence ajustée : 3,08 pts — signal moteur favorable",
         "Nausées / vomissements ↑ — tolérance à anticiper",
         "Pas d’indication réglementaire — hors essai seulement"],
        "Signal moteur favorable à court terme — insuffisant pour affirmer un effet modificateur durable.",
        p, GREEN,
        idea="LIXIPARK ouvre une piste pour le lixisénatide ; il ne valide pas la classe entière."
    )

    # 26 SYNTHESIS
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Chapitre 3", "Synthèse des essais — classe hétérogène",
           idea="Même cible, résultats divergents : on lit chaque essai, pas « les GLP-1 ».")
    rows = [
        ["Molécule / essai", "Design (idée)", "Résultat"],
        ["Exénatide (pilote/ph.II)", "Faible effectif — exploration", "Signal exploratoire"],
        ["LIXIPARK (lixisénatide)", "Ph.II · 156 · 12 mois", "+3,08 pts MDS-UPDRS III"],
        ["Exenatide-PD3", "Ph.III · 194 · 96 sem.", "Négatif (OFF)"],
        ["MOST-ABLE (séma oral)", "Ph.II · 99 · 48 sem.", "Résultats en attente"],
    ]
    table(s, Inches(0.25), Inches(1.5), Inches(12.8), rows,
          [Inches(4.0), Inches(4.0), Inches(4.8)], fs=15, rh=0.58)
    rect(s, Inches(0.25), Inches(4.85), Inches(12.8), Inches(1.95), NAVY)
    txt(s, Inches(0.5), Inches(5.15), Inches(12.3), Inches(1.3),
        "Pas d’effet de classe démontré. Pas d’indication dans Parkinson hors essai clinique.\n"
        "Méta-analyse globale : pas de bénéfice moteur significatif (signal courte durée = exploratoire).",
        size=16, color=WHITE)
    footer(s, p)

    # 27 LIMITS / PERSPECTIVES
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Chapitre 3", "Limites et perspectives",
           idea="Pour progresser : plus long, plus précoce, plus multicritère, mieux stratifié.")
    icon(s, "ico_time.png", Inches(0.55), Inches(1.55), Inches(0.9))
    icon(s, "ico_flow.png", Inches(7.05), Inches(1.55), Inches(0.9))
    panel(s, Inches(0.3), Inches(2.55), Inches(6.3), Inches(4.25),
          "Limites",
          ["Phase II ≠ preuve modificatrice — signal ≠ confirmation",
           "Durées souvent trop courtes — la PD évolue lentement",
           "MDS-UPDRS OFF insuffisant seul — un score ne dit pas tout",
           "Biomarqueurs non validés — difficile de prouver le freinage",
           "Hétérogénéité patients / molécules — brouille les moyennes"],
          CORAL, "L",
          idea="Idée : beaucoup d’essais ne peuvent techniquement pas conclure.")
    panel(s, Inches(6.8), Inches(2.55), Inches(6.2), Inches(4.25),
          "Perspectives",
          ["Stade précoce + suivi long — capturer la progression",
           "Critères moteurs + non moteurs — vision complète",
           "Cognition, chutes, nutrition — pertinents en PD",
           "Stratification / biomarqueurs — qui répond vraiment ?",
           "MOST-ABLE et essais confirmatoires — prochaine étape"],
          GREEN, "P",
          idea="Idée : le design futur doit coller à la lenteur de la maladie.")
    footer(s, p)

    # 28 ATLAS pharmacist
    p += 1
    atlas_slide(
        prs, blank, "Chapitre 3 · atlas médical",
        "Rôle du pharmacien — sécuriser le parcours",
        "med_08_pharma.png",
        ["Éducation injection / titration — geste et rythme",
         "EI digestifs & hydratation — prévenir l’arrêt précoce",
         "Constipation / perte de poids — croiser avec la PD",
         "Risque chute / sarcopénie — vigilance gériatrique",
         "Hypoglycémie si associations — interactions pratiques",
         "Hors essai = pas d’indication PD — message non négociable"],
        "Le pharmacien sécurise l’usage métabolique et rappelle clairement le caractère expérimental dans Parkinson.",
        p, SKY,
        idea="Deux missions : bien utiliser la classe en métabolisme, et ne pas l’étendre hors preuve."
    )

    # 29 PHARMA GRID
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Chapitre 3", "Missions du pharmacien — grille claire",
           idea="Six missions concrètes : éduquer, surveiller, informer, coordonner.")
    roles = [
        ("Éducation", "Rendre le geste sûr et reproductible",
         ["Injection SC — technique et sites", "Titration — rythme personnalisé", "Oublis / conservation — règles simples"],
         TEAL, "ico_pill.png"),
        ("Tolérance", "Anticiper les EI qui font arrêter",
         ["Nausées / vomissements — conseils repas", "Constipation (PD) — déjà fréquente", "Hydratation — prévenir la fragilité"],
         CORAL, "ico_shield.png"),
        ("Vigilance", "Protéger les patients vulnérables",
         ["Insuline/sulfamides — hypo", "Dénutrition — poids + apports", "Chutes / fragilité — alerte soignants"],
         GOLD, "ico_weight.png"),
        ("Essais", "Sécuriser le circuit de recherche",
         ["Traçabilité — lot et observance", "Protocole — respect strict", "Dispensation — cadre réglementaire"],
         GREEN, "ico_trial.png"),
        ("Information", "Cadre réaliste des attentes",
         ["Pas d’indication PD — hors essai", "Attentes réalistes — pas de miracle", "Anti-automédication — message clair"],
         SKY, "ico_pharma.png"),
        ("Coordination", "Relier les acteurs du parcours",
         ["Neurologue — suivi moteur", "Endocrinologue — métabolisme", "Diététicien / MG — nutrition"],
         BLUE, "ico_flow.png"),
    ]
    for i, (t, idea, items, col, ico) in enumerate(roles):
        c, r = i % 3, i // 3
        x = Inches(0.3) + Inches(c * 4.3)
        y = Inches(1.55) + Inches(r * 2.65)
        rect(s, x, y, Inches(4.15), Inches(2.45), SOFT)
        icon(s, ico, x + Inches(3.15), y + Inches(0.12), Inches(0.8))
        txt(s, x + Inches(0.2), y + Inches(0.15), Inches(2.9), Inches(0.35),
            t, size=17, bold=True, color=NAVY, font="Georgia")
        txt(s, x + Inches(0.2), y + Inches(0.55), Inches(3.7), Inches(0.35),
            idea, size=13, bold=True, color=col)
        bullets(s, x + Inches(0.2), y + Inches(1.0), Inches(3.7), Inches(1.3),
                items, size=14, spacing=4)
    footer(s, p)

    # 30 CONCLUSION
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Conclusion", "Cinq messages à retenir",
           idea="Formuler clairement : mature en métabolisme, prudent en Parkinson.")
    msgs = [
        ("1", "Classe mature en métabolisme",
         "DT2, obésité, cardio-rénal : bénéfices prouvés, mais toujours molécule-spécifiques.",
         TEAL, "ico_glucose.png"),
        ("2", "Rationnel PD plausible",
         "Survie, mitochondries, inflammation, α-syn : cohérent en préclinique, pas encore prouvé chez l’humain.",
         GREEN, "ico_neuron.png"),
        ("3", "Clinique hétérogène",
         "LIXIPARK + (ph.II) · Exenatide-PD3 − · pas d’effet de classe démontré.",
         CORAL, "ico_trial.png"),
        ("4", "Pas d’indication actuelle",
         "Hors protocole de recherche : ne pas prescrire ni conseiller un GLP-1 pour la Parkinson.",
         GOLD, "ico_shield.png"),
        ("5", "Pharmacien central",
         "Éducation, tolérance, nutrition, information réaliste : sécuriser sans surpromettre.",
         SKY, "ico_pharma.png"),
    ]
    for i, (n, t, d, col, ico) in enumerate(msgs):
        y = Inches(1.5) + Inches(i * 1.05)
        rect(s, Inches(0.3), y, Inches(12.7), Inches(0.95), SOFT)
        rect(s, Inches(0.3), y, Inches(0.85), Inches(0.95), col)
        txt(s, Inches(0.3), y + Inches(0.22), Inches(0.85), Inches(0.5),
            n, size=22, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
        icon(s, ico, Inches(1.3), y + Inches(0.1), Inches(0.75))
        txt(s, Inches(2.2), y + Inches(0.1), Inches(10.5), Inches(0.35),
            t, size=18, bold=True, color=NAVY, font="Georgia")
        txt(s, Inches(2.2), y + Inches(0.48), Inches(10.5), Inches(0.4),
            d, size=14, color=MUTED)
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
