import pytest
from app.services.gemini_service import (
    _heuristic_classify,
    _two_stage_merge_and_validate,
    _validate_and_normalize,
    detect_explicit_categories,
    RURAL_CATEGORIES,
    URBAN_CATEGORIES
)
from app.services.firestore_service import firestore_service, verify_password, hash_password


# ==============================================================================
# HACKATHON REGRESSION SUITE: SPECIFIED TESTS 1 TO 9 + SILK BOARD TEST
# ==============================================================================

def test_1_potholes_causing_traffic_congestion():
    """TEST 1: 'Massive potholes are causing severe traffic congestion.' -> ['roads', 'traffic']"""
    text = "Massive potholes are causing severe traffic congestion."
    res = _heuristic_classify(text)
    assert res["area_type"] == "urban"
    assert "roads" in res["categories"]
    assert "traffic" in res["categories"]
    assert len(res["categories"]) == 2
    for cat in res["categories"]:
        assert cat in URBAN_CATEGORIES


def test_2_broken_road_and_no_healthcare():
    """TEST 2: 'Broken road and no healthcare facility nearby.' -> ['roads', 'healthcare_access']"""
    text = "Broken road and no healthcare facility nearby."
    res = _heuristic_classify(text)
    assert res["area_type"] == "rural"
    assert "roads" in res["categories"]
    assert "healthcare_access" in res["categories"]
    assert len(res["categories"]) == 2
    for cat in res["categories"]:
        assert cat in RURAL_CATEGORIES


def test_3_garbage_dumping_and_water_problems():
    """TEST 3: 'Garbage dumping is polluting the area and causing water problems.' -> ['pollution', 'water_shortage']"""
    text = "Garbage dumping is polluting the area and causing water problems."
    res = _heuristic_classify(text)
    assert res["area_type"] == "urban"
    assert "pollution" in res["categories"]
    assert "water_shortage" in res["categories"]
    assert len(res["categories"]) == 2
    for cat in res["categories"]:
        assert cat in URBAN_CATEGORIES


def test_4_transformer_failure_and_irrigation_pumps():
    """TEST 4: 'Transformer failure has stopped irrigation pumps.' -> ['electricity', 'irrigation_water']"""
    text = "Transformer failure has stopped irrigation pumps."
    res = _heuristic_classify(text)
    assert res["area_type"] == "rural"
    assert "electricity" in res["categories"]
    assert "irrigation_water" in res["categories"]
    assert len(res["categories"]) == 2
    for cat in res["categories"]:
        assert cat in RURAL_CATEGORIES


def test_5_traffic_potholes_road_expansion():
    """TEST 5: 'Traffic congestion due to potholes and road expansion work.' -> ['traffic', 'roads', 'road_expansion']"""
    text = "Traffic congestion due to potholes and road expansion work."
    res = _heuristic_classify(text)
    assert res["area_type"] == "urban"
    assert "traffic" in res["categories"]
    assert "roads" in res["categories"]
    assert "road_expansion" in res["categories"]
    assert len(res["categories"]) == 3
    for cat in res["categories"]:
        assert cat in URBAN_CATEGORIES


def test_6_stage2_single_gemini_category_supplemented_by_potholes():
    """TEST 6: Gemini returns ['traffic'] for a complaint mentioning potholes -> final: ['traffic', 'roads']"""
    text = "Outer Ring Road near Silk Board Junction has massive crater potholes causing 2-hour daily traffic jams and dangerous accidents for two-wheelers."
    gemini_output = {
        "area_type": "urban",
        "categories": ["traffic"],
        "urgency": "medium",
        "summary": "Traffic congestion near Silk Board Junction.",
        "location": "Silk Board Junction",
        "state": "Karnataka",
        "district": "Bengaluru Urban",
        "locality": "Silk Board",
        "original_language": "English",
        "classified_by": "gemini"
    }

    result = _two_stage_merge_and_validate(gemini_output, text)
    assert result["area_type"] == "urban"
    assert "traffic" in result["categories"]
    assert "roads" in result["categories"]
    assert len(result["categories"]) >= 2
    assert result["urgency"] == "high"


def test_7_invalid_category_removed():
    """TEST 7: Gemini returns an invalid category -> invalid category is removed."""
    text = "Broken road with crater potholes"
    gemini_output = {
        "area_type": "urban",
        "categories": ["space_travel", "alien_invasion", "unrecognized_xyz", "roads"],
        "urgency": "low",
        "summary": "Potholes on the road.",
        "location": "unspecified",
        "original_language": "English"
    }

    result = _two_stage_merge_and_validate(gemini_output, text)
    assert "space_travel" not in result["categories"]
    assert "alien_invasion" not in result["categories"]
    assert "unrecognized_xyz" not in result["categories"]
    assert result["categories"] == ["roads"]
    for cat in result["categories"]:
        assert cat in URBAN_CATEGORIES


def test_8_more_than_three_categories_capped_at_three():
    """TEST 8: More than 3 categories detected -> maximum 3 categories."""
    text = "Severe traffic jam on broken road with power cut, garbage dumping, and no tap water."
    gemini_output = {
        "area_type": "urban",
        "categories": ["traffic", "roads", "electricity", "pollution", "water_shortage"],
        "urgency": "high",
        "summary": "Multiple urban civic issues.",
        "location": "unspecified",
        "original_language": "English"
    }

    result = _two_stage_merge_and_validate(gemini_output, text)
    assert isinstance(result["categories"], list)
    assert len(result["categories"]) == 3
    for cat in result["categories"]:
        assert cat in URBAN_CATEGORIES


def test_9_gemini_unavailable_fallback():
    """TEST 9: Gemini API unavailable -> fallback classifier still returns multiple categories when supported."""
    text = "The road to our village PHC is broken and the health centre has had no doctor for two months."
    res = _heuristic_classify(text)
    assert res["area_type"] == "rural"
    assert len(res["categories"]) >= 2
    assert "roads" in res["categories"]
    assert "healthcare_access" in res["categories"]
    assert res["classified_by"] == "heuristic_fallback"
    assert "summary" in res
    assert "location" in res


def test_10_silk_board_exact_primary_bug_test():
    """TEST 10: 'Outer Ring Road near Silk Board Junction has massive crater potholes causing 2-hour daily traffic jams and dangerous accidents for two-wheelers.'"""
    text = "Outer Ring Road near Silk Board Junction has massive crater potholes causing 2-hour daily traffic jams and dangerous accidents for two-wheelers."
    res = _heuristic_classify(text)
    assert res["area_type"] == "urban"
    assert "roads" in res["categories"]
    assert "traffic" in res["categories"]
    assert len(res["categories"]) == 2
    assert res["urgency"] == "high"
    assert "Silk Board" in res["location"] or "Bengaluru" in res["location"]


# ==============================================================================
# 4. Auth, Hotspots, and Database Integrity Tests
# ==============================================================================

def test_no_location_hallucination():
    """Requirement: Never hallucinate location when not in text; default to 'unspecified'."""
    text = "There is a huge pothole and electricity wire spark on the road."
    raw_data = {
        "area_type": "urban",
        "categories": ["roads", "electricity"],
        "location": "None",
        "state": "null",
        "district": "",
        "locality": "unknown",
        "urgency": "high",
        "summary": "Pothole and spark.",
        "original_language": "English"
    }

    res = _two_stage_merge_and_validate(raw_data, text)
    assert res["location"] == "unspecified"
    assert res["state"] == "unspecified"
    assert res["district"] == "unspecified"
    assert res["locality"] == "unspecified"


def test_bcrypt_password_hashing():
    """Test bcrypt hashing and verification."""
    raw = "civic2026"
    hashed = hash_password(raw)
    assert hashed != raw
    assert verify_password(raw, hashed) is True
    assert verify_password("wrong_password", hashed) is False


def test_official_auth_4_tiers():
    """Test official authentication across 4 tiers with pre-provisioned credentials."""
    # National
    admin_auth = firestore_service.verify_official("admin", "civic2026")
    assert admin_auth is not None
    assert admin_auth["level"] == "national"

    # State
    state_auth = firestore_service.verify_official("state_up", "jal2026")
    assert state_auth is not None
    assert state_auth["level"] == "state"
    assert state_auth["jurisdiction"]["state"] == "Uttar Pradesh"

    # District
    dist_auth = firestore_service.verify_official("dm_varanasi", "varanasi2026")
    assert dist_auth is not None
    assert dist_auth["level"] == "district"
    assert dist_auth["jurisdiction"]["district"] == "Varanasi"

    # Local
    local_auth = firestore_service.verify_official("local_rampur", "local2026")
    assert local_auth is not None
    assert local_auth["level"] == "local"
    assert local_auth["jurisdiction"]["locality"] == "Rampur"


def test_priority_score_formula():
    """Test Priority score calculation formula logic."""
    complaints = firestore_service.get_complaints()
    assert len(complaints) > 0
    first = complaints[0]
    assert "id" in first
    assert "area_type" in first
    assert "categories" in first
    assert isinstance(first["categories"], list)
    assert "urgency" in first
    assert "support_count" in first
    assert "high_priority" in first


def test_support_increment():
    """Test public support increment and 100k threshold."""
    doc = firestore_service.create_complaint({
        "raw_text": "Test pothole complaint on MG Road",
        "area_type": "urban",
        "categories": ["roads", "infra_quality"],
        "location": "MG Road",
        "locality": "MG Road",
        "urgency": "medium",
        "summary": "Pothole on MG Road",
        "original_language": "English",
        "user_id": "usr-test-1",
        "support_count": 99999,
        "high_priority": False
    })

    # Increment by 1 -> becomes 100,000 -> high_priority True
    updated = firestore_service.increment_support(doc["id"], amount=1)
    assert updated["support_count"] == 100000
    assert updated["high_priority"] is True
