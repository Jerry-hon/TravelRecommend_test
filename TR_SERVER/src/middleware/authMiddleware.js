import userService from '../service/userService.js'

export const verifyToken = (req, res, next) => {
    const token = req.headers.authorization?.replace('Bearer ', '')
    if (!token) {
        return res.status(401).json({ success: false, error: '请先登录' })
    }
    const user = userService.getUserByToken(token)
    if (!user) {
        return res.status(401).json({ success: false, error: '登录已过期，请重新登录' })
    }
    req.user = user
    next()
}
