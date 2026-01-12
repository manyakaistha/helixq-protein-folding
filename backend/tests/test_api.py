"""Automated test suite for FastAPI backend endpoints."""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

TEST_SEQ = "MVLSPADKTNVKAAWGKVGAHAGEYGAEALERMFLSFPTTKTYFPHFDLSHGSAQVKGHGKKVADALTNAVAHVDDMPNALSALSDLHAHKLRVDPVNFKLLSHCLLVTLAAHLPAEFTPAVHASLDKFLASVSTVLTSKYR"


def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "online"


def test_health_and_readiness():
    res_health = client.get("/api/v1/health")
    assert res_health.status_code == 200
    assert res_health.json()["status"] == "healthy"
    assert res_health.json()["model_loaded"] is True

    res_ready = client.get("/api/v1/ready")
    assert res_ready.status_code == 200
    assert res_ready.json()["status"] == "ready"


def test_model_info():
    response = client.get("/api/v1/model/info")
    assert response.status_code == 200
    data = response.json()
    assert data["historical_competition_score"] == 0.4910
    assert data["parameters"] > 6000000
    assert len(data["q8_classes"]) == 8
    assert len(data["q3_classes"]) == 3


def test_predict_single():
    payload = {
        "sequence": TEST_SEQ,
        "id": "human_alpha_globin",
        "return_probabilities": True,
        "return_attention": False
    }
    response = client.post("/api/v1/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "human_alpha_globin"
    assert data["length"] == len(TEST_SEQ)
    assert len(data["q8"]) == len(TEST_SEQ)
    assert len(data["q3"]) == len(TEST_SEQ)
    assert len(data["residues"]) == len(TEST_SEQ)

    # Validate first residue schema
    first_res = data["residues"][0]
    assert first_res["position"] == 1
    assert first_res["amino_acid"] == "M"
    assert first_res["q8_state"] in ["B", "C", "E", "G", "H", "I", "S", "T"]
    assert first_res["q3_state"] in ["C", "E", "H"]
    assert 0.0 <= first_res["q8_probability"] <= 1.0


def test_predict_batch():
    payload = {
        "sequences": [
            {"id": "seq1", "sequence": "ACDEFGHIKLMNPQRSTVWY"},
            {"id": "seq2", "sequence": "YVTSQPNMLKIHGFEDCA"}
        ],
        "return_probabilities": False
    }
    response = client.post("/api/v1/predict/batch", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["total_sequences"] == 2
    assert data["successful"] == 2
    assert len(data["results"]) == 2


def test_analysis_endpoint():
    payload = {"sequence": TEST_SEQ, "id": "globin"}
    response = client.post("/api/v1/analyze", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "q3_composition" in data
    assert "q8_composition" in data
    assert "consistency" in data
    assert data["consistency"]["agreement_percentage"] > 70.0
    assert "longest_helix_length" in data["summary"]
    assert data["summary"]["longest_helix_length"] > 0


def test_fasta_parser_endpoint():
    fasta_text = ">seqA Alpha protein\nMVLSPADKTN\nVKAAWGKVGA\n>seqB Beta protein\nQANQIQDQTG\n"
    response = client.post("/api/v1/parse/fasta", json={"content": fasta_text})
    assert response.status_code == 200
    records = response.json()
    assert len(records) == 2
    assert records[0]["id"] == "seqA"
    assert records[0]["length"] == 20
    assert records[1]["id"] == "seqB"
    assert records[1]["length"] == 10


def test_export_endpoint():
    results = [
        {"id": "seq_1", "sequence": "ACDEF", "q8": "CCHHH", "q3": "CCHHH", "length": 5}
    ]
    # Test CSV
    r_csv = client.post("/api/v1/export", json={"format": "csv", "results": results})
    assert r_csv.status_code == 200
    assert "seq_1,CCHHH,CCHHH,5" in r_csv.text

    # Test FASTA
    r_fa = client.post("/api/v1/export", json={"format": "fasta", "results": results})
    assert r_fa.status_code == 200
    assert ">seq_1 | AA Sequence" in r_fa.text

    # Test JSON
    r_json = client.post("/api/v1/export", json={"format": "json", "results": results})
    assert r_json.status_code == 200
    assert "CCHHH" in r_json.text
