import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spin, Button, Form, Input, Select, DatePicker, Tag, Avatar, message, Modal, Row, Col, Card, Descriptions, Typography, List } from 'antd';
import { 
  EditOutlined, 
  CommentOutlined,
  UserOutlined, 
  ClockCircleOutlined, 
  RocketOutlined,
  ProfileOutlined,
  CheckOutlined // Import for subtask icon
} from '@ant-design/icons';
import { ProjectContext } from '../context/ProjectContext';
import dayjs from 'dayjs';
import { getTypeIcon, getStatusColor, getPriorityColor } from '../utils/itemUi.jsx';

const { TextArea } = Input;
const { Title, Text } = Typography;

const statusOptions = [
  { value: 'todo', label: 'To Do' },
  { value: 'inprogress', label: 'In Progress' },
  { value: 'inreview', label: 'In Review' },
  { value: 'done', label: 'Done' },
];

function ItemDetail() {
  const { itemId } = useParams();
  const navigate = useNavigate();
  
  const { selectedProject, setSelectedProject, hasProjectPermission, currentUser, projectMembers } = useContext(ProjectContext);

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [commentInput, setCommentInput] = useState('');

  // Set form values when task changes and modal is open
  useEffect(() => {
    if (editModalVisible && task) {
      form.setFieldsValue({
        ...task,
        due_date: task.due_date ? dayjs(task.due_date) : null,
        assignee_id: task.assignee_id || null
      });
    }
  }, [editModalVisible, task, form]);

  useEffect(() => {
    if (itemId) {
      fetchTask();
    }
  }, [itemId]);

  const fetchTask = async () => {
      setLoading(true);
      const token = localStorage.getItem('token');
      try {
        const res = await fetch(`http://localhost:5000/items/${itemId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        setTask(data.item);
        if (data.item?.project_id) {
          if (!selectedProject || selectedProject.id !== data.item.project_id) {
            fetchAndSetProject(data.item.project_id);
          }
        }
    } catch (error) {
      message.error('Failed to fetch task');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchAndSetProject = async (projectId) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:5000/projects/${projectId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) {
        const projectData = await res.json();
        setSelectedProject(projectData.project);
    }
  };

  const handleUpdateTask = async () => {
    // ... update logic
  };

  const handleAddComment = async () => {
    // ... add comment logic
  };

  const canEdit = hasProjectPermission('edit_any_task') || (hasProjectPermission('edit_own_task') && task && (currentUser?.id === task.reporter_id || currentUser?.id === task.assignee_id));

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '40vh auto' }} />;
  if (!task) return <div>Task not found.</div>;
  
  const getAssigneeName = () => {
    if (task.assignee_name) return task.assignee_name;
    const member = projectMembers.find(m => m.user_id === task.assignee_id);
    return member?.username || "Unassigned";
  }

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Title level={2}>{task.title}</Title>
        {canEdit && <Button type="primary" icon={<EditOutlined />} onClick={() => setEditModalVisible(true)}>Edit</Button>}
      </div>
      
      <Row gutter={[24, 24]}>
        <Col xs={24} md={16}>
          <Card title="Description" bordered={false} style={{ marginBottom: 24 }}>
            {task.description || "No description."}
          </Card>

          {/* --- NEW: Subtasks Section --- */}
          {/* This card will only show if the current item is an epic and has subtasks */}
          {task.type === 'epic' && task.subtasks && task.subtasks.length > 0 && (
            <Card title={<span><CheckOutlined /> Subtasks ({task.subtasks.length})</span>} bordered={false} style={{ marginBottom: 24 }}>
              <List
                itemLayout="horizontal"
                dataSource={task.subtasks}
                renderItem={subtask => (
                  <List.Item
                    onClick={() => navigate(`/items/${subtask.id}`)}
                    style={{ cursor: 'pointer', borderRadius: '4px' }}
                    className="hover-bg"
                  >
                    <List.Item.Meta
                      avatar={getTypeIcon(subtask.type)}
                      title={<span style={{ fontWeight: 500 }}>{subtask.title}</span>}
                      description={<Tag color={getStatusColor(subtask.status)}>{subtask.status}</Tag>}
                    />
                  </List.Item>
                )}
              />
            </Card>
          )}
          
          <Card title="Comments" bordered={false}>
            {hasProjectPermission('add_comment') && (
              <div style={{ display: 'flex', marginBottom: 24 }}>
                <Avatar src={currentUser?.avatar} icon={<UserOutlined />} style={{ marginRight: 12 }} />
                <div style={{ flex: 1 }}>
                  <TextArea rows={2} placeholder="Add a comment..." value={commentInput} onChange={e => setCommentInput(e.target.value)} />
                  <Button type="primary" onClick={handleAddComment} disabled={!commentInput.trim()} style={{ marginTop: 8 }}>Comment</Button>
                </div>
              </div>
            )}
            
            <List
              itemLayout="horizontal"
              dataSource={task.comments || []}
              renderItem={comment => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar icon={<UserOutlined />} />}
                    title={comment.author_name}
                    description={
                      <>
                        <div style={{ marginBottom: '4px' }}>{comment.content}</div>
                        <small style={{ color: '#888' }}>{dayjs(comment.created_at).format('MMM D, YYYY, h:mm A')}</small>
                      </>
                    }
                  />
                </List.Item>
              )}
              locale={{ emptyText: "No comments yet." }}
            />
          </Card>
        </Col>

        <Col xs={24} md={8}>
            {/* --- NEW: Parent Epic Section --- */}
            {/* This card will only show if the current task has a parent epic */}
            {task.parent_epic && (
                <Card 
                    bordered={false} 
                    style={{ marginBottom: 24, cursor: 'pointer' }} 
                    onClick={() => navigate(`/items/${task.parent_epic.id}`)}
                    className="hover-bg"
                >
                    <Title level={5}>Parent Epic</Title>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {getTypeIcon('epic')}
                        <Text strong>{task.parent_epic.title}</Text>
                    </div>
                </Card>
            )}

          <Card bordered={false}>
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="Status"><Tag color={getStatusColor(task.status)}>{task.status}</Tag></Descriptions.Item>
              <Descriptions.Item label="Assignee">{getAssigneeName()}</Descriptions.Item>
              <Descriptions.Item label="Reporter">{task.reporter_name}</Descriptions.Item>
              <Descriptions.Item label="Due Date">{task.due_date ? dayjs(task.due_date).format('MMM D, YYYY') : 'None'}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>

      <Modal
        open={editModalVisible}
        title="Edit Task"
        onCancel={() => setEditModalVisible(false)}
        onOk={handleUpdateTask}
        destroyOnHidden
      >
        <Form 
            form={form} 
            layout="vertical" 
        >
            <Form.Item name="title" label="Title" rules={[{ required: true }]}><Input /></Form.Item>
            <Form.Item name="description" label="Description"><TextArea rows={4} /></Form.Item>
            <Form.Item name="status" label="Status" rules={[{ required: true }]}><Select options={statusOptions} /></Form.Item>
            <Form.Item name="assignee_id" label="Assignee">
              <Select
                allowClear
                options={projectMembers.map(m => ({ value: m.user_id, label: m.username || m.email || m.user_id }))}
                placeholder="Select assignee"
              />
            </Form.Item>
            <Form.Item name="due_date" label="Due Date"><DatePicker style={{ width: '100%' }} /></Form.Item>
        </Form>
      </Modal>

      {/* A simple style for hover effects */}
      <style>{`
        .hover-bg:hover {
            background-color: #f8f9fa;
        }
      `}</style>
    </div>
  );
};

export default ItemDetail;