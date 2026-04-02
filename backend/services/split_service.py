from pathlib import Path
from PyPDF2 import PdfReader, PdfWriter
import zipfile

def split_pdf_pypdf2(path: Path, out_dir: Path, mode: str, ranges: str = None, every_n: int = None, pages: str = None) -> list[Path]:
    try:
        reader = PdfReader(path)
        total_pages = len(reader.pages)
    except Exception as e:
        raise ValueError(f"Corrupted or invalid PDF: {e}")

    out_dir.mkdir(parents=True, exist_ok=True)
    outputs = []

    if mode == "extract":
        # e.g., "1,3,5"
        if not pages:
            raise ValueError("Pages parameter is required for extract mode")
        
        page_nums = [int(p.strip()) for p in pages.split(",") if p.strip().isdigit()]
        writer = PdfWriter()
        for p in page_nums:
            if 1 <= p <= total_pages:
                writer.add_page(reader.pages[p - 1])
            else:
                raise ValueError(f"Page number {p} exceeds total pages ({total_pages})")
                
        if len(writer.pages) == 0:
            raise ValueError("No valid pages found to extract")
            
        outp = out_dir / f"{path.stem}_extracted.pdf"
        with open(outp, "wb") as f:
            writer.write(f)
        outputs.append(outp)

    elif mode == "range":
        # e.g., "1-3,4-6"
        if not ranges:
            raise ValueError("Ranges parameter is required for range mode")
        
        parts = [r.strip() for r in ranges.split(",") if r.strip()]
        for i, part in enumerate(parts):
            if "-" in part:
                start_str, end_str = part.split("-", 1)
                start = int(start_str.strip()) if start_str.strip().isdigit() else 1
                end = int(end_str.strip()) if end_str.strip().isdigit() else total_pages
            else:
                start = end = int(part.strip()) if part.strip().isdigit() else 1
                
            start = max(1, start)
            end = min(total_pages, end)
            
            if start > end:
                raise ValueError(f"Invalid range: {part}")

            writer = PdfWriter()
            for p in range(start, end + 1):
                writer.add_page(reader.pages[p - 1])
            
            outp = out_dir / f"{path.stem}_part{i+1}.pdf"
            with open(outp, "wb") as f:
                writer.write(f)
            outputs.append(outp)

    elif mode == "every_n":
        if not every_n or every_n < 1:
            raise ValueError("Valid 'every_n' parameter is required")
        
        part = 1
        for i in range(0, total_pages, every_n):
            writer = PdfWriter()
            chunk_end = min(i + every_n, total_pages)
            for p in range(i, chunk_end):
                writer.add_page(reader.pages[p])
            
            outp = out_dir / f"{path.stem}_part{part}.pdf"
            with open(outp, "wb") as f:
                writer.write(f)
            outputs.append(outp)
            part += 1
            
    else:
        raise ValueError("Invalid mode specified")

    return outputs

def create_zip(files: list[Path], dest: Path):
    with zipfile.ZipFile(dest, "w", zipfile.ZIP_DEFLATED) as zf:
        for f in files:
            zf.write(f, arcname=f.name)
