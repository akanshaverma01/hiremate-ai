import re
import string
import nltk
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer

# Ensure required NLTK corpora are present. In production these should be
# pre-downloaded in the Docker image build step, not at request time.
for pkg in ("stopwords", "wordnet", "omw-1.4"):
    try:
        nltk.data.find(f"corpora/{pkg}")
    except LookupError:
        nltk.download(pkg, quiet=True)

_STOPWORDS = set(stopwords.words("english"))
_LEMMATIZER = WordNetLemmatizer()


def clean_text(text: str) -> str:
    """Lowercase, strip punctuation/numbers/extra whitespace, remove stopwords,
    and lemmatize. Returns a single space-joined string ready for TF-IDF."""
    text = text.lower()
    text = re.sub(r"[\r\n\t]+", " ", text)
    text = text.translate(str.maketrans("", "", string.punctuation))
    text = re.sub(r"\d+", " ", text)
    tokens = text.split()
    tokens = [
        _LEMMATIZER.lemmatize(tok)
        for tok in tokens
        if tok not in _STOPWORDS and len(tok) > 1
    ]
    return " ".join(tokens)
