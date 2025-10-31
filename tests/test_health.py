from app import create_app

def test_health_check():
    app = create_app()
    client = app.test_client()
    res = client.get("/health")
    assert res.status_code == 200
    assert res.get_json()["ok"] is True
