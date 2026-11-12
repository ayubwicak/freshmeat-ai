import pytest
from freshmeat_core.scoring import apply_safety_rules, build_verdict


@pytest.mark.parametrize(
    ("score", "expected"),
    [
        (100.0, "GRADE_A_FRESH"),
        (80.0, "GRADE_A_FRESH"),
        (79.9, "GRADE_B_SUBFRESH"),
        (55.0, "GRADE_B_SUBFRESH"),
        (54.9, "REJECT_SPOILED"),
        (0.0, "REJECT_SPOILED"),
    ],
)
def test_build_verdict_boundaries(score, expected):
    assert build_verdict(score)["classification"] == expected


def run_rules(
    *,
    storage_temp: float = 4.0,
    exposure_hours: float = 1.5,
    surface: str = "normal",
    aroma: str = "fresh",
    discoloration: float = 0.0,
    specularity: float = 0.0,
    lightness: float = 40.0,
    a_star: float = 40.0,
    chroma: float = 45.0,
    commodity: str = "Sapi (Beef Sirloin/Tenderloin)",
):
    scores = {"total_freshness_score": 90.0}
    cielab = {
        "discoloration_ratio_pct": discoloration,
        "L_star": lightness,
        "a_star": a_star,
        "chroma": chroma,
    }
    glcm = {"specularity_wetness_pct": specularity}
    return apply_safety_rules(
        scores,
        cielab,
        glcm,
        commodity,
        storage_temp,
        exposure_hours,
        surface,
        aroma,
    )


def test_rule_boundaries_do_not_trigger_too_early():
    _, rules = run_rules(
        storage_temp=25.0,
        exposure_hours=8.0,
        discoloration=18.0,
        specularity=25.0,
        lightness=60.0,
        a_star=20.0,
        chroma=25.0,
    )
    assert rules == []


def test_rule_boundaries_trigger_above_threshold():
    _, rules = run_rules(
        storage_temp=25.0,
        exposure_hours=8.5,
        discoloration=18.1,
        specularity=25.1,
        lightness=60.0,
        a_star=20.0,
        chroma=25.0,
    )
    assert any("RULE-01" in rule for rule in rules)
    assert any("RULE-02" in rule for rule in rules)
    assert any("RULE-03" in rule for rule in rules)


def test_rule_03_only_applies_to_beef():
    _, rules = run_rules(
        surface="wet",
        lightness=70.0,
        a_star=20.0,
        chroma=25.0,
        commodity="Ayam Broiler (Poultry)",
    )
    assert rules == []


def test_rule_03_does_not_flag_fresh_glossy_marbled_beef():
    _, rules = run_rules(
        surface="wet",
        specularity=30.0,
        lightness=55.0,
        a_star=38.0,
        chroma=44.0,
    )
    assert not any("RULE-03" in rule for rule in rules)


def test_rule_03_requires_pale_chroma_for_specular_only_signal():
    _, rules = run_rules(
        surface="normal",
        specularity=40.0,
        lightness=60.0,
        a_star=25.0,
        chroma=35.0,
    )
    assert not any("RULE-03" in rule for rule in rules)


def test_rule_01_does_not_flag_white_marbling():
    _, rules = run_rules(
        discoloration=25.0,
        lightness=55.0,
        a_star=38.0,
        chroma=44.0,
    )
    assert not any("RULE-01" in rule for rule in rules)
