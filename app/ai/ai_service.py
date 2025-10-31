import openai
import os

openai.api_key = os.getenv("OPENAI_API_KEY")

def gerar_resumo_regulatorio(texto):
    """Usa a API OpenAI para gerar um resumo técnico-regulatório."""
    try:
        resposta = openai.ChatCompletion.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Você é um analista técnico da área de mineração."},
                {"role": "user", "content": f"Resuma tecnicamente o seguinte texto:\n{texto}"}
            ],
            temperature=0.3,
            max_tokens=500
        )
        return resposta.choices[0].message.content.strip()
    except Exception as e:
        return f"Erro ao gerar resumo: {e}"
