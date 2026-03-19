from docx import Document
from pathlib import Path
path = Path('concept.docx')
if not path.exists():
    raise FileNotFoundError(path)
doc = Document(path)
for p in doc.paragraphs:
    print(p.text)