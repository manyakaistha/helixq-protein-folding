#!/usr/bin/env python3
"""Convert Markdown to PDF using markdown2 and reportlab"""
import subprocess
import sys

# Install dependencies if needed
for pkg in ['markdown2', 'reportlab']:
    try:
        __import__(pkg)
    except ImportError:
        print(f"Installing {pkg}...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-q", pkg])

import markdown2
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from html.parser import HTMLParser

# Read markdown
with open('experiment_writeup.md', 'r') as f:
    md_text = f.read()

# Convert to HTML
html = markdown2.markdown(md_text, extras=['tables', 'fenced-code-blocks'])

# Create PDF
pdf_file = 'experiment_writeup.pdf'
doc = SimpleDocTemplate(pdf_file, pagesize=letter,
                        leftMargin=0.75*inch, rightMargin=0.75*inch,
                        topMargin=0.75*inch, bottomMargin=0.75*inch)

# Styles
styles = getSampleStyleSheet()
title_style = ParagraphStyle('CustomTitle', parent=styles['Heading1'], fontSize=16, spaceAfter=12, textColor=colors.HexColor('#1a1a1a'), alignment=TA_CENTER)
h2_style = ParagraphStyle('CustomH2', parent=styles['Heading2'], fontSize=14, spaceAfter=10, textColor=colors.HexColor('#333333'))
h3_style = ParagraphStyle('CustomH3', parent=styles['Heading3'], fontSize=12, spaceAfter=8, textColor=colors.HexColor('#555555'))
body_style = ParagraphStyle('CustomBody', parent=styles['BodyText'], fontSize=10, leading=14)

# Simple HTML parser for basic formatting
class SimpleHTMLParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.story = []
        self.in_table = False
        self.table_data = []
        self.current_row = []
        self.current_text = ""
        
    def handle_starttag(self, tag, attrs):
        if tag == 'h1':
            self.current_tag = 'h1'
        elif tag == 'h2':
            self.current_tag = 'h2'
        elif tag == 'h3':
            self.current_tag = 'h3'
        elif tag == 'p':
            self.current_tag = 'p'
        elif tag == 'table':
            self.in_table = True
            self.table_data = []
        elif tag == 'tr':
            self.current_row = []
        elif tag in ['th', 'td']:
            self.current_text = ""
            
    def handle_endtag(self, tag):
        if tag == 'h1' and hasattr(self, 'current_tag'):
            self.story.append(Paragraph(self.current_text, title_style))
            self.story.append(Spacer(1, 0.2*inch))
            self.current_text = ""
        elif tag == 'h2':
            self.story.append(Spacer(1, 0.15*inch))
            self.story.append(Paragraph(self.current_text, h2_style))
            self.story.append(Spacer(1, 0.1*inch))
            self.current_text = ""
        elif tag == 'h3':
            self.story.append(Paragraph(self.current_text, h3_style))
            self.story.append(Spacer(1, 0.08*inch))
            self.current_text = ""
        elif tag == 'p':
            if self.current_text.strip():
                self.story.append(Paragraph(self.current_text, body_style))
                self.story.append(Spacer(1, 0.1*inch))
            self.current_text = ""
        elif tag in ['th', 'td']:
            self.current_row.append(self.current_text)
            self.current_text = ""
        elif tag == 'tr':
            if self.current_row:
                self.table_data.append(self.current_row)
        elif tag == 'table':
            if self.table_data:
                t = Table(self.table_data)
                t.setStyle(TableStyle([
                    ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f2f2f2')),
                    ('TEXTCOLOR', (0,0), (-1,0), colors.black),
                    ('ALIGN', (0,0), (-1,-1), 'LEFT'),
                    ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
                    ('FONTSIZE', (0,0), (-1,0), 10),
                    ('BOTTOMPADDING', (0,0), (-1,0), 12),
                    ('GRID', (0,0), (-1,-1), 0.5, colors.grey),
                    ('FONTSIZE', (0,1), (-1,-1), 9),
                    ('TOPPADDING', (0,1), (-1,-1), 6),
                    ('BOTTOMPADDING', (0,1), (-1,-1), 6),
                ]))
                self.story.append(t)
                self.story.append(Spacer(1, 0.15*inch))
            self.in_table = False
            self.table_data = []
            
    def handle_data(self, data):
        self.current_text += data.strip() + " "

# Parse and build PDF
parser = SimpleHTMLParser()
parser.feed(html)

# Build PDF
doc.build(parser.story)
print(f"✓ PDF created successfully: {pdf_file}")
