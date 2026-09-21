"""Check local portfolio references before deploying to GitHub Pages."""

from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit


ROOT = Path(__file__).resolve().parents[1]
PAGE = ROOT / "index.html"
RESUME = ROOT / "assets" / "Resume_GayatriSharmaKurmatey.pdf"


class SiteParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.ids = set()
        self.references = []
        self.errors = []

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        element_id = attributes.get("id")
        if element_id:
            if element_id in self.ids:
                self.errors.append(f"Duplicate id: #{element_id}")
            self.ids.add(element_id)

        for attribute in ("href", "src"):
            if attributes.get(attribute):
                self.references.append((tag, attribute, attributes[attribute]))


def main():
    parser = SiteParser()
    parser.feed(PAGE.read_text(encoding="utf-8"))
    parser.close()

    for tag, attribute, value in parser.references:
        url = urlsplit(value)
        if url.scheme or url.netloc:
            continue

        if url.path:
            if url.path.startswith("/"):
                parser.errors.append(f"Root-relative {attribute} in <{tag}>: {value}")
                continue
            target = (ROOT / unquote(url.path)).resolve()
            if not target.is_relative_to(ROOT) or not target.is_file():
                parser.errors.append(f"Missing local {attribute} in <{tag}>: {value}")

        if url.fragment and (not url.path or url.path == "index.html"):
            fragment = unquote(url.fragment)
            if fragment not in parser.ids:
                parser.errors.append(f"Missing page anchor: #{fragment}")

    if not RESUME.is_file() or not RESUME.read_bytes().startswith(b"%PDF-"):
        parser.errors.append("Resume PDF is missing or invalid")

    if parser.errors:
        for error in parser.errors:
            print(f"ERROR: {error}")
        raise SystemExit(1)

    print(f"Site checks passed ({len(parser.references)} links/assets, {len(parser.ids)} anchors).")


if __name__ == "__main__":
    main()
