import pytest

from app.services.phone import last_ten_digits, normalize_mobile


@pytest.mark.parametrize(
    ("raw", "expected"),
    [
        ("9876543210", "+919876543210"),
        ("98765 43210", "+919876543210"),
        ("098765-43210", "+919876543210"),
        ("919876543210", "+919876543210"),
        ("+91 (98765) 43210", "+919876543210"),
        ("0091 9876543210", "+919876543210"),
        ("+1 415 555 2671", "+14155552671"),
    ],
)
def test_normalize_mobile(raw, expected):
    assert normalize_mobile(raw) == expected


@pytest.mark.parametrize(
    "raw", ["", "12345", "98765abc10", "+12", "123456789012345678", "1234567890123"]
)
def test_normalize_mobile_rejects(raw):
    with pytest.raises(ValueError):
        normalize_mobile(raw)


def test_last_ten_digits():
    assert last_ten_digits("+919876543210") == "9876543210"
