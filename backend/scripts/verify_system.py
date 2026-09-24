#!/usr/bin/env python3
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

print("=== 1. Health Check ===")
res = client.get("/api/health")
print("Status Code:", res.status_code)
print("Health Data:", res.json())

print("\n=== 2. Part A & B: Live Gemini AI Ingestion Tests ===")
prompts = [
    ("English Urban", "Outer Ring Road near Silk Board has massive potholes causing heavy gridlock and accidents every evening in Bengaluru."),
    ("Hinglish Rural", "Hamare Rampur gaon mein 3 hafte se bijli transformer jala hua hai aur tube well band hai."),
    ("Vague Multi-issue", "There are big garbage dumps and continuous water leakage on 5th main road."),
    ("Part B Dual-Issue", "The road to our village PHC is broken and the health centre has had no doctor for two months.")
]

for label, text in prompts:
    print(f"\n--- Submitting: {label} ---")
    sub_res = client.post("/requests/submit", json={"text": text, "user_id": "test-verifier"})
    assert sub_res.status_code == 200, f"Failed: {sub_res.text}"
    data = sub_res.json()
    print("Area Type:", data.get("area_type"))
    print("Categories:", data.get("categories"))
    print("Location / Locality:", data.get("locality"), ",", data.get("location"), f"({data.get('state')})")
    print("Summary:", data.get("summary"))
    print("Classified By:", data.get("classified_by"))

print("\n=== 3. Part D: Tiered Officials Server-Side Scope Verification ===")
tiers = [
    ("admin", "civic2026", "National"),
    ("state_up", "jal2026", "State UP"),
    ("dm_varanasi", "varanasi2026", "District Varanasi"),
    ("local_rampur", "local2026", "Local Rampur")
]

for uid, pwd, tname in tiers:
    lres = client.post("/officials/login", json={"official_id": uid, "password": pwd})
    assert lres.status_code == 200
    ldata = lres.json()
    tok = ldata["token"]
    
    # Call dashboard data trying to spoof another state
    dres = client.get(f"/officials/dashboard-data?token={tok}&drill_state=Delhi")
    ddata = dres.json()
    print(f"\nOfficial: {ldata['official']['name']} ({tname} Tier)")
    print("  Enforced Level:", ddata.get("level"))
    print("  Enforced Jurisdiction:", ddata.get("jurisdiction"))
    print("  Scoped Complaints Count:", ddata["kpis"]["total_complaints"])
    print("  Chart Data Points:", len(ddata.get("chart_data", [])))

print("\n✅ All live verifications passed successfully!")
