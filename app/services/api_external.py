import requests

def consultar_api_anm(codigo_projeto):
    """Simulação de integração com a API da ANM."""
    try:
        response = requests.get(f"https://api.exemplo-anm.gov/{codigo_projeto}")
        if response.status_code == 200:
            return response.json()
        return {"erro": "Falha na consulta ANM", "status_code": response.status_code}
    except Exception as e:
        return {"erro": str(e)}
