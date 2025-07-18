from flask import Blueprint
from controllers.report_controller import get_project_report

reports_bp = Blueprint('reports', __name__)

@reports_bp.route('/reports/project/<int:project_id>', methods=['GET'])
def project_report(project_id):
    return get_project_report(project_id) 