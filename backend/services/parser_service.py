import io
from pdfminer.high_level import extract_text

def extract_text_from_upload(file_storage) -> str:
    """
    Extract raw text from uploaded file (.pdf or .txt).
    """
    filename = file_storage.filename.lower()
    data = file_storage.read()

    if filename.endswith(".txt"):
        return data.decode("utf-8", errors="ignore")

    return extract_text(io.BytesIO(data))