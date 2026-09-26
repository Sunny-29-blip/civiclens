"""
CivicLens Priority Score Calculation Service (0–100 Integer System).
Provides deterministic, explainable, and integer-clamped governance priority scores
for citizen complaints based on urgency, safety hazards, multi-issue complexity, and persistence.
"""

import re
from typing import List, Tuple, Dict, Any


def calculate_priority_score(
    urgency: str,
    categories: List[str],
    raw_text: str = "",
    support_count: int = 1
) -> Tuple[int, str]:
    """
    Computes an intuitive 0–100 integer priority score and human-readable explanation.
    
    Factors:
    - Base Urgency: High = 45, Medium = 25, Low = 10
    - Safety / Accident / Health Hazard: +25
    - Multi-Issue Breadth: +10 per additional category (2 cats = +10, 3 cats = +20)
    - Persistence / Duration: +10
    - Public Support Weight: +1 per support vote (max +10)
    - Clamped strictly: 0 <= score <= 100
    """
    score = 0
    reasons: List[str] = []

    # 1. Base Urgency
    urgency_lower = urgency.lower()
    if urgency_lower == "high":
        score += 45
        reasons.append("High urgency")
    elif urgency_lower == "medium":
        score += 25
        reasons.append("Medium disruption")
    else:
        score += 10
        reasons.append("Low maintenance")

    lower_text = raw_text.lower() if raw_text else ""

    # 2. Safety Hazard & Critical Health/Life Risk
    safety_keywords = [
        "accident", "accidents", "crater", "danger", "dangerous", "hazard",
        "spark", "fire", "aag", "khatra", "emergency", "hospital", "doctor",
        "toxic", "sewer leak", "collapsed", "death", "two-wheeler", "pedestrian"
    ]
    if any(k in lower_text for k in safety_keywords):
        score += 25
        reasons.append("immediate safety/health hazard")

    # 3. Multi-Issue Complexity
    num_cats = len(categories) if categories else 1
    if num_cats >= 3:
        score += 20
        reasons.append(f"{num_cats} compound civic failures")
    elif num_cats == 2:
        score += 10
        reasons.append("dual co-occurring issues")

    # 4. Persistence / Long-Running Disruption
    persistence_keywords = [
        "daily", "2-hour", "2 hour", "hours", "weeks", "months", "hafte", "mahine",
        "persistent", "recurring", "frequent", "regularly", "years", "pichle"
    ]
    if any(k in lower_text for k in persistence_keywords):
        score += 10
        reasons.append("recurring daily disruption")

    # 5. Public Support Contribution (capped at 10)
    if support_count > 1:
        support_bonus = min(10, int(support_count))
        score += support_bonus
        if support_bonus >= 5:
            reasons.append(f"backed by {support_count} citizen supports")

    # Strict clamping: 0 <= score <= 100
    final_score = max(0, min(100, int(score)))

    # Construct explanation string
    reason_str = " + ".join(reasons) if reasons else "Standard community reporting"
    explanation = f"Priority: {final_score}/100 · {reason_str.capitalize()}."

    return final_score, explanation
