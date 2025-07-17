import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Spin, Button, Form, Input, Select, DatePicker, Tag, Avatar, Divider, message, Modal, Row, Col, Card, Badge, Descriptions } from 'antd';
import { 
  EditOutlined, 
  SaveOutlined, 
  CloseOutlined, 
  UserOutlined, 
  PaperClipOutlined, 
  LinkOutlined, 
  MoreOutlined, 
  CommentOutlined,
  CheckOutlined, 
  ClockCircleOutlined, 
  ArrowLeftOutlined,
  RocketOutlined,
  BugOutlined,
  FlagOutlined,
  ProfileOutlined
} from '@ant-design/icons';
import { ProjectContext } from '../context/ProjectContext';
import dayjs from 'dayjs';
import { getTypeIcon, getStatusColor, getPriorityColor } from '../utils/itemUi.jsx';

const { TextArea } = Input;


const statusOptions = [
  { value: 'todo', label: 'To Do' },
  { value: 'inprogress', label: 'In Progress' },
  { value: 'inreview', label: 'In Review' },
  { value: 'done', label: 'Done' },
];

const priorityOptions = [
  { value: 'Low', label: 'Low' },
  { value: 'Medium', label: 'Medium' },
  { value: 'High', label: 'High' },
  { value: 'Critical', label: 'Critical' },
];

const typeOptions = [
  { value: 'task', label: 'Task' },
  { value: 'bug', label: 'Bug' },
  { value: 'epic', label: 'Epic' },
  { value: 'story', label: 'Story' },
];

const TaskDetail = () => {
  const { itemId } = useParams();
  const { selectedProject } = useContext(ProjectContext);
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [commentInput, setCommentInput] = useState('');
  const [currentUser] = useState(() => JSON.parse(localStorage.getItem('user')) || null);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('[ItemDetail] useEffect - itemId:', itemId);
    fetchTask();
  }, [itemId]);

  const fetchTask = async () => {
      setLoading(true);
      const token = localStorage.getItem('token');
      try {
        const res = await fetch(`http://localhost:5000/items/${itemId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
      console.log('[ItemDetail] fetchTask - data:', data);
      setTask(data.item);
      if (data.item?.project_id) {
        fetchMembers(data.item.project_id);
      }
    } catch (error) {
      console.error('[ItemDetail] fetchTask error:', error);
      message.error('Failed to fetch task');
    } finally {
      setLoading(false);
    }
  };

  const fetchMembers = async (projectId) => {
      const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/projects/${projectId}/members`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
        const data = await res.json();
      console.log('[ItemDetail] fetchMembers - data:', data);
      setMembers(data.members);
    } catch (error) {
      console.error('[ItemDetail] fetchMembers error:', error);
      message.error('Failed to fetch members');
    }
  };

  const handleUpdateTask = async () => {
    try {
      const values = await form.validateFields();
      console.log('[ItemDetail] handleUpdateTask - form values:', values);
    const token = localStorage.getItem('token');
      const payload = {
        ...values,
        due_date: values.due_date?.format('YYYY-MM-DD')
      };
      console.log('[ItemDetail] handleUpdateTask - payload:', payload);
      const res = await fetch(`http://localhost:5000/items/${itemId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });
      console.log('[ItemDetail] handleUpdateTask - response status:', res.status);
      if (res.ok) {
        message.success('Task updated successfully');
        setEditModalVisible(false);
        fetchTask();
      }
    } catch (error) {
      console.error('[ItemDetail] handleUpdateTask error:', error);
      message.error('Failed to update task');
    }
  };

  const handleAddComment = async () => {
    if (!commentInput.trim()) return;
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`http://localhost:5000/items/${task.id}/comments`, {
      method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${token}` 
        },
      body: JSON.stringify({ content: commentInput })
    });
      console.log('[ItemDetail] handleAddComment - response status:', res.status);
    if (res.ok) {
      setCommentInput('');
        fetchTask();
        message.success('Comment added');
    }
    } catch (error) {
      console.error('[ItemDetail] handleAddComment error:', error);
      message.error('Failed to add comment');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-medium text-gray-700">Task not found</h2>
          <p className="text-gray-500 mt-2">The requested task does not exist or you don't have permission to view it</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Accent Bar & Header */}
      <div style={{ borderTop: `6px solid ${getPriorityColor(task.priority)}`, background: '#fff', borderBottom: '1px solid #eee', padding: '24px 32px 16px 32px', display: 'flex', alignItems: 'center', gap: 24 }}>
        <div style={{ fontSize: 32, marginRight: 16 }}>{getTypeIcon(task.type)}</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 style={{ fontSize: 28, fontWeight: 600, margin: 0 }}>{task.title}</h1>
            <Tag color={getStatusColor(task.status)} style={{ fontSize: 16, borderRadius: 6 }}>{task.status}</Tag>
            <Tag color={getPriorityColor(task.priority)} style={{ fontSize: 16, borderRadius: 6 }}>{task.priority || 'No priority'}</Tag>
            {task.due_date && (
              <Tag icon={<ClockCircleOutlined />} color="default" style={{ fontSize: 16, borderRadius: 6 }}>
                Due {dayjs(task.due_date).format('MMM D')}
              </Tag>
            )}
          </div>
          <div style={{ marginTop: 8, color: '#888', fontSize: 15 }}>
            <UserOutlined style={{ marginRight: 4 }} />
            {task.assignee_name || <span style={{ color: '#bbb' }}>Unassigned</span>}
          </div>
        </div>
        <Button 
          type="primary" 
          icon={<EditOutlined />} 
          onClick={() => setEditModalVisible(true)}
          style={{ marginLeft: 16 }}
        >
          Edit
        </Button>
      </div>

      {/* Main Content */}
      <Row gutter={[32, 32]} style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 0' }}>
        {/* Left Column */}
        <Col xs={24} md={16}>
          <Card title={<span><ProfileOutlined /> Description</span>} bordered={false} style={{ marginBottom: 24 }}>
            <div style={{ minHeight: 60, color: task.description ? '#222' : '#bbb', fontSize: 16 }}>
              {task.description || <span>No description provided</span>}
            </div>
          </Card>

          {/* Subtasks (if epic) */}
          {task.type === 'epic' && task.subtasks?.length > 0 && (
            <Card title={<span><CheckOutlined /> Subtasks ({task.subtasks.length})</span>} bordered={false} style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {task.subtasks.map(subtask => (
                  <Card
                    key={subtask.id}
                    size="small"
                    hoverable
                    onClick={() => navigate(`/items/${subtask.id}`)}
                    style={{
                      background: '#fafcff',
                      borderLeft: '4px solid #1677ff',
                      marginBottom: 0,
                      cursor: 'pointer',
                      transition: 'box-shadow 0.2s',
                    }}
                    bodyStyle={{ padding: 12 }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      {/* Type Icon */}
                      <div style={{ minWidth: 28, textAlign: 'center' }}>{getTypeIcon(subtask.type)}</div>
                      {/* Title */}
                      <div style={{ flex: 2, fontWeight: 500, fontSize: 16 }}>{subtask.title}</div>
                      {/* Status */}
                      <Tag color={getStatusColor(subtask.status)} style={{ minWidth: 80, textAlign: 'center' }}>{subtask.status}</Tag>
                      {/* Priority */}
                      <Tag color={getPriorityColor(subtask.priority)} style={{ minWidth: 70, textAlign: 'center' }}>{subtask.priority || 'No priority'}</Tag>
                      {/* Due Date */}
                      <div style={{ minWidth: 90, color: '#888', fontSize: 14 }}>
                        {subtask.due_date ? dayjs(subtask.due_date).format('MMM D') : ''}
                      </div>
                      {/* Assignee */}
                      <div style={{ minWidth: 100, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {subtask.assignee_name ? (
                        <>
                            <Avatar size={20} style={{ background: '#eee', color: '#555', fontSize: 12 }} icon={<UserOutlined />} />
                            <span style={{ fontSize: 14 }}>{subtask.assignee_name}</span>
                          </>
                        ) : (
                          <span style={{ color: '#bbb', fontSize: 14 }}>Unassigned</span>
                      )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          )}

          {/* Comments Section */}
          <Card title={<span><CommentOutlined /> Activity</span>} bordered={false}>
            {/* Comment Input */}
            <div style={{ display: 'flex', marginBottom: 24 }}>
              <Avatar src={currentUser?.avatar} icon={<UserOutlined />} style={{ marginRight: 12 }} />
              <div style={{ flex: 1 }}>
                <TextArea
                  rows={3}
                  placeholder="Add a comment..."
                  value={commentInput}
                  onChange={e => setCommentInput(e.target.value)}
                  style={{ borderRadius: 8 }}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                  <Button 
                    type="primary" 
                    onClick={handleAddComment}
                    disabled={!commentInput.trim()}
                  >
                    Comment
                  </Button>
                </div>
            </div>
            </div>
            {/* Comments List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {task.comments?.map(comment => (
                <div key={comment.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <Avatar src={comment.author_avatar} icon={<UserOutlined />} />
                  <div style={{ background: '#f6f8fa', borderRadius: 12, padding: '12px 16px', minWidth: 120, maxWidth: 600 }}>
                    <div style={{ fontWeight: 500, color: '#222' }}>{comment.author_name}</div>
                    <div style={{ color: '#888', fontSize: 13, marginBottom: 4 }}>{dayjs(comment.created_at).format('MMM D, YYYY [at] h:mm A')}</div>
                    <div style={{ fontSize: 15 }}>{comment.content}</div>
            </div>
            </div>
              ))}
              {(!task.comments || task.comments.length === 0) && <div style={{ color: '#bbb', textAlign: 'center' }}>No comments yet</div>}
            </div>
          </Card>
        </Col>

        {/* Right Column */}
        <Col xs={24} md={8}>
          <Card bordered={false} style={{ marginBottom: 24 }}>
            <Descriptions column={1} size="small" labelStyle={{ fontWeight: 500, color: '#888' }}>
              <Descriptions.Item label={<span><UserOutlined /> Assignee</span>}>
                {task.assignee_name || <span style={{ color: '#bbb' }}>Unassigned</span>}
              </Descriptions.Item>
              <Descriptions.Item label={<span><UserOutlined /> Reporter</span>}>
                {task.reporter_name}
              </Descriptions.Item>
              <Descriptions.Item label={<span><ClockCircleOutlined /> Created</span>}>
                {dayjs(task.created_at).format('MMM D, YYYY')}
              </Descriptions.Item>
              <Descriptions.Item label={<span><ClockCircleOutlined /> Updated</span>}>
                {dayjs(task.updated_at).format('MMM D, YYYY')}
              </Descriptions.Item>
              <Descriptions.Item label={<span><RocketOutlined /> Project</span>}>
                {selectedProject?.name || 'No project'}
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Parent Epic */}
          {task.parent_epic && (
            <Card bordered={false} style={{ marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                {getTypeIcon('epic')}
                <span style={{ fontWeight: 500 }}>{task.parent_epic.title}</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Tag color={getStatusColor(task.parent_epic.status)}>{task.parent_epic.status}</Tag>
                <Tag color={getPriorityColor(task.parent_epic.priority)}>{task.parent_epic.priority || 'No priority'}</Tag>
              </div>
            </Card>
          )}
        </Col>
      </Row>

      {/* Edit Task Modal */}
      <Modal
        title="Edit Task"
        visible={editModalVisible}
        onCancel={() => {
          console.log('[ItemDetail] Modal onCancel');
          setEditModalVisible(false);
        }}
        afterClose={() => {
          console.log('[ItemDetail] Modal afterClose');
        }}
        onOk={handleUpdateTask}
        width={800}
        footer={[
          <Button key="back" onClick={() => {
            console.log('[ItemDetail] Modal Cancel button clicked');
            setEditModalVisible(false);
          }}>
            Cancel
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            onClick={handleUpdateTask}
          >
            Save Changes
          </Button>,
        ]}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            title: task.title,
            description: task.description,
            status: task.status,
            type: task.type,
            priority: task.priority,
            assignee_id: task.assignee_id,
            due_date: task.due_date ? dayjs(task.due_date) : null,
          }}
          onValuesChange={(changed, all) => {
            console.log('[ItemDetail] Form onValuesChange', changed, all);
          }}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Form.Item
              name="title"
              label="Title"
              rules={[{ required: true, message: 'Please enter a title' }]}
            >
              <Input placeholder="Task title" />
            </Form.Item>

            <Form.Item
              name="status"
              label="Status"
              rules={[{ required: true }]}
            >
              <Select options={statusOptions} />
            </Form.Item>

            <Form.Item
              name="type"
              label="Type"
              rules={[{ required: true }]}
            >
              <Select options={typeOptions} />
            </Form.Item>

            <Form.Item
              name="priority"
              label="Priority"
            >
              <Select options={priorityOptions} />
            </Form.Item>

            <Form.Item
              name="assignee_id"
              label="Assignee"
            >
              <Select 
                showSearch
                optionFilterProp="children"
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                options={members.map(member => ({
                  value: member.user_id,
                  label: member.username || member.email,
                }))}
                placeholder="Select assignee"
              />
            </Form.Item>

            <Form.Item
              name="due_date"
              label="Due Date"
            >
              <DatePicker className="w-full" />
            </Form.Item>
          </div>

          <Form.Item
            name="description"
            label="Description"
          >
            <TextArea rows={4} placeholder="Task description" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TaskDetail;