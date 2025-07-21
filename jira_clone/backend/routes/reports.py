from flask import Blueprint
from controllers.report_controller import get_project_report
from controllers.jwt_utils import jwt_required # Import jwt_required

reports_bp = Blueprint('reports', __name__)

# --- FIX: Secure this route with authentication ---
@reports_bp.route('/reports/project/<int:project_id>', methods=['GET'])
@jwt_required
def project_report(project_id):
    return get_project_report(project_id)