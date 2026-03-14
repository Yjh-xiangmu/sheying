import axios from 'axios';
import { ElMessage } from 'element-plus';

// 创建 axios 实例
const request = axios.create({
    baseURL: 'http://localhost:3000/api', // 后端基础路径
    timeout: 5000 // 请求超时时间
});

// 请求拦截器：如果本地有 token，就在发送请求时自动带上
request.interceptors.request.use(
    config => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    error => Promise.reject(error)
);

// 响应拦截器：统一处理后端的返回结果和报错
request.interceptors.response.use(
    response => {
        const res = response.data;
        // 如果后端返回的 code 不是 200，说明业务出错，直接弹出错误提示
        if (res.code === 403) {
    return res;
}
        if (res.code !== 200) {
            ElMessage.error(res.message || 'Error');
            return Promise.reject(new Error(res.message || 'Error'));
        }
        return res; // 成功则直接返回数据部分
    },
    error => {
        ElMessage.error(error.message || '网络请求异常');
        return Promise.reject(error);
    }
);

export default request;