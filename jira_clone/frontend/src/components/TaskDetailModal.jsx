import React, { useEffect, useState, useContext } from 'react';
import { Modal, Descriptions, Button, Form, Input, Select, DatePicker, Tag, Spin, List, Avatar, Typography, Space } from 'antd';
import dayjs from 'dayjs';
import { EditOutlined, SaveOutlined, CloseOutlined, UserOutlined } from '@ant-design/icons';
import { ProjectContext } from '../context/ProjectContext';

const { Title, Text } = Typography;
const { TextArea } = Input;

const statusOptions = [
  { value: 'todo', label: 'To Do' },
  { value: 'inprogress', label: 'In Progress' },
  { value: 'inreview', label: 'In Review' },
  { value: 'done', label: 'Done' },
];

const getStatusColor = (status) => {
    switch(status) {
        case 'done': return 'success';
        case 'inprogress': return 'processing';
        case 'inreview': return 'warning';
        default: return 'default';
    }
};

export default function TaskDetailModal({ isOpen, onRequestClose, taskId }) {
  const { hasPermission, currentUser, projectMembers } = useContext(ProjectContext);

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form] = Form.useForm();
  const [commentInput, setCommentInput] = useState('');

  useEffect(() => {
    if (isOpen && taskId) {
      fetchTask();
    } else {
      setTask(null);
      setEditing(false);
    }
  }, [isOpen, taskId]);

  const fetchTask = async () => {
    setLoading(true);
    const token = localStorage.getItem('token');
    try {
      const taskRes = await fetch(`http://localhost:5000/items/${taskId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!taskRes.ok) throw new Error('Task not found');
      const taskData = await taskRes.json();
      setTask(taskData.item);
      console.log('Fetched task:', taskData.item);
    } catch (error) {
      setTask(null);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSave = async () => {
    try {
        const values = await form.validateFields();
        const token = localStorage.getItem('token');
        const payload = { ...values, due_date: values.due_date?.format('YYYY-MM-DD') };
        
        await fetch(`http://localhost:5000/items/${taskId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify(payload)
        });
        
        setEditing(false);
        fetchTask();
    } catch (e) {}
  };

  const handleAddComment = async () => {
    if (!commentInput.trim()) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`http://localhost:5000/items/${task.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ content: commentInput })
    });
    if (res.ok) {
        setCommentInput('');
        fetchTask();
    }
  };

  const canEdit = hasPermission('edit_any_task') || 
                  (hasPermission('edit_own_task') && task && (currentUser?.id === task.reporter_id || currentUser?.id === task.assignee_id));

  const assigneeOptionList = projectMembers.map(m => ({ value: m.user_id, label: m.username || m.email || m.user_id }));
  console.log('Assignee dropdown options:', assigneeOptionList);
  const assigneeDisplay = task && (task.assignee_name || (projectMembers.find(m => m.user_id === task.assignee_id)?.username) || (projectMembers.find(m => m.user_id === task.assignee_id)?.email) || "Unassigned");
  console.log('Assignee display value:', assigneeDisplay);


  if (!isOpen) return null;
  
  const renderContent = () => {
    if (loading) {
      return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}><Spin /></div>;
    }
    if (!task) {
      return <div style={{ padding: '40px', textAlign: 'center' }}>Task not found or could not be loaded.</div>;
    }
    
    return (
        <div>
            <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0' }}>
                <Title level={4} style={{ margin: 0 }}>{task.title}</Title>
                {canEdit && !editing && <Button icon={<EditOutlined />} onClick={() => setEditing(true)}>Edit</Button>}
            </div>

            <div style={{ padding: '24px' }}>
                {editing ? (
                    <Form form={form} layout="vertical" onFinish={handleSave} initialValues={{...task, due_date: task.due_date ? dayjs(task.due_date) : null}}>
                        <Form.Item name="title" label="Title" rules={[{required: true}]}><Input/></Form.Item>
                        <Form.Item name="description" label="Description"><TextArea rows={3}/></Form.Item>
                        <Form.Item name="status" label="Status"><Select options={statusOptions}/></Form.Item>
                        <Form.Item name="assignee_id" label="Assignee">
                            <Select allowClear options={assigneeOptionList} />
                        </Form.Item>
                        <Form.Item name="due_date" label="Due Date"><DatePicker style={{width: '100%'}}/></Form.Item>
                        <Space>
                            <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>Save</Button>
                            <Button onClick={() => setEditing(false)} icon={<CloseOutlined />}>Cancel</Button>
                        </Space>
                    </Form>
                ) : (
                    <>
                        <Descriptions bordered column={1} size="small">
                            <Descriptions.Item label="Description">{task.description || "N/A"}</Descriptions.Item>
                            <Descriptions.Item label="Status"><Tag color={getStatusColor(task.status)}>{task.status}</Tag></Descriptions.Item>
                            <Descriptions.Item label="Assignee">{assigneeDisplay}</Descriptions.Item>
                            <Descriptions.Item label="Reporter">{task.reporter_name}</Descriptions.Item>
                            <Descriptions.Item label="Due Date">{task.due_date ? dayjs(task.due_date).format('MMM D, YYYY') : "N/A"}</Descriptions.Item>
                        </Descriptions>
                        
                        <div style={{marginTop: '24px'}}>
                            <Title level={5}>Comments</Title>
                            <List
                                itemLayout="horizontal"
                                dataSource={task.comments || []}
                                locale={{ emptyText: "No comments yet." }}
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
                            />
                            {hasPermission('add_comment') && (
                                <div style={{ display: 'flex', marginTop: '16px' }}>
                                    <Avatar icon={<UserOutlined />} style={{ marginRight: '12px' }}/>
                                    <div style={{flex: 1}}>
                                        <TextArea
                                            rows={2}
                                            placeholder="Add a comment..."
                                            value={commentInput}
                                            onChange={e => setCommentInput(e.target.value)}
                                        />
                                        <Button 
                                            type="primary" 
                                            onClick={handleAddComment} 
                                            disabled={!commentInput.trim()}
                                            style={{ marginTop: '8px' }}
                                        >
                                            Add Comment
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
  };

  return (
    <Modal open={isOpen} onCancel={onRequestClose} footer={null} width={700} destroyOnHidden>
      {renderContent()}
    </Modal>
  );
}