/** Fun labels + emojis per backend action id */
export const TOOL_META: Record<string, { emoji: string; title: string; blurb: string }> = {
  organize_pdf: { emoji: '🧩', title: 'Organize pages', blurb: 'Reorder pages by drag-and-drop order.' },
  merge_pdf: { emoji: '🤝', title: 'Merge PDFs', blurb: 'Combine multiple PDFs into one file.' },
  split_pdf: { emoji: '✂️', title: 'Split PDF', blurb: 'Split by ranges or single pages.' },
  remove_pages: { emoji: '🗑️', title: 'Remove pages', blurb: 'Delete pages you don’t need.' },
  extract_pages: { emoji: '📤', title: 'Extract pages', blurb: 'Pull out selected pages as a new PDF.' },
  rotate_pdf: { emoji: '🔄', title: 'Rotate pages', blurb: '90° / 180° rotations.' },
  crop_pdf: { emoji: '✂️', title: 'Crop PDF', blurb: 'Trim margins visually.' },
  scan_to_pdf: { emoji: '📷', title: 'Scan to PDF', blurb: 'Images → one clean PDF.' },
  jpg_to_pdf: { emoji: '🖼️', title: 'Images → PDF', blurb: 'JPG/PNG to PDF.' },
  word_to_pdf: { emoji: '📝', title: 'Word → PDF', blurb: 'DOCX to PDF.' },
  powerpoint_to_pdf: { emoji: '📊', title: 'PowerPoint → PDF', blurb: 'PPTX to PDF.' },
  excel_to_pdf: { emoji: '📈', title: 'Excel → PDF', blurb: 'Spreadsheet to PDF.' },
  html_to_pdf: { emoji: '🌐', title: 'HTML → PDF', blurb: 'Render HTML as PDF.' },
  pdf_to_jpg: { emoji: '🖼️', title: 'PDF → JPG', blurb: 'Export pages as images.' },
  pdf_to_word: { emoji: '📝', title: 'PDF → Word', blurb: 'Convert to editable DOCX.' },
  pdf_to_powerpoint: { emoji: '📊', title: 'PDF → Slides', blurb: 'Slides with page images.' },
  pdf_to_excel: { emoji: '📈', title: 'PDF → Excel', blurb: 'Tables to spreadsheet.' },
  pdf_to_pdfa: { emoji: '📜', title: 'PDF/A', blurb: 'Archive-friendly PDF.' },
  compress_pdf: { emoji: '🗜️', title: 'Compress PDF', blurb: 'Shrink file size — optional target KB.' },
  optimize_pdf: { emoji: '⚡', title: 'Optimize PDF', blurb: 'Structural cleanup & deflate.' },
  repair_pdf: { emoji: '🛠️', title: 'Repair PDF', blurb: 'Recover from minor corruption.' },
  ocr_pdf: { emoji: '👁️', title: 'OCR PDF', blurb: 'Extract text from scans.' },
  summarize_pdf: { emoji: '📋', title: 'Summarize', blurb: 'AI summary of the document.' },
  translate_pdf: { emoji: '🌍', title: 'Translate', blurb: 'Translate text to another language.' },
  edit_pdf_text: { emoji: '✏️', title: 'Edit text', blurb: 'Insert text overlay.' },
  add_remove_images: { emoji: '🖼️', title: 'Images in PDF', blurb: 'Add images to a page.' },
  add_page_numbers: { emoji: '🔢', title: 'Page numbers', blurb: 'Number pages automatically.' },
  watermark_pdf: { emoji: '💧', title: 'Watermark', blurb: 'Stamp text across pages.' },
  sign_pdf: { emoji: '✍️', title: 'Sign PDF', blurb: 'Add a signature image.' },
  redact_pdf: { emoji: '⬛', title: 'Redact', blurb: 'Black out sensitive areas.' },
  compare_pdfs: { emoji: '⚖️', title: 'Compare PDFs', blurb: 'Visual diff report.' },
  protect_pdf: { emoji: '🔒', title: 'Protect PDF', blurb: 'Password-protect PDF.' },
  unlock_pdf: { emoji: '🔓', title: 'Unlock PDF', blurb: 'Remove password (if known).' },
  detect_encryption: { emoji: '🔍', title: 'Detect encryption', blurb: 'Is the PDF encrypted?' },
  secure_validation: { emoji: '✅', title: 'Validate PDF', blurb: 'Quick structure check.' },
  redact_sensitive: { emoji: '🛡️', title: 'Redact sensitive', blurb: 'Hide sensitive regions.' },
  image_convert: { emoji: '🎨', title: 'Image convert', blurb: 'Image pipeline helpers.' },
  password_strength: { emoji: '🔑', title: 'Password strength', blurb: 'Score & tips.' },
  file_scanner: { emoji: '🔎', title: 'File scanner', blurb: 'Heuristic checks on file.' },
}

export function getToolMeta(action: string) {
  return (
    TOOL_META[action] ?? {
      emoji: '✨',
      title: action.replace(/_/g, ' '),
      blurb: 'Run from the workspace with optional JSON parameters.',
    }
  )
}
