import json
import os
import shutil
import subprocess
from flask import Flask, jsonify,  send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
import requests
from apscheduler.schedulers.background import BackgroundScheduler
from requests.auth import HTTPBasicAuth

app = Flask(__name__, static_folder=os.path.join(os.getcwd(), 'jira', 'dist', 'jira'))
CORS(app)
load_dotenv()

JIRA_USER = os.getenv("Jira_User")
JIRA_API_TOKEN = os.getenv("Jira_Api_Token")

tickets_data = []  # Lista para almacenar los tickets filtrados


def get_jira_tickets():
    """Obtiene los tickets de JIRA y filtra solo los campos personalizados requeridos."""
    jira_url = "https://grupo-orbe.atlassian.net/rest/api/2/search?jql=project=%20%22TEST%20-%20MERGE%22%0A&maxResults=15"
    headers = {"Accept": "application/json"}
    auth = HTTPBasicAuth(JIRA_USER, JIRA_API_TOKEN)

    try:
        response = requests.get(jira_url, headers=headers, auth=auth)

        if response.status_code != 200:
            print(f"Error al obtener tickets: {response.status_code}")
            return

        tickets = response.json()

        if not tickets.get("issues"):
            print("No se encontraron tickets.")
            return

        processed_tickets = []
        for issue in tickets.get("issues", []):
            fields = issue.get("fields", {})

            ticket_info = {
                "key": issue.get("key"),
                "status": fields.get("status", {}).get("name"),
                "prioridad": fields.get("priority", {}).get("name"),
                "herramienta": fields.get("customfield_10178"),    # Herramienta
                "organizacion": fields.get("customfield_10179"),  # Organización
                "hora": fields.get("created")
            }

            processed_tickets.append(ticket_info)

        global tickets_data
        tickets_data = processed_tickets
        print(json.dumps(tickets_data, indent=4, ensure_ascii=False))  # Imprimir para depuración

    except requests.exceptions.RequestException as e:
        print(f"Error en la solicitud: {e}")


# **Actualizar los tickets cada minuto**
scheduler = BackgroundScheduler()
scheduler.add_job(get_jira_tickets, 'interval', minutes=1)
scheduler.start()


# **Endpoint para obtener los tickets filtrados**
@app.route('/api/jira/tickets', methods=['GET'])
def get_tickets():
    return jsonify({"tickets": tickets_data})

@app.route('/', defaults={'path': 'index.html'})
@app.route('/<path:path>')
def serve_static(path):
    return send_from_directory(app.static_folder, path)

# Iniciar la aplicación
if __name__ == '__main__':

    get_jira_tickets()
    app.run(debug=True, host='0.0.0.0', port=5000)
