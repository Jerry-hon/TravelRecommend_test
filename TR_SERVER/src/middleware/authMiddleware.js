import userService from '../service/userService.js'

export const verifyToken = (req, res, next) => {
    const email = req.headers.authorization?.replace('Bearer ', '')
    if (!email) {
        return res.status(401).json({ success: false, error: '请先登录' })
    }
    const user = userService.getUserByEmail(email)
    if (!user) {
        return res.status(401).json({ success: false, error: '用户不存在，请重新登录' })
    }
    req.user = user
    next()
}
