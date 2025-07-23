from flask import Blueprint, jsonify, request
from models.team import Team
from models.db import db
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.user import User
from models.team_member import TeamMember
from models.project import Project
from models.project_member import ProjectMember
from models.role import Role
from controllers.rbac import is_admin
from datetime import datetime
import logging
logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)
logger.propagate = True

teams_bp = Blueprint('teams', __name__)

# --- TeamManagerRequest Model ---
from sqlalchemy import Column, Integer, ForeignKey, String, DateTime
from models.db import db as _db
class TeamManagerRequest(_db.Model):
    __tablename__ = 'team_manager_request'
    id = Column(Integer, primary_key=True)
    team_id = Column(Integer, ForeignKey('team.id'), nullable=False)
    user_id = Column(Integer, ForeignKey('user.id'), nullable=False)
    status = Column(String(20), default='pending')  # pending, accepted, rejected
    created_at = Column(DateTime, default=datetime.utcnow)

# --- Notification helper ---
def create_notification(user_id, message):
    from models.notification import Notification
    notif = Notification(user_id=user_id, message=message)
    db.session.add(notif)
    db.session.commit()

# --- Request to be manager ---
@teams_bp.route('/teams/<int:team_id>/manager-request', methods=['POST'])
@jwt_required()
def request_manager(team_id):
    user_id = int(get_jwt_identity())
    team = Team.query.get(team_id)
    if not team:
        return jsonify({'error': 'Team not found'}), 404
    if team.manager_id == user_id:
        return jsonify({'error': 'You are already the manager'}), 400
    if TeamManagerRequest.query.filter_by(team_id=team_id, user_id=user_id, status='pending').first():
        return jsonify({'error': 'Request already pending'}), 409
    req = TeamManagerRequest(team_id=team_id, user_id=user_id, status='pending')
    db.session.add(req)
    db.session.commit()
    # Notify current manager and firm admin
    create_notification(team.manager_id, f"User {user_id} requested to become manager of team {team_id}.")
    admin_user = User.query.filter_by(email='admin@example.com').first()
    if admin_user:
        create_notification(admin_user.id, f"User {user_id} requested to become manager of team {team_id}.")
    return jsonify({'message': 'Request submitted'}), 200

# --- List manager requests (admin/manager only) ---
@teams_bp.route('/teams/<int:team_id>/manager-requests', methods=['GET'])
@jwt_required()
def list_manager_requests(team_id):
    logger.debug(f"[list_manager_requests] Called for team_id={team_id}")
    print(f"[list_manager_requests] Called for team_id={team_id}")
    user_id = int(get_jwt_identity())
    team = Team.query.get(team_id)
    if not team:
        logger.warning(f"[list_manager_requests] Team not found: team_id={team_id}")
        return jsonify({'error': 'Team not found'}), 404
    if not (is_admin(user_id) or team.manager_id == user_id):
        logger.warning(f"[list_manager_requests] Forbidden: user_id={user_id}, team.manager_id={team.manager_id}, is_admin={is_admin(user_id)}")
        return jsonify({'error': 'Forbidden'}), 403
    reqs = TeamManagerRequest.query.filter_by(team_id=team_id, status='pending').all()
    result = []
    for r in reqs:
        user = User.query.get(r.user_id)
        result.append({'id': r.id, 'user_id': r.user_id, 'username': user.username if user else None, 'email': user.email if user else None, 'created_at': r.created_at.isoformat(), 'status': r.status})
    return jsonify({'requests': result}), 200

# --- Accept manager request ---
@teams_bp.route('/teams/<int:team_id>/manager-requests/<int:request_id>/accept', methods=['POST'])
@jwt_required()
def accept_manager_request(team_id, request_id):
    user_id = int(get_jwt_identity())
    team = Team.query.get(team_id)
    if not team:
        return jsonify({'error': 'Team not found'}), 404
    if not (is_admin(user_id) or team.manager_id == user_id):
        return jsonify({'error': 'Forbidden'}), 403
    req = TeamManagerRequest.query.filter_by(id=request_id, team_id=team_id, status='pending').first()
    if not req:
        return jsonify({'error': 'Request not found'}), 404
    # Transfer manager
    manager_role = Role.query.filter_by(name='Team Manager', scope='team').first()
    member_role = Role.query.filter_by(name='Team Member', scope='team').first()
    # Demote all other managers
    for m in TeamMember.query.filter_by(team_id=team_id).all():
        if m.user_id != req.user_id and m.role_id == manager_role.id:
            m.role_id = member_role.id
    team.manager_id = req.user_id
    # Promote requester
    tm = TeamMember.query.filter_by(team_id=team_id, user_id=req.user_id).first()
    if tm:
        tm.role_id = manager_role.id
    req.status = 'accepted'
    db.session.commit()
    create_notification(req.user_id, f"Your request to become manager of team {team_id} was accepted.")
    return jsonify({'message': 'Manager transferred'}), 200

# --- Reject manager request ---
@teams_bp.route('/teams/<int:team_id>/manager-requests/<int:request_id>/reject', methods=['POST'])
@jwt_required()
def reject_manager_request(team_id, request_id):
    user_id = int(get_jwt_identity())
    team = Team.query.get(team_id)
    if not team:
        return jsonify({'error': 'Team not found'}), 404
    if not (is_admin(user_id) or team.manager_id == user_id):
        return jsonify({'error': 'Forbidden'}), 403
    req = TeamManagerRequest.query.filter_by(id=request_id, team_id=team_id, status='pending').first()
    if not req:
        return jsonify({'error': 'Request not found'}), 404
    req.status = 'rejected'
    db.session.commit()
    create_notification(req.user_id, f"Your request to become manager of team {team_id} was rejected.")
    return jsonify({'message': 'Request rejected'}), 200

@teams_bp.route('/teams', methods=['GET'])
def get_teams():
    teams = Team.query.all()
    return jsonify({'teams': [
        {'id': t.id, 'name': t.name, 'description': t.description} for t in teams
    ]}), 200

@teams_bp.route('/teams', methods=['POST'])
@jwt_required()
def create_team():
    user_id = int(get_jwt_identity())
    from controllers.rbac import is_admin
    if not is_admin(user_id):
        return jsonify({'error': 'Forbidden: Admins only'}), 403
    data = request.get_json()
    name = data.get('name')
    description = data.get('description')
    if not name:
        return jsonify({'error': 'Team name is required'}), 400
    team = Team(name=name, description=description, manager_id=user_id)
    db.session.add(team)
    db.session.commit()
    return jsonify({'message': 'Team created', 'team': {'id': team.id, 'name': team.name, 'description': team.description, 'manager_id': team.manager_id}}), 201

@teams_bp.route('/teams/<int:team_id>', methods=['GET'])
@jwt_required()
def get_team(team_id):
    team = Team.query.get(team_id)
    if not team:
        return jsonify({'error': 'Team not found'}), 404
    members = TeamMember.query.filter_by(team_id=team_id).all()
    member_list = []
    for m in members:
        user = User.query.get(m.user_id)
        if user:
            member_list.append({'id': user.id, 'username': user.username, 'email': user.email, 'is_manager': user.id == team.manager_id})
    # project_links = ProjectTeam.query.filter_by(team_id=team_id).all() # This line is removed as ProjectTeam is no longer imported.
    # projects = [] # This line is removed as ProjectTeam is no longer imported.
    # for pl in project_links: # This line is removed as ProjectTeam is no longer imported.
    #     project = Project.query.get(pl.project_id) # This line is removed as ProjectTeam is no longer imported.
    #     if project: # This line is removed as ProjectTeam is no longer imported.
    #         projects.append({'id': project.id, 'name': project.name, 'description': project.description}) # This line is removed as ProjectTeam is no longer imported.
    return jsonify({
        'id': team.id,
        'name': team.name,
        'description': team.description,
        'manager_id': team.manager_id,
        'members': member_list,
        # 'projects': projects # This line is removed as ProjectTeam is no longer imported.
    }), 200

@teams_bp.route('/teams/<int:team_id>/projects', methods=['POST'])
@jwt_required()
def add_team_project(team_id):
    team = Team.query.get_or_404(team_id)
    user_id = int(get_jwt_identity())
    if team.manager_id != user_id and not is_admin(user_id):
        return jsonify({'error': 'Forbidden: You are not the manager of this team.'}), 403

    data = request.get_json()
    project_id = data.get('project_id')
    roles = data.get('roles', {})
    if not project_id:
        return jsonify({'error': 'Project ID required'}), 400
    # if ProjectTeam.query.filter_by(team_id=team_id, project_id=project_id).first(): # This line is removed as ProjectTeam is no longer imported.
    #     return jsonify({'error': 'Project already associated'}), 409 # This line is removed as ProjectTeam is no longer imported.
    # pt = ProjectTeam(team_id=team_id, project_id=project_id) # This line is removed as ProjectTeam is no longer imported.
    # db.session.add(pt) # This line is removed as ProjectTeam is no longer imported.
    team_members = TeamMember.query.filter_by(team_id=team_id).all()
    for tm in team_members:
        if not ProjectMember.query.filter_by(project_id=project_id, user_id=tm.user_id).first():
            role_name = roles.get(str(tm.user_id), 'member')
            # Look up the project role by name and scope
            role_obj = Role.query.filter_by(name=role_name, scope='project').first()
            if not role_obj:
                return jsonify({'error': f'Role {role_name} not found for project scope'}), 400
            pm = ProjectMember(project_id=project_id, user_id=tm.user_id, role_id=role_obj.id)
            db.session.add(pm)
    db.session.commit()
    return jsonify({'message': 'Project associated'}), 200

@teams_bp.route('/teams/<int:team_id>/projects/<int:project_id>', methods=['DELETE'])
@jwt_required()
def remove_team_project(team_id, project_id):
    team = Team.query.get_or_404(team_id)
    user_id = int(get_jwt_identity())
    if team.manager_id != user_id and not is_admin(user_id):
        return jsonify({'error': 'Forbidden: You are not the manager of this team.'}), 403
        
    # pt = ProjectTeam.query.filter_by(team_id=team_id, project_id=project_id).first() # This line is removed as ProjectTeam is no longer imported.
    # if not pt: # This line is removed as ProjectTeam is no longer imported.
    #     return jsonify({'error': 'Project association not found'}), 404 # This line is removed as ProjectTeam is no longer imported.
    team_members = TeamMember.query.filter_by(team_id=team_id).all()
    for tm in team_members:
        # other_teams = ProjectTeam.query.filter(ProjectTeam.project_id==project_id, ProjectTeam.team_id!=team_id).all() # This line is removed as ProjectTeam is no longer imported.
        # is_member_via_other_team = any(TeamMember.query.filter_by(team_id=ot.team_id, user_id=tm.user_id).first() for ot in other_teams) # This line is removed as ProjectTeam is no longer imported.
        direct_member = ProjectMember.query.filter_by(project_id=project_id, user_id=tm.user_id).first()
        if direct_member: # This line is removed as ProjectTeam is no longer imported.
            db.session.delete(direct_member)
    # db.session.delete(pt) # This line is removed as ProjectTeam is no longer imported.
    db.session.commit()
    return jsonify({'message': 'Project disassociated'}), 200

@teams_bp.route('/teams/<int:team_id>/members', methods=['POST'])
@jwt_required()
def add_team_member(team_id):
    team = Team.query.get_or_404(team_id)
    user_id = int(get_jwt_identity())
    # Allow team admin or manager to add members
    is_team_manager = team.manager_id == user_id
    manager_role = Role.query.filter_by(name='Team Manager', scope='team').first()
    is_manager = False
    if manager_role:
        tm = TeamMember.query.filter_by(team_id=team_id, user_id=user_id, role_id=manager_role.id).first()
        is_manager = tm is not None
    logger.debug(f"[add_team_member] user_id={user_id}, team_id={team_id}, is_team_manager={is_team_manager}, is_manager={is_manager}, is_admin={is_admin(user_id)}")
    if not (is_team_manager or is_manager or is_admin(user_id)):
        logger.warning(f"[add_team_member] 403 Forbidden for user_id={user_id} on team_id={team_id}")
        return jsonify({'error': 'Forbidden: Only team admins or managers can add members.'}), 403

    data = request.get_json()
    email = data.get('email')
    if not email:
        return jsonify({'error': 'Email required'}), 400
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    if TeamMember.query.filter_by(team_id=team_id, user_id=user.id).first():
        return jsonify({'error': 'User already a member'}), 409
    tm = TeamMember(team_id=team_id, user_id=user.id, role_id=None)  # Will set below
    # Assign default team role if not provided
    team_role = Role.query.filter_by(name='Team Member', scope='team').first()
    if not team_role:
        return jsonify({'error': 'Default team role not found'}), 400
    tm.role_id = team_role.id
    db.session.add(tm)
    # project_links = ProjectTeam.query.filter_by(team_id=team_id).all() # This line is removed as ProjectTeam is no longer imported.
    for pl in Project.query.filter_by(owner_team_id=team_id).all(): # This line is changed to use Project directly.
        if not ProjectMember.query.filter_by(project_id=pl.id, user_id=user.id).first(): # This line is changed to use Project directly.
            # Assign default project role
            project_role = Role.query.filter_by(name='Project Contributor', scope='project').first()
            if not project_role:
                return jsonify({'error': 'Default project role not found'}), 400
            pm = ProjectMember(project_id=pl.id, user_id=user.id, role_id=project_role.id)
            db.session.add(pm)
    db.session.commit()
    return jsonify({'message': 'Member added'}), 200

@teams_bp.route('/teams/<int:team_id>/members/<int:user_id>', methods=['DELETE'])
@jwt_required()
def remove_team_member(team_id, user_id):
    team = Team.query.get_or_404(team_id)
    current_user_id = int(get_jwt_identity())
    # Allow team admin or manager to remove members
    is_team_manager = team.manager_id == current_user_id
    manager_role = Role.query.filter_by(name='Team Manager', scope='team').first()
    is_manager = False
    if manager_role:
        tm = TeamMember.query.filter_by(team_id=team_id, user_id=current_user_id, role_id=manager_role.id).first()
        is_manager = tm is not None
    logger.debug(f"[remove_team_member] user_id={current_user_id}, team_id={team_id}, is_team_manager={is_team_manager}, is_manager={is_manager}, is_admin={is_admin(current_user_id)}")
    if not (is_team_manager or is_manager or is_admin(current_user_id)):
        logger.warning(f"[remove_team_member] 403 Forbidden for user_id={current_user_id} on team_id={team_id}")
        return jsonify({'error': 'Forbidden: Only team admins or managers can remove members.'}), 403

    tm = TeamMember.query.filter_by(team_id=team_id, user_id=user_id).first()
    if not tm:
        return jsonify({'error': 'Member not found'}), 404
    # project_links = ProjectTeam.query.filter_by(team_id=team_id).all() # This line is removed as ProjectTeam is no longer imported.
    for pl in Project.query.filter_by(owner_team_id=team_id).all(): # This line is changed to use Project directly.
        # other_teams = ProjectTeam.query.filter(ProjectTeam.project_id==pl.project_id, ProjectTeam.team_id!=team_id).all() # This line is removed as ProjectTeam is no longer imported.
        # is_member_via_other_team = any(TeamMember.query.filter_by(team_id=ot.team_id, user_id=user_id).first() for ot in other_teams) # This line is removed as ProjectTeam is no longer imported.
        direct_member = ProjectMember.query.filter_by(project_id=pl.id, user_id=user_id).first() # This line is changed to use Project directly.
        if direct_member: # This line is removed as ProjectTeam is no longer imported.
            db.session.delete(direct_member)
    db.session.delete(tm)
    db.session.commit()
    return jsonify({'message': 'Member removed'}), 200

@teams_bp.route('/teams/<int:team_id>/my-role', methods=['GET'])
@jwt_required()
def get_my_team_permissions(team_id):
    user_id = int(get_jwt_identity())
    member = TeamMember.query.filter_by(user_id=user_id, team_id=team_id).first()
    if not member or not member.role:
        return jsonify({'permissions': [], 'role': None}), 200
    perms = [p.action for p in member.role.permissions]
    return jsonify({'permissions': perms, 'role': member.role.name}), 200

@teams_bp.route('/teams/<int:team_id>/members/<int:user_id>/role', methods=['PATCH'])
@jwt_required()
def change_team_member_role(team_id, user_id):
    current_user_id = int(get_jwt_identity())
    # Only team manager, users with 'assign_team_role' permission, or firm admin can change roles
    is_team_manager = Team.query.get(team_id).manager_id == current_user_id
    manager_role = Role.query.filter_by(name='Team Manager', scope='team').first()
    member_role = Role.query.filter_by(name='Team Member', scope='team').first()
    is_manager = False
    if manager_role:
        tm = TeamMember.query.filter_by(team_id=team_id, user_id=current_user_id, role_id=manager_role.id).first()
        is_manager = tm is not None
    # Check permission
    has_assign_perm = False
    member = TeamMember.query.filter_by(team_id=team_id, user_id=current_user_id).first()
    if member and member.role and any(p.action == 'assign_team_role' for p in member.role.permissions):
        has_assign_perm = True
    logger.debug(f"[change_team_member_role] user_id={current_user_id}, team_id={team_id}, is_team_manager={is_team_manager}, is_manager={is_manager}, has_assign_perm={has_assign_perm}, is_admin={is_admin(current_user_id)}")
    if not (is_team_manager or is_manager or has_assign_perm or is_admin(current_user_id)):
        logger.warning(f"[change_team_member_role] 403 Forbidden for user_id={current_user_id} on team_id={team_id}")
        return jsonify({'error': 'Forbidden: Only team managers or users with the Team Manager role or assign_team_role permission can change roles.'}), 403
    data = request.get_json()
    role_id = data.get('role_id')
    tm = TeamMember.query.filter_by(team_id=team_id, user_id=user_id).first()
    role = Role.query.get(role_id)
    if not tm or not role or role.scope != 'team':
        return jsonify({'error': 'Invalid membership or role'}), 400
    # If setting to Team Manager, transfer manager_id and demote previous manager
    team = Team.query.get(team_id)
    if role.name == 'Team Manager':
        # Demote all other managers to member
        for m in TeamMember.query.filter_by(team_id=team_id).all():
            if m.user_id != user_id and m.role_id == manager_role.id:
                m.role_id = member_role.id
        team.manager_id = user_id
    tm.role_id = role_id
    db.session.commit()
    return jsonify({'message': 'Team role updated'}), 200

@teams_bp.route('/teams/<int:team_id>', methods=['DELETE'])
@jwt_required()
def delete_team(team_id):
    user_id = int(get_jwt_identity())
    from controllers.rbac import is_admin
    if not is_admin(user_id):
        return jsonify({'error': 'Forbidden: Admins only'}), 403
    team = Team.query.get(team_id)
    if not team:
        return jsonify({'error': 'Team not found'}), 404
    # Delete all team members first to avoid FK constraint
    TeamMember.query.filter_by(team_id=team_id).delete()
    db.session.delete(team)
    db.session.commit()
    return jsonify({'message': 'Team deleted'}), 200

@teams_bp.route('/teams/my-teams', methods=['GET'])
@jwt_required()
def get_my_teams():
    user_id = int(get_jwt_identity())
    if not user_id:
        return jsonify({'error': 'User not found'}), 401
    team_ids = [tm.team_id for tm in TeamMember.query.filter_by(user_id=user_id)]
    teams = Team.query.filter(Team.id.in_(team_ids)).all()
    result = [
        {
            'id': t.id,
            'name': t.name,
            'description': t.description,
            'manager_id': t.manager_id,
            'created_at': t.created_at.isoformat() if t.created_at else None,
            'updated_at': t.updated_at.isoformat() if t.updated_at else None
        }
        for t in teams
    ]
    return jsonify({'teams': result}), 200

@teams_bp.route('/teams/all', methods=['GET'])
@jwt_required()
def get_all_teams():
    user_id = int(get_jwt_identity())
    if not is_admin(user_id):
        return jsonify({"error": "Forbidden: Admins only"}), 403
    
    teams = Team.query.all()
    result = [
        {
            'id': team.id,
            'name': team.name,
            'description': team.description,
            'manager_id': team.manager_id
        } for team in teams
    ]
    return jsonify({'teams': result}), 200

@teams_bp.route('/roles/team', methods=['GET'])
def get_team_roles():
    from models.role import Role
    roles = Role.query.filter_by(scope='team').all()
    return jsonify({'roles': [{'id': r.id, 'name': r.name} for r in roles]}), 200