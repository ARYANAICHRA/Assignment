import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { Spin, Button, Form, Input, Select, DatePicker, Tag, Avatar, Divider, message, Modal } from 'antd';
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

const getPriorityColor = (priority) => {
  switch (priority) {
    case 'High': return 'red';
    case 'Medium': return 'orange';
    case 'Critical': return 'volcano';
    default: return 'blue';
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case 'done': return 'green';
    case 'inprogress': return 'orange';
    case 'inreview': return 'purple';
    default: return 'blue';
  }
};

const getTypeIcon = (type) => {
  switch (type) {
    case 'bug': return <span className="bg-red-100 text-red-600 p-1 rounded"><BugOutlined /></span>;
    case 'epic': return <span className="bg-purple-100 text-purple-600 p-1 rounded"><RocketOutlined /></span>;
    case 'story': return <span className="bg-blue-100 text-blue-600 p-1 rounded"><ProfileOutlined /></span>;
    case 'task':
    default: return <span className="bg-yellow-100 text-yellow-600 p-1 rounded"><FlagOutlined /></span>;
  }
};

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
      {/* Header */}
      <div className="bg-white border-b border-gray-200 py-4 px-6 flex items-center">
        <Button 
          type="text" 
          icon={<ArrowLeftOutlined />} 
          className="mr-4"
          onClick={() => window.history.back()}
        >
          Back
        </Button>
        <h1 className="text-xl font-medium text-gray-800">Task Details</h1>
        <div className="ml-auto flex space-x-2">
          <Button 
            type="primary" 
            icon={<EditOutlined />}
            onClick={() => setEditModalVisible(true)}
          >
            Edit
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto py-6 px-4">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left Column */}
          <div className="flex-1">
            {/* Task Header */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex items-start">
                <div className="mr-4">
                  {getTypeIcon(task.type)}
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-medium text-gray-800 mb-2">{task.title}</h2>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Tag color={getStatusColor(task.status)} className="rounded-md">
                      {task.status}
                    </Tag>
                    <Tag color={getPriorityColor(task.priority)} className="rounded-md">
                      {task.priority || 'No priority'}
                    </Tag>
                    {task.due_date && (
                      <Tag icon={<ClockCircleOutlined />} color="default" className="rounded-md">
                        Due {dayjs(task.due_date).format('MMM D')}
                      </Tag>
                    )}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-700 mb-3">Description</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  {task.description || (
                    <p className="text-gray-400 italic">No description provided</p>
                  )}
                </div>
              </div>
            </div>

            {/* Activity Section */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-medium text-gray-700 mb-4">Activity</h3>
              
              {/* Comment Input */}
              <div className="flex mb-6">
                <Avatar 
                  src={currentUser?.avatar} 
                  icon={<UserOutlined />} 
                  className="mr-3"
                />
                <div className="flex-1">
                  <TextArea
                    rows={3}
                    placeholder="Add a comment..."
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    className="rounded-lg"
                  />
                  <div className="flex justify-between mt-2">
                    <div className="flex space-x-2">
                      <Button icon={<PaperClipOutlined />} type="text" />
                      <Button icon={<LinkOutlined />} type="text" />
                    </div>
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
              <div className="space-y-4">
                {task.comments?.map(comment => (
                  <div key={comment.id} className="flex">
                    <Avatar 
                      src={comment.author_avatar} 
                      icon={<UserOutlined />} 
                      className="mr-3"
                    />
                    <div className="flex-1 bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center mb-1">
                        <span className="font-medium text-gray-800 mr-2">{comment.author_name}</span>
                        <span className="text-xs text-gray-500">
                          {dayjs(comment.created_at).format('MMM D, YYYY [at] h:mm A')}
                        </span>
                        {currentUser?.id === comment.user_id && (
                          <Button 
                            type="text" 
                            icon={<EditOutlined />} 
                            size="small" 
                            className="ml-auto"
                          />
                        )}
                      </div>
                      <p className="text-gray-800">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="w-full lg:w-80 space-y-4">
            {/* Details Card */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="font-medium text-gray-700 mb-3">Details</h3>
              <div className="space-y-3">
                <div>
                  <div className="text-xs text-gray-500 mb-1">Assignee</div>
                  <div className="flex items-center">
                    {task.assignee_id ? (
                      <>
                        <Avatar 
                          src={task.assignee_avatar} 
                          icon={<UserOutlined />} 
                          size="small" 
                          className="mr-2"
                        />
                        <span>{task.assignee_name}</span>
                      </>
                    ) : (
                      <span className="text-gray-400">Unassigned</span>
                    )}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Reporter</div>
                  <div className="flex items-center">
                    <Avatar 
                      src={task.reporter_avatar} 
                      icon={<UserOutlined />} 
                      size="small" 
                      className="mr-2"
                    />
                    <span>{task.reporter_name}</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Created</div>
                  <div>{dayjs(task.created_at).format('MMM D, YYYY')}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Updated</div>
                  <div>{dayjs(task.updated_at).format('MMM D, YYYY')}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500 mb-1">Project</div>
                  <div>{selectedProject?.name || 'No project'}</div>
                </div>
              </div>
            </div>

            {/* Parent Epic */}
            {task.parent_epic && (
              <div className="bg-white rounded-lg shadow-sm p-4">
                <h3 className="font-medium text-gray-700 mb-3">Parent Epic</h3>
                <div className="flex items-center mb-2">
                  {getTypeIcon('epic')}
                  <span className="ml-2 font-medium">{task.parent_epic.title}</span>
                </div>
                <div className="flex space-x-2">
                  <Tag color={getStatusColor(task.parent_epic.status)} className="rounded-md">
                    {task.parent_epic.status}
                  </Tag>
                  <Tag color={getPriorityColor(task.parent_epic.priority)} className="rounded-md">
                    {task.parent_epic.priority || 'No priority'}
                  </Tag>
                </div>
              </div>
            )}

            {/* Subtasks */}
            {task.type === 'epic' && task.subtasks?.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm p-4">
                <h3 className="font-medium text-gray-700 mb-3">Subtasks ({task.subtasks.length})</h3>
                <div className="space-y-2">
                  {task.subtasks.map(subtask => (
                    <div key={subtask.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                      <div className="flex items-center">
                        <CheckOutlined className="text-gray-400 mr-2" />
                        <span className="text-gray-800">{subtask.title}</span>
                      </div>
                      <Tag color={getStatusColor(subtask.status)} className="rounded-md">
                        {subtask.status}
                      </Tag>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

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