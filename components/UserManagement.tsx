import React, { useState } from 'react';
import { User, Group } from '../types';
import { Plus, Trash2, UserPlus, Users, X } from 'lucide-react';

interface UserManagementProps {
  users: User[];
  groups: Group[];
  onAddUser: (user: User) => Promise<void> | void;
  onUpdateUser: (user: User) => Promise<void> | void;
  onDeleteUser: (id: string) => Promise<void> | void;
  onAddGroup: (group: Group) => Promise<void> | void;
  onDeleteGroup: (id: string) => Promise<void> | void;
}

export const UserManagement: React.FC<UserManagementProps> = ({
  users, groups, onAddUser, onUpdateUser, onDeleteUser, onAddGroup, onDeleteGroup
}) => {
  const [activeTab, setActiveTab] = useState<'USERS' | 'GROUPS'>('USERS');

  // New User State
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState<'MANAGER' | 'EXECUTOR'>('EXECUTOR');
  const [isAddingUser, setIsAddingUser] = useState(false);

  // New Group State
  const [newGroupName, setNewGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [isAddingGroup, setIsAddingGroup] = useState(false);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail || !newUserPassword) return;

    try {
      setIsAddingUser(true);
      await onAddUser({
        id: `u-${Date.now()}`,
        name: newUserName,
        email: newUserEmail,
        password: newUserPassword,
        role: newUserRole
      });
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
    } catch (error) {
      alert('新增人員失敗');
      console.error(error);
    } finally {
      setIsAddingUser(false);
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName || selectedMembers.length === 0) return;

    try {
      setIsAddingGroup(true);
      await onAddGroup({
        id: `g-${Date.now()}`,
        name: newGroupName,
        memberIds: selectedMembers
      });
      setNewGroupName('');
      setSelectedMembers([]);
    } catch (error) {
      alert('新增群組失敗');
      console.error(error);
    } finally {
      setIsAddingGroup(false);
    }
  };

  const handleResetPassword = async (user: User) => {
    const newPass = prompt(`請為 ${user.name} 輸入新的密碼：`);
    if (newPass) {
      try {
        await onUpdateUser({ ...user, password: newPass });
        alert('密碼已重設');
      } catch (error) {
        alert('重設密碼失敗');
      }
    }
  };

  const handleDeleteUser = async (id: string) => {
    try {
      await onDeleteUser(id);
    } catch (error) {
      alert('刪除失敗');
      console.error(error);
    }
  };

  const handleDeleteGroup = async (id: string) => {
    try {
      await onDeleteGroup(id);
    } catch (error) {
      alert('刪除失敗');
      console.error(error);
    }
  };

  const toggleMemberSelection = (userId: string) => {
    if (selectedMembers.includes(userId)) {
      setSelectedMembers(selectedMembers.filter(id => id !== userId));
    } else {
      setSelectedMembers([...selectedMembers, userId]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex space-x-4 border-b">
        <button
          className={`pb-2 px-4 font-medium transition-colors ${activeTab === 'USERS' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('USERS')}
        >
          人員管理
        </button>
        <button
          className={`pb-2 px-4 font-medium transition-colors ${activeTab === 'GROUPS' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('GROUPS')}
        >
          群組管理
        </button>
      </div>

      {activeTab === 'USERS' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Add User Form */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center"><UserPlus size={20} className="mr-2" /> 新增人員</h3>
            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 block mb-1">姓名</label>
                <input required type="text" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newUserName} onChange={e => setNewUserName(e.target.value)} />
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">Email</label>
                <input required type="email" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} />
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">預設密碼</label>
                <input required type="text" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="設定初始密碼"
                  value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} />
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-1">角色</label>
                <select className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newUserRole} onChange={(e: any) => setNewUserRole(e.target.value)}>
                  <option value="EXECUTOR">執行者 (Executor)</option>
                  <option value="MANAGER">主管 (Manager)</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={isAddingUser}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
              >
                {isAddingUser ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : '建立人員'}
              </button>
            </form>
          </div>

          {/* User List */}
          <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4">現有人員列表</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500">
                  <tr>
                    <th className="px-4 py-2">姓名</th>
                    <th className="px-4 py-2">Email</th>
                    <th className="px-4 py-2">角色</th>
                    <th className="px-4 py-2 text-right">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{user.name}</td>
                      <td className="px-4 py-3 text-gray-500">{user.email}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs ${user.role === 'MANAGER' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'}`}>
                          {user.role === 'MANAGER' ? '主管' : '執行者'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-2">
                        <button
                          onClick={() => handleResetPassword(user)}
                          className="text-blue-500 hover:text-blue-700 text-xs underline"
                        >
                          重設密碼
                        </button>
                        <button onClick={() => handleDeleteUser(user.id)} className="text-red-400 hover:text-red-600 transition">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Add Group Form */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 h-fit">
            <h3 className="font-bold text-gray-800 mb-4 flex items-center"><Users size={20} className="mr-2" /> 新增群組</h3>
            <form onSubmit={handleCreateGroup} className="space-y-4">
              <div>
                <label className="text-sm text-gray-600 block mb-1">群組名稱</label>
                <input required type="text" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  value={newGroupName} onChange={e => setNewGroupName(e.target.value)} />
              </div>
              <div>
                <label className="text-sm text-gray-600 block mb-2">選擇成員</label>
                <div className="max-h-48 overflow-y-auto border rounded-lg p-2 space-y-1">
                  {users.filter(u => u.role === 'EXECUTOR').map(user => (
                    <div key={user.id}
                      onClick={() => toggleMemberSelection(user.id)}
                      className={`flex items-center p-2 rounded cursor-pointer text-sm ${selectedMembers.includes(user.id) ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-50'}`}
                    >
                      <div className={`w-4 h-4 border rounded mr-2 flex items-center justify-center ${selectedMembers.includes(user.id) ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                        {selectedMembers.includes(user.id) && <Plus size={10} className="text-white transform rotate-45" />}
                      </div>
                      {user.name}
                    </div>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1">已選擇 {selectedMembers.length} 人</p>
              </div>
              <button
                type="submit"
                disabled={isAddingGroup}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
              >
                {isAddingGroup ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div> : '建立群組'}
              </button>
            </form>
          </div>

          {/* Group List */}
          <div className="md:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-gray-800 mb-4">現有群組列表</h3>
            <div className="space-y-4">
              {groups.map(group => (
                <div key={group.id} className="border rounded-lg p-4 flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-gray-800">{group.name}</h4>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {group.memberIds.map(mid => {
                        const member = users.find(u => u.id === mid);
                        return member ? (
                          <span key={mid} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            {member.name}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                  <button onClick={() => handleDeleteGroup(group.id)} className="text-red-400 hover:text-red-600 p-2">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              {groups.length === 0 && <p className="text-gray-400 text-center py-4">尚無群組</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
