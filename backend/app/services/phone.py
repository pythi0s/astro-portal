"""Mobile number normalisation: the customer portal's unique login identifier."""

import re

DEFAULT_COUNTRY_CODE = "91"


def normalize_mobile(raw: str) -> str:
    """Return an E.164-style number (`+<digits>`) or raise ValueError.

    Bare 10-digit numbers (and 0-prefixed 11-digit ones) are treated as Indian mobiles.
    """
    cleaned = re.sub(r"[\s\-().]", "", raw or "")
    if cleaned.startswith("00"):
        cleaned = "+" + cleaned[2:]
    has_plus = cleaned.startswith("+")
    digits = cleaned[1:] if has_plus else cleaned
    if not digits.isdigit():
        raise ValueError("Enter a valid mobile number")
    if not has_plus:
        if len(digits) == 10:
            digits = DEFAULT_COUNTRY_CODE + digits
        elif len(digits) == 11 and digits.startswith("0"):
            digits = DEFAULT_COUNTRY_CODE + digits[1:]
        elif not (len(digits) == 12 and digits.startswith(DEFAULT_COUNTRY_CODE)):
            raise ValueError("Enter a valid mobile number")
    if not 10 <= len(digits) <= 15:
        raise ValueError("Enter a valid mobile number")
    return "+" + digits


def last_ten_digits(normalized: str) -> str:
    return normalized[-10:]
