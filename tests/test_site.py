"""Smoke tests for the published portfolio files and navigation."""

from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit


ROOT = Path(__file__).resolve().parents[1]
RESUME_PATH = "assets/Resume_GayatriSharmaKurmatey.pdf"


class SiteParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.ids = []
        self.references = []

    def handle_starttag(self, tag, attrs):
        attributes = dict(attrs)
        if attributes.get("id"):
            self.ids.append(attributes["id"])
        for attribute in ("href", "src"):
            if attributes.get(attribute):
                self.references.append((tag, attribute, attributes[attribute]))


site = SiteParser()
site.feed((ROOT / "index.html").read_text(encoding="utf-8"))
site.close()


def test_page_ids_are_unique():
    assert len(site.ids) == len(set(site.ids)), "Duplicate HTML ids found"


def test_local_links_and_assets_exist():
    errors = []
    for tag, attribute, value in site.references:
        url = urlsplit(value)
        if url.scheme or url.netloc or not url.path:
            continue
        path = unquote(url.path)
        if path.startswith("/"):
            errors.append(f"Root-relative {attribute} in <{tag}>: {value}")
            continue
        target = (ROOT / path).resolve()
        if not target.is_relative_to(ROOT) or not target.is_file():
            errors.append(f"Missing local {attribute} in <{tag}>: {value}")
    assert not errors, "\n".join(errors)


def test_navigation_anchors_exist():
    missing = []
    for _, attribute, value in site.references:
        if attribute != "href":
            continue
        url = urlsplit(value)
        if url.fragment and (not url.path or url.path == "index.html"):
            fragment = unquote(url.fragment)
            if fragment not in site.ids:
                missing.append(f"#{fragment}")
    assert not missing, f"Missing page anchors: {', '.join(missing)}"


def test_resume_link_points_to_pdf():
    assert any(
        attribute == "href" and urlsplit(value).path == RESUME_PATH
        for _, attribute, value in site.references
    ), "Resume link is missing"
    assert (ROOT / RESUME_PATH).read_bytes().startswith(b"%PDF-"), "Resume is not a PDF"
