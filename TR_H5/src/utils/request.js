import axios from 'axios'

const request = axios.create({
    baseURL: '/api/travel',
    timeout: 60000,
    headers: {
        'Content-Type': 'application/json'
    }
})

request.interceptors.request.use(
    config => {
        return config
    },
    error => {
        return Promise.reject(error)
    }
)

request.interceptors.response.use(
    response => {
        return response.data
    },
    error => {
        return Promise.reject(error)
    }
)

export function post(url, data) {
    return request.post(url, data)
}

export function get(url, params) {
    return request.get(url, { params })
}

export async function fetchStream(url, data, onChunk, onComplete, onError) {
    const controller = new AbortController()
    
    try {
        const response = await fetch(`/api/travel/${url}`, { 
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data),
            signal: controller.signal
        })

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        while(true) {
            const { done, value } = await reader.read()
            if(done) {
                onComplete()
                break
            }
            const text = decoder.decode(value, { stream: true })
            const lines = text.split('\n').filter(line => line.trim())
            for(const line of lines) {
                onChunk(line)
            }
        }
    } catch (error) {
        onError(error.message)
    }
}

// 用户相关 API（baseURL 为 /api/user）
const userRequest = axios.create({
    baseURL: '/api/user',
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
})

userRequest.interceptors.response.use(
    response => response.data,
    error => Promise.reject(error)
)

export function userPost(url, data) {
    return userRequest.post(url, data)
}

export function userGet(url) {
    return userRequest.get(url)
}

export default request
