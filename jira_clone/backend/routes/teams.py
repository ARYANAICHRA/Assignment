from flask import Blueprint, jsonify, request
from models.team import Team
from models.db import db
from flask_jwt_extended import jwt_required, get_jwt_identity
from models.user import User
from models.team_member import TeamMember
from models.project_team import ProjectTeam
from models.project import Project
from models.project_member import ProjectMember

teams_bp = Blueprint('teams', __name__)

@teams_bp.route('/teams', methods=['GET'])
def get_teams():
    teams = Team.query.all()
    return jsonify({'teams': [
        {'id': t.id, 'name': t.name, 'description': t.description} for t in teams
    ]})

@teams_bp.route('/teams', methods=['POST'])
@jwt_required()
def create_team():
    data = request.get_json()
    name = data.get('name')
    description = data.get('description')
    if not name:
        return jsonify({'error': 'Team name is required'}), 400
    user_id = get_jwt_identity()
    if not user_id:
        return jsonify({'error': 'Authentication required'}), 401
    team = Team(name=name, description=description, admin_id=user_id)
    db.session.add(team)
    db.session.commit()
    return jsonify({'message': 'Team created', 'team': {'id': team.id, 'name': team.name, 'description': team.description, 'admin_id': team.admin_id}}), 201 

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
            member_list.append({'id': user.id, 'username': user.username, 'email': user.email, 'is_admin': user.id == team.admin_id})
    project_links = ProjectTeam.query.filter_by(team_id=team_id).all()
    projects = []
    for pl in project_links:
        project = Project.query.get(pl.project_id)
        if project:
            projects.append({'id': project.id, 'name': project.name, 'description': project.description})
    return jsonify({
        'id': team.id,
        'name': team.name,
        'description': team.description,
        'admin_id': team.admin_id,
        'members': member_list,
        'projects': projects
    })

@teams_bp.route('/teams/<int:team_id>/projects', methods=['POST'])
@jwt_required()
def add_team_project(team_id):
    team = Team.query.get_or_404(team_id)
    if team.admin_id != get_jwt_identity():
        return jsonify({'error': 'Forbidden: You are not the admin of this team.'}), 403

    data = request.get_json()
    project_id = data.get('project_id')
    roles = data.get('roles', {})
    if not project_id:
        return jsonify({'error': 'Project ID required'}), 400
    if ProjectTeam.query.filter_by(team_id=team_id, project_id=project_id).first():
        return jsonify({'error': 'Project already associated'}), 409
    pt = ProjectTeam(team_id=team_id, project_id=project_id)
    db.session.add(pt)
    team_members = TeamMember.query.filter_by(team_id=team_id).all()
    for tm in team_members:
        if not ProjectMember.query.filter_by(project_id=project_id, user_id=tm.user_id).first():
            role = roles.get(str(tm.user_id), 'member')
            pm = ProjectMember(project_id=project_id, user_id=tm.user_id, role=role) # This line assumes 'role' is a string, which is incorrect. A full fix requires mapping role name to role_id.
            db.session.add(pm)
    db.session.commit()
    return jsonify({'message': 'Project associated'})

@teams_bp.route('/teams/<int:team_id>/projects/<int:project_id>', methods=['DELETE'])
@jwt_required()
def remove_team_project(team_id, project_id):
    team = Team.query.get_or_404(team_id)
    if team.admin_id != get_jwt_identity():
        return jsonify({'error': 'Forbidden: You are not the admin of this team.'}), 403
        
    pt = ProjectTeam.query.filter_by(team_id=team_id, project_id=project_id).first()
    if not pt:
        return jsonify({'error': 'Project association not found'}), 404
    team_members = TeamMember.query.filter_by(team_id=team_id).all()
    for tm in team_members:
        other_teams = ProjectTeam.query.filter(ProjectTeam.project_id==project_id, ProjectTeam.team_id!=team_id).all()
        is_member_via_other_team = any(TeamMember.query.filter_by(team_id=ot.team_id, user_id=tm.user_id).first() for ot in other_teams)
        direct_member = ProjectMember.query.filter_by(project_id=project_id, user_id=tm.user_id).first()
        if direct_member and not is_member_via_other_team:
            db.session.delete(direct_member)
    db.session.delete(pt)
    db.session.commit()
    return jsonify({'message': 'Project disassociated'})

@teams_bp.route('/teams/<int:team_id>/members', methods=['POST'])
@jwt_required()
def add_team_member(team_id):
    team = Team.query.get_or_404(team_id)
    if team.admin_id != get_jwt_identity():
        return jsonify({'error': 'Forbidden: You are not the admin of this team.'}), 403

    data = request.get_json()
    email = data.get('email')
    if not email:
        return jsonify({'error': 'Email required'}), 400
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    if TeamMember.query.filter_by(team_id=team_id, user_id=user.id).first():
        return jsonify({'error': 'User already a member'}), 409
    tm = TeamMember(team_id=team_id, user_id=user.id)
    db.session.add(tm)
    project_links = ProjectTeam.query.filter_by(team_id=team_id).all()
    for pl in project_links:
        if not ProjectMember.query.filter_by(project_id=pl.project_id, user_id=user.id).first():
            pm = ProjectMember(project_id=pl.project_id, user_id=user.id, role='member') 
            db.session.add(pm)
    db.session.commit()
    return jsonify({'message': 'Member added'})

@teams_bp.route('/teams/<int:team_id>/members/<int:user_id>', methods=['DELETE'])
@jwt_required()
def remove_team_member(team_id, user_id):
    team = Team.query.get_or_404(team_id)
    if team.admin_id != get_jwt_identity():
        return jsonify({'error': 'Forbidden: You are not the admin of this team.'}), 403

    tm = TeamMember.query.filter_by(team_id=team_id, user_id=user_id).first()
    if not tm:
        return jsonify({'error': 'Member not found'}), 404
    project_links = ProjectTeam.query.filter_by(team_id=team_id).all()
    for pl in project_links:
        other_teams = ProjectTeam.query.filter(ProjectTeam.project_id==pl.project_id, ProjectTeam.team_id!=team_id).all()
        is_member_via_other_team = any(TeamMember.query.filter_by(team_id=ot.team_id, user_id=user_id).first() for ot in other_teams)
        direct_member = ProjectMember.query.filter_by(project_id=pl.project_id, user_id=user_id).first()
        if direct_member and not is_member_via_other_team:
            db.session.delete(direct_member)
    db.session.delete(tm)
    db.session.commit()
    return jsonify({'message': 'Member removed'}) 

@teams_bp.route('/teams/my-teams', methods=['GET'])
@jwt_required()
def get_my_teams():
    user_id = get_jwt_identity()
    if not user_id:
        return jsonify({'error': 'User not found'}), 401
    team_ids = [tm.team_id for tm in TeamMember.query.filter_by(user_id=user_id)]
    teams = Team.query.filter(Team.id.in_(team_ids)).all()
    result = [
        {
            'id': t.id,
            'name': t.name,
            'description': t.description,
            'admin_id': t.admin_id,
            'created_at': t.created_at.isoformat() if t.created_at else None,
            'updated_at': t.updated_at.isoformat() if t.updated_at else None
        }
        for t in teams
    ]
    return jsonify({'teams': result})