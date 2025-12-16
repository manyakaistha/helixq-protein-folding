#!/usr/bin/env python3
"""Convert HTML to PDF using weasyprint"""
import subprocess
import sys

# Try to install weasyprint if not available
try:
    from weasyprint import HTML
    print("✓ weasyprint found")
except ImportError:
    print("Installing weasyprint...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "-q", "weasyprint"])
    from weasyprint import HTML
    print("✓ weasyprint installed")

# Convert HTML to PDF
html_file = 'experiment_writeup.html'
pdf_file = 'experiment_writeup.pdf'

print(f"Converting {html_file} to {pdf_file}...")
HTML(html_file).write_pdf(pdf_file)
print(f"✓ PDF created: {pdf_file}")
