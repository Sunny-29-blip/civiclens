"""
CivicLens Canonical Location & Jurisdiction Normalization Service.
Resolves and validates citizen-provided complaint text, city names, and form hints
into a canonical Indian State, District, Locality, and Confidence score.
Prevents hallucinations and wrongful state mappings (e.g. Hyderabad -> Telangana, NEVER Uttar Pradesh).
"""

import re
from typing import Dict, Any, Optional, Tuple, List
from pydantic import BaseModel, Field

# Canonical Indian States & Union Territories with aliases and abbreviations
INDIAN_STATES_CANONICAL: Dict[str, str] = {
    "andhra pradesh": "Andhra Pradesh", "ap": "Andhra Pradesh",
    "arunachal pradesh": "Arunachal Pradesh", "ar": "Arunachal Pradesh",
    "assam": "Assam", "as": "Assam",
    "bihar": "Bihar", "br": "Bihar",
    "chhattisgarh": "Chhattisgarh", "cg": "Chhattisgarh",
    "goa": "Goa", "ga": "Goa",
    "gujarat": "Gujarat", "gj": "Gujarat",
    "haryana": "Haryana", "hr": "Haryana",
    "himachal pradesh": "Himachal Pradesh", "hp": "Himachal Pradesh",
    "jharkhand": "Jharkhand", "jh": "Jharkhand",
    "karnataka": "Karnataka", "ka": "Karnataka",
    "kerala": "Kerala", "kl": "Kerala",
    "madhya pradesh": "Madhya Pradesh", "mp": "Madhya Pradesh",
    "maharashtra": "Maharashtra", "mh": "Maharashtra",
    "manipur": "Manipur", "mn": "Manipur",
    "meghalaya": "Meghalaya", "ml": "Meghalaya",
    "mizoram": "Mizoram", "mz": "Mizoram",
    "nagaland": "Nagaland", "nl": "Nagaland",
    "odisha": "Odisha", "orissa": "Odisha", "od": "Odisha",
    "punjab": "Punjab", "pb": "Punjab",
    "rajasthan": "Rajasthan", "rj": "Rajasthan",
    "sikkim": "Sikkim", "sk": "Sikkim",
    "tamil nadu": "Tamil Nadu", "tn": "Tamil Nadu",
    "telangana": "Telangana", "ts": "Telangana", "tg": "Telangana",
    "tripura": "Tripura", "tr": "Tripura",
    "uttar pradesh": "Uttar Pradesh", "up": "Uttar Pradesh",
    "uttarakhand": "Uttarakhand", "uk": "Uttarakhand", "ua": "Uttarakhand",
    "west bengal": "West Bengal", "wb": "West Bengal",
    "delhi": "Delhi", "nct of delhi": "Delhi", "new delhi": "Delhi", "dl": "Delhi",
    "jammu and kashmir": "Jammu & Kashmir", "j&k": "Jammu & Kashmir", "jk": "Jammu & Kashmir",
    "ladakh": "Ladakh", "la": "Ladakh",
    "puducherry": "Puducherry", "pondicherry": "Puducherry", "py": "Puducherry",
    "chandigarh": "Chandigarh", "ch": "Chandigarh",
    "dadra and nagar haveli and daman and diu": "Dadra & Nagar Haveli and Daman & Diu",
    "andaman and nicobar islands": "Andaman & Nicobar Islands",
    "lakshadweep": "Lakshadweep"
}

# Major Districts, Cities, and Localities mapped to their definitive State & District
CANONICAL_CITY_DISTRICT_MAP: Dict[str, Tuple[str, str, str]] = {
    # Telangana
    "hyderabad": ("Telangana", "Hyderabad", "Hyderabad"),
    "kukatpally": ("Telangana", "Hyderabad", "Kukatpally"),
    "hitec city": ("Telangana", "Hyderabad", "Hitec City"),
    "gachibowli": ("Telangana", "Hyderabad", "Gachibowli"),
    "secunderabad": ("Telangana", "Hyderabad", "Secunderabad"),
    "madhapur": ("Telangana", "Hyderabad", "Madhapur"),
    "warangal": ("Telangana", "Warangal", "Warangal"),
    "nizamabad": ("Telangana", "Nizamabad", "Nizamabad"),
    "karimnagar": ("Telangana", "Karimnagar", "Karimnagar"),
    "khammam": ("Telangana", "Khammam", "Khammam"),

    # Karnataka
    "bengaluru": ("Karnataka", "Bengaluru Urban", "Bengaluru"),
    "bangalore": ("Karnataka", "Bengaluru Urban", "Bengaluru"),
    "silk board": ("Karnataka", "Bengaluru Urban", "Silk Board"),
    "silk board junction": ("Karnataka", "Bengaluru Urban", "Silk Board"),
    "outer ring road": ("Karnataka", "Bengaluru Urban", "Outer Ring Road"),
    "koramangala": ("Karnataka", "Bengaluru Urban", "Koramangala"),
    "indiranagar": ("Karnataka", "Bengaluru Urban", "Indiranagar"),
    "whitefield": ("Karnataka", "Bengaluru Urban", "Whitefield"),
    "electronic city": ("Karnataka", "Bengaluru Urban", "Electronic City"),
    "marathahalli": ("Karnataka", "Bengaluru Urban", "Marathahalli"),
    "mysuru": ("Karnataka", "Mysuru", "Mysuru"),
    "mysore": ("Karnataka", "Mysuru", "Mysore"),
    "hubballi": ("Karnataka", "Dharwad", "Hubballi"),
    "mangalore": ("Karnataka", "Dakshina Kannada", "Mangalore"),

    # Uttar Pradesh
    "varanasi": ("Uttar Pradesh", "Varanasi", "Varanasi"),
    "rampur": ("Uttar Pradesh", "Varanasi", "Rampur"),
    "lucknow": ("Uttar Pradesh", "Lucknow", "Lucknow"),
    "kanpur": ("Uttar Pradesh", "Kanpur Nagar", "Kanpur"),
    "agra": ("Uttar Pradesh", "Agra", "Agra"),
    "prayagraj": ("Uttar Pradesh", "Prayagraj", "Prayagraj"),
    "allahabad": ("Uttar Pradesh", "Prayagraj", "Allahabad"),
    "noida": ("Uttar Pradesh", "Gautam Buddha Nagar", "Noida"),
    "ghaziabad": ("Uttar Pradesh", "Ghaziabad", "Ghaziabad"),
    "meerut": ("Uttar Pradesh", "Meerut", "Meerut"),
    "gorakhpur": ("Uttar Pradesh", "Gorakhpur", "Gorakhpur"),

    # Bihar
    "phulparas": ("Bihar", "Madhubani", "Phulparas"),
    "madhubani": ("Bihar", "Madhubani", "Madhubani"),
    "patna": ("Bihar", "Patna", "Patna"),
    "gaya": ("Bihar", "Gaya", "Gaya"),
    "muzaffarpur": ("Bihar", "Muzaffarpur", "Muzaffarpur"),
    "bhagalpur": ("Bihar", "Bhagalpur", "Bhagalpur"),
    "darbhanga": ("Bihar", "Darbhanga", "Darbhanga"),
    "bikramganj": ("Bihar", "Rohtas", "Bikramganj"),
    "rohtas": ("Bihar", "Rohtas", "Rohtas"),

    # Delhi (NCT)
    "okhla": ("Delhi", "South East Delhi", "Okhla"),
    "okhla phase 3": ("Delhi", "South East Delhi", "Okhla Phase 3"),
    "connaught place": ("Delhi", "New Delhi", "Connaught Place"),
    "dwarka": ("Delhi", "South West Delhi", "Dwarka"),
    "rohini": ("Delhi", "North West Delhi", "Rohini"),
    "saket": ("Delhi", "South Delhi", "Saket"),
    "lajpat nagar": ("Delhi", "South Delhi", "Lajpat Nagar"),
    "chandni chowk": ("Delhi", "Central Delhi", "Chandni Chowk"),

    # Maharashtra
    "mumbai": ("Maharashtra", "Mumbai City", "Mumbai"),
    "pune": ("Maharashtra", "Pune", "Pune"),
    "khed": ("Maharashtra", "Pune", "Khed"),
    "nagpur": ("Maharashtra", "Nagpur", "Nagpur"),
    "nashik": ("Maharashtra", "Nashik", "Nashik"),
    "thane": ("Maharashtra", "Thane", "Thane"),

    # Rajasthan
    "jaipur": ("Rajasthan", "Jaipur", "Jaipur"),
    "mansarovar": ("Rajasthan", "Jaipur", "Mansarovar"),
    "jodhpur": ("Rajasthan", "Jodhpur", "Jodhpur"),
    "udaipur": ("Rajasthan", "Udaipur", "Udaipur"),
    "kota": ("Rajasthan", "Kota", "Kota"),

    # Haryana
    "gurugram": ("Haryana", "Gurugram", "Gurugram"),
    "gurgaon": ("Haryana", "Gurugram", "Gurgaon"),
    "rajeev chowk": ("Haryana", "Gurugram", "Rajeev Chowk"),
    "faridabad": ("Haryana", "Faridabad", "Faridabad"),
    "panipat": ("Haryana", "Panipat", "Panipat"),

    # Tamil Nadu
    "chennai": ("Tamil Nadu", "Chennai", "Chennai"),
    "coimbatore": ("Tamil Nadu", "Coimbatore", "Coimbatore"),
    "madurai": ("Tamil Nadu", "Madurai", "Madurai")
}


class JurisdictionResult(BaseModel):
    state: str = Field(..., description="Canonical state name or 'unspecified'")
    district: str = Field(..., description="Canonical district name or 'unspecified'")
    locality: str = Field(..., description="Specific landmark, ward, village, or 'unspecified'")
    location_str: str = Field(..., description="Formatted location string")
    confidence: str = Field(..., description="'high', 'medium', or 'low'")

    def __getitem__(self, item: str):
        if item == "location":
            return self.location_str
        return getattr(self, item)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "state": self.state,
            "district": self.district,
            "locality": self.locality,
            "location": self.location_str,
            "confidence": self.confidence
        }


def normalize_location(
    complaint_text: str = "",
    state_hint: Optional[str] = None,
    district_hint: Optional[str] = None,
    ai_state: Optional[str] = None,
    ai_district: Optional[str] = None,
    ai_locality: Optional[str] = None,
    ai_location: Optional[str] = None
) -> JurisdictionResult:
    """
    Canonical Location Resolution Engine:
    Resolves jurisdiction strictly based on:
    1. Explicit state/district mentions in complaint text (e.g. 'Hyderabad, Telangana' -> Telangana).
    2. Authoritative citizen form hints (State Hint & District Hint).
    3. Unambiguous city/landmark dictionary matching.
    4. Validated AI extraction (never blindly trusted).
    5. Fallback to 'unspecified' with 'low' confidence when unknown.
    """
    lower_text = complaint_text.lower() if complaint_text else ""

    resolved_state: Optional[str] = None
    resolved_district: Optional[str] = None
    resolved_locality: Optional[str] = None
    confidence = "low"

    # 1. Check for explicit State name in complaint text
    for alias, canon_name in INDIAN_STATES_CANONICAL.items():
        pattern = r'(?<![a-zA-Z])' + re.escape(alias) + r'(?![a-zA-Z])'
        if re.search(pattern, lower_text):
            resolved_state = canon_name
            confidence = "high"
            break

    # 2. Check for canonical city/locality matches in text (longest/most specific first)
    sorted_city_items = sorted(CANONICAL_CITY_DISTRICT_MAP.items(), key=lambda x: len(x[0]), reverse=True)
    for city_key, (c_state, c_dist, c_loc) in sorted_city_items:
        pattern = r'(?<![a-zA-Z])' + re.escape(city_key) + r'(?![a-zA-Z])'
        if re.search(pattern, lower_text):
            if not resolved_state:
                resolved_state = c_state
                resolved_district = c_dist
                resolved_locality = c_loc
                confidence = "high"
            elif resolved_state == c_state:
                if not resolved_district or resolved_district == "unspecified":
                    resolved_district = c_dist
                if not resolved_locality or resolved_locality == "unspecified" or resolved_locality == resolved_district:
                    resolved_locality = c_loc
                confidence = "high"
            break

    # 3. Consider authoritative State Hint & District Hint from form
    if state_hint and state_hint.strip() and state_hint.strip().lower() not in ("unspecified", "all states", "none", "null", "unknown"):
        hint_clean = state_hint.strip().lower()
        if hint_clean in INDIAN_STATES_CANONICAL:
            if not resolved_state:
                resolved_state = INDIAN_STATES_CANONICAL[hint_clean]
                confidence = "high"

    if district_hint and district_hint.strip() and district_hint.strip().lower() not in ("unspecified", "all districts", "none", "null", "unknown"):
        if not resolved_district or resolved_district == "unspecified":
            resolved_district = district_hint.strip()
            confidence = "high"

    # 4. Fallback to validated AI extractions if valid state
    if not resolved_state and ai_state and ai_state.strip().lower() not in ("unspecified", "none", "null", "unknown"):
        ai_st_clean = ai_state.strip().lower()
        if ai_st_clean in INDIAN_STATES_CANONICAL:
            resolved_state = INDIAN_STATES_CANONICAL[ai_st_clean]
            confidence = "medium"

    if (not resolved_district or resolved_district == "unspecified") and ai_district and ai_district.strip().lower() not in ("unspecified", "none", "null", "unknown"):
        resolved_district = ai_district.strip()

    if (not resolved_locality or resolved_locality == "unspecified") and ai_locality and ai_locality.strip().lower() not in ("unspecified", "none", "null", "unknown"):
        resolved_locality = ai_locality.strip()

    # Final defaults
    final_state = resolved_state if resolved_state else "unspecified"
    final_district = resolved_district if resolved_district else "unspecified"
    final_locality = resolved_locality if resolved_locality else "unspecified"

    # Build human-readable formatted location
    parts = []
    if final_locality != "unspecified":
        parts.append(final_locality)
    if final_district != "unspecified" and final_district != final_locality:
        parts.append(final_district)
    if final_state != "unspecified":
        parts.append(final_state)

    if parts:
        formatted_loc = ", ".join(parts)
    else:
        formatted_loc = "unspecified"
        confidence = "low"

    return JurisdictionResult(
        state=final_state,
        district=final_district,
        locality=final_locality,
        location_str=formatted_loc,
        confidence=confidence
    )
