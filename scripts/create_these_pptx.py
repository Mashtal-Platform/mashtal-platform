#!/usr/bin/env python3
"""
Soutenance de thèse — 21 diapositives (texte fourni pour l’écran).
Agonistes du GLP-1 : mise au point et potentiel prometteur pour la maladie de Parkinson
Sara Yousef & Wiam Bourhan — Université Libanaise, Faculté de Pharmacie
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


def add_footer(slide, page, total=TOTAL):
    add_rect(slide, 0, Inches(7.12), SLIDE_W, Inches(0.38), NAVY)
    add_textbox(
        slide, Inches(0.35), Inches(7.16), Inches(10.6), Inches(0.28),
        "Sara Yousef & Wiam Bourhan  ·  Université Libanaise — Faculté de Pharmacie",
        size=10, color=WHITE,
    )
    add_textbox(
        slide, Inches(11.4), Inches(7.16), Inches(1.6), Inches(0.28),
        f"{page}  /  {total}", size=10, color=WHITE, align=PP_ALIGN.RIGHT,
    )


def header(slide, kicker, title, subtitle=None):
    add_bg(slide, LIGHT)
    h = Inches(1.18) if not subtitle else Inches(1.38)
    add_rect(slide, 0, 0, SLIDE_W, h, NAVY)
    add_rect(slide, 0, 0, Inches(0.12), h, ACCENT)
    add_textbox(slide, Inches(0.4), Inches(0.18), Inches(12.5), Inches(0.28),
                kicker.upper(), size=11, bold=True, color=TEAL_LT)
    add_textbox(slide, Inches(0.4), Inches(0.46), Inches(12.5), Inches(0.48),
                title, size=24, bold=True, color=WHITE, font="Georgia")
    if subtitle:
        add_textbox(slide, Inches(0.4), Inches(0.96), Inches(12.5), Inches(0.3),
                    subtitle, size=13, color=RGBColor(0xB0, 0xD0, 0xD8))


def add_nested(slide, left, top, width, height, items, size=16, spacing=8):
    """items: str | (str, [str, ...])"""
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
            p.space_before = Pt(2)
            run = p.add_run()
            run.text = "▸  " + title
            set_run(run, size=size, bold=True, color=DARK)
            for child in children:
                p = tf.add_paragraph()
                p.level = 0
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


def add_table(slide, left, top, width, rows, col_widths, font_size=13, row_h=0.48):
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
            set_run(run, size=font_size, bold=is_header, color=WHITE if is_header else DARK)
            cell.fill.solid()
            if is_header:
                cell.fill.fore_color.rgb = NAVY
            elif r % 2 == 0:
                cell.fill.fore_color.rgb = ROW_ALT
            else:
                cell.fill.fore_color.rgb = WHITE
    return table_shape


def kpi(slide, left, top, width, height, value, label, sub=None, bg=NAVY):
    add_round(slide, left, top, width, height, bg)
    add_textbox(
        slide, left + Inches(0.1), top + Inches(0.16), width - Inches(0.2), Inches(0.55),
        value, size=24, bold=True, color=WHITE, align=PP_ALIGN.CENTER, font="Georgia",
    )
    add_textbox(
        slide, left + Inches(0.1), top + Inches(0.72), width - Inches(0.2), Inches(0.4),
        label, size=12, bold=True, color=RGBColor(0xB8, 0xD8, 0xE0), align=PP_ALIGN.CENTER,
    )
    if sub:
        add_textbox(
            slide, left + Inches(0.1), top + Inches(1.1), width - Inches(0.2), Inches(0.4),
            sub, size=11, color=RGBColor(0x90, 0xB8, 0xC0), align=PP_ALIGN.CENTER,
        )


def add_picture_fit(slide, path, left, top, width, height):
    return slide.shapes.add_picture(str(path), left, top, width=width, height=height)


def content_slide(prs, blank, page, kicker, title, items, size=17, spacing=10, subtitle=None):
    s = prs.slides.add_slide(blank)
    header(s, kicker, title, subtitle)
    y = Inches(1.55) if not subtitle else Inches(1.7)
    add_round(s, Inches(0.35), y, Inches(12.6), Inches(6.85) - y, WHITE)
    add_nested(s, Inches(0.6), y + Inches(0.2), Inches(12.1), Inches(6.55) - y,
               items, size=size, spacing=spacing)
    add_footer(s, page)
    return s


def build():
    prs = Presentation()
    prs.slide_width = SLIDE_W
    prs.slide_height = SLIDE_H
    blank = prs.slide_layouts[6]
    p = 0

    # ------------------------------------------------------------------
    # 1. TITRE
    # ------------------------------------------------------------------
    p += 1
    s = prs.slides.add_slide(blank)
    add_bg(s, NAVY)
    add_rect(s, 0, 0, Inches(0.18), SLIDE_H, ACCENT)
    add_rect(s, 0, Inches(5.55), SLIDE_W, Inches(1.95), TEAL)
    add_textbox(s, Inches(0.7), Inches(0.55), Inches(12), Inches(0.32),
                "THÈSE EN VUE DE L’OBTENTION DU DIPLÔME DE DOCTOR IN PHARMACY PRACTICE",
                size=12, bold=True, color=TEAL_LT)
    add_textbox(
        s, Inches(0.7), Inches(1.05), Inches(12.1), Inches(2.35),
        "Agonistes du GLP-1 :\nMise au point et potentiel prometteur\npour la maladie de Parkinson",
        size=28, bold=True, color=WHITE, font="Georgia",
    )
    add_textbox(
        s, Inches(0.7), Inches(3.6), Inches(12), Inches(0.4),
        "Université Libanaise  —  Faculté de Pharmacie",
        size=16, color=RGBColor(0xB0, 0xD0, 0xD8),
    )
    add_textbox(
        s, Inches(0.7), Inches(4.15), Inches(12), Inches(0.7),
        "Directrice de thèse :  Pr. Dalia Khachman",
        size=15, color=WHITE,
    )
    add_textbox(
        s, Inches(0.7), Inches(5.8), Inches(7.5), Inches(1.2),
        "Préparée par\nSara Yousef  &  Wiam Bourhan",
        size=16, bold=True, color=WHITE,
    )
    add_textbox(
        s, Inches(8.6), Inches(6.05), Inches(4.2), Inches(0.9),
        "Soutenance\n03 septembre 2026",
        size=16, bold=True, color=WHITE, align=PP_ALIGN.RIGHT,
    )

    # ------------------------------------------------------------------
    # 2. CONTEXTE
    # ------------------------------------------------------------------
    p += 1
    content_slide(prs, blank, p, "Introduction", "Contexte", [
        "La maladie de Parkinson est une maladie neurodégénérative progressive.",
        "Elle associe des symptômes moteurs et non moteurs, avec un retentissement important sur l’autonomie et la qualité de vie.",
        "Les traitements actuels améliorent principalement les symptômes, en particulier moteurs.",
        "Aucun traitement n’a démontré de manière certaine qu’il ralentit durablement la neurodégénérescence.",
        "Le développement de traitements modificateurs de la maladie reste donc une priorité.",
    ], size=18, spacing=14)

    # ------------------------------------------------------------------
    # 3. PROBLÉMATIQUE
    # ------------------------------------------------------------------
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Introduction", "Problématique",
           "Les agonistes du récepteur du GLP-1 peuvent-ils représenter une nouvelle stratégie thérapeutique dans la maladie de Parkinson ?")
    add_round(s, Inches(0.35), Inches(1.7), Inches(12.6), Inches(5.05), WHITE)
    add_nested(s, Inches(0.6), Inches(1.9), Inches(12.1), Inches(4.7), [
        "Ces médicaments sont déjà utilisés dans le diabète de type 2 et l’obésité.",
        "Ils possèdent des effets métaboliques, cardiovasculaires et rénaux démontrés pour certaines molécules.",
        "Des données expérimentales suggèrent des effets potentiellement neuroprotecteurs.",
        "Toutefois, une plausibilité biologique ne constitue pas une preuve d’efficacité clinique.",
        "Il est nécessaire d’évaluer les données disponibles de façon critique, molécule par molécule.",
    ], size=17, spacing=12)
    add_footer(s, p)

    # ------------------------------------------------------------------
    # 4. OBJECTIFS
    # ------------------------------------------------------------------
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Introduction", "Objectifs de la thèse")
    objs = [
        ("1", "Physiologie et pharmacologie",
         "Présenter la physiologie du GLP-1 et la pharmacologie des agonistes du GLP-1R."),
        ("2", "Indications validées",
         "Examiner leurs applications dans le diabète de type 2, l’obésité et la prévention cardio-rénale."),
        ("3", "Repositionnement",
         "Analyser leur potentiel de repositionnement dans la maladie de Parkinson."),
        ("4", "Lecture critique",
         "Distinguer les données précliniques, les signaux cliniques et la preuve d’un effet modificateur de la maladie."),
        ("5", "Rôle du pharmacien",
         "Définir la place du pharmacien dans l’accompagnement et la sécurisation de leur utilisation."),
    ]
    for i, (n, t, d) in enumerate(objs):
        y = Inches(1.45) + Inches(i * 1.05)
        add_round(s, Inches(0.35), y, Inches(12.6), Inches(0.95), WHITE)
        add_rect(s, Inches(0.35), y, Inches(0.75), Inches(0.95), NAVY if i != 2 else ACCENT)
        add_textbox(s, Inches(0.35), y + Inches(0.22), Inches(0.75), Inches(0.5),
                    n, size=20, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
        add_textbox(s, Inches(1.3), y + Inches(0.12), Inches(11.4), Inches(0.32),
                    t, size=16, bold=True, color=NAVY, font="Georgia")
        add_textbox(s, Inches(1.3), y + Inches(0.48), Inches(11.4), Inches(0.38),
                    d, size=14, color=MUTED)
    add_footer(s, p)

    # ------------------------------------------------------------------
    # 5. RAPPELS PD
    # ------------------------------------------------------------------
    p += 1
    content_slide(prs, blank, p, "Maladie de Parkinson", "Maladie de Parkinson : rappels", [
        "La maladie de Parkinson résulte notamment de la dégénérescence des neurones dopaminergiques de la substance noire.",
        "Cette dégénérescence entraîne une diminution de la dopamine striatale.",
        ("Les principaux symptômes moteurs sont :", [
            "Bradykinésie",
            "Tremblement de repos",
            "Rigidité",
            "Troubles de la marche et de l’équilibre",
        ]),
        "Les symptômes non moteurs sont fréquents : constipation, fatigue, douleur, troubles du sommeil, anxiété, dépression, dysautonomie et troubles cognitifs.",
    ], size=16, spacing=10)

    # ------------------------------------------------------------------
    # 6. HÉTÉROGÉNÉITÉ
    # ------------------------------------------------------------------
    p += 1
    content_slide(prs, blank, p, "Maladie de Parkinson", "Une maladie complexe et hétérogène", [
        "La maladie de Parkinson ne se limite pas au déficit dopaminergique.",
        ("Plusieurs mécanismes sont impliqués :", [
            "Agrégation d’alpha-synucléine",
            "Dysfonction mitochondriale",
            "Stress oxydatif",
            "Neuroinflammation",
            "Altération de l’autophagie et de la protéostase",
        ]),
        "Les trajectoires cliniques sont variables d’un patient à l’autre.",
        "Cette hétérogénéité complique l’évaluation des traitements modificateurs de la maladie.",
    ], size=16, spacing=8)

    # ------------------------------------------------------------------
    # 7. PHYSIOLOGIE GLP-1
    # ------------------------------------------------------------------
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Chapitre I", "GLP-1 : physiologie")
    add_round(s, Inches(0.35), Inches(1.5), Inches(7.15), Inches(5.25), WHITE)
    add_nested(s, Inches(0.55), Inches(1.7), Inches(6.8), Inches(4.9), [
        "Le GLP-1 est une hormone incrétine issue du proglucagon.",
        "Il est principalement sécrété par les cellules entéroendocrines L de l’intestin après les repas.",
        ("Ses principales actions sont :", [
            "Stimulation de l’insulinosécrétion glucose-dépendante",
            "Diminution de la sécrétion de glucagon en hyperglycémie",
            "Ralentissement de la vidange gastrique",
            "Augmentation de la satiété",
        ]),
        "Il contribue ainsi à la régulation glycémique et énergétique.",
    ], size=15, spacing=8)
    add_picture_fit(s, ASSETS / "fig0_physiologie_glp1.png",
                    Inches(7.65), Inches(1.5), Inches(5.3), Inches(5.25))
    add_footer(s, p)

    # ------------------------------------------------------------------
    # 8. LIMITES GLP-1 ENDOGÈNE
    # ------------------------------------------------------------------
    p += 1
    content_slide(prs, blank, p, "Chapitre I", "Limites du GLP-1 endogène", [
        "Le GLP-1 endogène possède une demi-vie très courte : environ 1 à 2 minutes.",
        "Il est rapidement inactivé, principalement par la dipeptidyl-peptidase-4 ou DPP-4.",
        "Il ne peut donc pas être utilisé directement comme médicament.",
        ("Les agonistes du GLP-1R ont été développés afin de :", [
            "Résister à la dégradation par la DPP-4",
            "Prolonger l’exposition systémique",
            "Permettre une administration quotidienne ou hebdomadaire",
        ]),
    ], size=17, spacing=10)

    # ------------------------------------------------------------------
    # 9. RÉCEPTEUR ET SIGNALISATION
    # ------------------------------------------------------------------
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Chapitre I", "Récepteur du GLP-1 et signalisation")
    add_round(s, Inches(0.35), Inches(1.5), Inches(6.55), Inches(5.25), WHITE)
    add_nested(s, Inches(0.55), Inches(1.7), Inches(6.2), Inches(4.9), [
        "Le GLP-1R est un récepteur couplé aux protéines G.",
        "Son activation stimule principalement la voie Gs → AMPc → PKA / EPAC2.",
        "Dans les cellules bêta pancréatiques, cette signalisation favorise la sécrétion d’insuline en présence de glucose.",
        "Les voies PI3K/Akt et MAPK/ERK peuvent également être modulées.",
        "Dans les modèles expérimentaux, ces voies sont associées à la survie cellulaire et à la réponse au stress.",
    ], size=15, spacing=9)
    add_picture_fit(s, ASSETS / "fig1_glp1r_signalisation.png",
                    Inches(7.05), Inches(1.5), Inches(5.9), Inches(5.25))
    add_footer(s, p)

    # ------------------------------------------------------------------
    # 10. TABLEAU DES AGONISTES
    # ------------------------------------------------------------------
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Chapitre I", "Principaux agonistes du GLP-1R")
    rows = [
        ["Molécule", "Profil", "Administration", "Particularité"],
        ["Exénatide", "Dérivé de l’exendine-4", "2 fois/jour ou 1 fois/semaine", "Évalué dans Parkinson"],
        ["Lixisénatide", "Action courte", "1 fois/jour", "Molécule de LIXIPARK"],
        ["Liraglutide", "Analogue du GLP-1 humain", "1 fois/jour", "Diabète et obésité selon la dose"],
        ["Dulaglutide", "Action prolongée", "1 fois/semaine", "Bénéfice CV démontré"],
        ["Sémaglutide", "Action prolongée", "1 fois/semaine ou oral", "Données cardio-rénales"],
        ["Tirzépatide", "Double agoniste GIP/GLP-1", "1 fois/semaine", "Non sélectif du GLP-1R"],
    ]
    add_table(s, Inches(0.35), Inches(1.55), Inches(12.6), rows,
              [Inches(2.3), Inches(3.3), Inches(3.4), Inches(3.6)],
              font_size=14, row_h=0.68)
    add_footer(s, p)

    # ------------------------------------------------------------------
    # 11. NON INTERCHANGEABLES
    # ------------------------------------------------------------------
    p += 1
    content_slide(prs, blank, p, "Chapitre I", "Des médicaments non interchangeables", [
        "Les agonistes du GLP-1R partagent une cible commune, mais ne sont pas équivalents.",
        ("Ils diffèrent par :", [
            "Leur structure moléculaire",
            "Leur demi-vie",
            "Leur fréquence d’administration",
            "Leur liaison aux protéines plasmatiques",
            "Leur profil pharmacodynamique",
            "Leur exposition tissulaire potentielle",
        ]),
        "Il n’est donc pas possible de conclure à un effet neurologique de classe à partir du résultat d’une seule molécule.",
    ], size=16, spacing=8)

    # ------------------------------------------------------------------
    # 12. DT2
    # ------------------------------------------------------------------
    p += 1
    content_slide(prs, blank, p, "Chapitre II", "Applications validées dans le diabète", [
        "Les agonistes du GLP-1R améliorent le contrôle glycémique.",
        "Ils réduisent la glycémie à jeun et postprandiale.",
        "Ils diminuent l’HbA1c.",
        "Ils présentent un faible risque intrinsèque d’hypoglycémie lorsqu’ils ne sont pas associés à l’insuline ou aux sulfamides hypoglycémiants.",
        "Ils contribuent également à la réduction de l’appétit et du poids corporel.",
    ], size=18, spacing=14)

    # ------------------------------------------------------------------
    # 13. OBÉSITÉ ET CARDIO-RÉNAL
    # ------------------------------------------------------------------
    p += 1
    content_slide(prs, blank, p, "Chapitre II", "Bénéfices dans l’obésité et protection cardio-rénale", [
        "Certains agonistes du GLP-1R sont indiqués dans l’obésité, en complément des mesures hygiéno-diététiques.",
        "La réduction pondérale résulte principalement d’une diminution de l’appétit et des apports énergétiques.",
        ("Des bénéfices cardiovasculaires ont été démontrés avec :", [
            "Liraglutide : LEADER",
            "Sémaglutide : SUSTAIN-6 et SELECT",
            "Dulaglutide : REWIND",
        ]),
        "Le sémaglutide a également démontré un bénéfice rénal dans l’essai FLOW.",
        "Ces bénéfices concernent des molécules et des populations précises.",
    ], size=16, spacing=8)

    # ------------------------------------------------------------------
    # 14. TOLÉRANCE
    # ------------------------------------------------------------------
    p += 1
    content_slide(prs, blank, p, "Chapitre II", "Tolérance et précautions", [
        ("Les effets indésirables sont principalement digestifs :", [
            "Nausées",
            "Vomissements",
            "Diarrhée",
            "Constipation",
            "Douleurs abdominales",
            "Diminution de l’appétit",
        ]),
        "Une titration progressive améliore généralement la tolérance.",
        ("Une vigilance est nécessaire en cas de :", [
            "Risque de déshydratation",
            "Perte pondérale excessive",
            "Fragilité nutritionnelle",
            "Association à l’insuline ou aux sulfamides",
        ]),
    ], size=15, spacing=8)

    # ------------------------------------------------------------------
    # 15. POURQUOI REPOSITIONNER
    # ------------------------------------------------------------------
    p += 1
    content_slide(prs, blank, p, "Chapitre III", "Pourquoi un repositionnement dans Parkinson ?", [
        "Le repositionnement thérapeutique consiste à explorer une nouvelle indication pour un médicament déjà connu.",
        "Il peut permettre de réduire certaines incertitudes du développement pharmaceutique et clinique.",
        ("Les agonistes du GLP-1R sont d’intérêt dans Parkinson car ils pourraient agir sur :", [
            "La survie cellulaire",
            "Le métabolisme énergétique",
            "La fonction mitochondriale",
            "Le stress oxydatif",
            "La neuroinflammation",
        ]),
        "Mais leur efficacité dans le diabète ou l’obésité ne prédit pas une efficacité neurologique.",
    ], size=15, spacing=8)

    # ------------------------------------------------------------------
    # 16. MÉCANISMES NEUROPROTECTEURS
    # ------------------------------------------------------------------
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Chapitre III", "Mécanismes neuroprotecteurs potentiels")
    add_round(s, Inches(0.35), Inches(1.5), Inches(6.55), Inches(5.25), WHITE)
    add_nested(s, Inches(0.55), Inches(1.7), Inches(6.2), Inches(4.9), [
        ("Dans les modèles expérimentaux, l’activation du GLP-1R peut moduler :", [
            "La voie AMPc/PKA",
            "La voie PI3K/Akt",
            "La voie MAPK/ERK",
        ]),
        ("Ces voies sont associées à :", [
            "Une amélioration de la survie neuronale",
            "Une diminution de certains signaux pro-apoptotiques",
            "Une meilleure réponse au stress cellulaire",
            "Une modulation du métabolisme énergétique",
        ]),
        "Ces mécanismes restent des hypothèses précliniques.",
    ], size=14, spacing=7)
    add_picture_fit(s, ASSETS / "fig2_neuroprotection.png",
                    Inches(7.05), Inches(1.5), Inches(5.9), Inches(5.25))
    add_footer(s, p)

    # ------------------------------------------------------------------
    # 17. MITOCHONDRIES / INFLAMMATION
    # ------------------------------------------------------------------
    p += 1
    content_slide(prs, blank, p, "Chapitre III", "Mitochondries, stress oxydatif et inflammation", [
        "La dysfonction mitochondriale contribue à la vulnérabilité des neurones dopaminergiques.",
        ("Elle peut induire :", [
            "Une diminution de la production d’énergie",
            "Une augmentation des espèces réactives de l’oxygène",
            "Une augmentation du stress oxydatif",
        ]),
        ("Les agonistes du GLP-1R ont montré dans certains modèles :", [
            "Une amélioration de paramètres mitochondriaux",
            "Une diminution de marqueurs de stress oxydatif",
            "Une modulation de l’activation microgliale",
            "Une réduction de certains médiateurs pro-inflammatoires",
        ]),
        "Ces résultats ne démontrent pas encore une neuroprotection chez l’humain.",
    ], size=15, spacing=6)

    # ------------------------------------------------------------------
    # 18. ALPHA-SYN ET PRÉCLINIQUE
    # ------------------------------------------------------------------
    p += 1
    content_slide(prs, blank, p, "Chapitre III", "Alpha-synucléine et données précliniques", [
        "L’agrégation d’alpha-synucléine est un mécanisme majeur de la maladie de Parkinson.",
        "Des anomalies de l’autophagie et de la protéostase peuvent favoriser l’accumulation de protéines mal conformées.",
        ("Dans certains modèles, les agonistes du GLP-1R semblent moduler :", [
            "L’autophagie",
            "La protéostase",
            "Certains processus associés à l’alpha-synucléine",
        ]),
        "Les modèles MPTP et 6-OHDA ont montré des résultats encourageants avec plusieurs molécules.",
        "Toutefois, ils reproduisent imparfaitement la maladie humaine, sa progression lente et son hétérogénéité.",
    ], size=15, spacing=7)

    # ------------------------------------------------------------------
    # 19. LIXIPARK
    # ------------------------------------------------------------------
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Chapitre III — Clinique", "Données cliniques : LIXIPARK",
           "Essai de phase II, randomisé, contrôlé contre placebo — lixisénatide")
    kpi(s, Inches(0.35), Inches(1.7), Inches(4.05), Inches(1.65), "156", "Patients", "Parkinson précoce", bg=TEAL)
    kpi(s, Inches(4.6), Inches(1.7), Inches(4.05), Inches(1.65), "12 mois", "Durée de suivi", "critère moteur", bg=NAVY)
    kpi(s, Inches(8.85), Inches(1.7), Inches(4.1), Inches(1.65), "3,08 pts", "Différence ajustée", "MDS-UPDRS III", bg=ACCENT_DK)
    add_round(s, Inches(0.35), Inches(3.55), Inches(12.6), Inches(3.2), WHITE)
    add_nested(s, Inches(0.55), Inches(3.7), Inches(12.2), Inches(2.9), [
        ("Résultat principal :", [
            "Variation moyenne du MDS-UPDRS III : −0,04 point sous lixisénatide",
            "Variation moyenne du MDS-UPDRS III : +3,04 points sous placebo",
            "Différence ajustée : 3,08 points en faveur du lixisénatide",
        ]),
        "Les nausées et vomissements étaient plus fréquents sous lixisénatide.",
    ], size=15, spacing=6)
    add_footer(s, p)

    # ------------------------------------------------------------------
    # 20. EXENATIDE-PD3
    # ------------------------------------------------------------------
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Chapitre III — Clinique", "Données cliniques : Exenatide-PD3",
           "Essai de phase III, randomisé, contrôlé contre placebo — exénatide hebdomadaire")
    kpi(s, Inches(0.35), Inches(1.7), Inches(4.05), Inches(1.65), "194", "Participants", "maladie de Parkinson", bg=NAVY)
    kpi(s, Inches(4.6), Inches(1.7), Inches(4.05), Inches(1.65), "96 sem.", "Traitement et suivi", "vs placebo", bg=TEAL)
    kpi(s, Inches(8.85), Inches(1.7), Inches(4.1), Inches(1.65), "Négatif", "Critère principal", "MDS-UPDRS III OFF", bg=WARN)
    add_round(s, Inches(0.35), Inches(3.55), Inches(12.6), Inches(3.2), WHITE)
    add_nested(s, Inches(0.55), Inches(3.7), Inches(12.2), Inches(2.9), [
        ("Résultat principal :", [
            "Aggravation similaire du score moteur MDS-UPDRS III à l’état OFF dans les deux groupes",
            "Absence de différence significative sur le critère principal",
        ]),
        "Conclusion : aucun argument en faveur d’un effet modificateur de la maladie avec l’exénatide dans cette population.",
    ], size=15, spacing=7)
    add_footer(s, p)

    # ------------------------------------------------------------------
    # 21. CONCLUSION
    # ------------------------------------------------------------------
    p += 1
    s = prs.slides.add_slide(blank)
    header(s, "Conclusion", "Messages clés")
    msgs = [
        "Les agonistes du GLP-1R sont des médicaments majeurs dans le DT2 et, pour certaines molécules, dans l’obésité et la prévention cardio-rénale.",
        "Leur intérêt dans Parkinson repose sur une plausibilité biologique cohérente et des résultats précliniques encourageants.",
        "Les données cliniques restent contradictoires : signal favorable à court terme (LIXIPARK / lixisénatide) ; résultat négatif (Exenatide-PD3).",
        "Il n’existe pas, à ce jour, de preuve d’un effet de classe ni d’indication des agonistes du GLP-1R dans Parkinson.",
        "Leur utilisation dans cette maladie doit rester limitée aux protocoles de recherche clinique.",
        "Le pharmacien joue un rôle essentiel dans l’éducation thérapeutique, la surveillance de la tolérance et la prévention des usages hors indication non justifiés.",
    ]
    for i, text in enumerate(msgs):
        y = Inches(1.42) + Inches(i * 0.88)
        add_round(s, Inches(0.35), y, Inches(12.6), Inches(0.8), WHITE)
        add_rect(s, Inches(0.35), y, Inches(0.62), Inches(0.8), ACCENT if i == 3 else NAVY)
        add_textbox(s, Inches(0.35), y + Inches(0.18), Inches(0.62), Inches(0.45),
                    str(i + 1), size=16, bold=True, color=WHITE, align=PP_ALIGN.CENTER)
        add_textbox(s, Inches(1.15), y + Inches(0.12), Inches(11.55), Inches(0.58),
                    text, size=13, color=DARK)
    add_footer(s, p)

    assert p == TOTAL, f"Expected {TOTAL} slides, got {p}"

    out = Path("/workspace/docs/presentation/Soutenance_GLP1_Parkinson.pptx")
    prs.save(str(out))
    print(f"Saved: {out}")
    print(f"Slides: {len(prs.slides)} (counter={p})")
    return str(out)


if __name__ == "__main__":
    build()
