import pytest
from conftest import analyze


def test_health(client):
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "online"


def test_frontend_is_served(client):
    response = client.get("/")
    assert response.status_code == 200
    assert "FreshMeat AI" in response.text


def test_fresh_beef_is_grade_a(client, fresh_meat_jpeg):
    result = analyze(client, fresh_meat_jpeg)

    assert result["classification"] == "GRADE_A_FRESH"
    assert result["scores"]["total_freshness_score"] >= 80
    assert result["triggered_rules"] == []
    assert result["cielab_features"]["a_star"] > 0
    assert 0 <= result["glcm_features"]["homogeneity"] <= 1
    assert result["biomarkers"]["microbial_risk_level"] == "Rendah"
    assert set(result["shelf_life"]) == {
        "room_temp_28c",
        "chiller_4c",
        "freezer_minus18c",
    }


def test_analysis_is_persisted(client, fresh_meat_jpeg):
    result = analyze(client, fresh_meat_jpeg)

    response = client.get("/api/v1/inspections")
    assert response.status_code == 200
    records = response.json()
    assert len(records) == 1
    assert records[0]["inspection_id"] == result["inspection_id"]
    assert (
        records[0]["scores"]["total_freshness_score"]
        == result["scores"]["total_freshness_score"]
    )


def test_inspection_history_is_newest_first_and_limited(client, fresh_meat_jpeg):
    analyze(client, fresh_meat_jpeg)
    latest = analyze(client, fresh_meat_jpeg)

    response = client.get("/api/v1/inspections?limit=1")
    assert response.status_code == 200
    records = response.json()
    assert len(records) == 1
    assert records[0]["inspection_id"] == latest["inspection_id"]


@pytest.mark.parametrize("limit", [0, 101])
def test_inspection_history_limit_is_validated(client, limit):
    response = client.get(f"/api/v1/inspections?limit={limit}")
    assert response.status_code == 422


def test_fresh_marbled_wagyu_is_grade_a(client, fresh_wagyu_jpeg):
    result = analyze(client, fresh_wagyu_jpeg)

    assert result["classification"] == "GRADE_A_FRESH"
    assert result["scores"]["total_freshness_score"] >= 80
    assert result["triggered_rules"] == []
    assert result["cielab_features"]["a_star"] > 25
    assert result["cielab_features"]["marbling_ratio_pct"] > 10
    assert result["cielab_features"]["discoloration_ratio_pct"] < 18


def test_rule_01_spoiled_meat_is_rejected(client, fresh_meat_jpeg):
    result = analyze(
        client,
        fresh_meat_jpeg,
        storage_temp="30",
        exposure_hours="14",
        surface_condition="slimy",
        aroma_condition="ammonia",
    )

    assert result["classification"] == "REJECT_SPOILED"
    assert result["scores"]["total_freshness_score"] <= 20
    assert any("RULE-01" in rule for rule in result["triggered_rules"])
    assert result["biomarkers"]["microbial_risk_level"] == "Tinggi / Kritis"


def test_rule_02_danger_zone_limits_score(client, fresh_meat_jpeg):
    result = analyze(
        client,
        fresh_meat_jpeg,
        storage_temp="30",
        exposure_hours="10",
    )

    assert result["classification"] == "GRADE_B_SUBFRESH"
    assert result["scores"]["total_freshness_score"] <= 58
    assert any("RULE-02" in rule for rule in result["triggered_rules"])


def test_rule_03_water_injected_beef_is_flagged(client, pale_meat_jpeg):
    result = analyze(
        client,
        pale_meat_jpeg,
        surface_condition="wet",
    )

    assert result["classification"] == "REJECT_SPOILED"
    assert result["scores"]["total_freshness_score"] <= 48
    assert any("RULE-03" in rule for rule in result["triggered_rules"])


def test_invalid_upload_returns_400(client):
    response = client.post(
        "/api/v1/analyze",
        files={"file": ("notes.txt", b"bukan gambar", "text/plain")},
    )
    assert response.status_code == 400


def test_caseinsensitive_conditions_are_supported(client, fresh_meat_jpeg):
    result = analyze(
        client,
        fresh_meat_jpeg,
        surface_condition="WET",
        aroma_condition="AMMONIA",
    )

    assert result["classification"] == "REJECT_SPOILED"
    assert any("RULE-01" in rule for rule in result["triggered_rules"])


def test_invalid_numeric_parameters_are_rejected(client, fresh_meat_jpeg):
    response = client.post(
        "/api/v1/analyze",
        files={"file": ("specimen.jpg", fresh_meat_jpeg, "image/jpeg")},
        data={
            "commodity": "Sapi (Beef Sirloin/Tenderloin)",
            "storage_temp": "nan",
            "exposure_hours": "1.5",
            "surface_condition": "normal",
            "aroma_condition": "fresh",
        },
    )
    assert response.status_code == 422


def test_batch_groups_multiple_samples(client, fresh_meat_jpeg):
    response = client.post(
        "/api/v1/batches",
        json={
            "name": "Batch Pasar Minggu",
            "commodity": "Sapi (Beef Sirloin/Tenderloin)",
        },
    )
    assert response.status_code == 201
    batch = response.json()
    assert batch["sample_count"] == 0
    assert batch["average_score"] is None

    first = analyze(client, fresh_meat_jpeg, batch_id=batch["batch_id"])
    second = analyze(client, fresh_meat_jpeg, batch_id=batch["batch_id"])

    assert first["batch_id"] == batch["batch_id"]
    assert first["batch_name"] == "Batch Pasar Minggu"
    assert second["batch_id"] == batch["batch_id"]

    history = client.get(f"/api/v1/inspections?batch_id={batch['batch_id']}")
    assert history.status_code == 200
    records = history.json()
    assert len(records) == 2
    assert {record["inspection_id"] for record in records} == {
        first["inspection_id"],
        second["inspection_id"],
    }

    batches = client.get("/api/v1/batches")
    assert batches.status_code == 200
    saved_batch = batches.json()[0]
    assert saved_batch["sample_count"] == 2
    assert saved_batch["average_score"] == round(
        (
            first["scores"]["total_freshness_score"]
            + second["scores"]["total_freshness_score"]
        )
        / 2,
        1,
    )


def test_batch_default_name_and_empty_commodity(client):
    response = client.post(
        "/api/v1/batches",
        json={"commodity": "Ayam Broiler (Poultry)"},
    )
    assert response.status_code == 201
    assert response.json()["name"].startswith("Batch Ayam Broiler")

    invalid = client.post("/api/v1/batches", json={"commodity": "   "})
    assert invalid.status_code == 422


def test_unknown_batch_is_rejected_before_analysis(client, fresh_meat_jpeg):
    response = client.post(
        "/api/v1/analyze",
        files={"file": ("specimen.jpg", fresh_meat_jpeg, "image/jpeg")},
        data={
            "commodity": "Sapi (Beef Sirloin/Tenderloin)",
            "storage_temp": "4",
            "exposure_hours": "1.5",
            "surface_condition": "normal",
            "aroma_condition": "fresh",
            "batch_id": "BT-20261020-NOPE01",
        },
    )
    assert response.status_code == 404


def test_pwa_manifest_is_served(client):
    response = client.get("/manifest.webmanifest")
    assert response.status_code == 200

    manifest = response.json()
    assert manifest["display"] == "standalone"
    assert manifest["theme_color"].lower() == "#0f172a"

    sizes = {icon["sizes"] for icon in manifest["icons"]}
    assert {"192x192", "512x512"} <= sizes
    assert any(icon.get("purpose") == "maskable" for icon in manifest["icons"])


def test_service_worker_is_served(client):
    response = client.get("/sw.js")
    assert response.status_code == 200
    assert "javascript" in response.headers["content-type"]
    assert "self.addEventListener" in response.text
    assert "/api/" in response.text


def test_pwa_icon_is_served(client):
    response = client.get("/icons/icon-192.png")
    assert response.status_code == 200
    assert response.headers["content-type"] == "image/png"
    assert response.content.startswith(b"\x89PNG\r\n\x1a\n")
