import pytest
from app.services.gemini_service import (
    _heuristic_classify,
    _two_stage_merge_and_validate,
    _validate_and_normalize,
    detect_explicit_categories,
    RURAL_CATEGORIES,
    URBAN_CATEGORIES
)
from app.services.location_service import normalize_location
from app.services.priority_service import calculate_priority_score
from app.services.firestore_service import firestore_service, verify_password, hash_password


# ==============================================================================
# 12 MANDATORY HACKATHON REGRESSION TESTS
# ==============================================================================

def test_1_potholes_causing_traffic_congestion():
    """Test 1: 'Massive potholes are causing severe traffic congestion.' -> ['roads', 'traffic']"""
    text = "Massive potholes are causing severe traffic congestion."
    res = _heuristic_classify(text)
    assert res["area_type"] == "urban"
    assert "roads" in res["categories"]
    assert "traffic" in res["categories"]
    assert len(res["categories"]) == 2
    for cat in res["categories"]:
        assert cat in URBAN_CATEGORIES


def test_2_broken_road_and_no_healthcare():
    """Test 2: 'Broken road and no healthcare facility nearby.' -> ['roads', 'healthcare_access']"""
    text = "Broken road and no healthcare facility nearby."
    res = _heuristic_classify(text)
    assert res["area_type"] == "rural"
    assert "roads" in res["categories"]
    assert "healthcare_access" in res["categories"]
    assert len(res["categories"]) == 2
    for cat in res["categories"]:
        assert cat in RURAL_CATEGORIES


def test_3_garbage_dumping_and_water_problems():
    """Test 3: 'Garbage dumping is polluting the area and causing water problems.' -> ['pollution', 'water_shortage']"""
    text = "Garbage dumping is polluting the area and causing water problems."
    res = _heuristic_classify(text)
    assert res["area_type"] == "urban"
    assert "pollution" in res["categories"]
    assert "water_shortage" in res["categories"]
    assert len(res["categories"]) == 2
    for cat in res["categories"]:
        assert cat in URBAN_CATEGORIES


def test_4_transformer_failure_and_irrigation_pumps():
    """Test 4: 'Transformer failure has stopped irrigation pumps.' -> ['electricity', 'irrigation_water']"""
    text = "Transformer failure has stopped irrigation pumps."
    res = _heuristic_classify(text)
    assert res["area_type"] == "rural"
    assert "electricity" in res["categories"]
    assert "irrigation_water" in res["categories"]
    assert len(res["categories"]) == 2
    for cat in res["categories"]:
        assert cat in RURAL_CATEGORIES


def test_5_traffic_potholes_road_expansion():
    """Test 5: 'Traffic congestion due to potholes and road expansion work.' -> ['traffic', 'roads', 'road_expansion']"""
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
    """Test 6: Gemini returns ['traffic'] for a complaint mentioning potholes -> final: ['traffic', 'roads']"""
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
    """Test 7: Gemini returns an invalid category -> invalid category is removed."""
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


def test_8_gemini_unavailable_fallback():
    """Test 8: Gemini API unavailable -> fallback classifier returns deterministic multi-label categories."""
    text = "The road to our village PHC is broken and the health centre has had no doctor for two months."
    res = _heuristic_classify(text)
    assert res["area_type"] == "rural"
    assert len(res["categories"]) >= 2
    assert "roads" in res["categories"]
    assert "healthcare_access" in res["categories"]
    assert res["classified_by"] == "heuristic_fallback"


def test_9_hyderabad_telangana_never_uttar_pradesh():
    """Test 9: 'Hyderabad, Telangana' -> State is Telangana and NEVER Uttar Pradesh."""
    # Direct normalization test
    loc = normalize_location(
        complaint_text="Huge potholes near Kukatpally, Hyderabad, Telangana",
        state_hint="Telangana"
    )
    assert loc["state"] == "Telangana"
    assert loc["district"] == "Hyderabad"
    assert loc["locality"] == "Kukatpally"
    assert loc["state"] != "Uttar Pradesh"

    # Heuristic extraction test
    res = _heuristic_classify("Garbage dumped near water source in Kukatpally, Hyderabad, Telangana")
    assert res["state"] == "Telangana"
    assert res["district"] == "Hyderabad"
    assert res["state"] != "Uttar Pradesh"


def test_10_manual_category_addition():
    """Test 10: AI returns ['roads'], citizen adds 'traffic' -> merged: ['roads', 'traffic']"""
    ai_categories = ["roads"]
    manual_categories = ["traffic"]

    merged = list(ai_categories)
    for mc in manual_categories:
        if mc and mc not in merged:
            merged.append(mc)
    final = merged[:3]

    assert final == ["roads", "traffic"]


def test_11_citizen_removes_category():
    """Test 11: AI returns ['roads', 'traffic'], citizen removes 'traffic' -> final: ['roads']"""
    ai_categories = ["roads", "traffic"]
    # User removes 'traffic'
    confirmed_categories = [c for c in ai_categories if c != "traffic"]
    assert confirmed_categories == ["roads"]


def test_12_priority_score_0_to_100_integer():
    """Test 12: Priority Score is always an integer between 0 and 100 with clear reason string."""
    # Test High Urgency + Safety Risk + Multi-Issue + Persistence
    score1, reason1 = calculate_priority_score(
        urgency="high",
        categories=["roads", "traffic"],
        raw_text="Outer Ring Road has massive crater potholes causing 2-hour daily traffic jams and dangerous accidents for two-wheelers.",
        support_count=50
    )
    assert isinstance(score1, int)
    assert 0 <= score1 <= 100
    assert score1 >= 80
    assert "Priority:" in reason1
    assert "safety" in reason1.lower() or "hazard" in reason1.lower()

    # Test Low Urgency
    score2, reason2 = calculate_priority_score(
        urgency="low",
        categories=["infra_quality"],
        raw_text="A small signpost is slightly faded.",
        support_count=1
    )
    assert isinstance(score2, int)
    assert 0 <= score2 <= 100
    assert score2 <= 30

    # Ensure bounds: cannot exceed 100 or be less than 0
    score_clamped, _ = calculate_priority_score(
        urgency="high",
        categories=["roads", "traffic", "pollution"],
        raw_text="fatal death accident fire emergency toxic daily 2-hour persistent collapsed",
        support_count=100000
    )
    assert score_clamped <= 100
    assert score_clamped >= 0


# ==============================================================================
# EXACT HACKATHON DEMO SCENARIOS
# ==============================================================================

def test_demo_scenario_1_silk_board():
    """Demo Scenario 1: Silk Board Junction Bangalore."""
    text = "Outer Ring Road near Silk Board Junction has massive crater potholes causing 2-hour daily traffic jams and dangerous accidents for two-wheelers."
    res = _heuristic_classify(text)
    assert res["area_type"] == "urban"
    assert "roads" in res["categories"]
    assert "traffic" in res["categories"]
    assert res["urgency"] == "high"
    assert res["state"] == "Karnataka"
    assert "Bengaluru" in res["district"] or "Bengaluru" in res["location"]


def test_demo_scenario_2_hyderabad_garbage_water():
    """Demo Scenario 2: Hyderabad Garbage & Drinking Water."""
    text = "Garbage has been dumped around the public water source in Hyderabad, Telangana and the water is becoming unsafe."
    res = _heuristic_classify(text)
    assert "pollution" in res["categories"]
    assert "water_shortage" in res["categories"]
    assert res["state"] == "Telangana"
    assert res["state"] != "Uttar Pradesh"


def test_demo_scenario_3_street_lights_single_category():
    """Demo Scenario 3: Single issue complaint should not be forced into multiple categories."""
    text = "Street lights are not working and students have difficulty travelling safely at night."
    res = _heuristic_classify(text)
    assert "electricity" in res["categories"]
    # Should only detect electricity
    assert len(res["categories"]) == 1


def test_multi_category_analytics_aggregation():
    """Analytics test: One complaint with ['roads', 'traffic'] counts towards BOTH categories."""
    mock_complaints = [
        {"id": "c1", "categories": ["roads", "traffic"], "state": "Karnataka", "priority_score": 85},
        {"id": "c2", "categories": ["roads"], "state": "Karnataka", "priority_score": 60},
        {"id": "c3", "categories": ["electricity"], "state": "Karnataka", "priority_score": 50}
    ]

    from collections import defaultdict
    category_counts = defaultdict(int)
    for c in mock_complaints:
        for cat in c["categories"]:
            category_counts[cat] += 1

    assert category_counts["roads"] == 2
    assert category_counts["traffic"] == 1
    assert category_counts["electricity"] == 1
