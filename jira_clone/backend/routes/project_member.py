from flask import Blueprint, request
from controllers.project_member_controller import (
    add_member, remove_member, list_members, update_member_role, request_to_join_project,
    list_join_requests, accept_join_request, reject_join_request, list_my_invitations, accept_invitation, reject_invitation
)
from controllers.jwt_utils import jwt_required

project_member_bp = Blueprint('project_member', __name__)

@project_member_bp.route('/projects/<int:project_id>/members', methods=['POST'])
@jwt_required
def add_member_route(project_id):
    return add_member(project_id)

@project_member_bp.route('/projects/<int:project_id>/members', methods=['GET'])
@jwt_required
def list_members_route(project_id):
    return list_members(project_id)

@project_member_bp.route('/projects/<int:project_id>/join-request', methods=['POST'])
@jwt_required
def request_to_join_project_route(project_id):
    user_id = request.user.id
    return request_to_join_project(project_id, user_id)

@project_member_bp.route('/projects/<int:project_id>/join-requests', methods=['GET'])
@jwt_required
def list_join_requests_route(project_id):
    return list_join_requests(project_id)

@project_member_bp.route('/projects/<int:project_id>/join-request/<int:request_id>/accept', methods=['POST'])
@jwt_required
def accept_join_request_route(project_id, request_id):
    return accept_join_request(project_id, request_id)

@project_member_bp.route('/projects/<int:project_id>/join-request/<int:request_id>/reject', methods=['POST'])
@jwt_required
def reject_join_request_route(project_id, request_id):
    return reject_join_request(project_id, request_id)

@project_member_bp.route('/my-invitations', methods=['GET'])
@jwt_required
def list_my_invitations_route():
    user_id = request.user.id
    return list_my_invitations(user_id)

@project_member_bp.route('/projects/<int:project_id>/invitation/<int:invite_id>/accept', methods=['POST'])
@jwt_required
def accept_invitation_route(project_id, invite_id):
    user_id = request.user.id
    return accept_invitation(project_id, invite_id, user_id)

@project_member_bp.route('/projects/<int:project_id>/invitation/<int:invite_id>/reject', methods=['POST'])
@jwt_required
def reject_invitation_route(project_id, invite_id):
    user_id = request.user.id
    return reject_invitation(project_id, invite_id, user_id)

@project_member_bp.route('/projects/<int:project_id>/members/<int:user_id>', methods=['DELETE', 'PATCH'])
@jwt_required
def member_detail(project_id, user_id):
    if request.method == 'DELETE':
        return remove_member(project_id, user_id)
    elif request.method == 'PATCH':
        return update_member_role(project_id, user_id)
    else:
        return {'error': 'Method not allowed'}, 405
