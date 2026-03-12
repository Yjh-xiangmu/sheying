<template>
  <div class="message-container fade-in">
    <div class="chat-box glass-panel">
      <div class="friends-sidebar">
        <div class="sidebar-header">消息列表</div>
        <div class="friends-list">
          <div v-if="friends.length === 0" class="empty-friends">暂无联系人</div>
          <div
            v-else class="friend-item"
            v-for="friend in friends" :key="friend.id"
            :class="{ active: currentFriend?.id === friend.id }"
            @click="selectFriend(friend)"
          >
            <el-badge :is-dot="friend.isStranger" type="warning" class="stranger-badge">
              <el-avatar :size="40" :src="getAvatarUrl(friend.avatar)" />
            </el-badge>
            <div class="friend-info">
              <span class="friend-name">{{ friend.nickname }}</span>
              <span class="stranger-tag" v-if="friend.isStranger">未关注</span>
            </div>
          </div>
        </div>
      </div>

      <div class="chat-area">
        <div v-if="!currentFriend" class="empty-chat">
          <el-icon size="50" color="#333"><ChatDotRound /></el-icon>
          <p>选择一个联系人开始聊天</p>
        </div>

        <template v-else>
          <div class="chat-header">
            与 <span class="chat-target">{{ currentFriend.nickname }}</span> 聊天中
          </div>

          <div class="message-list" ref="messageListRef">
            <div
              v-for="msg in messages" :key="msg.id" class="message-wrapper"
              :class="{ 'is-mine': msg.sender_id === currentUser.id }"
            >
              <el-avatar :size="36" :src="getAvatarUrl(msg.sender_id === currentUser.id ? currentUser.avatar : currentFriend.avatar)" class="msg-avatar" @click="$router.push(`/user/${msg.sender_id}`)" style="cursor: pointer;"/>
              <div class="message-content">
                <div class="text-bubble" v-if="msg.content">{{ msg.content }}</div>
                <div class="artwork-share-card" v-if="msg.artwork_id" @click="$router.push(`/artwork/${msg.artwork_id}`)">
                  <img :src="`http://localhost:3000${msg.artwork_cover}`" class="share-img" />
                  <div class="share-title">{{ msg.artwork_title }}</div>
                  <div class="share-tag">作品分享</div>
                </div>
              </div>
            </div>
          </div>

          <div class="chat-input-area">
            <div v-if="currentFriend.isStranger" class="stranger-tip">
              <el-icon><Warning /></el-icon> 你们尚未互相关注。只能发送 1 条搭讪消息，对方回复或互关后可继续。
            </div>
            <el-input
              v-model="inputText" type="textarea" :rows="3"
              :placeholder="canSend ? '说点什么...' : '已发送搭讪消息，等待对方回复...'"
              class="dark-input"
              :disabled="!canSend"
              @keyup.enter.exact="sendMessage"
            />
            <div class="input-actions">
              <span class="tip" v-if="canSend">Enter 发送</span>
              <el-button type="primary" round @click="sendMessage" :loading="sending" :disabled="!canSend">发送</el-button>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ChatDotRound, Warning } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import request from '../../utils/request';

const route = useRoute();
const router = useRouter();
const currentUser = ref(null);
const friends = ref([]);
const currentFriend = ref(null);
const messages = ref([]);
const inputText = ref('');
const sending = ref(false);
const messageListRef = ref(null);

const getAvatarUrl = (path) => path ? `http://localhost:3000${path}` : 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png';

const scrollToBottom = async () => {
  await nextTick();
  if (messageListRef.value) messageListRef.value.scrollTop = messageListRef.value.scrollHeight;
};

// 【风控逻辑】：判断是否还能发消息
const canSend = computed(() => {
  if (!currentFriend.value) return false;
  if (!currentFriend.value.isStranger) return true; // 互关了随便发
  // 陌生人：判断我发了几条。如果没有我发的消息，或者消息总数为0，允许发1条
  const myMsgs = messages.value.filter(m => m.sender_id === currentUser.value.id);
  return myMsgs.length < 1;
});

const loadFriendsAndInitChat = async () => {
  try {
    const res = await request.get(`/interaction/friends/${currentUser.value.id}`);
    friends.value = res.data;

    // 如果从详情页点了“私信”跳过来
    if (route.query.chat_with) {
      const targetId = parseInt(route.query.chat_with);

      // 自己不能私信自己
      if (targetId === currentUser.value.id) {
        ElMessage.warning('不能给自己发私信');
        return;
      }

      let target = friends.value.find(f => f.id === targetId);

      if (target) {
        // 已经是互关好友
        selectFriend(target);
      } else {
        // 【核心】发现是陌生人！去查他的信息，并临时加到聊天列表中
        const infoRes = await request.get(`/interaction/user-info/${targetId}`);
        if (infoRes.code === 200) {
          target = infoRes.data;
          target.isStranger = true; // 打上陌生人标记
          friends.value.unshift(target); // 置顶
          selectFriend(target);
        }
      }
    }
  } catch (error) {}
};

const selectFriend = async (friend) => {
  currentFriend.value = friend;
  try {
    const res = await request.get(`/interaction/messages/${currentUser.value.id}/${friend.id}`);
    messages.value = res.data;
    scrollToBottom();
  } catch (error) {}
};

const sendMessage = async () => {
  if (!inputText.value.trim() || !canSend.value) return;
  sending.value = true;
  try {
    await request.post('/interaction/message', { sender_id: currentUser.value.id, receiver_id: currentFriend.value.id, content: inputText.value.trim() });
    inputText.value = '';
    const res = await request.get(`/interaction/messages/${currentUser.value.id}/${currentFriend.value.id}`);
    messages.value = res.data;
    scrollToBottom();
  } catch (error) {} finally { sending.value = false; }
};

onMounted(() => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    currentUser.value = JSON.parse(userStr);
    loadFriendsAndInitChat();
  } else {
    ElMessage.warning('请先登录');
    router.push('/');
  }
});
</script>

<style scoped>
.message-container { max-width: 1000px; margin: 40px auto; height: calc(100vh - 150px); }
.glass-panel { background: rgba(20,20,22,0.8); backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; display: flex; height: 100%; box-shadow: 0 20px 50px rgba(0,0,0,0.5); overflow: hidden;}
.friends-sidebar { width: 280px; border-right: 1px solid rgba(255,255,255,0.05); display: flex; flex-direction: column; background: rgba(0,0,0,0.2); }
.sidebar-header { padding: 20px; font-size: 16px; font-weight: bold; border-bottom: 1px solid rgba(255,255,255,0.05); }
.friends-list { flex: 1; overflow-y: auto; }
.empty-friends { padding: 30px 20px; text-align: center; color: #666; font-size: 13px; line-height: 1.6; }
.friend-item { display: flex; align-items: center; gap: 15px; padding: 15px 20px; cursor: pointer; transition: 0.3s; border-left: 3px solid transparent; }
.friend-item:hover { background: rgba(255,255,255,0.03); }
.friend-item.active { background: rgba(255,255,255,0.08); border-left-color: #409eff; }
.friend-info { display: flex; flex-direction: column; gap: 4px; }
.friend-name { color: #eee; font-size: 15px; }
.stranger-tag { font-size: 10px; color: #e6a23c; background: rgba(230,162,60,0.1); padding: 2px 6px; border-radius: 4px; display: inline-block; width: fit-content; }
:deep(.stranger-badge .el-badge__content.is-fixed.is-dot) { right: 8px; top: 4px; }
.chat-area { flex: 1; display: flex; flex-direction: column; }
.empty-chat { flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; color: #555; }
.empty-chat p { margin-top: 15px; font-size: 15px; }
.chat-header { padding: 20px; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 16px; color: #aaa; }
.chat-target { color: #fff; font-weight: bold; margin: 0 5px; }
.message-list { flex: 1; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 20px; }
.message-wrapper { display: flex; gap: 15px; align-items: flex-start; max-width: 80%; }
.message-wrapper.is-mine { align-self: flex-end; flex-direction: row-reverse; }
.message-content { display: flex; flex-direction: column; gap: 10px; }
.text-bubble { background: #2a2a2c; padding: 12px 18px; border-radius: 0 16px 16px 16px; color: #eee; font-size: 15px; line-height: 1.5; word-break: break-all; }
.is-mine .text-bubble { background: #409eff; color: #fff; border-radius: 16px 0 16px 16px; }
.artwork-share-card { width: 220px; background: #1a1a1c; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; overflow: hidden; cursor: pointer; transition: 0.3s; }
.artwork-share-card:hover { transform: translateY(-3px); border-color: #409eff; }
.share-img { width: 100%; height: 140px; object-fit: cover; display: block; }
.share-title { padding: 12px; font-size: 14px; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.share-tag { font-size: 10px; background: rgba(64,158,255,0.2); color: #409eff; padding: 2px 8px; border-radius: 10px; display: inline-block; margin: 0 0 12px 12px; }
.chat-input-area { padding: 20px; border-top: 1px solid rgba(255,255,255,0.05); background: rgba(0,0,0,0.2); }
.stranger-tip { font-size: 12px; color: #e6a23c; margin-bottom: 10px; display: flex; align-items: center; gap: 5px; }
:deep(.dark-input .el-textarea__inner) { background-color: #111; box-shadow: 0 0 0 1px rgba(255,255,255,0.1) inset; color: #fff; border-radius: 8px; resize: none; font-size: 15px; }
:deep(.dark-input.is-disabled .el-textarea__inner) { background-color: #1a1a1c; color: #666; cursor: not-allowed; }
.input-actions { display: flex; justify-content: flex-end; align-items: center; gap: 15px; margin-top: 15px; }
.tip { font-size: 12px; color: #666; }
</style>