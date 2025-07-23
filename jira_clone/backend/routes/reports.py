from flask import Blueprint
from controllers.report_controller import get_project_report
from flask_jwt_extended import jwt_required

reports_bp = Blueprint('reports', __name__)

@reports_bp.route('/reports/project/<int:project_id>', methods=['GET'])
@jwt_required()
def project_report(project_id):
    return get_project_report(project_id)